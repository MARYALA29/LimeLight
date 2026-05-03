/**
 * Tests for task-filter parsing and Prisma where-clause composition.
 *
 * The filter API takes a raw URLSearchParams from the request, the current
 * user id (for the "me" assignee shortcut), and returns:
 *   1. a parsed, normalised filter object, and
 *   2. a Prisma `where` fragment that can be merged with the projectId scope.
 *
 * Behaviour:
 *   - Filters combine with AND across categories, OR within a category.
 *   - Invalid values are silently ignored.
 *   - Empty / missing params produce no filter constraints (other than scope).
 *   - "me" expands to the current user id; "unassigned" matches assigneeId === null.
 */
import {
  parseTaskFilters,
  buildTaskWhere,
} from "@/lib/task-filters";

describe("parseTaskFilters", () => {
  it("returns empty filters when no params are provided", () => {
    const filters = parseTaskFilters(new URLSearchParams(), "user-1");
    expect(filters).toEqual({
      assigneeIds: [],
      includeUnassigned: false,
      includeMe: false,
      priorities: [],
      statusIds: [],
      search: "",
      meId: "user-1",
    });
  });

  it("parses comma-separated assignee ids", () => {
    const params = new URLSearchParams("assignee=u1,u2,u3");
    const filters = parseTaskFilters(params, "me-id");
    expect(filters.assigneeIds).toEqual(["u1", "u2", "u3"]);
  });

  it("recognises 'unassigned' shortcut in the assignee param", () => {
    const params = new URLSearchParams("assignee=unassigned,u1");
    const filters = parseTaskFilters(params, "me-id");
    expect(filters.includeUnassigned).toBe(true);
    expect(filters.assigneeIds).toEqual(["u1"]);
  });

  it("recognises 'me' shortcut in the assignee param", () => {
    const params = new URLSearchParams("assignee=me,u2");
    const filters = parseTaskFilters(params, "me-id");
    expect(filters.includeMe).toBe(true);
    expect(filters.assigneeIds).toEqual(["u2"]);
  });

  it("parses priority and uppercases values", () => {
    const params = new URLSearchParams("priority=low,High");
    const filters = parseTaskFilters(params, "me-id");
    expect(filters.priorities).toEqual(["LOW", "HIGH"]);
  });

  it("ignores invalid priority values", () => {
    const params = new URLSearchParams("priority=BANANA,LOW,;drop");
    const filters = parseTaskFilters(params, "me-id");
    expect(filters.priorities).toEqual(["LOW"]);
  });

  it("parses status ids verbatim", () => {
    const params = new URLSearchParams("status=todo-id,done-id");
    const filters = parseTaskFilters(params, "me-id");
    expect(filters.statusIds).toEqual(["todo-id", "done-id"]);
  });

  it("trims and lowercases the search query but preserves user input casing for matching", () => {
    const params = new URLSearchParams("search=  fix bug  ");
    const filters = parseTaskFilters(params, "me-id");
    expect(filters.search).toBe("fix bug");
  });

  it("returns empty search for whitespace-only input", () => {
    const params = new URLSearchParams("search=   ");
    const filters = parseTaskFilters(params, "me-id");
    expect(filters.search).toBe("");
  });
});

describe("buildTaskWhere", () => {
  const projectId = "project-1";
  const meId = "user-me";

  it("returns scope-only where when filters are empty", () => {
    const where = buildTaskWhere(projectId, parseTaskFilters(new URLSearchParams(), meId));
    expect(where).toEqual({ projectId });
  });

  it("filters by priorities (OR within category)", () => {
    const filters = parseTaskFilters(new URLSearchParams("priority=HIGH,URGENT"), meId);
    const where = buildTaskWhere(projectId, filters);
    expect(where).toEqual({
      projectId,
      priority: { in: ["HIGH", "URGENT"] },
    });
  });

  it("filters by status ids (OR within category)", () => {
    const filters = parseTaskFilters(new URLSearchParams("status=s1,s2"), meId);
    const where = buildTaskWhere(projectId, filters);
    expect(where).toEqual({
      projectId,
      statusId: { in: ["s1", "s2"] },
    });
  });

  it("filters by assignee ids", () => {
    const filters = parseTaskFilters(new URLSearchParams("assignee=u1,u2"), meId);
    const where = buildTaskWhere(projectId, filters);
    expect(where).toEqual({
      projectId,
      assigneeId: { in: ["u1", "u2"] },
    });
  });

  it("supports unassigned shortcut alone", () => {
    const filters = parseTaskFilters(new URLSearchParams("assignee=unassigned"), meId);
    const where = buildTaskWhere(projectId, filters);
    expect(where).toEqual({
      projectId,
      assigneeId: null,
    });
  });

  it("supports 'me' shortcut alone", () => {
    const filters = parseTaskFilters(new URLSearchParams("assignee=me"), meId);
    const where = buildTaskWhere(projectId, filters);
    expect(where).toEqual({
      projectId,
      assigneeId: meId,
    });
  });

  it("supports combining unassigned + ids + me into an OR list", () => {
    const filters = parseTaskFilters(
      new URLSearchParams("assignee=me,unassigned,u9"),
      meId
    );
    const where = buildTaskWhere(projectId, filters);
    expect(where).toEqual({
      projectId,
      OR: [
        { assigneeId: { in: ["u9", meId] } },
        { assigneeId: null },
      ],
    });
  });

  it("filters by search across title and description (case-insensitive)", () => {
    const filters = parseTaskFilters(new URLSearchParams("search=login"), meId);
    const where = buildTaskWhere(projectId, filters);
    expect(where).toEqual({
      projectId,
      OR: [
        { title: { contains: "login", mode: "insensitive" } },
        { description: { contains: "login", mode: "insensitive" } },
      ],
    });
  });

  it("combines all filters with AND across categories", () => {
    const filters = parseTaskFilters(
      new URLSearchParams(
        "priority=HIGH&status=s1&assignee=me&search=auth"
      ),
      meId
    );
    const where = buildTaskWhere(projectId, filters);
    expect(where.projectId).toBe(projectId);
    expect(where.priority).toEqual({ in: ["HIGH"] });
    expect(where.statusId).toEqual({ in: ["s1"] });
    expect(where.assigneeId).toBe(meId);
    // Single-branch assignee leaves the OR slot free, so search lives there.
    expect(where.OR).toEqual([
      { title: { contains: "auth", mode: "insensitive" } },
      { description: { contains: "auth", mode: "insensitive" } },
    ]);
    expect(where.AND).toBeUndefined();
  });

  it("merges assignee OR with search AND clauses", () => {
    const filters = parseTaskFilters(
      new URLSearchParams("assignee=me,unassigned&search=foo"),
      meId
    );
    const where = buildTaskWhere(projectId, filters);
    // assignee fan-out goes into top-level OR; search becomes its own AND group
    expect(where.OR).toEqual([
      { assigneeId: { in: [meId] } },
      { assigneeId: null },
    ]);
    expect(where.AND).toEqual([
      {
        OR: [
          { title: { contains: "foo", mode: "insensitive" } },
          { description: { contains: "foo", mode: "insensitive" } },
        ],
      },
    ]);
  });
});
