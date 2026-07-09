export type Project = {
  id?: string;
  repoFullName?: string;
  filePath?: string;
  title: string;
  slug: string;
  summary: string | null;
  tools: string[];
  repoUrl: string | null;
  demoUrl: string | null;
  dashboardUrl?: string | null;
  coverImage: string | null;
  featured: boolean;
  date: string | null;
  locale?: string;
  availableLocales?: string[];
  contentHtml?: string;
  sha?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type SocialLink = {
  label: string;
  href: string;
};

export type ImpactStat = {
  value: string;
  label: string;
  detail: string;
};
