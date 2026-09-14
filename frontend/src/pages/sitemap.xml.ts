import type { APIRoute } from "astro";

import { getProjects } from "../lib/api";
import { supportedLocales, withLocale, type Locale } from "../lib/i18n";
import { getSiteOrigin, toAbsoluteUrl } from "../lib/siteUrl";

export const prerender = false;

const STATIC_PATHS = ["/", "/projects", "/privacy"] as const;

export const GET: APIRoute = async ({ request }) => {
  const siteOrigin = getSiteOrigin(new URL(request.url));
  const urls = new Set<string>();

  for (const locale of supportedLocales) {
    for (const path of STATIC_PATHS) {
      urls.add(toAbsoluteUrl(withLocale(path, locale), siteOrigin));
    }

    for (const projectPath of await getProjectPaths(locale)) {
      urls.add(toAbsoluteUrl(projectPath, siteOrigin));
    }
  }

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...Array.from(urls).map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`),
    "</urlset>",
    ""
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
};

async function getProjectPaths(locale: Locale): Promise<string[]> {
  try {
    const projects = await getProjects(locale);
    return projects.map((project) => withLocale(`/projects/${project.slug}`, locale));
  } catch {
    return [];
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
