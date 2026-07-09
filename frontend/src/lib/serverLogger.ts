type LogLevel = "debug" | "info" | "warn" | "error" | "silent";
type LogContext = Record<string, unknown>;

const logPriorities: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 50
};

const sensitiveExactKeys = new Set(["email", "message", "name"]);
const sensitiveKeyPattern = /(authorization|cookie|password|secret|token|api[_-]?key)/i;
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const bearerPattern = /Bearer\s+[^\s"']+/gi;
const maxStringLength = 1000;

export function getRequestId(headers?: Headers): string {
  const incomingRequestId = headers?.get("x-request-id")?.trim();

  if (incomingRequestId && /^[a-zA-Z0-9._:-]{1,128}$/.test(incomingRequestId)) {
    return incomingRequestId;
  }

  return createRequestId();
}

export function serializeError(error: unknown): LogContext {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    };
  }

  return {
    errorMessage: String(error)
  };
}

export const serverLogger = {
  debug(event: string, context: LogContext = {}) {
    writeLog("debug", event, context);
  },
  info(event: string, context: LogContext = {}) {
    writeLog("info", event, context);
  },
  warn(event: string, context: LogContext = {}) {
    writeLog("warn", event, context);
  },
  error(event: string, context: LogContext = {}) {
    writeLog("error", event, context);
  }
};

function writeLog(level: Exclude<LogLevel, "silent">, event: string, context: LogContext): void {
  const configuredLevel = getConfiguredLogLevel();

  if (logPriorities[level] < logPriorities[configuredLevel]) {
    return;
  }

  const entry = sanitizeLogContext({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context
  });
  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  if (level === "debug") {
    console.debug(line);
    return;
  }

  console.info(line);
}

function getConfiguredLogLevel(): LogLevel {
  const explicitLevel = normalizeLogLevel(readEnv("LOG_LEVEL"));

  if (explicitLevel) {
    return explicitLevel;
  }

  return readEnv("NODE_ENV") === "test" ? "silent" : "info";
}

function normalizeLogLevel(value: string | undefined): LogLevel | null {
  if (
    value === "debug" ||
    value === "info" ||
    value === "warn" ||
    value === "error" ||
    value === "silent"
  ) {
    return value;
  }

  return null;
}

function readEnv(key: string): string | undefined {
  const metaEnv = (import.meta as ImportMeta & {
    env?: ImportMetaEnv & Record<string, string | undefined>;
  }).env;

  return metaEnv?.[key] ?? process.env[key];
}

function createRequestId(): string {
  if (globalThis.crypto && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function sanitizeLogContext(context: LogContext): LogContext {
  return sanitizeValue(context, 0) as LogContext;
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (depth > 4) {
    return "[truncated]";
  }

  if (value instanceof Error) {
    return sanitizeValue(serializeError(value), depth + 1);
  }

  if (typeof value === "string") {
    return sanitizeString(value);
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null ||
    value === undefined
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const sanitized: LogContext = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      sanitized[key] = isSensitiveKey(key)
        ? "[redacted]"
        : sanitizeValue(nestedValue, depth + 1);
    }

    return sanitized;
  }

  return String(value);
}

function isSensitiveKey(key: string): boolean {
  return sensitiveExactKeys.has(key.toLowerCase()) || sensitiveKeyPattern.test(key);
}

function sanitizeString(value: string): string {
  const sanitized = value
    .replace(emailPattern, "[redacted-email]")
    .replace(bearerPattern, "Bearer [redacted]");

  if (sanitized.length <= maxStringLength) {
    return sanitized;
  }

  return `${sanitized.slice(0, maxStringLength)}...[truncated]`;
}
