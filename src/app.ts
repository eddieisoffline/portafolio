import fastify, { type FastifyInstance } from "fastify";

import type { AppConfig } from "./config/env.js";
import type { ProjectRepository } from "./db/projectRepository.js";
import type { GitHubClient } from "./services/githubClient.js";
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

export async function createApp(options: CreateAppOptions): Promise<FastifyInstance> {
  const app = fastify({
    logger: options.config.nodeEnv !== "test"
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
