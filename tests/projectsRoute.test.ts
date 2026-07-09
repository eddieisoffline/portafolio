import { describe, expect, it, vi } from "vitest";

import { createApp } from "../src/app.js";
import type { AppConfig } from "../src/config/env.js";
import type { ProjectRepository } from "../src/db/projectRepository.js";
import type { GitHubClient } from "../src/services/githubClient.js";

const config: AppConfig = {
  nodeEnv: "test",
  logLevel: "silent",
  port: 3000,
  databaseUrl: "postgres://example",
  migrationDatabaseUrl: "postgres://example",
  githubWebhookSecret: "secret",
  syncToken: "sync-token",
  corsOrigins: [],
  allowedRepos: [],
  syncOnStartup: false
};

describe("project routes", () => {
  it("passes the requested locale to GET /projects", async () => {
    const projectRepository = {
      list: vi.fn(async () => [
        {
          id: "1",
          repoFullName: "tests/repo",
          filePath: "README.md",
          slug: "coffee",
          title: "Dashboard de cafe",
          summary: "Resumen",
          tools: [],
          repoUrl: null,
          demoUrl: null,
          coverImage: null,
          featured: false,
          date: null,
          locale: "es",
          availableLocales: ["es", "en"],
          sha: null,
          createdAt: new Date(0).toISOString(),
          updatedAt: new Date(0).toISOString()
        }
      ]),
      findBySlug: vi.fn()
    } as unknown as ProjectRepository;
    const app = await createApp({
      config,
      projectRepository,
      githubClient: {} as GitHubClient
    });

    const response = await app.inject({
      method: "GET",
      url: "/projects?lang=es"
    });

    expect(response.statusCode).toBe(200);
    expect(projectRepository.list).toHaveBeenCalledWith("es");
    expect(JSON.parse(response.body)[0]).toMatchObject({
      title: "Dashboard de cafe",
      locale: "es",
      availableLocales: ["es", "en"]
    });

    await app.close();
  });
});
