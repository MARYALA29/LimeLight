/**
 * @jest-environment node
 *
 * Tests that an existing protected route (`GET /api/auth/me`) accepts both
 * session cookies and PATs.
 */

import { NextRequest } from "next/server";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    personalAccessToken: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => {
  const actual = jest.requireActual("@/lib/auth");
  return {
    ...actual,
    getCurrentUser: jest.fn(),
  };
});

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { __resetPATLastUsedCacheForTests } from "@/lib/auth-pat";
import { generatePersonalAccessToken } from "@/lib/pat";
import { GET as meGET } from "@/app/api/auth/me/route";

const mockedAuth = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
const mockedPrisma = prisma as unknown as {
  personalAccessToken: { findUnique: jest.Mock; update: jest.Mock };
};

const userRow = {
  id: "user-1",
  email: "user@example.com",
  name: "User",
  avatarUrl: null,
  role: "USER" as const,
  createdAt: new Date("2024-01-01"),
};

beforeEach(() => {
  jest.clearAllMocks();
  __resetPATLastUsedCacheForTests();
});

describe("GET /api/auth/me with PAT auth", () => {
  it("authenticates with a valid PAT in the Authorization header", async () => {
    mockedAuth.mockResolvedValue(null);
    const { token, tokenHash } = generatePersonalAccessToken();
    mockedPrisma.personalAccessToken.findUnique.mockResolvedValue({
      id: "pat-1",
      userId: userRow.id,
      tokenHash,
      revokedAt: null,
      lastUsedAt: null,
      user: userRow,
    });

    const req = new NextRequest("http://localhost/api/auth/me", {
      headers: { authorization: `Bearer ${token}` },
    });
    const res = await meGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toEqual(expect.objectContaining({ id: "user-1" }));
  });

  it("rejects a revoked PAT with 401", async () => {
    mockedAuth.mockResolvedValue(null);
    const { token, tokenHash } = generatePersonalAccessToken();
    mockedPrisma.personalAccessToken.findUnique.mockResolvedValue({
      id: "pat-1",
      userId: userRow.id,
      tokenHash,
      revokedAt: new Date("2024-02-01"),
      lastUsedAt: null,
      user: userRow,
    });

    const req = new NextRequest("http://localhost/api/auth/me", {
      headers: { authorization: `Bearer ${token}` },
    });
    const res = await meGET(req);
    expect(res.status).toBe(401);
  });

  it("rejects malformed bearer tokens with 401", async () => {
    mockedAuth.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/auth/me", {
      headers: { authorization: "Bearer not-a-pat" },
    });
    const res = await meGET(req);
    expect(res.status).toBe(401);
  });

  it("still works with a session cookie when no Authorization header is present", async () => {
    mockedAuth.mockResolvedValue(userRow);
    const req = new NextRequest("http://localhost/api/auth/me");
    const res = await meGET(req);
    expect(res.status).toBe(200);
  });
});
