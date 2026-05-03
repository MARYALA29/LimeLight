/**
 * @jest-environment node
 *
 * Tests `PATCH /api/users/me/preferences` — the dedicated endpoint for
 * updating just the user's theme preference.
 */
import { NextRequest } from "next/server";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => ({
  getCurrentUser: jest.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PATCH } from "@/app/api/users/me/preferences/route";

const mockedAuth = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
const mockedPrisma = prisma as unknown as {
  user: { update: jest.Mock };
};

const baseUser = {
  id: "user-1",
  email: "demo@example.com",
  name: "Demo User",
  avatarUrl: null,
  role: "USER" as const,
  themePreference: "SYSTEM" as const,
  createdAt: new Date("2024-01-01"),
};

function makePatch(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/users/me/preferences", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("PATCH /api/users/me/preferences", () => {
  it("returns 401 when unauthenticated", async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await PATCH(makePatch({ themePreference: "DARK" }));
    expect(res.status).toBe(401);
  });

  it("updates the user's theme preference to DARK", async () => {
    mockedAuth.mockResolvedValue(baseUser);
    mockedPrisma.user.update.mockResolvedValue({
      ...baseUser,
      themePreference: "DARK",
    });

    const res = await PATCH(makePatch({ themePreference: "DARK" }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.user.themePreference).toBe("DARK");
    expect(mockedPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: { themePreference: "DARK" },
      })
    );
  });

  it("updates the user's theme preference to LIGHT", async () => {
    mockedAuth.mockResolvedValue(baseUser);
    mockedPrisma.user.update.mockResolvedValue({
      ...baseUser,
      themePreference: "LIGHT",
    });

    const res = await PATCH(makePatch({ themePreference: "LIGHT" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.themePreference).toBe("LIGHT");
  });

  it("updates the user's theme preference to SYSTEM", async () => {
    mockedAuth.mockResolvedValue(baseUser);
    mockedPrisma.user.update.mockResolvedValue({
      ...baseUser,
      themePreference: "SYSTEM",
    });

    const res = await PATCH(makePatch({ themePreference: "SYSTEM" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.themePreference).toBe("SYSTEM");
  });

  it("rejects an unknown themePreference value with 400", async () => {
    mockedAuth.mockResolvedValue(baseUser);
    const res = await PATCH(makePatch({ themePreference: "AUTO" }));
    expect(res.status).toBe(400);
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });

  it("rejects a missing themePreference with 400", async () => {
    mockedAuth.mockResolvedValue(baseUser);
    const res = await PATCH(makePatch({}));
    expect(res.status).toBe(400);
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });

  it("ignores unknown fields in the payload", async () => {
    mockedAuth.mockResolvedValue(baseUser);
    mockedPrisma.user.update.mockResolvedValue({
      ...baseUser,
      themePreference: "DARK",
    });

    const res = await PATCH(
      makePatch({ themePreference: "DARK", role: "ADMIN", name: "Hacked" })
    );
    expect(res.status).toBe(200);
    const updateCall = mockedPrisma.user.update.mock.calls[0][0];
    expect(updateCall.data).toEqual({ themePreference: "DARK" });
  });
});
