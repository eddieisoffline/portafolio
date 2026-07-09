import type { ImpactStat, SocialLink } from "./types";

export const siteProfile = {
  name: "Eduardo Anica Gonzalez",
  role: "Data Science / Data Analytics",
  headline: "Data systems for decisions that can be inspected.",
  summary:
    "I build analytical pipelines, dashboards, APIs, and case studies that turn messy operational data into work people can verify.",
  bio:
    "This portfolio is structured around evidence: project context, technical choices, measurable outcomes, and the artifacts behind each decision.",
  photoSrc: "",
  location: "",
  email: ""
} as const;

export const socialLinks: SocialLink[] = [
  {
    label: "GitHub",
    href: "https://github.com/eddieisoffline"
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/eduardo-anica-gonzalez/"
  },
  {
    label: "Kaggle",
    href: "https://www.kaggle.com/eduardoanicagonzlez"
  }
];

// Replace these with verified personal metrics before publishing.
export const impactStats: ImpactStat[] = [
  {
    value: "Pipelines",
    label: "Operational data flows",
    detail: "Reusable ingestion and transformation work for analytical datasets."
  },
  {
    value: "Dashboards",
    label: "Decision surfaces",
    detail: "Looker Studio reporting designed around traceable project context."
  },
  {
    value: "APIs",
    label: "Data access",
    detail: "Typed endpoints and backend services that keep content and analysis decoupled."
  }
];

export const siteNav = [
  {
    label: "Projects",
    href: "/projects"
  },
  {
    label: "Stack",
    href: "/#stack"
  },
  {
    label: "Contact",
    href: "/#contact"
  }
] as const;
