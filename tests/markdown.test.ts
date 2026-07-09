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

  it("parses localized frontmatter and language blocks", () => {
    const parsed = parseProjectMarkdown(`---
title:
  es: Dashboard de cafe
  en: Coffee Dashboard
slug: coffee-dashboard
summary:
  es: Ventas por tienda.
  en: Sales by store.
---

:::es
## Problema

Contenido en español.
:::

:::en
## Problem

English content.
:::
`);

    expect(parsed.metadata.title).toBe("Coffee Dashboard");
    expect(parsed.metadata.summary).toBe("Sales by store.");
    expect(parsed.translations.es?.title).toBe("Dashboard de cafe");
    expect(parsed.translations.es?.contentHtml).toContain("<h2>Problema</h2>");
    expect(parsed.translations.en?.title).toBe("Coffee Dashboard");
    expect(parsed.translations.en?.contentHtml).toContain("<h2>Problem</h2>");
  });

  it("parses legacy bilingual sections with language subheadings", () => {
    const parsed = parseProjectMarkdown(`---
title:
  es: Dashboard de cafe
  en: Coffee Dashboard
slug: coffee-dashboard
---

## Problema

### Español

Contenido en español.

### English

English content.

## Resultados

### Español

Resultados en español.

### English

English results.
`);

    expect(parsed.translations.es?.contentHtml).toContain("<h2>Problema</h2>");
    expect(parsed.translations.es?.contentHtml).toContain("Contenido en español.");
    expect(parsed.translations.es?.contentHtml).not.toContain("English content.");
    expect(parsed.translations.en?.contentHtml).toContain("<h2>Problem</h2>");
    expect(parsed.translations.en?.contentHtml).toContain("English content.");
    expect(parsed.translations.en?.contentHtml).toContain("<h2>Results</h2>");
    expect(parsed.translations.en?.contentHtml).not.toContain("Contenido en español.");
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

  it("accepts a relative cover image path", () => {
    const parsed = parseProjectMarkdown(`---
title: Coffee Dashboard
slug: coffee-dashboard
cover_image: /images/projects/coffee.png
---

# Coffee Dashboard
`);

    expect(parsed.metadata.coverImage).toBe("/images/projects/coffee.png");
  });
});
