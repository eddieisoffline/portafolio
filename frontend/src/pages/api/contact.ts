import type { APIRoute } from "astro";

import { getRequestId, serializeError, serverLogger } from "../../lib/serverLogger";

const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 3000;
const CONTACT_RATE_LIMIT = {
  limit: 5,
  windowMs: 15 * 60 * 1000
};
const MAX_RATE_LIMIT_BUCKETS = 5000;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const requestId = locals.requestId ?? getRequestId(request.headers);
  const rateLimit = checkContactRateLimit(getContactRateLimitKey(request));

  if (!rateLimit.allowed) {
    serverLogger.warn("contact_rate_limited", { requestId });

    return json(
      { ok: false, error: "rate_limited", requestId },
      429,
      requestId,
      getContactRateLimitHeaders(rateLimit)
    );
  }

  try {
    const formData = await request.formData();
    const company = getField(formData, "company");

    if (company.length > 0) {
      return json({ ok: true }, 200, requestId);
    }

    const name = getField(formData, "name");
    const email = getField(formData, "email");
    const message = getField(formData, "message");
    const validationError = validateContactInput({ name, email, message });

    if (validationError) {
      return json({ ok: false, error: validationError, requestId }, 400, requestId);
    }

    const contactEnv = getContactEnv();

    if (contactEnv.missing.length > 0) {
      serverLogger.error("contact_config_missing", {
        requestId,
        missingEnv: contactEnv.missing,
        inputLengths: getInputLengths({ name, email, message })
      });

      return json(
        { ok: false, error: "contact_not_configured", requestId },
        500,
        requestId
      );
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${contactEnv.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: contactEnv.from,
        to: contactEnv.to,
        reply_to: email,
        subject: `Portfolio contact: ${name}`,
        text: buildTextEmail({ name, email, message }),
        html: buildHtmlEmail({ name, email, message })
      })
    });

    if (!resendResponse.ok) {
      const resendBody = await resendResponse.text().catch(() => "");

      serverLogger.error("contact_resend_failed", {
        requestId,
        status: resendResponse.status,
        statusText: resendResponse.statusText,
        responseBodySummary: summarizeProviderBody(resendBody),
        inputLengths: getInputLengths({ name, email, message })
      });

      return json({ ok: false, error: "email_send_failed", requestId }, 502, requestId);
    }

    return json({ ok: true }, 200, requestId);
  } catch (error) {
    serverLogger.error("contact_unexpected_error", {
      requestId,
      ...serializeError(error)
    });

    return json({ ok: false, error: "contact_unexpected_error", requestId }, 500, requestId);
  }
};

function getField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function validateContactInput(input: {
  name: string;
  email: string;
  message: string;
}): string | null {
  if (!input.name || input.name.length > MAX_NAME_LENGTH) {
    return "invalid_name";
  }

  if (
    !input.email ||
    input.email.length > MAX_EMAIL_LENGTH ||
    !emailPattern.test(input.email)
  ) {
    return "invalid_email";
  }

  if (!input.message || input.message.length > MAX_MESSAGE_LENGTH) {
    return "invalid_message";
  }

  return null;
}

function getContactEnv(): {
  apiKey: string;
  to: string;
  from: string;
  missing: Array<keyof ImportMetaEnv>;
} {
  const apiKey = getPrivateEnv("RESEND_API_KEY") ?? "";
  const to = getPrivateEnv("CONTACT_TO_EMAIL") ?? "";
  const from = getPrivateEnv("CONTACT_FROM_EMAIL") ?? "";
  const missing: Array<keyof ImportMetaEnv> = [];

  if (!apiKey) {
    missing.push("RESEND_API_KEY");
  }

  if (!to) {
    missing.push("CONTACT_TO_EMAIL");
  }

  if (!from) {
    missing.push("CONTACT_FROM_EMAIL");
  }

  return {
    apiKey,
    to,
    from,
    missing
  };
}

function getInputLengths(input: {
  name: string;
  email: string;
  message: string;
}): Record<string, number> {
  return {
    nameLength: input.name.length,
    emailLength: input.email.length,
    messageLength: input.message.length
  };
}

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const contactRateLimitBuckets = new Map<string, RateLimitBucket>();

function getContactRateLimitKey(request: Request): string {
  const forwardedFor = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const clientKey = forwardedFor || realIp || "unknown";

  return `contact:${clientKey.slice(0, 80)}`;
}

function checkContactRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  pruneContactRateLimitBuckets(now);
  const bucket = contactRateLimitBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + CONTACT_RATE_LIMIT.windowMs;
    contactRateLimitBuckets.set(key, { count: 1, resetAt });

    return {
      allowed: true,
      limit: CONTACT_RATE_LIMIT.limit,
      remaining: Math.max(CONTACT_RATE_LIMIT.limit - 1, 0),
      resetAt,
      retryAfterSeconds: 0
    };
  }

  if (bucket.count >= CONTACT_RATE_LIMIT.limit) {
    return {
      allowed: false,
      limit: CONTACT_RATE_LIMIT.limit,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfterSeconds: Math.max(Math.ceil((bucket.resetAt - now) / 1000), 1)
    };
  }

  bucket.count += 1;

  return {
    allowed: true,
    limit: CONTACT_RATE_LIMIT.limit,
    remaining: Math.max(CONTACT_RATE_LIMIT.limit - bucket.count, 0),
    resetAt: bucket.resetAt,
    retryAfterSeconds: 0
  };
}

function pruneContactRateLimitBuckets(now: number): void {
  if (contactRateLimitBuckets.size < MAX_RATE_LIMIT_BUCKETS) {
    return;
  }

  for (const [key, bucket] of contactRateLimitBuckets) {
    if (bucket.resetAt <= now) {
      contactRateLimitBuckets.delete(key);
    }
  }

  const targetSize = Math.floor(MAX_RATE_LIMIT_BUCKETS * 0.8);
  for (const key of contactRateLimitBuckets.keys()) {
    if (contactRateLimitBuckets.size <= targetSize) {
      break;
    }

    contactRateLimitBuckets.delete(key);
  }
}

function getContactRateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  return {
    "x-ratelimit-limit": String(result.limit),
    "x-ratelimit-remaining": String(result.remaining),
    "x-ratelimit-reset": String(Math.ceil(result.resetAt / 1000)),
    ...(result.allowed
      ? {}
      : { "retry-after": String(result.retryAfterSeconds) })
  };
}

function summarizeProviderBody(value: string): Record<string, unknown> {
  const trimmed = value.trim();

  if (!trimmed) {
    return {
      bodyLength: 0
    };
  }

  const summary: Record<string, unknown> = {
    bodyLength: value.length
  };

  try {
    const parsed = JSON.parse(trimmed) as unknown;

    if (isRecord(parsed)) {
      summary.jsonKeys = Object.keys(parsed).slice(0, 10);
      const safeCode = getSafeIdentifier(parsed.code);
      const safeName = getSafeIdentifier(parsed.name);

      if (safeCode) {
        summary.code = safeCode;
      }

      if (safeName) {
        summary.name = safeName;
      }
    }
  } catch {
    summary.bodyType = "text";
  }

  return summary;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getSafeIdentifier(value: unknown): string | undefined {
  if (typeof value !== "string" || !/^[a-z0-9_.-]{1,80}$/i.test(value)) {
    return undefined;
  }

  return value;
}

function buildTextEmail(input: {
  name: string;
  email: string;
  message: string;
}): string {
  return [
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    "",
    input.message
  ].join("\n");
}

function buildHtmlEmail(input: {
  name: string;
  email: string;
  message: string;
}): string {
  return `
    <h2>Portfolio contact</h2>
    <p><strong>Name:</strong> ${escapeHtml(input.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(input.message).replace(/\n/g, "<br />")}</p>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getPrivateEnv(key: keyof ImportMetaEnv): string | undefined {
  const metaEnv = (import.meta as ImportMeta & { env?: ImportMetaEnv }).env;
  return metaEnv?.[key] ?? process.env[key];
}

function json(
  body: Record<string, unknown>,
  status = 200,
  requestId?: string,
  extraHeaders: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
      ...(requestId ? { "x-request-id": requestId } : {})
    }
  });
}
