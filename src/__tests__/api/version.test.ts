/**
 * @jest-environment node
 *
 * Tests the /api/version route handler. The handler should expose the
 * application version (sourced from package.json), the git commit it was
 * built from, and the build timestamp. Used for diagnostics and to confirm
 * which version is deployed in any given environment.
 */
import { GET } from "@/app/api/version/route";
import pkg from "../../../package.json";

describe("GET /api/version", () => {
  it("returns 200 with the version from package.json", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.version).toBe(pkg.version);
  });

  it("includes a commit field that is a string", async () => {
    const response = await GET();
    const body = await response.json();

    expect(typeof body.commit).toBe("string");
    expect(body.commit.length).toBeGreaterThan(0);
  });

  it("includes a builtAt field that is a valid ISO timestamp", async () => {
    const response = await GET();
    const body = await response.json();

    expect(typeof body.builtAt).toBe("string");
    // toISOString() always produces a string ending with Z
    const parsed = new Date(body.builtAt);
    expect(Number.isNaN(parsed.getTime())).toBe(false);
    expect(parsed.toISOString()).toBe(body.builtAt);
  });

  it("returns the same builtAt across requests (snapshot at module load time)", async () => {
    const first = await GET();
    const second = await GET();

    const firstBody = await first.json();
    const secondBody = await second.json();

    expect(firstBody.builtAt).toBe(secondBody.builtAt);
  });

  it("falls back to 'unknown' for commit when no env var is set", async () => {
    // The route module captures the commit at load time. We assert it's a
    // string — in CI/local where neither VERCEL_GIT_COMMIT_SHA nor
    // GIT_COMMIT is set, it should be "unknown".
    const response = await GET();
    const body = await response.json();

    if (
      !process.env.VERCEL_GIT_COMMIT_SHA &&
      !process.env.GIT_COMMIT
    ) {
      expect(body.commit).toBe("unknown");
    }
  });
});
