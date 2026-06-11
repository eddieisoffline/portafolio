import type { QueryResultRow } from "pg";

import type { Queryable } from "./pool.js";

export type ProjectUpsert = {
  repoFullName: string;
  filePath: string;
  slug: string;
  title: string;
  summary?: string | null;
  tools: string[];
  repoUrl?: string | null;
  demoUrl?: string | null;
  coverImage?: string | null;
  featured: boolean;
  date?: string | null;
  contentMarkdown: string;
  contentHtml: string;
  frontmatter: Record<string, unknown>;
  sha?: string | null;
};

export type ProjectSummary = {
  id: string;
  repoFullName: string;
  filePath: string;
  slug: string;
  title: string;
  summary: string | null;
  tools: string[];
  repoUrl: string | null;
  demoUrl: string | null;
  coverImage: string | null;
  featured: boolean;
  date: string | null;
  sha: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectDetail = ProjectSummary & {
  contentMarkdown: string;
  contentHtml: string;
  frontmatter: Record<string, unknown>;
};

type ProjectRow = QueryResultRow & {
  id: string;
  repo_full_name: string;
  file_path: string;
  slug: string;
  title: string;
  summary: string | null;
  tools: string[];
  repo_url: string | null;
  demo_url: string | null;
  cover_image: string | null;
  featured: boolean;
  date: string | Date | null;
  content_markdown?: string;
  content_html?: string;
  frontmatter?: Record<string, unknown>;
  sha: string | null;
  created_at: Date;
  updated_at: Date;
};

export class ProjectRepository {
  constructor(private readonly db: Queryable) {}

  async list(): Promise<ProjectSummary[]> {
    const result = await this.db.query<ProjectRow>(
      `
        SELECT
          id,
          repo_full_name,
          file_path,
          slug,
          title,
          summary,
          tools,
          repo_url,
          demo_url,
          cover_image,
          featured,
          date,
          sha,
          created_at,
          updated_at
        FROM projects
        ORDER BY featured DESC, date DESC NULLS LAST, updated_at DESC
      `
    );

    return result.rows.map(mapSummaryRow);
  }

  async findBySlug(slug: string): Promise<ProjectDetail | null> {
    const result = await this.db.query<ProjectRow>(
      `
        SELECT *
        FROM projects
        WHERE slug = $1
        LIMIT 1
      `,
      [slug]
    );

    const row = result.rows[0];
    return row ? mapDetailRow(row) : null;
  }

  async upsert(project: ProjectUpsert): Promise<ProjectDetail> {
    const result = await this.db.query<ProjectRow>(
      `
        INSERT INTO projects (
          repo_full_name,
          file_path,
          slug,
          title,
          summary,
          tools,
          repo_url,
          demo_url,
          cover_image,
          featured,
          date,
          content_markdown,
          content_html,
          frontmatter,
          sha
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15
        )
        ON CONFLICT (repo_full_name, file_path)
        DO UPDATE SET
          slug = EXCLUDED.slug,
          title = EXCLUDED.title,
          summary = EXCLUDED.summary,
          tools = EXCLUDED.tools,
          repo_url = EXCLUDED.repo_url,
          demo_url = EXCLUDED.demo_url,
          cover_image = EXCLUDED.cover_image,
          featured = EXCLUDED.featured,
          date = EXCLUDED.date,
          content_markdown = EXCLUDED.content_markdown,
          content_html = EXCLUDED.content_html,
          frontmatter = EXCLUDED.frontmatter,
          sha = EXCLUDED.sha,
          updated_at = now()
        RETURNING *
      `,
      [
        project.repoFullName,
        project.filePath,
        project.slug,
        project.title,
        project.summary ?? null,
        project.tools,
        project.repoUrl ?? null,
        project.demoUrl ?? null,
        project.coverImage ?? null,
        project.featured,
        project.date ?? null,
        project.contentMarkdown,
        project.contentHtml,
        project.frontmatter,
        project.sha ?? null
      ]
    );

    return mapDetailRow(result.rows[0]);
  }

  async deleteByRepoAndPath(
    repoFullName: string,
    filePath: string
  ): Promise<boolean> {
    const result = await this.db.query(
      `
        DELETE FROM projects
        WHERE repo_full_name = $1 AND file_path = $2
      `,
      [repoFullName, filePath]
    );

    return (result.rowCount ?? 0) > 0;
  }
}

function mapSummaryRow(row: ProjectRow): ProjectSummary {
  return {
    id: row.id,
    repoFullName: row.repo_full_name,
    filePath: row.file_path,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    tools: row.tools ?? [],
    repoUrl: row.repo_url,
    demoUrl: row.demo_url,
    coverImage: row.cover_image,
    featured: row.featured,
    date: formatDate(row.date),
    sha: row.sha,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

function mapDetailRow(row: ProjectRow): ProjectDetail {
  return {
    ...mapSummaryRow(row),
    contentMarkdown: row.content_markdown ?? "",
    contentHtml: row.content_html ?? "",
    frontmatter: row.frontmatter ?? {}
  };
}

function formatDate(value: string | Date | null): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value;
}
