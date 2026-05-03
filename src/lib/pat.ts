/**
 * Personal Access Token (PAT) helpers.
 *
 * Tokens are 256-bit random secrets, base64url-encoded, prefixed with
 * `ll_pat_` for log identification. We store only a sha256 hash of the
 * token. Why sha256 instead of bcrypt?
 *
 *   - bcrypt is intentionally slow and is appropriate for low-entropy
 *     human-chosen passwords, where attackers would otherwise grind
 *     through dictionaries.
 *   - PATs are 256 bits of cryptographically-secure randomness — they are
 *     not guessable. The threat model is "attacker has the database hash
 *     and wants to recover the token". With 2^256 possibilities, a fast
 *     hash is no easier to attack than a slow one.
 *   - Authentication needs to be fast (every API request) — bcrypt would
 *     make every PAT-authenticated request take ~100ms.
 *
 * Verification uses `crypto.timingSafeEqual` on equal-length buffers to
 * prevent timing-based hash recovery.
 */

import { createHash, randomBytes, timingSafeEqual } from "crypto";

export const TOKEN_PREFIX = "ll_pat_";
/** Number of chars after `ll_pat_` we expose publicly for token identification. */
export const PUBLIC_PREFIX_LENGTH = 8;
/** Random bytes for the secret part of the token. */
const SECRET_BYTES = 32;

export interface GeneratedToken {
  /** The raw token, e.g. `ll_pat_abc...`. Show to the user once and never persist. */
  token: string;
  /** sha256 hash of the raw token, hex-encoded. Persist this. */
  tokenHash: string;
  /** First {@link PUBLIC_PREFIX_LENGTH} chars after the `ll_pat_` prefix. Persist for display. */
  prefix: string;
}

/**
 * Generate a new PAT. The raw token is returned exactly once — callers must
 * surface it to the user immediately and discard it.
 */
export function generatePersonalAccessToken(): GeneratedToken {
  const secret = randomBytes(SECRET_BYTES).toString("base64url");
  const token = `${TOKEN_PREFIX}${secret}`;
  const tokenHash = hashToken(token);
  const prefix = secret.slice(0, PUBLIC_PREFIX_LENGTH);
  return { token, tokenHash, prefix };
}

/**
 * Compute the sha256 hash of a raw token, hex-encoded.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Verify a raw token against a stored sha256 hex hash using a constant-time
 * comparison. Returns false rather than throwing on malformed inputs.
 */
export function verifyTokenAgainstHash(token: string, storedHash: string): boolean {
  if (!token.startsWith(TOKEN_PREFIX)) return false;
  const computed = hashToken(token);
  if (computed.length !== storedHash.length) return false;
  try {
    const a = Buffer.from(computed, "hex");
    const b = Buffer.from(storedHash, "hex");
    if (a.length !== b.length || a.length === 0) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
