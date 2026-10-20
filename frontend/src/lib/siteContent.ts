import type { SocialLink } from "./types";

export const siteProfile = {
  name: "Eduardo Anica Gonzalez",
  role: "Data & Analytics Engineer",
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
