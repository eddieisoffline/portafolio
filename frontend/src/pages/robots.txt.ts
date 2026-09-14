import type { APIRoute } from "astro";

import { getSiteOrigin } from "../lib/siteUrl";

export const prerender = false;

export const GET: APIRoute = ({ request }) => {
  const siteOrigin = getSiteOrigin(new URL(request.url));
  const body = [
    "User-agent: *",
    "Allow: /",
    `Sitemap: ${siteOrigin}/sitemap.xml`,
    ""
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
};
