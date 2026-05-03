/**
 * @jest-environment node
 *
 * PAT-management endpoints must NOT accept PAT auth — only session cookies.
 * Otherwise, a stolen PAT could be used to mint or revoke other PATs,
 * making revocation pointless.
 *
 * These tests verify the create/list/revoke routes use `getCurrentUser()`
 * (session-only) rather than `getCurrentUserOrPATUser()`.
 */

import { NextRequest } from "next/server";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    personalAccessToken: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("@/lib/pat-rate-limit", () => ({
  checkAndIncrementCreateRate: jest.fn(() => ({ ok: true, remaining: 9 })),
}));

import { getCurrentUser } from "@/lib/auth";
import { POST as createPOST, GET as listGET } from "@/app/api/users/me/tokens/route";
import { DELETE as revokeDELETE } from "@/app/api/users/me/tokens/[id]/route";
import { generatePersonalAccessToken } from "@/lib/pat";

const mockedAuth = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;

beforeEach(() => {
  jest.clearAllMocks();
  // Simulate "no session". A PAT in the header must not rescue the request.
  mockedAuth.mockResolvedValue(null);
});

describe("PAT routes reject PAT auth (session cookie required)", () => {
  it("POST /api/users/me/tokens returns 401 even with a Bearer token", async () => {
    const { token } = generatePersonalAccessToken();
    const req = new NextRequest("http://localhost/api/users/me/tokens", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: "evil" }),
    });
    const res = await createPOST(req);
    expect(res.status).toBe(401);
  });

  it("GET /api/users/me/tokens returns 401 with a Bearer token (no session)", async () => {
    const res = await listGET();
    expect(res.status).toBe(401);
  });

  it("DELETE /api/users/me/tokens/[id] returns 401 with a Bearer token", async () => {
    const { token } = generatePersonalAccessToken();
    const req = new NextRequest("http://localhost/api/users/me/tokens/pat-1", {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` },
    });
    const res = await revokeDELETE(req, {
      params: Promise.resolve({ id: "pat-1" }),
    });
    expect(res.status).toBe(401);
  });
});
