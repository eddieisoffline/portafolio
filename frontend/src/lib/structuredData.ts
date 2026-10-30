import { copy, type Locale, withLocale } from "./i18n";
import { siteProfile, socialLinks } from "./siteContent";
import type { Project } from "./types";
import { toAbsoluteUrl } from "./siteUrl";

export type StructuredData = Record<string, unknown>;

function personId(siteOrigin: string): string {
  return `${siteOrigin}/#person`;
}

export function getPersonSchema(locale: Locale, siteOrigin: string): StructuredData {
  return {
    "@type": "Person",
    "@id": personId(siteOrigin),
    name: siteProfile.displayName,
    jobTitle: siteProfile.role,
    url: toAbsoluteUrl(withLocale("/", locale), siteOrigin),
    sameAs: socialLinks.map((link) => link.href).filter((href) => href.trim()),
    knowsAbout: copy[locale].stackGroups.flatMap((group) => group.tools)
  };
}

export function getHomeSchema(locale: Locale, siteOrigin: string): StructuredData {
  return {
    "@context": "https://schema.org",
    "@graph": [
      getPersonSchema(locale, siteOrigin),
      {
        "@type": "WebSite",
        "@id": `${siteOrigin}/#website`,
        name: siteProfile.displayName,
        url: siteOrigin,
        inLanguage: ["es", "en"],
        author: { "@id": personId(siteOrigin) }
      }
    ]
  };
}

export function getProjectSchema(
  project: Project,
  locale: Locale,
  siteOrigin: string
): StructuredData {
  const url = toAbsoluteUrl(withLocale(`/projects/${project.slug}`, locale), siteOrigin);

  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: project.title,
    description: project.summary ?? undefined,
    url,
    mainEntityOfPage: url,
    inLanguage: locale,
    datePublished: project.date ?? undefined,
    dateModified: project.updatedAt ?? project.date ?? undefined,
    image: project.coverImage ? toAbsoluteUrl(project.coverImage, siteOrigin) : undefined,
    keywords: project.tools.length > 0 ? project.tools.join(", ") : undefined,
    author: getPersonSchema(locale, siteOrigin),
    isBasedOn: project.repoUrl ?? undefined
  };
}
