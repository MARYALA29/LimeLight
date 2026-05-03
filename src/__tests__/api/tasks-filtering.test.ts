/**
 * @jest-environment node
 *
 * Tests the project-tasks list endpoint with filter query params. Prisma and
 * auth are mocked so these run without a database. Verifies the where-clause
 * the route hands to Prisma for each filter category and combinations of them.
 */
import { NextRequest } from "next/server";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    projectMember: { findFirst: jest.fn() },
    task: { findMany: jest.fn() },
  },
}));

jest.mock("@/lib/auth", () => ({
  getCurrentUser: jest.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { GET } from "@/app/api/projects/[id]/tasks/route";

const mockedAuth = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
const mockedPrisma = prisma as unknown as {
  projectMember: { findFirst: jest.Mock };
  task: { findMany: jest.Mock };
};

const me = {
  id: "user-me",
  email: "me@test.com",
  name: "Me",
  avatarUrl: null,
  role: "USER" as const,
  createdAt: new Date("2024-01-01"),
};

function makeRequest(url: string) {
  return new NextRequest(url);
}

const paramsFor = (id: string) => Promise.resolve({ id });

beforeEach(() => {
  jest.clearAllMocks();
  mockedPrisma.task.findMany.mockResolvedValue([]);
});

async function callGetWithSearch(query: string) {
  return GET(
    makeRequest(`http://localhost/api/projects/p1/tasks?${query}`),
    { params: paramsFor("p1") } as never
  );
}

describe("GET /api/projects/[id]/tasks (filtering)", () => {
  it("returns 401 when unauthenticated", async () => {
    mockedAuth.mockResolvedValue(null);
    const res = await callGetWithSearch("");
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not a project member", async () => {
    mockedAuth.mockResolvedValue(me);
    mockedPrisma.projectMember.findFirst.mockResolvedValue(null);
    const res = await callGetWithSearch("priority=HIGH");
    expect(res.status).toBe(403);
  });

  describe("when authorised", () => {
    beforeEach(() => {
      mockedAuth.mockResolvedValue(me);
      mockedPrisma.projectMember.findFirst.mockResolvedValue({
        id: "m1",
        role: "MEMBER",
      });
    });

    it("scopes by projectId only when no filters are passed", async () => {
      const res = await callGetWithSearch("");
      expect(res.status).toBe(200);
      const call = mockedPrisma.task.findMany.mock.calls[0][0];
      expect(call.where).toEqual({ projectId: "p1" });
    });

    it("filters by priority", async () => {
      await callGetWithSearch("priority=HIGH,URGENT");
      const call = mockedPrisma.task.findMany.mock.calls[0][0];
      expect(call.where).toMatchObject({
        projectId: "p1",
        priority: { in: ["HIGH", "URGENT"] },
      });
    });

    it("ignores invalid priorities silently", async () => {
      await callGetWithSearch("priority=BANANA");
      const call = mockedPrisma.task.findMany.mock.calls[0][0];
      expect(call.where).toEqual({ projectId: "p1" });
    });

    it("filters by status ids", async () => {
      await callGetWithSearch("status=s-todo,s-done");
      const call = mockedPrisma.task.findMany.mock.calls[0][0];
      expect(call.where).toMatchObject({
        projectId: "p1",
        statusId: { in: ["s-todo", "s-done"] },
      });
    });

    it("filters by assignee ids", async () => {
      await callGetWithSearch("assignee=u1,u2");
      const call = mockedPrisma.task.findMany.mock.calls[0][0];
      expect(call.where).toMatchObject({
        projectId: "p1",
        assigneeId: { in: ["u1", "u2"] },
      });
    });

    it("expands the 'me' shortcut to the current user id", async () => {
      await callGetWithSearch("assignee=me");
      const call = mockedPrisma.task.findMany.mock.calls[0][0];
      expect(call.where).toMatchObject({
        projectId: "p1",
        assigneeId: me.id,
      });
    });

    it("expands the 'unassigned' shortcut to a null assignee", async () => {
      await callGetWithSearch("assignee=unassigned");
      const call = mockedPrisma.task.findMany.mock.calls[0][0];
      expect(call.where).toMatchObject({
        projectId: "p1",
        assigneeId: null,
      });
    });

    it("ORs unassigned with explicit ids when both are present", async () => {
      await callGetWithSearch("assignee=u1,unassigned");
      const call = mockedPrisma.task.findMany.mock.calls[0][0];
      expect(call.where).toMatchObject({
        projectId: "p1",
        OR: [{ assigneeId: { in: ["u1"] } }, { assigneeId: null }],
      });
    });

    it("filters by free-text search on title and description", async () => {
      await callGetWithSearch("search=login%20bug");
      const call = mockedPrisma.task.findMany.mock.calls[0][0];
      expect(call.where).toMatchObject({
        projectId: "p1",
        OR: [
          { title: { contains: "login bug", mode: "insensitive" } },
          { description: { contains: "login bug", mode: "insensitive" } },
        ],
      });
    });

    it("ignores whitespace-only search", async () => {
      await callGetWithSearch("search=%20%20%20");
      const call = mockedPrisma.task.findMany.mock.calls[0][0];
      expect(call.where).toEqual({ projectId: "p1" });
    });

    it("combines priority + status + assignee + search", async () => {
      await callGetWithSearch(
        "priority=HIGH&status=s1&assignee=me&search=auth"
      );
      const call = mockedPrisma.task.findMany.mock.calls[0][0];
      expect(call.where.projectId).toBe("p1");
      expect(call.where.priority).toEqual({ in: ["HIGH"] });
      expect(call.where.statusId).toEqual({ in: ["s1"] });
      expect(call.where.assigneeId).toBe(me.id);
      // Single assignee branch leaves the OR slot for search.
      expect(call.where.OR).toEqual([
        { title: { contains: "auth", mode: "insensitive" } },
        { description: { contains: "auth", mode: "insensitive" } },
      ]);
    });

    it("returns the filtered task list in the response body", async () => {
      const tasks = [{ id: "t1", title: "Hello" }];
      mockedPrisma.task.findMany.mockResolvedValue(tasks);
      const res = await callGetWithSearch("priority=HIGH");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tasks).toEqual(tasks);
    });

    it("returns an empty array when no tasks match", async () => {
      mockedPrisma.task.findMany.mockResolvedValue([]);
      const res = await callGetWithSearch("priority=URGENT");
      const body = await res.json();
      expect(body.tasks).toEqual([]);
    });
  });
});
