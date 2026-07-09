import type { FastifyInstance } from "fastify";

import type { AppConfig } from "../config/env.js";
import { verifyGitHubSignature } from "../security/signature.js";
import type { PushCommit, SyncService } from "../services/syncService.js";

type RawBodyRequest = {
  rawBody?: string;
};

type GitHubPushPayload = {
  ref?: string;
  after?: string;
  repository?: {
    name?: string;
    full_name?: string;
    html_url?: string;
    owner?: {
      name?: string;
      login?: string;
    };
  };
  commits?: PushCommit[];
};

export async function registerWebhookRoutes(
  app: FastifyInstance,
  config: AppConfig,
  syncService: SyncService
): Promise<void> {
  app.post("/webhooks/github", async (request, reply) => {
    const rawBody = (request as typeof request & RawBodyRequest).rawBody ?? "";
    const isValidSignature = verifyGitHubSignature({
      payload: rawBody,
      signatureHeader: request.headers["x-hub-signature-256"],
      secret: config.githubWebhookSecret
    });

    if (!isValidSignature) {
      return reply.code(401).send({
        error: "invalid_signature",
        message: "GitHub signature verification failed."
      });
    }

    const event = request.headers["x-github-event"];
    if (event === "ping") {
      return {
        ok: true,
        event: "ping"
      };
    }

    if (event !== "push") {
      return reply.code(202).send({
        ok: true,
        ignored: true,
        event
      });
    }

    const payload = request.body as GitHubPushPayload;
    const repository = payload.repository;
    const owner = repository?.owner?.login ?? repository?.owner?.name;
    const repo = repository?.name;
    const repoFullName = repository?.full_name;
    const repoUrl =
      repository?.html_url ?? (repoFullName ? `https://github.com/${repoFullName}` : undefined);

    if (!owner || !repo || !repoFullName || !repoUrl) {
      return reply.code(400).send({
        error: "invalid_payload",
        message: "Push payload is missing repository information."
      });
    }

    const normalizedRepoFullName = repoFullName.toLowerCase();
    if (!config.allowedRepos.includes(normalizedRepoFullName)) {
      request.log.warn(
        {
          requestId: request.id,
          repoFullName: normalizedRepoFullName
        },
        "webhook_repo_not_allowed"
      );

      return reply.code(403).send({
        error: "repo_not_allowed",
        message: `${normalizedRepoFullName} is not listed in ALLOWED_REPOS.`,
        requestId: request.id
      });
    }

    const ref = payload.after && !/^0+$/.test(payload.after) ? payload.after : payload.ref;
    const result = await syncService.syncPush({
      owner,
      repo,
      repoFullName,
      repoUrl,
      ref,
      commits: payload.commits ?? []
    });

    return {
      ok: true,
      event: "push",
      result
    };
  });
}
