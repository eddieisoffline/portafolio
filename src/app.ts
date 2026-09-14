import type { IncomingMessage, ServerResponse } from "node:http";
import cors from "@fastify/cors";
import fastify, {
  type FastifyInstance
} from "fastify";

import type { AppConfig } from "./config/env.js";
import { loadEnv } from "./config/env.js";
import { createPool } from "./db/pool.js";
import { ProjectRepository } from "./db/projectRepository.js";
import { GitHubClient } from "./services/githubClient.js";
import { SyncService } from "./services/syncService.js";
import { registerProjectRoutes } from "./routes/projects.js";
import { registerSyncRoutes } from "./routes/sync.js";
import { registerWebhookRoutes } from "./routes/webhooks.js";

export type CreateAppOptions = {
  config: AppConfig;
  projectRepository: ProjectRepository;
  githubClient: GitHubClient;
};

type RawBodyRequest = Parameters<
  Parameters<FastifyInstance["addContentTypeParser"]>[2]
>[0] & {
  rawBody?: string;
};

type RequestError = Error & {
  statusCode?: number;
};

const CORS_ALLOWED_METHODS = ["GET"];
const CORS_ALLOWED_HEADERS = ["Accept", "x-request-id"];
const CORS_MAX_AGE_SECONDS = 600;
let vercelAppPromise: Promise<FastifyInstance> | undefined;

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const app = await getVercelApp();
  await app.ready();
  app.server.emit("request", request, response);
}

export async function createApp(options: CreateAppOptions): Promise<FastifyInstance> {
  const app = fastify({
    logger:
      options.config.logLevel === "silent"
        ? false
        : {
            level: options.config.logLevel,
            redact: [
              "req.headers.authorization",
              "req.headers.cookie",
              "req.headers.x-github-signature-256"
            ]
          },
    requestIdHeader: "x-request-id"
  });

  await app.register(cors, {
    delegator: (request, callback) => {
      callback(null, getCorsOptions({
        allowedOrigins: options.config.corsOrigins,
        method: request.method,
        origin: getHeaderValue(request.headers.origin),
        requestedMethod: getHeaderValue(
          request.headers["access-control-request-method"]
        ),
        url: request.url
      }));
    },
    strictPreflight: true
  });

  app.addHook("onSend", async (request, reply, payload) => {
    reply.header("x-request-id", request.id);
    return payload;
  });

  app.setErrorHandler((error, request, reply) => {
    const requestError = normalizeRequestError(error);
    const statusCode = requestError.statusCode && requestError.statusCode >= 400
      ? requestError.statusCode
      : 500;

    if (statusCode >= 500) {
      request.log.error(
        {
          err: requestError,
          requestId: request.id,
          method: request.method,
          url: request.url,
          statusCode
        },
        "request_failed"
      );
    }

    return reply.code(statusCode).send({
      error: statusCode >= 500 ? "internal_server_error" : "request_error",
      message: statusCode >= 500 ? "Internal server error." : requestError.message,
      requestId: request.id
    });
  });

  app.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" },
    (request, body, done) => {
      const rawBody = body.toString("utf8");
      (request as RawBodyRequest).rawBody = rawBody;

      try {
        done(null, rawBody.length ? JSON.parse(rawBody) : {});
      } catch (error) {
        done(error as Error);
      }
    }
  );

  app.get("/health", async () => {
    return { ok: true };
  });

  const syncService = new SyncService(
    options.projectRepository,
    options.githubClient
  );

  await registerProjectRoutes(app, options.projectRepository);
  await registerWebhookRoutes(app, options.config, syncService);
  await registerSyncRoutes(app, options.config, syncService);

  return app;
}

async function getVercelApp(): Promise<FastifyInstance> {
  vercelAppPromise ??= createVercelApp();
  return vercelAppPromise;
}

async function createVercelApp(): Promise<FastifyInstance> {
  const config = loadEnv();
  const pool = createPool(config.databaseUrl);
  const projectRepository = new ProjectRepository(pool);
  const githubClient = new GitHubClient(config.githubToken);
  const app = await createApp({ config, projectRepository, githubClient });

  app.addHook("onClose", async () => {
    await pool.end();
  });

  return app;
}

function getHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getCorsOptions(input: {
  allowedOrigins: string[];
  method: string;
  origin: string | undefined;
  requestedMethod: string | undefined;
  url: string;
}): {
  origin: false | string;
  methods?: string[];
  allowedHeaders?: string[];
  maxAge?: number;
  credentials?: false;
  optionsSuccessStatus?: number;
} {
  const method = input.method === "OPTIONS"
    ? input.requestedMethod
    : input.method;

  if (
    !input.origin ||
    !input.allowedOrigins.includes(input.origin) ||
    !method ||
    !CORS_ALLOWED_METHODS.includes(method) ||
    !isPublicProjectCorsPath(input.url)
  ) {
    return { origin: false };
  }

  return {
    origin: input.origin,
    methods: CORS_ALLOWED_METHODS,
    allowedHeaders: CORS_ALLOWED_HEADERS,
    maxAge: CORS_MAX_AGE_SECONDS,
    credentials: false,
    optionsSuccessStatus: 204
  };
}

function isPublicProjectCorsPath(url: string): boolean {
  const { pathname } = new URL(url, "http://localhost");

  if (pathname === "/projects" || pathname === "/projects/") {
    return true;
  }

  return /^\/projects\/[^/]+\/?$/.test(pathname);
}

function normalizeRequestError(error: unknown): RequestError {
  if (error instanceof Error) {
    return error as RequestError;
  }

  return new Error(String(error));
}
