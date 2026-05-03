/**
 * @jest-environment node
 *
 * Smoke tests that hit the deployed HTTPS API to catch issues local tests
 * can't: schema-not-synced after deploy, missing env vars, broken Vercel
 * deploys, runtime auth failures.
 *
 * Run with `npm run test:smoke`. Skipped by default in `npm test`.
 *
 * Configurable via env:
 *   SMOKE_BASE_URL — defaults to https://limelightv1.vercel.app
 *
 * Each run registers a fresh user with a unique email, so tests don't
 * depend on rotated seed credentials. The registered user will remain on
 * the system after the run — tolerated for now; can be cleaned up by a
 * future "delete account" endpoint.
 */

const BASE_URL = (process.env.SMOKE_BASE_URL ?? "https://limelightv1.vercel.app").replace(
  /\/$/,
  ""
);

// Per-run unique credentials so back-to-back runs don't collide.
const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const TEST_USER = {
  email: `smoke-${uniqueId}@smoke.test`,
  password: `smoke-pw-${uniqueId}`,
  name: `Smoke ${uniqueId}`,
};

/**
 * Pull the auth-token cookie out of a Set-Cookie response header so we can
 * replay it on subsequent requests. Cookie jar would be overkill — we only
 * care about a single named cookie.
 */
function extractAuthCookie(response: Response): string | null {
  // Some runtimes expose getSetCookie(); fall back to the raw header.
  const cookies = (response.headers as Headers & { getSetCookie?: () => string[] })
    .getSetCookie?.() ?? [response.headers.get("set-cookie") ?? ""];
  for (const c of cookies) {
    const match = c.match(/auth-token=([^;]+)/);
    if (match) return `auth-token=${match[1]}`;
  }
  return null;
}

// State carried across the ordered test sequence. Each test is independent
// in what it asserts but they share an in-memory session.
const session: {
  cookie: string | null;
  rawToken: string | null;
  tokenId: string | null;
} = {
  cookie: null,
  rawToken: null,
  tokenId: null,
};

describe(`smoke: deployed API at ${BASE_URL}`, () => {
  // Generous because cold starts on serverless can be slow.
  jest.setTimeout(30_000);

  it("GET /api/version returns version metadata", async () => {
    const res = await fetch(`${BASE_URL}/api/version`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.version).toBe("string");
    expect(body.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(typeof body.commit).toBe("string");
    expect(typeof body.builtAt).toBe("string");
    // builtAt should be a valid ISO timestamp
    expect(Number.isFinite(Date.parse(body.builtAt))).toBe(true);
  });

  it("GET /api/auth/me without a session returns 401", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("POST /api/auth/login with bogus credentials returns 401", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nobody@example.invalid",
        password: "definitely-wrong-password",
      }),
    });
    expect(res.status).toBe(401);
  });

  it("POST /api/auth/register creates a fresh user and sets a session cookie", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TEST_USER),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe(TEST_USER.email);

    const cookie = extractAuthCookie(res);
    expect(cookie).not.toBeNull();
    session.cookie = cookie;
  });

  it("POST /api/auth/login with the registered credentials returns a session", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
      }),
    });
    expect(res.status).toBe(200);
    const cookie = extractAuthCookie(res);
    expect(cookie).not.toBeNull();
    // Prefer the freshest cookie for subsequent requests.
    session.cookie = cookie;
  });

  it("GET /api/auth/me with the session cookie returns the user", async () => {
    expect(session.cookie).toBeTruthy();
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: session.cookie! },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe(TEST_USER.email);
  });

  it("POST /api/users/me/tokens creates a personal access token", async () => {
    expect(session.cookie).toBeTruthy();
    const res = await fetch(`${BASE_URL}/api/users/me/tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: session.cookie!,
      },
      body: JSON.stringify({ name: "smoke-test-token" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(typeof body.token).toBe("string");
    expect(body.token).toMatch(/^ll_pat_/);
    expect(body.personalAccessToken).toBeTruthy();
    expect(typeof body.personalAccessToken.id).toBe("string");
    session.rawToken = body.token;
    session.tokenId = body.personalAccessToken.id;
  });

  it("GET /api/auth/me with the PAT in Authorization header returns the user", async () => {
    expect(session.rawToken).toBeTruthy();
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${session.rawToken!}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe(TEST_USER.email);
  });

  it("GET /api/auth/me with a malformed Bearer token returns 401", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: "Bearer ll_pat_not-a-real-token" },
    });
    expect(res.status).toBe(401);
  });

  it("GET /api/users/me/tokens lists the created token without exposing the raw value", async () => {
    expect(session.cookie).toBeTruthy();
    const res = await fetch(`${BASE_URL}/api/users/me/tokens`, {
      headers: { Cookie: session.cookie! },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.personalAccessTokens)).toBe(true);
    const created = body.personalAccessTokens.find(
      (t: { id: string }) => t.id === session.tokenId
    );
    expect(created).toBeTruthy();
    expect(created).not.toHaveProperty("token");
    expect(created).not.toHaveProperty("tokenHash");
  });

  it("DELETE /api/users/me/tokens/:id revokes the PAT", async () => {
    expect(session.cookie).toBeTruthy();
    expect(session.tokenId).toBeTruthy();
    const res = await fetch(`${BASE_URL}/api/users/me/tokens/${session.tokenId}`, {
      method: "DELETE",
      headers: { Cookie: session.cookie! },
    });
    expect([200, 204]).toContain(res.status);
  });

  it("GET /api/auth/me with the now-revoked PAT returns 401", async () => {
    expect(session.rawToken).toBeTruthy();
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${session.rawToken!}` },
    });
    expect(res.status).toBe(401);
  });
});
