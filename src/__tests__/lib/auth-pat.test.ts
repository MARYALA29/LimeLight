/**
 * @jest-environment node
 *
 * Tests for `getCurrentUserOrPATUser` — resolves a user from either a
 * session cookie (existing behavior via `getCurrentUser`) or a PAT in the
 * Authorization header. Also covers `lastUsedAt` debounced updates.
 */

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

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  getCurrentUserOrPATUser,
  __resetPATLastUsedCacheForTests,
} from "@/lib/auth-pat";
import { hashToken, generatePersonalAccessToken } from "@/lib/pat";

const mockedPrisma = prisma as unknown as {
  personalAccessToken: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  user: { findUnique: jest.Mock };
};
const mockedGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;

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

function makeRequest(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/test", { headers });
}

describe("getCurrentUserOrPATUser", () => {
  it("falls back to session-based getCurrentUser when no Authorization header is present", async () => {
    mockedGetCurrentUser.mockResolvedValue(userRow);
    const result = await getCurrentUserOrPATUser(makeRequest());
    expect(result).toEqual({ user: userRow, viaPAT: false });
  });

  it("returns null when neither session nor PAT auth succeeds", async () => {
    mockedGetCurrentUser.mockResolvedValue(null);
    const result = await getCurrentUserOrPATUser(makeRequest());
    expect(result).toBeNull();
  });

  it("authenticates a user via a valid PAT in the Authorization header", async () => {
    const { token, tokenHash } = generatePersonalAccessToken();

    mockedPrisma.personalAccessToken.findUnique.mockResolvedValue({
      id: "pat-1",
      userId: "user-1",
      tokenHash,
      revokedAt: null,
      lastUsedAt: null,
      user: userRow,
    });

    const result = await getCurrentUserOrPATUser(
      makeRequest({ authorization: `Bearer ${token}` })
    );

    expect(mockedPrisma.personalAccessToken.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tokenHash: hashToken(token) } })
    );
    expect(result).toEqual({
      user: expect.objectContaining({ id: "user-1" }),
      viaPAT: true,
      tokenId: "pat-1",
    });
  });

  it("rejects a revoked PAT (returns null even if session also missing)", async () => {
    const { token, tokenHash } = generatePersonalAccessToken();
    mockedGetCurrentUser.mockResolvedValue(null);

    mockedPrisma.personalAccessToken.findUnique.mockResolvedValue({
      id: "pat-1",
      userId: "user-1",
      tokenHash,
      revokedAt: new Date("2024-01-02"),
      lastUsedAt: null,
      user: userRow,
    });

    const result = await getCurrentUserOrPATUser(
      makeRequest({ authorization: `Bearer ${token}` })
    );

    expect(result).toBeNull();
  });

  it("rejects a malformed Authorization header", async () => {
    mockedGetCurrentUser.mockResolvedValue(null);
    const result = await getCurrentUserOrPATUser(
      makeRequest({ authorization: "Bearer not-a-real-token" })
    );
    expect(result).toBeNull();
    expect(mockedPrisma.personalAccessToken.findUnique).not.toHaveBeenCalled();
  });

  it("rejects a token whose hash is not in the database", async () => {
    const { token } = generatePersonalAccessToken();
    mockedPrisma.personalAccessToken.findUnique.mockResolvedValue(null);

    const result = await getCurrentUserOrPATUser(
      makeRequest({ authorization: `Bearer ${token}` })
    );

    expect(result).toBeNull();
  });

  it("updates lastUsedAt on first successful PAT auth", async () => {
    const { token, tokenHash } = generatePersonalAccessToken();
    mockedPrisma.personalAccessToken.findUnique.mockResolvedValue({
      id: "pat-1",
      userId: "user-1",
      tokenHash,
      revokedAt: null,
      lastUsedAt: null,
      user: userRow,
    });

    await getCurrentUserOrPATUser(
      makeRequest({ authorization: `Bearer ${token}` })
    );

    expect(mockedPrisma.personalAccessToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "pat-1" },
        data: expect.objectContaining({ lastUsedAt: expect.any(Date) }),
      })
    );
  });

  it("debounces lastUsedAt to at most once per minute per token", async () => {
    const { token, tokenHash } = generatePersonalAccessToken();
    mockedPrisma.personalAccessToken.findUnique.mockResolvedValue({
      id: "pat-1",
      userId: "user-1",
      tokenHash,
      revokedAt: null,
      lastUsedAt: new Date(),
      user: userRow,
    });

    // First call writes lastUsedAt
    await getCurrentUserOrPATUser(
      makeRequest({ authorization: `Bearer ${token}` })
    );
    // Second call within the debounce window should skip the write
    await getCurrentUserOrPATUser(
      makeRequest({ authorization: `Bearer ${token}` })
    );

    expect(mockedPrisma.personalAccessToken.update).toHaveBeenCalledTimes(1);
  });
});
