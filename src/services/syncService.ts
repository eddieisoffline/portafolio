import type {
  ProjectRepository,
  ProjectUpsert
} from "../db/projectRepository.js";
import {
  GitHubApiError,
  GitHubClient,
  isMarkdownFile
} from "./githubClient.js";
import { MarkdownParseError, parseProjectMarkdown } from "./markdown.js";

export type SyncResult = {
  processed: Array<{ path: string; slug: string }>;
  deleted: Array<{ path: string; existed: boolean }>;
  skipped: Array<{ path: string; reason: string }>;
};

export type PushCommit = {
  added?: string[];
  modified?: string[];
  removed?: string[];
};

export class SyncService {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly github: GitHubClient
  ) {}

  async syncPush(params: {
    owner: string;
    repo: string;
    repoFullName: string;
    repoUrl: string;
    ref?: string;
    commits: PushCommit[];
  }): Promise<SyncResult> {
    const addedOrModified = new Set<string>();
    const removed = new Set<string>();

    for (const commit of params.commits) {
      for (const path of [...(commit.added ?? []), ...(commit.modified ?? [])]) {
        if (isMarkdownFile(path)) {
          addedOrModified.add(path);
        }
      }

      for (const path of commit.removed ?? []) {
        if (isMarkdownFile(path)) {
          removed.add(path);
        }
      }
    }

    for (const path of removed) {
      addedOrModified.delete(path);
    }

    const result: SyncResult = {
      processed: [],
      deleted: [],
      skipped: []
    };

    for (const path of removed) {
      const existed = await this.projects.deleteByRepoAndPath(
        params.repoFullName,
        path
      );
      result.deleted.push({ path, existed });
    }

    for (const path of addedOrModified) {
      await this.processPath(
        {
          owner: params.owner,
          repo: params.repo,
          repoFullName: params.repoFullName,
          repoUrl: params.repoUrl,
          path,
          ref: params.ref
        },
        result
      );
    }

    return result;
  }

  async syncRepo(params: {
    owner: string;
    repo: string;
    ref?: string;
    paths?: string[];
  }): Promise<SyncResult> {
    const repoFullName = `${params.owner}/${params.repo}`;
    const repoUrl = `https://github.com/${repoFullName}`;
    const rawPaths =
      params.paths ??
      (await this.github.listMarkdownFiles({
        owner: params.owner,
        repo: params.repo,
        ref: params.ref
      }));

    const result: SyncResult = {
      processed: [],
      deleted: [],
      skipped: []
    };

    for (const path of rawPaths) {
      if (!isMarkdownFile(path)) {
        result.skipped.push({ path, reason: "Not a Markdown file." });
        continue;
      }

      await this.processPath(
        {
          owner: params.owner,
          repo: params.repo,
          repoFullName,
          repoUrl,
          path,
          ref: params.ref
        },
        result
      );
    }

    return result;
  }

  private async processPath(
    params: {
      owner: string;
      repo: string;
      repoFullName: string;
      repoUrl: string;
      path: string;
      ref?: string;
    },
    result: SyncResult
  ): Promise<void> {
    try {
      const file = await this.github.getFileContent({
        owner: params.owner,
        repo: params.repo,
        path: params.path,
        ref: params.ref
      });

      const parsed = parseProjectMarkdown(file.content, {
        repoUrl: params.repoUrl
      });

      const project: ProjectUpsert = {
        repoFullName: params.repoFullName,
        filePath: params.path,
        slug: parsed.metadata.slug,
        title: parsed.metadata.title,
        summary: parsed.metadata.summary,
        tools: parsed.metadata.tools,
        repoUrl: parsed.metadata.repoUrl,
        demoUrl: parsed.metadata.demoUrl,
        coverImage: parsed.metadata.coverImage,
        featured: parsed.metadata.featured,
        date: parsed.metadata.date,
        contentMarkdown: parsed.contentMarkdown,
        contentHtml: parsed.contentHtml,
        translations: parsed.translations,
        frontmatter: parsed.frontmatter,
        sha: file.sha
      };

      await this.projects.upsert(project);
      result.processed.push({ path: params.path, slug: parsed.metadata.slug });
    } catch (error) {
      result.skipped.push({
        path: params.path,
        reason: getSyncErrorMessage(error)
      });
    }
  }
}

function getSyncErrorMessage(error: unknown): string {
  if (error instanceof MarkdownParseError) {
    return error.message;
  }

  if (error instanceof GitHubApiError) {
    return `${error.message}${error.status ? ` (${error.status})` : ""}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown sync error.";
}
