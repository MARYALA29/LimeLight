/**
 * @jest-environment node
 *
 * Tests the vulnerability API route handlers directly. Prisma and auth are
 * mocked so these run without a database. State machine and validation are
 * exercised end-to-end through the route handlers.
 */
import { NextRequest } from "next/server";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    projectMember: { findFirst: jest.fn() },
    project: { findUnique: jest.fn() },
    vulnerability: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => ({
  getCurrentUser: jest.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  GET as listGET,
  POST as createPOST,
} from "@/app/api/projects/[id]/vulnerabilities/route";
import {
  GET as detailGET,
  PATCH as detailPATCH,
} from "@/app/api/projects/[id]/vulnerabilities/[vulnId]/route";

const mockedAuth = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
const mockedPrisma = prisma as unknown as {
  projectMember: { findFirst: jest.Mock };
  project: { findUnique: jest.Mock };
  vulnerability: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
};

const adminUser = {
  id: "user-admin",
  email: "admin@test.com",
  name: "Admin",
  avatarUrl: null,
  role: "USER" as const,
  themePreference: "SYSTEM" as const,
  createdAt: new Date("2024-01-01"),
};

const memberUser = {
  ...adminUser,
  id: "user-member",
  email: "member@test.com",
  name: "Member",
};

function makeRequest(url: string, init?: { method?: string; body?: string }) {
  return new NextRequest(url, init);
}

function paramsFor(id: string, vulnId?: string) {
  return Promise.resolve(vulnId ? { id, vulnId } : { id });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/projects/[id]/vulnerabilities (list)", () => {
  it("returns 401 when unauthenticated", async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await listGET(
      makeRequest("http://localhost/api/projects/p1/vulnerabilities"),
      { params: paramsFor("p1") } as never
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not a project member", async () => {
    mockedAuth.mockResolvedValue(adminUser);
    mockedPrisma.projectMember.findFirst.mockResolvedValue(null);
    const res = await listGET(
      makeRequest("http://localhost/api/projects/p1/vulnerabilities"),
      { params: paramsFor("p1") } as never
    );
    expect(res.status).toBe(403);
  });

  it("returns vulnerabilities for a member", async () => {
    mockedAuth.mockResolvedValue(memberUser);
    mockedPrisma.projectMember.findFirst.mockResolvedValue({
      id: "m1",
      role: "MEMBER",
    });
    const vulns = [{ id: "v1", title: "RCE" }];
    mockedPrisma.vulnerability.findMany.mockResolvedValue(vulns);

    const res = await listGET(
      makeRequest("http://localhost/api/projects/p1/vulnerabilities"),
      { params: paramsFor("p1") } as never
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.vulnerabilities).toEqual(vulns);
    expect(mockedPrisma.vulnerability.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { projectId: "p1" } })
    );
  });
});

describe("POST /api/projects/[id]/vulnerabilities (create)", () => {
  const validBody = JSON.stringify({
    title: "RCE in foo",
    severity: "HIGH",
    cveId: "CVE-2025-12345",
  });

  it("returns 401 when unauthenticated", async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await createPOST(
      makeRequest("http://localhost/api/projects/p1/vulnerabilities", {
        method: "POST",
        body: validBody,
      }),
      { params: paramsFor("p1") } as never
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid input", async () => {
    mockedAuth.mockResolvedValue(adminUser);
    const res = await createPOST(
      makeRequest("http://localhost/api/projects/p1/vulnerabilities", {
        method: "POST",
        body: JSON.stringify({ title: "no severity" }),
      }),
      { params: paramsFor("p1") } as never
    );
    expect(res.status).toBe(400);
  });

  it("returns 403 when user is not a project member", async () => {
    mockedAuth.mockResolvedValue(adminUser);
    mockedPrisma.projectMember.findFirst.mockResolvedValue(null);
    const res = await createPOST(
      makeRequest("http://localhost/api/projects/p1/vulnerabilities", {
        method: "POST",
        body: validBody,
      }),
      { params: paramsFor("p1") } as never
    );
    expect(res.status).toBe(403);
  });

  it("returns 403 when member is not an admin", async () => {
    mockedAuth.mockResolvedValue(memberUser);
    mockedPrisma.projectMember.findFirst.mockResolvedValue({
      id: "m1",
      role: "MEMBER",
    });
    const res = await createPOST(
      makeRequest("http://localhost/api/projects/p1/vulnerabilities", {
        method: "POST",
        body: validBody,
      }),
      { params: paramsFor("p1") } as never
    );
    expect(res.status).toBe(403);
  });

  it("creates the vulnerability when admin and input is valid", async () => {
    mockedAuth.mockResolvedValue(adminUser);
    mockedPrisma.projectMember.findFirst.mockResolvedValue({
      id: "m1",
      role: "ADMIN",
    });
    mockedPrisma.project.findUnique.mockResolvedValue({ id: "p1" });
    const created = { id: "v1", title: "RCE in foo" };
    mockedPrisma.vulnerability.create.mockResolvedValue(created);

    const res = await createPOST(
      makeRequest("http://localhost/api/projects/p1/vulnerabilities", {
        method: "POST",
        body: validBody,
      }),
      { params: paramsFor("p1") } as never
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.vulnerability).toEqual(created);
    expect(mockedPrisma.vulnerability.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: "p1",
          reporterId: adminUser.id,
          title: "RCE in foo",
          severity: "HIGH",
          cveId: "CVE-2025-12345",
        }),
      })
    );
  });
});

describe("GET /api/projects/[id]/vulnerabilities/[vulnId] (detail)", () => {
  it("returns 404 when vuln does not exist", async () => {
    mockedAuth.mockResolvedValue(memberUser);
    mockedPrisma.projectMember.findFirst.mockResolvedValue({
      id: "m1",
      role: "MEMBER",
    });
    mockedPrisma.vulnerability.findFirst.mockResolvedValue(null);

    const res = await detailGET(
      makeRequest("http://localhost/api/projects/p1/vulnerabilities/v1"),
      { params: paramsFor("p1", "v1") } as never
    );
    expect(res.status).toBe(404);
  });

  it("returns the vuln when member has access", async () => {
    mockedAuth.mockResolvedValue(memberUser);
    mockedPrisma.projectMember.findFirst.mockResolvedValue({
      id: "m1",
      role: "MEMBER",
    });
    const vuln = { id: "v1", title: "RCE" };
    mockedPrisma.vulnerability.findFirst.mockResolvedValue(vuln);

    const res = await detailGET(
      makeRequest("http://localhost/api/projects/p1/vulnerabilities/v1"),
      { params: paramsFor("p1", "v1") } as never
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.vulnerability).toEqual(vuln);
  });
});

describe("PATCH /api/projects/[id]/vulnerabilities/[vulnId] (update)", () => {
  it("returns 403 when member is not an admin", async () => {
    mockedAuth.mockResolvedValue(memberUser);
    mockedPrisma.projectMember.findFirst.mockResolvedValue({
      id: "m1",
      role: "MEMBER",
    });
    const res = await detailPATCH(
      makeRequest("http://localhost/api/projects/p1/vulnerabilities/v1", {
        method: "PATCH",
        body: JSON.stringify({ status: "TRIAGED" }),
      }),
      { params: paramsFor("p1", "v1") } as never
    );
    expect(res.status).toBe(403);
  });

  it("rejects invalid status transitions", async () => {
    mockedAuth.mockResolvedValue(adminUser);
    mockedPrisma.projectMember.findFirst.mockResolvedValue({
      id: "m1",
      role: "ADMIN",
    });
    mockedPrisma.vulnerability.findFirst.mockResolvedValue({
      id: "v1",
      status: "OPEN",
      patchedAt: null,
      verifiedAt: null,
    });

    const res = await detailPATCH(
      makeRequest("http://localhost/api/projects/p1/vulnerabilities/v1", {
        method: "PATCH",
        body: JSON.stringify({ status: "VERIFIED" }),
      }),
      { params: paramsFor("p1", "v1") } as never
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/OPEN.*VERIFIED/);
    expect(mockedPrisma.vulnerability.update).not.toHaveBeenCalled();
  });

  it("allows valid status transition and stamps patchedAt", async () => {
    mockedAuth.mockResolvedValue(adminUser);
    mockedPrisma.projectMember.findFirst.mockResolvedValue({
      id: "m1",
      role: "ADMIN",
    });
    mockedPrisma.vulnerability.findFirst.mockResolvedValue({
      id: "v1",
      status: "IN_PROGRESS",
      patchedAt: null,
      verifiedAt: null,
    });
    mockedPrisma.vulnerability.update.mockResolvedValue({
      id: "v1",
      status: "PATCHED",
    });

    const res = await detailPATCH(
      makeRequest("http://localhost/api/projects/p1/vulnerabilities/v1", {
        method: "PATCH",
        body: JSON.stringify({ status: "PATCHED" }),
      }),
      { params: paramsFor("p1", "v1") } as never
    );
    expect(res.status).toBe(200);
    const updateCall = mockedPrisma.vulnerability.update.mock.calls[0][0];
    expect(updateCall.data.status).toBe("PATCHED");
    expect(updateCall.data.patchedAt).toBeInstanceOf(Date);
  });

  it("stamps verifiedAt when transitioning PATCHED → VERIFIED", async () => {
    mockedAuth.mockResolvedValue(adminUser);
    mockedPrisma.projectMember.findFirst.mockResolvedValue({
      id: "m1",
      role: "ADMIN",
    });
    mockedPrisma.vulnerability.findFirst.mockResolvedValue({
      id: "v1",
      status: "PATCHED",
      patchedAt: new Date("2025-01-01"),
      verifiedAt: null,
    });
    mockedPrisma.vulnerability.update.mockResolvedValue({
      id: "v1",
      status: "VERIFIED",
    });

    const res = await detailPATCH(
      makeRequest("http://localhost/api/projects/p1/vulnerabilities/v1", {
        method: "PATCH",
        body: JSON.stringify({ status: "VERIFIED" }),
      }),
      { params: paramsFor("p1", "v1") } as never
    );
    expect(res.status).toBe(200);
    const updateCall = mockedPrisma.vulnerability.update.mock.calls[0][0];
    expect(updateCall.data.verifiedAt).toBeInstanceOf(Date);
  });

  it("ignores attempts to change reporterId (stripped by schema)", async () => {
    mockedAuth.mockResolvedValue(adminUser);
    mockedPrisma.projectMember.findFirst.mockResolvedValue({
      id: "m1",
      role: "ADMIN",
    });
    mockedPrisma.vulnerability.findFirst.mockResolvedValue({
      id: "v1",
      status: "OPEN",
      patchedAt: null,
      verifiedAt: null,
    });
    mockedPrisma.vulnerability.update.mockResolvedValue({ id: "v1" });

    await detailPATCH(
      makeRequest("http://localhost/api/projects/p1/vulnerabilities/v1", {
        method: "PATCH",
        body: JSON.stringify({ reporterId: "someone-else" }),
      }),
      { params: paramsFor("p1", "v1") } as never
    );

    const updateCall = mockedPrisma.vulnerability.update.mock.calls[0][0];
    expect(updateCall.data).not.toHaveProperty("reporterId");
  });
});
