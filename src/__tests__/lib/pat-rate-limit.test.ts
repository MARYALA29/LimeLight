/**
 * @jest-environment node
 *
 * Tests the in-memory token-bucket rate limiter for PAT creation.
 * Limit: 10 creations per rolling hour per user.
 */

import {
  checkAndIncrementCreateRate,
  __resetRateLimiterForTests,
  PAT_CREATE_LIMIT_PER_HOUR,
} from "@/lib/pat-rate-limit";

beforeEach(() => {
  __resetRateLimiterForTests();
});

describe("checkAndIncrementCreateRate", () => {
  it("allows the first call and decrements remaining", () => {
    const result = checkAndIncrementCreateRate("user-1");
    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(PAT_CREATE_LIMIT_PER_HOUR - 1);
  });

  it("blocks once the per-hour limit is reached", () => {
    for (let i = 0; i < PAT_CREATE_LIMIT_PER_HOUR; i += 1) {
      const r = checkAndIncrementCreateRate("user-1");
      expect(r.ok).toBe(true);
    }
    const blocked = checkAndIncrementCreateRate("user-1");
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("isolates buckets per user", () => {
    for (let i = 0; i < PAT_CREATE_LIMIT_PER_HOUR; i += 1) {
      checkAndIncrementCreateRate("user-1");
    }
    expect(checkAndIncrementCreateRate("user-1").ok).toBe(false);
    expect(checkAndIncrementCreateRate("user-2").ok).toBe(true);
  });
});
