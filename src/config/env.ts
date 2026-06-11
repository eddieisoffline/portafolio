import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgres://portfolio:portfolio@localhost:5432/portfolio"),
  GITHUB_WEBHOOK_SECRET: z.string().min(1),
  GITHUB_TOKEN: z.string().optional(),
  SYNC_TOKEN: z.string().min(1),
  ALLOWED_REPOS: z.string().default("")
});

export type AppConfig = {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  githubWebhookSecret: string;
  githubToken?: string;
  syncToken: string;
  allowedRepos: string[];
};

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const env = EnvSchema.parse(source);

  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    githubWebhookSecret: env.GITHUB_WEBHOOK_SECRET,
    githubToken: env.GITHUB_TOKEN || undefined,
    syncToken: env.SYNC_TOKEN,
    allowedRepos: env.ALLOWED_REPOS.split(",")
      .map((repo) => repo.trim().toLowerCase())
      .filter(Boolean)
  };
}
