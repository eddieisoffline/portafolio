import { defineMiddleware } from "astro:middleware";

import {
  getLocaleFromPath,
  getLocaleFromRequest,
  withLocale
} from "./lib/i18n";
import { getRequestId, serializeError, serverLogger } from "./lib/serverLogger";

export const onRequest = defineMiddleware(async (context, next) => {
  const startedAt = performance.now();
  const url = new URL(context.request.url);
  const requestId = getRequestId(context.request.headers);
  context.locals.requestId = requestId;

  try {
    const response = await handleRequest(context, next, url);
    response.headers.set("x-request-id", requestId);
    applySecurityHeaders(response);
    logRequest({
      requestId,
      method: context.request.method,
      path: url.pathname,
      status: response.status,
      durationMs: getDurationMs(startedAt)
    });

    return response;
  } catch (error) {
    serverLogger.error("astro_request_error", {
      requestId,
      method: context.request.method,
      path: url.pathname,
      status: 500,
      durationMs: getDurationMs(startedAt),
      ...serializeError(error)
    });

    throw error;
  }
});

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' https: data: blob:",
  "font-src 'self' data:",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self' https: http://localhost:3000 http://127.0.0.1:3000 ws://localhost:* ws://127.0.0.1:*",
  "frame-src https://lookerstudio.google.com https://lookerstudio.googleusercontent.com"
].join("; ");

function applySecurityHeaders(response: Response): void {
  response.headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
}

async function handleRequest(
  context: Parameters<Parameters<typeof defineMiddleware>[0]>[0],
  next: Parameters<Parameters<typeof defineMiddleware>[0]>[1],
  url: URL
): Promise<Response> {
  const locale = getLocaleFromPath(url.pathname);

  if (locale) {
    context.cookies.set("portfolio_locale", locale, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax"
    });
    return next();
  }

  if (url.pathname === "/" || url.pathname.startsWith("/projects")) {
    url.pathname = withLocale(url.pathname, getLocaleFromRequest(context.request));
    return context.redirect(url.toString(), 302);
  }

  return next();
}

function logRequest(input: {
  requestId: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
}): void {
  if (!input.path.startsWith("/api/") && input.status < 500) {
    return;
  }

  const logContext = {
    requestId: input.requestId,
    method: input.method,
    path: input.path,
    status: input.status,
    durationMs: input.durationMs
  };

  if (input.status >= 500) {
    serverLogger.error("http_request", logContext);
    return;
  }

  if (input.status >= 400) {
    serverLogger.warn("http_request", logContext);
    return;
  }

  serverLogger.info("http_request", logContext);
}

function getDurationMs(startedAt: number): number {
  return Math.round((performance.now() - startedAt) * 100) / 100;
}
