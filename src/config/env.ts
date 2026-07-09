import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.string().default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "silent"]).optional(),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgres://portfolio:portfolio@localhost:5432/portfolio"),
  MIGRATION_DATABASE_URL: z.string().min(1).optional(),
  GITHUB_WEBHOOK_SECRET: z.string().min(1),
  GITHUB_TOKEN: z.string().optional(),
  SYNC_TOKEN: z.string().min(1),
  CORS_ORIGINS: z.string().optional(),
  ALLOWED_REPOS: z.string().default(""),
  SYNC_ON_STARTUP: z.string().optional()
});

export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

export type AppConfig = {
  nodeEnv: string;
  logLevel: LogLevel;
  port: number;
  databaseUrl: string;
  migrationDatabaseUrl: string;
  githubWebhookSecret: string;
  githubToken?: string;
  syncToken: string;
  corsOrigins: string[];
  allowedRepos: string[];
  syncOnStartup: boolean;
};

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const env = EnvSchema.parse(source);

  return {
    nodeEnv: env.NODE_ENV,
    logLevel: env.LOG_LEVEL ?? (env.NODE_ENV === "test" ? "silent" : "info"),
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    migrationDatabaseUrl: env.MIGRATION_DATABASE_URL ?? env.DATABASE_URL,
    githubWebhookSecret: env.GITHUB_WEBHOOK_SECRET,
    githubToken: env.GITHUB_TOKEN || undefined,
    syncToken: env.SYNC_TOKEN,
    corsOrigins: getCorsOrigins(env.CORS_ORIGINS, env.NODE_ENV),
    allowedRepos: env.ALLOWED_REPOS.split(",")
      .map((repo) => repo.trim().toLowerCase())
      .filter(Boolean),
    syncOnStartup:
      parseOptionalBoolean(env.SYNC_ON_STARTUP) ??
      (env.NODE_ENV !== "production" && env.NODE_ENV !== "test")
  };
}

const DEVELOPMENT_CORS_ORIGINS = [
  "http://localhost:4321",
  "http://127.0.0.1:4321",
  "http://localhost:3000"
];

function getCorsOrigins(value: string | undefined, nodeEnv: string): string[] {
  const configuredOrigins = splitList(value)
    .map(normalizeOrigin)
    .filter((origin): origin is string => Boolean(origin));

  if (configuredOrigins.length > 0) {
    return configuredOrigins;
  }

  if (nodeEnv === "development") {
    return DEVELOPMENT_CORS_ORIGINS;
  }

  return [];
}

function splitList(value: string | undefined): string[] {
  return value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function normalizeOrigin(value: string): string | undefined {
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function parseOptionalBoolean(value: string | undefined): boolean | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return undefined;
}
