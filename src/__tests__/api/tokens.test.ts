/**
 * @jest-environment node
 *
 * Tests for the PAT management API routes:
 *   - POST   /api/users/me/tokens     create
 *   - GET    /api/users/me/tokens     list
 *   - DELETE /api/users/me/tokens/[id] revoke
 *
 * These routes require a session cookie — a stolen PAT must NOT be able
 * to mint or revoke other PATs.
 */

import { NextRequest } from "next/server";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    personalAccessToken: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("@/lib/pat-rate-limit", () => ({
  checkAndIncrementCreateRate: jest.fn(),
  __resetRateLimiterForTests: jest.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkAndIncrementCreateRate } from "@/lib/pat-rate-limit";
import { GET as listGET, POST as createPOST } from "@/app/api/users/me/tokens/route";
import { DELETE as revokeDELETE } from "@/app/api/users/me/tokens/[id]/route";
import { TOKEN_PREFIX } from "@/lib/pat";

const mockedAuth = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
const mockedRate = checkAndIncrementCreateRate as jest.MockedFunction<
  typeof checkAndIncrementCreateRate
>;
const mockedPrisma = prisma as unknown as {
  personalAccessToken: {
    create: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
    count: jest.Mock;
  };
};

const userRow = {
  id: "user-1",
  email: "user@example.com",
  name: "User",
  avatarUrl: null,
  role: "USER" as const,
  themePreference: "SYSTEM" as const,
  createdAt: new Date("2024-01-01"),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedRate.mockReturnValue({ ok: true, remaining: 9 });
});

function jsonRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/users/me/tokens", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function paramsFor(id: string) {
  return Promise.resolve({ id });
}

describe("POST /api/users/me/tokens", () => {
  it("returns 401 when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await createPOST(jsonRequest({ name: "ci-token" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when name is missing", async () => {
    mockedAuth.mockResolvedValue(userRow);
    const res = await createPOST(jsonRequest({}));
    expect(res.status).toBe(400);
  });

  it("creates a token, persists only the hash, and returns the raw token once", async () => {
    mockedAuth.mockResolvedValue(userRow);
    mockedPrisma.personalAccessToken.create.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: "pat-1",
        userId: userRow.id,
        name: data.name,
        prefix: data.prefix,
        scopes: data.scopes ?? ["*"],
        tokenHash: data.tokenHash,
        revokedAt: null,
        lastUsedAt: null,
        createdAt: new Date("2024-01-02"),
      })
    );

    const res = await createPOST(jsonRequest({ name: "ci-token" }));
    expect(res.status).toBe(201);
    const body = await res.json();

    expect(body.token).toEqual(expect.stringContaining(TOKEN_PREFIX));
    expect(body.personalAccessToken).toEqual(
      expect.objectContaining({
        id: "pat-1",
        name: "ci-token",
        prefix: expect.any(String),
      })
    );
    // The persisted record must NEVER include the raw token in plain form
    const persisted = mockedPrisma.personalAccessToken.create.mock.calls[0][0]
      .data as Record<string, unknown>;
    expect(persisted.tokenHash).toEqual(expect.any(String));
    expect(persisted).not.toHaveProperty("token");
    expect(typeof persisted.tokenHash).toBe("string");
    expect(persisted.tokenHash).not.toContain(TOKEN_PREFIX);
  });

  it("returns 429 when the rate limit has been exceeded", async () => {
    mockedAuth.mockResolvedValue(userRow);
    mockedRate.mockReturnValue({ ok: false, remaining: 0 });

    const res = await createPOST(jsonRequest({ name: "ci-token" }));
    expect(res.status).toBe(429);
    expect(mockedPrisma.personalAccessToken.create).not.toHaveBeenCalled();
  });
});

describe("GET /api/users/me/tokens", () => {
  it("returns 401 when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await listGET();
    expect(res.status).toBe(401);
  });

  it("lists active tokens without exposing tokenHash or raw token", async () => {
    mockedAuth.mockResolvedValue(userRow);
    mockedPrisma.personalAccessToken.findMany.mockResolvedValue([
      {
        id: "pat-1",
        name: "ci-token",
        prefix: "abcd1234",
        scopes: ["*"],
        lastUsedAt: null,
        revokedAt: null,
        createdAt: new Date("2024-01-02"),
      },
    ]);

    const res = await listGET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.personalAccessTokens).toHaveLength(1);
    const t = body.personalAccessTokens[0];
    expect(t).toEqual(
      expect.objectContaining({ id: "pat-1", name: "ci-token", prefix: "abcd1234" })
    );
    expect(t).not.toHaveProperty("tokenHash");
    expect(t).not.toHaveProperty("token");

    // The query must filter to the current user and exclude revoked tokens
    const args = mockedPrisma.personalAccessToken.findMany.mock.calls[0][0];
    expect(args.where).toEqual(
      expect.objectContaining({ userId: userRow.id, revokedAt: null })
    );
  });
});

describe("DELETE /api/users/me/tokens/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await revokeDELETE(
      new NextRequest("http://localhost/api/users/me/tokens/pat-1", {
        method: "DELETE",
      }),
      { params: paramsFor("pat-1") }
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when the token belongs to a different user", async () => {
    mockedAuth.mockResolvedValue(userRow);
    mockedPrisma.personalAccessToken.findFirst.mockResolvedValue(null);

    const res = await revokeDELETE(
      new NextRequest("http://localhost/api/users/me/tokens/pat-1", {
        method: "DELETE",
      }),
      { params: paramsFor("pat-1") }
    );
    expect(res.status).toBe(404);
  });

  it("soft-deletes (sets revokedAt) when the user owns the token", async () => {
    mockedAuth.mockResolvedValue(userRow);
    mockedPrisma.personalAccessToken.findFirst.mockResolvedValue({
      id: "pat-1",
      userId: userRow.id,
      revokedAt: null,
    });
    mockedPrisma.personalAccessToken.update.mockResolvedValue({
      id: "pat-1",
      userId: userRow.id,
      revokedAt: new Date("2024-01-03"),
    });

    const res = await revokeDELETE(
      new NextRequest("http://localhost/api/users/me/tokens/pat-1", {
        method: "DELETE",
      }),
      { params: paramsFor("pat-1") }
    );
    expect(res.status).toBe(200);

    const updateArgs = mockedPrisma.personalAccessToken.update.mock.calls[0][0];
    expect(updateArgs.where).toEqual({ id: "pat-1" });
    expect(updateArgs.data).toEqual(
      expect.objectContaining({ revokedAt: expect.any(Date) })
    );
  });
});
