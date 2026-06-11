import { describe, expect, it } from "vitest";

import { MarkdownParseError, parseProjectMarkdown } from "../src/services/markdown.js";

describe("project markdown parser", () => {
  it("parses frontmatter and renders sanitized HTML", () => {
    const parsed = parseProjectMarkdown(
      `---
title: Churn Model
slug: churn-model
summary: Predicts churn.
tools:
  - Python
  - scikit-learn
featured: true
date: 2026-01-15
---

# Result

<script>alert("xss")</script>

[Demo](https://example.com)
`,
      { repoUrl: "https://github.com/example/churn" }
    );

    expect(parsed.metadata).toMatchObject({
      title: "Churn Model",
      slug: "churn-model",
      summary: "Predicts churn.",
      tools: ["Python", "scikit-learn"],
      featured: true,
      date: "2026-01-15",
      repoUrl: "https://github.com/example/churn"
    });
    expect(parsed.contentHtml).toContain("<h1>Result</h1>");
    expect(parsed.contentHtml).toContain('href="https://example.com"');
    expect(parsed.contentHtml).not.toContain("<script>");
  });

  it("rejects markdown without required title or slug", () => {
    expect(() =>
      parseProjectMarkdown(`---
summary: Missing required fields.
---

Body
`)
    ).toThrow(MarkdownParseError);
  });
});
