import type { IncomingMessage, ServerResponse } from "node:http";
import fastify, {
  type FastifyInstance,
  type FastifyReply
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

const CORS_ALLOWED_METHODS = "GET,POST,OPTIONS";
const CORS_ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "x-request-id",
  "x-github-event",
  "x-hub-signature-256"
].join(",");
const CORS_MAX_AGE_SECONDS = "600";
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

  app.addHook("onRequest", async (request, reply) => {
    applyCorsHeaders(reply, getHeaderValue(request.headers.origin), options.config);

    if (request.method === "OPTIONS") {
      return reply.code(204).send();
    }
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

function applyCorsHeaders(
  reply: FastifyReply,
  origin: string | undefined,
  config: AppConfig
): void {
  if (!origin) {
    return;
  }

  reply.header("Vary", "Origin");
  reply.header("Access-Control-Allow-Methods", CORS_ALLOWED_METHODS);
  reply.header("Access-Control-Allow-Headers", CORS_ALLOWED_HEADERS);
  reply.header("Access-Control-Max-Age", CORS_MAX_AGE_SECONDS);

  if (config.corsOrigins.includes(origin)) {
    reply.header("Access-Control-Allow-Origin", origin);
  }
}

function getHeaderValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeRequestError(error: unknown): RequestError {
  if (error instanceof Error) {
    return error as RequestError;
  }

  return new Error(String(error));
}
