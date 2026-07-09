import "dotenv/config";

import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { createPool } from "./db/pool.js";
import { ProjectRepository } from "./db/projectRepository.js";
import { GitHubClient } from "./services/githubClient.js";
import { SyncService, type SyncResult } from "./services/syncService.js";

type Logger = {
  info: (obj: Record<string, unknown>, message?: string) => void;
  warn: (obj: Record<string, unknown>, message?: string) => void;
  error: (obj: Record<string, unknown>, message?: string) => void;
};

async function main(): Promise<void> {
  const config = loadEnv();
  const pool = createPool(config.databaseUrl);
  const projectRepository = new ProjectRepository(pool);
  const githubClient = new GitHubClient(config.githubToken);
  const app = await createApp({ config, projectRepository, githubClient });
  const syncService = new SyncService(projectRepository, githubClient);

  app.addHook("onClose", async () => {
    await pool.end();
  });

  await syncAllowedReposOnStartup({
    allowedRepos: config.allowedRepos,
    enabled: config.syncOnStartup,
    logger: app.log,
    syncService
  });

  await app.listen({
    host: "0.0.0.0",
    port: config.port
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function syncAllowedReposOnStartup(options: {
  allowedRepos: string[];
  enabled: boolean;
  logger: Logger;
  syncService: SyncService;
}): Promise<void> {
  if (!options.enabled) {
    options.logger.info({ event: "startup_sync_disabled" }, "startup_sync_disabled");
    return;
  }

  if (options.allowedRepos.length === 0) {
    options.logger.warn(
      { event: "startup_sync_skipped", reason: "No ALLOWED_REPOS configured." },
      "startup_sync_skipped"
    );
    return;
  }

  options.logger.info(
    {
      event: "startup_sync_started",
      repos: options.allowedRepos
    },
    "startup_sync_started"
  );

  for (const repoFullName of options.allowedRepos) {
    const parsed = parseRepoFullName(repoFullName);

    if (!parsed) {
      options.logger.warn(
        {
          event: "startup_sync_repo_skipped",
          repoFullName,
          reason: "Expected owner/repo format."
        },
        "startup_sync_repo_skipped"
      );
      continue;
    }

    try {
      const result = await options.syncService.syncRepo(parsed);
      logStartupSyncResult(options.logger, repoFullName, result);
    } catch (error) {
      options.logger.error(
        {
          event: "startup_sync_repo_failed",
          repoFullName,
          err: error
        },
        "startup_sync_repo_failed"
      );
    }
  }

  options.logger.info({ event: "startup_sync_finished" }, "startup_sync_finished");
}

function parseRepoFullName(repoFullName: string): {
  owner: string;
  repo: string;
} | null {
  const [owner, repo, extra] = repoFullName.split("/");

  if (!owner || !repo || extra) {
    return null;
  }

  return { owner, repo };
}

function logStartupSyncResult(
  logger: Logger,
  repoFullName: string,
  result: SyncResult
): void {
  logger.info(
    {
      event: "startup_sync_repo_completed",
      repoFullName,
      processedCount: result.processed.length,
      deletedCount: result.deleted.length,
      skippedCount: result.skipped.length,
      processed: result.processed,
      deleted: result.deleted,
      skipped: result.skipped
    },
    "startup_sync_repo_completed"
  );
}
