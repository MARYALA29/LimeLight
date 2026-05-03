/**
 * @jest-environment node
 *
 * Tests for the Personal Access Token (PAT) library helpers — token generation,
 * hashing, and verification. The library uses sha256 (not bcrypt): PATs are
 * 256-bit random secrets, so a fast deterministic hash with constant-time
 * compare is appropriate.
 */

import {
  generatePersonalAccessToken,
  hashToken,
  verifyTokenAgainstHash,
  TOKEN_PREFIX,
  PUBLIC_PREFIX_LENGTH,
} from "@/lib/pat";

describe("generatePersonalAccessToken", () => {
  it("returns a token starting with the ll_pat_ prefix", () => {
    const { token } = generatePersonalAccessToken();
    expect(token.startsWith(TOKEN_PREFIX)).toBe(true);
  });

  it("returns a public prefix exposing the first chars after ll_pat_", () => {
    const { token, prefix } = generatePersonalAccessToken();
    const afterPrefix = token.slice(TOKEN_PREFIX.length);
    expect(prefix).toBe(afterPrefix.slice(0, PUBLIC_PREFIX_LENGTH));
  });

  it("returns a tokenHash that matches sha256(token)", () => {
    const { token, tokenHash } = generatePersonalAccessToken();
    expect(tokenHash).toBe(hashToken(token));
  });

  it("generates unique tokens across calls", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 25; i += 1) {
      const { token } = generatePersonalAccessToken();
      expect(seen.has(token)).toBe(false);
      seen.add(token);
    }
  });

  it("generates a token whose secret portion is base64url (no +, /, =)", () => {
    const { token } = generatePersonalAccessToken();
    const secret = token.slice(TOKEN_PREFIX.length);
    expect(secret).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe("hashToken", () => {
  it("is deterministic for the same input", () => {
    expect(hashToken("ll_pat_abcdef")).toBe(hashToken("ll_pat_abcdef"));
  });

  it("produces different hashes for different tokens", () => {
    expect(hashToken("ll_pat_aaa")).not.toBe(hashToken("ll_pat_bbb"));
  });

  it("returns a 64-char hex string (sha256)", () => {
    const hash = hashToken("ll_pat_anything");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("verifyTokenAgainstHash", () => {
  it("returns true when the token matches the stored hash", () => {
    const { token, tokenHash } = generatePersonalAccessToken();
    expect(verifyTokenAgainstHash(token, tokenHash)).toBe(true);
  });

  it("returns false when the token does not match", () => {
    const { tokenHash } = generatePersonalAccessToken();
    expect(verifyTokenAgainstHash("ll_pat_wrongtoken", tokenHash)).toBe(false);
  });

  it("returns false for malformed (non ll_pat_) tokens", () => {
    const { tokenHash } = generatePersonalAccessToken();
    expect(verifyTokenAgainstHash("not-a-pat", tokenHash)).toBe(false);
  });

  it("does not throw when tokenHash has unexpected length", () => {
    expect(() => verifyTokenAgainstHash("ll_pat_x", "shorthex")).not.toThrow();
    expect(verifyTokenAgainstHash("ll_pat_x", "shorthex")).toBe(false);
  });
});
