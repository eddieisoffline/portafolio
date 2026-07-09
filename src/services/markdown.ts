import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";

import { DEFAULT_LOCALE, type Locale, SUPPORTED_LOCALES } from "../i18n/locales.js";

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true
});

const BooleanFrontmatterSchema = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((value) => {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      return ["true", "1", "yes"].includes(value.trim().toLowerCase());
    }

    return false;
  });

const LocalizedTextSchema = z.union([
  z.string().trim().min(1),
  z
    .object({
      es: z.string().trim().min(1).optional(),
      en: z.string().trim().min(1).optional()
    })
    .refine((value) => Boolean(value.es || value.en), {
      message: "At least one locale is required."
    })
]);

const ProjectFrontmatterSchema = z.object({
  title: LocalizedTextSchema,
  slug: z.string().trim().min(1),
  summary: LocalizedTextSchema.optional(),
  tools: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .transform((value) => normalizeTools(value)),
  repo_url: z.string().url().optional(),
  demo_url: z.string().url().optional(),
  cover_image: z.string().trim().min(1).optional(),
  featured: BooleanFrontmatterSchema,
  date: z
    .union([z.string(), z.date()])
    .optional()
    .transform((value) => normalizeDate(value))
});

export type ProjectMarkdown = {
  metadata: {
    title: string;
    slug: string;
    summary?: string;
    tools: string[];
    repoUrl?: string;
    demoUrl?: string;
    coverImage?: string;
    featured: boolean;
    date?: string;
  };
  translations: ProjectTranslations;
  contentMarkdown: string;
  contentHtml: string;
  frontmatter: Record<string, unknown>;
};

export type ProjectTranslation = {
  title: string;
  summary?: string;
  contentMarkdown: string;
  contentHtml: string;
};

export type ProjectTranslations = Partial<Record<Locale, ProjectTranslation>>;

export class MarkdownParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MarkdownParseError";
  }
}

export function parseProjectMarkdown(
  source: string,
  defaults: { repoUrl?: string } = {}
): ProjectMarkdown {
  const parsed = matter(source);
  const validated = ProjectFrontmatterSchema.safeParse(parsed.data);

  if (!validated.success) {
    const details = validated.error.issues
      .map((issue) => `${issue.path.join(".") || "frontmatter"}: ${issue.message}`)
      .join("; ");
    throw new MarkdownParseError(`Invalid project frontmatter: ${details}`);
  }

  const metadata = validated.data;
  const localizedTitles = normalizeLocalizedText(metadata.title);
  const localizedSummaries = normalizeLocalizedText(metadata.summary);
  const localizedContent = extractLocalizedMarkdown(parsed.content);
  const translations = buildTranslations({
    titles: localizedTitles,
    summaries: localizedSummaries,
    content: localizedContent
  });
  const canonicalLocale = translations[DEFAULT_LOCALE]
    ? DEFAULT_LOCALE
    : (SUPPORTED_LOCALES.find((locale) => translations[locale]) ?? DEFAULT_LOCALE);
  const canonicalTranslation = translations[canonicalLocale];
  const canonicalContentMarkdown =
    canonicalTranslation?.contentMarkdown ?? parsed.content;
  const canonicalContentHtml =
    canonicalTranslation?.contentHtml ?? renderSafeHtml(parsed.content);

  return {
    metadata: {
      title: canonicalTranslation?.title ?? localizedTitles[canonicalLocale] ?? "",
      slug: metadata.slug,
      summary: canonicalTranslation?.summary ?? localizedSummaries[canonicalLocale],
      tools: metadata.tools ?? [],
      repoUrl: metadata.repo_url ?? defaults.repoUrl,
      demoUrl: metadata.demo_url,
      coverImage: metadata.cover_image,
      featured: metadata.featured,
      date: metadata.date
    },
    translations,
    contentMarkdown: canonicalContentMarkdown,
    contentHtml: canonicalContentHtml,
    frontmatter: JSON.parse(JSON.stringify(parsed.data)) as Record<string, unknown>
  };
}

function renderSafeHtml(content: string): string {
  return sanitizeHtml(markdown.render(content), {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "img",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "pre",
      "code",
      "hr"
    ],
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      code: ["class"],
      th: ["align"],
      td: ["align"]
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer",
        target: "_blank"
      }),
      img: sanitizeHtml.simpleTransform("img", {
        loading: "lazy"
      })
    }
  });
}

function normalizeTools(value: string[] | string | undefined): string[] {
  if (!value) {
    return [];
  }

  const tools = Array.isArray(value) ? value : value.split(",");

  return tools.map((tool) => tool.trim()).filter(Boolean);
}

function normalizeDate(value: string | Date | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new MarkdownParseError(`Invalid project date: ${value}`);
  }

  return parsed.toISOString().slice(0, 10);
}

function normalizeLocalizedText(
  value: z.infer<typeof LocalizedTextSchema> | undefined
): Partial<Record<Locale, string>> {
  if (!value) {
    return {};
  }

  if (typeof value === "string") {
    const text = value.trim();
    return {
      es: text,
      en: text
    };
  }

  return SUPPORTED_LOCALES.reduce<Partial<Record<Locale, string>>>(
    (result, locale) => {
      const text = value[locale]?.trim();
      if (text) {
        result[locale] = text;
      }

      return result;
    },
    {}
  );
}

function extractLocalizedMarkdown(
  content: string
): Partial<Record<Locale, string>> {
  const blocks: Partial<Record<Locale, string[]>> = {};
  const pattern = /^:::(es|en)[^\S\r\n]*\r?\n([\s\S]*?)^:::[^\S\r\n]*$/gm;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    const locale = match[1] as Locale;
    const body = match[2].trim();

    if (!blocks[locale]) {
      blocks[locale] = [];
    }

    if (body) {
      blocks[locale]?.push(body);
    }
  }

  if (Object.keys(blocks).length === 0) {
    const legacySections = extractLegacyLocalizedSections(content);
    if (legacySections.es || legacySections.en) {
      return legacySections;
    }

    return {
      es: content,
      en: content
    };
  }

  return SUPPORTED_LOCALES.reduce<Partial<Record<Locale, string>>>(
    (result, locale) => {
      const parts = blocks[locale];
      if (parts?.length) {
        result[locale] = parts.join("\n\n");
      }

      return result;
    },
    {}
  );
}

function extractLegacyLocalizedSections(
  content: string
): Partial<Record<Locale, string>> {
  if (!/^###\s+(Español|English)\s*$/im.test(content)) {
    return {};
  }

  const sections = splitMarkdownH2Sections(content);
  const localized: Record<Locale, string[]> = {
    es: [],
    en: []
  };

  for (const section of sections) {
    const languageBlocks = splitLanguageH3Blocks(section.body);

    if (languageBlocks.es) {
      localized.es.push(`## ${section.title}\n\n${languageBlocks.es}`);
    }

    if (languageBlocks.en) {
      localized.en.push(
        `## ${translateLegacyHeading(section.title)}\n\n${languageBlocks.en}`
      );
    }
  }

  return {
    es: localized.es.length ? localized.es.join("\n\n") : undefined,
    en: localized.en.length ? localized.en.join("\n\n") : undefined
  };
}

function splitMarkdownH2Sections(
  content: string
): Array<{ title: string; body: string }> {
  const pattern = /^##\s+(.+?)\s*$/gm;
  const matches = [...content.matchAll(pattern)];

  if (matches.length === 0) {
    return [
      {
        title: "",
        body: content
      }
    ];
  }

  return matches.map((match, index) => {
    const nextMatch = matches[index + 1];
    const bodyStart = (match.index ?? 0) + match[0].length;
    const bodyEnd = nextMatch?.index ?? content.length;

    return {
      title: match[1].trim(),
      body: content.slice(bodyStart, bodyEnd).trim()
    };
  });
}

function splitLanguageH3Blocks(body: string): Partial<Record<Locale, string>> {
  const pattern = /^###\s+(Español|English)\s*$/gim;
  const matches = [...body.matchAll(pattern)];

  return matches.reduce<Partial<Record<Locale, string>>>((result, match, index) => {
    const nextMatch = matches[index + 1];
    const contentStart = (match.index ?? 0) + match[0].length;
    const contentEnd = nextMatch?.index ?? body.length;
    const locale: Locale = match[1].toLowerCase() === "español" ? "es" : "en";
    const block = body.slice(contentStart, contentEnd).trim();

    if (block) {
      result[locale] = block;
    }

    return result;
  }, {});
}

function translateLegacyHeading(value: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
  const headings: Record<string, string> = {
    problema: "Problem",
    metodologia: "Methodology",
    resultados: "Results",
    conclusion: "Conclusion",
    conclusiones: "Conclusions",
    datos: "Data",
    dataset: "Dataset",
    dashboard: "Dashboard"
  };

  return headings[normalized] ?? value;
}

function buildTranslations(params: {
  titles: Partial<Record<Locale, string>>;
  summaries: Partial<Record<Locale, string>>;
  content: Partial<Record<Locale, string>>;
}): ProjectTranslations {
  return SUPPORTED_LOCALES.reduce<ProjectTranslations>((result, locale) => {
    const fallbackLocale = locale === "es" ? "en" : "es";
    const title = params.titles[locale] ?? params.titles[fallbackLocale];
    const contentMarkdown =
      params.content[locale] ?? params.content[fallbackLocale];

    if (!title || contentMarkdown === undefined) {
      return result;
    }

    result[locale] = {
      title,
      summary: params.summaries[locale] ?? params.summaries[fallbackLocale],
      contentMarkdown,
      contentHtml: renderSafeHtml(contentMarkdown)
    };

    return result;
  }, {});
}
