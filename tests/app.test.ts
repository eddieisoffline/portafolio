import { beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import type { AppConfig } from "../src/config/env.js";
import type { ProjectRepository } from "../src/db/projectRepository.js";
import { clearRateLimitBuckets } from "../src/security/rateLimit.js";
import { createGitHubSignature } from "../src/security/signature.js";
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

beforeEach(() => {
  clearRateLimitBuckets();
});

describe("app error handling", () => {
  it("returns a safe 500 response with the request id", async () => {
    const app = await createApp({
      config,
      projectRepository: {} as ProjectRepository,
      githubClient: {} as GitHubClient
    });

    app.get("/explode", async () => {
      throw new Error("database password leaked in implementation detail");
    });

    const response = await app.inject({
      method: "GET",
      url: "/explode",
      headers: {
        "x-request-id": "test-request-id"
      }
    });

    expect(response.statusCode).toBe(500);
    expect(response.headers["x-request-id"]).toBe("test-request-id");
    expect(JSON.parse(response.body)).toEqual({
      error: "internal_server_error",
      message: "Internal server error.",
      requestId: "test-request-id"
    });
    expect(response.body).not.toContain("database password");

    await app.close();
  });
});

describe("CORS", () => {
  const allowedOrigin = "https://portfolio.example";

  it("returns CORS headers for an allowed preflight request", async () => {
    const app = await createApp({
      config: {
        ...config,
        corsOrigins: [allowedOrigin]
      },
      projectRepository: {} as ProjectRepository,
      githubClient: {} as GitHubClient
    });

    const response = await app.inject({
      method: "OPTIONS",
      url: "/projects",
      headers: {
        origin: allowedOrigin,
        "access-control-request-method": "GET"
      }
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(allowedOrigin);
    expect(response.headers["access-control-allow-methods"]).toBe(
      "GET,POST,OPTIONS"
    );
    expect(response.headers["access-control-allow-headers"]).toContain(
      "Authorization"
    );
    expect(response.headers.vary).toBe("Origin");

    await app.close();
  });

  it("adds CORS headers for an allowed request origin", async () => {
    const app = await createApp({
      config: {
        ...config,
        corsOrigins: [allowedOrigin]
      },
      projectRepository: {} as ProjectRepository,
      githubClient: {} as GitHubClient
    });

    const response = await app.inject({
      method: "GET",
      url: "/health",
      headers: {
        origin: allowedOrigin
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe(allowedOrigin);
    expect(response.headers.vary).toBe("Origin");

    await app.close();
  });

  it("does not expose CORS allow-origin for a disallowed request origin", async () => {
    const app = await createApp({
      config: {
        ...config,
        corsOrigins: [allowedOrigin]
      },
      projectRepository: {} as ProjectRepository,
      githubClient: {} as GitHubClient
    });

    const response = await app.inject({
      method: "GET",
      url: "/health",
      headers: {
        origin: "https://not-allowed.example"
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
    expect(response.headers.vary).toBe("Origin");

    await app.close();
  });
});

describe("sync route hardening", () => {
  it("rate limits repeated manual sync attempts", async () => {
    const app = await createApp({
      config: {
        ...config,
        allowedRepos: ["tests/repo"]
      },
      projectRepository: {} as ProjectRepository,
      githubClient: {} as GitHubClient
    });

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await app.inject({
        method: "POST",
        url: "/sync/repo",
        headers: {
          authorization: "Bearer sync-token"
        },
        payload: {
          owner: "tests",
          repo: "repo",
          paths: []
        }
      });

      expect(response.statusCode).toBe(200);
    }

    const limited = await app.inject({
      method: "POST",
      url: "/sync/repo",
      headers: {
        authorization: "Bearer sync-token"
      },
      payload: {
        owner: "tests",
        repo: "repo",
        paths: []
      }
    });

    expect(limited.statusCode).toBe(429);
    expect(limited.headers["retry-after"]).toBeDefined();
    expect(JSON.parse(limited.body)).toMatchObject({
      error: "rate_limited",
      requestId: expect.any(String)
    });

    await app.close();
  });
});

describe("GitHub webhook hardening", () => {
  it("rejects a signed push webhook for a repo outside ALLOWED_REPOS", async () => {
    const app = await createApp({
      config: {
        ...config,
        allowedRepos: ["tests/repo"]
      },
      projectRepository: {} as ProjectRepository,
      githubClient: {} as GitHubClient
    });
    const payload = JSON.stringify({
      ref: "refs/heads/main",
      after: "abc123",
      repository: {
        name: "repo",
        full_name: "evil/repo",
        html_url: "https://github.com/evil/repo",
        owner: {
          login: "evil"
        }
      },
      commits: []
    });

    const response = await app.inject({
      method: "POST",
      url: "/webhooks/github",
      headers: {
        "content-type": "application/json",
        "x-github-event": "push",
        "x-hub-signature-256": createGitHubSignature(payload, config.githubWebhookSecret)
      },
      payload
    });

    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body)).toMatchObject({
      error: "repo_not_allowed",
      requestId: expect.any(String)
    });

    await app.close();
  });
});
