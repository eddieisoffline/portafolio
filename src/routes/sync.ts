import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AppConfig } from "../config/env.js";
import type { SyncService } from "../services/syncService.js";

const SyncRepoBodySchema = z.object({
  owner: z.string().trim().min(1),
  repo: z.string().trim().min(1),
  ref: z.string().trim().min(1).optional(),
  paths: z.array(z.string().trim().min(1)).optional()
});

export async function registerSyncRoutes(
  app: FastifyInstance,
  config: AppConfig,
  syncService: SyncService
): Promise<void> {
  app.post("/sync/repo", async (request, reply) => {
    if (request.headers.authorization !== `Bearer ${config.syncToken}`) {
      return reply.code(401).send({
        error: "unauthorized",
        message: "Missing or invalid sync token."
      });
    }

    const parsed = SyncRepoBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "invalid_body",
        details: parsed.error.flatten()
      });
    }

    const repoFullName = `${parsed.data.owner}/${parsed.data.repo}`.toLowerCase();
    if (!config.allowedRepos.includes(repoFullName)) {
      return reply.code(403).send({
        error: "repo_not_allowed",
        message: `${repoFullName} is not listed in ALLOWED_REPOS.`
      });
    }

    const result = await syncService.syncRepo(parsed.data);
    return {
      ok: true,
      result
    };
  });
}
