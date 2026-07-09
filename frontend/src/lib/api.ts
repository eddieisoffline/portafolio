import type { Project } from "./types";
import type { Locale } from "./i18n";

const DEFAULT_API_URL = "http://localhost:3000";
const REQUEST_TIMEOUT_MS = 8000;

export type ApiErrorCode = "http" | "invalid" | "network" | "timeout";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status?: number;

  constructor(message: string, code: ApiErrorCode, status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export async function getProjects(locale: Locale): Promise<Project[]> {
  const data = await fetchJson(`/projects?lang=${locale}`);

  if (!Array.isArray(data)) {
    throw new ApiError("The projects response was not a list.", "invalid");
  }

  return data.map(parseProject);
}

export async function getProject(
  slug: string,
  locale: Locale
): Promise<Project | null> {
  try {
    const data = await fetchJson(
      `/projects/${encodeURIComponent(slug)}?lang=${locale}`
    );
    return parseProject(data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

function getApiBaseUrl(): string {
  const configuredUrl = import.meta.env.PUBLIC_API_URL?.trim();
  return (configuredUrl && configuredUrl.length > 0
    ? configuredUrl
    : DEFAULT_API_URL
  ).replace(/\/+$/, "");
}

async function fetchJson(path: string): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      headers: {
        Accept: "application/json"
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new ApiError(
        `API request failed with status ${response.status}.`,
        "http",
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("The API request timed out.", "timeout");
    }

    throw new ApiError("The API request could not be completed.", "network");
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseProject(value: unknown): Project {
  if (!isRecord(value)) {
    throw new ApiError("Project response was not an object.", "invalid");
  }

  const title = getRequiredString(value, "title");
  const slug = getRequiredString(value, "slug");

  return {
    id: getOptionalString(value, "id"),
    repoFullName: getOptionalString(value, "repoFullName"),
    filePath: getOptionalString(value, "filePath"),
    title,
    slug,
    summary: getNullableString(value, "summary"),
    tools: getStringArray(value, "tools"),
    repoUrl: getNullableString(value, "repoUrl"),
    demoUrl: getNullableString(value, "demoUrl"),
    dashboardUrl: getNullableString(value, "dashboardUrl"),
    coverImage: getNullableString(value, "coverImage"),
    featured: getBoolean(value, "featured"),
    date: getNullableString(value, "date"),
    locale: getOptionalString(value, "locale"),
    availableLocales: getStringArray(value, "availableLocales"),
    contentHtml: getOptionalString(value, "contentHtml"),
    sha: getNullableString(value, "sha"),
    createdAt: getOptionalString(value, "createdAt"),
    updatedAt: getOptionalString(value, "updatedAt")
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getRequiredString(
  record: Record<string, unknown>,
  key: string
): string {
  const value = record[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(`Project field ${key} is required.`, "invalid");
  }

  return value;
}

function getOptionalString(
  record: Record<string, unknown>,
  key: string
): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function getNullableString(
  record: Record<string, unknown>,
  key: string
): string | null {
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function getBoolean(record: Record<string, unknown>, key: string): boolean {
  const value = record[key];
  return typeof value === "boolean" ? value : false;
}

function getStringArray(record: Record<string, unknown>, key: string): string[] {
  const value = record[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}
