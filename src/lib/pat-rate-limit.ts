/**
 * Simple in-memory rolling-window rate limiter for PAT creation.
 *
 * Limit: 10 creations per rolling 1-hour window per user. This is per-process
 * and resets on restart — fine for v1. A future iteration can move this to
 * Redis or a database counter.
 *
 * Why limit creation? An authenticated attacker could otherwise mint
 * thousands of tokens, e.g. as a denial-of-service vector or to make
 * revocation infeasible.
 */

export const PAT_CREATE_LIMIT_PER_HOUR = 10;
const WINDOW_MS = 60 * 60 * 1000;

const buckets = new Map<string, number[]>();

export interface RateCheckResult {
  ok: boolean;
  remaining: number;
}

export function checkAndIncrementCreateRate(userId: string): RateCheckResult {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const existing = buckets.get(userId) ?? [];
  // Drop entries outside the window
  const fresh = existing.filter((t) => t > cutoff);

  if (fresh.length >= PAT_CREATE_LIMIT_PER_HOUR) {
    buckets.set(userId, fresh);
    return { ok: false, remaining: 0 };
  }

  fresh.push(now);
  buckets.set(userId, fresh);
  return { ok: true, remaining: PAT_CREATE_LIMIT_PER_HOUR - fresh.length };
}

/** Test-only reset hook. */
export function __resetRateLimiterForTests() {
  buckets.clear();
}
