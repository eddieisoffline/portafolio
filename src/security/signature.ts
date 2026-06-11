import { createHmac, timingSafeEqual } from "node:crypto";

const SIGNATURE_PREFIX = "sha256=";

export function createGitHubSignature(
  payload: string | Buffer,
  secret: string
): string {
  const digest = createHmac("sha256", secret).update(payload).digest("hex");
  return `${SIGNATURE_PREFIX}${digest}`;
}

export function verifyGitHubSignature(params: {
  payload: string | Buffer;
  signatureHeader?: string | string[];
  secret: string;
}): boolean {
  const signatureHeader = Array.isArray(params.signatureHeader)
    ? params.signatureHeader[0]
    : params.signatureHeader;

  if (!signatureHeader?.startsWith(SIGNATURE_PREFIX)) {
    return false;
  }

  const expected = createGitHubSignature(params.payload, params.secret);
  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(signatureHeader, "utf8");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
