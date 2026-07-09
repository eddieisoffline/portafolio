import pg from "pg";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { runMigrations } from "../src/db/migrate.js";
import { ProjectRepository, type ProjectUpsert } from "../src/db/projectRepository.js";

const { Pool } = pg;
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;

describeWithDatabase("ProjectRepository", () => {
  let pool: pg.Pool;
  let repository: ProjectRepository;

  beforeAll(async () => {
    pool = new Pool({ connectionString: testDatabaseUrl });
    await runMigrations(pool);
    repository = new ProjectRepository(pool);
  });

  afterEach(async () => {
    await pool.query("DELETE FROM projects WHERE repo_full_name = $1", [
      "tests/repo"
    ]);
  });

  afterAll(async () => {
    await pool.end();
  });

  it("creates and updates a project by repo and file path", async () => {
    const baseProject: ProjectUpsert = {
      repoFullName: "tests/repo",
      filePath: "README.md",
      slug: "repo-readme",
      title: "Original title",
      summary: "Original summary",
      tools: ["Python"],
      repoUrl: "https://github.com/tests/repo",
      demoUrl: null,
      coverImage: null,
      featured: false,
      date: "2026-01-15",
      contentMarkdown: "# Original",
      contentHtml: "<h1>Original</h1>",
      translations: {
        en: {
          title: "Original title",
          summary: "Original summary",
          contentMarkdown: "# Original",
          contentHtml: "<h1>Original</h1>"
        },
        es: {
          title: "Titulo original",
          summary: "Resumen original",
          contentMarkdown: "# Original ES",
          contentHtml: "<h1>Original ES</h1>"
        }
      },
      frontmatter: { title: "Original title" },
      sha: "sha-1"
    };

    const created = await repository.upsert(baseProject);
    expect(created.title).toBe("Original title");

    const updated = await repository.upsert({
      ...baseProject,
      title: "Updated title",
      summary: "Updated summary",
      translations: {
        ...baseProject.translations,
        en: {
          title: "Updated title",
          summary: "Updated summary",
          contentMarkdown: "# Updated",
          contentHtml: "<h1>Updated</h1>"
        }
      },
      featured: true,
      sha: "sha-2"
    });

    expect(updated.id).toBe(created.id);
    expect(updated.title).toBe("Updated title");
    expect(updated.featured).toBe(true);

    const spanish = await repository.findBySlug("repo-readme", "es");
    expect(spanish?.title).toBe("Titulo original");
    expect(spanish?.contentHtml).toBe("<h1>Original ES</h1>");

    const listed = await repository.list();
    expect(listed.some((project) => project.slug === "repo-readme")).toBe(true);
  });

  it("deletes a project when its source Markdown file is removed", async () => {
    await repository.upsert({
      repoFullName: "tests/repo",
      filePath: "case-study.md",
      slug: "case-study",
      title: "Case Study",
      summary: null,
      tools: [],
      repoUrl: "https://github.com/tests/repo",
      demoUrl: null,
      coverImage: null,
      featured: false,
      date: null,
      contentMarkdown: "# Case Study",
      contentHtml: "<h1>Case Study</h1>",
      translations: {
        en: {
          title: "Case Study",
          contentMarkdown: "# Case Study",
          contentHtml: "<h1>Case Study</h1>"
        }
      },
      frontmatter: { title: "Case Study" },
      sha: "sha-3"
    });

    await expect(
      repository.deleteByRepoAndPath("tests/repo", "case-study.md")
    ).resolves.toBe(true);
    await expect(
      repository.deleteByRepoAndPath("tests/repo", "case-study.md")
    ).resolves.toBe(false);
  });
});
