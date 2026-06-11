import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";

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

const ProjectFrontmatterSchema = z.object({
  title: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  summary: z.string().trim().optional(),
  tools: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .transform((value) => normalizeTools(value)),
  repo_url: z.string().url().optional(),
  demo_url: z.string().url().optional(),
  cover_image: z.string().url().optional(),
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
  contentMarkdown: string;
  contentHtml: string;
  frontmatter: Record<string, unknown>;
};

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

  const contentHtml = sanitizeHtml(markdown.render(parsed.content), {
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

  const metadata = validated.data;

  return {
    metadata: {
      title: metadata.title,
      slug: metadata.slug,
      summary: metadata.summary,
      tools: metadata.tools ?? [],
      repoUrl: metadata.repo_url ?? defaults.repoUrl,
      demoUrl: metadata.demo_url,
      coverImage: metadata.cover_image,
      featured: metadata.featured,
      date: metadata.date
    },
    contentMarkdown: parsed.content,
    contentHtml,
    frontmatter: JSON.parse(JSON.stringify(parsed.data)) as Record<string, unknown>
  };
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
