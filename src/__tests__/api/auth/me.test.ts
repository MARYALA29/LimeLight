/**
 * @jest-environment node
 *
 * Tests `GET /api/auth/me` and `PATCH /api/auth/me`. Prisma and the auth
 * helpers are mocked so we can verify the route handlers in isolation.
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

jest.mock("@/lib/auth-pat", () => ({
  getCurrentUserOrPATUser: jest.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentUserOrPATUser } from "@/lib/auth-pat";
import { GET, PATCH } from "@/app/api/auth/me/route";

const mockedAuth = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
const mockedAuthOrPAT = getCurrentUserOrPATUser as jest.MockedFunction<
  typeof getCurrentUserOrPATUser
>;
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
  return new NextRequest("http://localhost/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeGet() {
  return new NextRequest("http://localhost/api/auth/me", { method: "GET" });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/auth/me", () => {
  it("returns 401 when unauthenticated", async () => {
    mockedAuthOrPAT.mockResolvedValue(null);
    const res = await GET(makeGet());
    expect(res.status).toBe(401);
  });

  it("returns the user when authenticated", async () => {
    mockedAuthOrPAT.mockResolvedValue({ user: baseUser, viaPAT: false });
    const res = await GET(makeGet());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.id).toBe("user-1");
    expect(body.user.themePreference).toBe("SYSTEM");
  });
});

describe("PATCH /api/auth/me", () => {
  it("returns 401 when unauthenticated", async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await PATCH(makePatch({ name: "New" }));
    expect(res.status).toBe(401);
  });

  it("updates the name when provided a valid payload", async () => {
    mockedAuth.mockResolvedValue(baseUser);
    mockedPrisma.user.update.mockResolvedValue({
      ...baseUser,
      name: "Renamed",
    });

    const res = await PATCH(makePatch({ name: "Renamed" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.name).toBe("Renamed");
    expect(mockedPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({ name: "Renamed" }),
      })
    );
  });

  it("rejects an invalid name with a 400", async () => {
    mockedAuth.mockResolvedValue(baseUser);
    const res = await PATCH(makePatch({ name: "" }));
    expect(res.status).toBe(400);
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });

  it("accepts a themePreference of DARK", async () => {
    mockedAuth.mockResolvedValue(baseUser);
    mockedPrisma.user.update.mockResolvedValue({
      ...baseUser,
      themePreference: "DARK",
    });

    const res = await PATCH(
      makePatch({ name: "Demo User", themePreference: "DARK" })
    );
    expect(res.status).toBe(200);
    expect(mockedPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ themePreference: "DARK" }),
      })
    );
    const body = await res.json();
    expect(body.user.themePreference).toBe("DARK");
  });

  it("accepts a themePreference of LIGHT", async () => {
    mockedAuth.mockResolvedValue(baseUser);
    mockedPrisma.user.update.mockResolvedValue({
      ...baseUser,
      themePreference: "LIGHT",
    });

    const res = await PATCH(
      makePatch({ name: "Demo User", themePreference: "LIGHT" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.themePreference).toBe("LIGHT");
  });

  it("accepts a themePreference of SYSTEM", async () => {
    mockedAuth.mockResolvedValue(baseUser);
    mockedPrisma.user.update.mockResolvedValue({
      ...baseUser,
      themePreference: "SYSTEM",
    });

    const res = await PATCH(
      makePatch({ name: "Demo User", themePreference: "SYSTEM" })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.themePreference).toBe("SYSTEM");
  });

  it("rejects an invalid themePreference with a 400", async () => {
    mockedAuth.mockResolvedValue(baseUser);
    const res = await PATCH(
      makePatch({ name: "Demo User", themePreference: "AUTO" })
    );
    expect(res.status).toBe(400);
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });

  it("returns themePreference in the selected fields", async () => {
    mockedAuth.mockResolvedValue(baseUser);
    mockedPrisma.user.update.mockResolvedValue({
      ...baseUser,
      themePreference: "DARK",
    });

    await PATCH(makePatch({ name: "Demo User", themePreference: "DARK" }));
    const updateCall = mockedPrisma.user.update.mock.calls[0][0];
    expect(updateCall.select).toEqual(
      expect.objectContaining({ themePreference: true })
    );
  });
});
