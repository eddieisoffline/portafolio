import "dotenv/config";

import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { createPool } from "./db/pool.js";
import { ProjectRepository } from "./db/projectRepository.js";
import { GitHubClient } from "./services/githubClient.js";

async function main(): Promise<void> {
  const config = loadEnv();
  const pool = createPool(config.databaseUrl);
  const projectRepository = new ProjectRepository(pool);
  const githubClient = new GitHubClient(config.githubToken);
  const app = await createApp({ config, projectRepository, githubClient });

  app.addHook("onClose", async () => {
    await pool.end();
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
