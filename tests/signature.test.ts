import { describe, expect, it } from "vitest";

import {
  createGitHubSignature,
  verifyGitHubSignature
} from "../src/security/signature.js";

describe("GitHub webhook signature", () => {
  it("accepts a valid sha256 signature", () => {
    const payload = JSON.stringify({ zen: "Keep it logically awesome." });
    const secret = "test-secret";
    const signature = createGitHubSignature(payload, secret);

    expect(
      verifyGitHubSignature({
        payload,
        signatureHeader: signature,
        secret
      })
    ).toBe(true);
  });

  it("rejects an invalid signature", () => {
    expect(
      verifyGitHubSignature({
        payload: "{}",
        signatureHeader: "sha256=bad",
        secret: "test-secret"
      })
    ).toBe(false);
  });

  it("rejects a missing signature", () => {
    expect(
      verifyGitHubSignature({
        payload: "{}",
        secret: "test-secret"
      })
    ).toBe(false);
  });
});
