import type { Prisma, Priority } from "@prisma/client";

const VALID_PRIORITIES: ReadonlyArray<Priority> = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export interface TaskFilters {
  /** Explicit user ids to include. */
  assigneeIds: string[];
  /** Whether the "Unassigned" shortcut is active (assigneeId IS NULL). */
  includeUnassigned: boolean;
  /** Whether the "Me" shortcut is active (assigneeId === currentUserId). */
  includeMe: boolean;
  /** Priorities (uppercase, validated against the Prisma enum). */
  priorities: Priority[];
  /** Status ids (no validation — Prisma will simply match nothing on bad ids). */
  statusIds: string[];
  /** Free-text search applied to title + description. */
  search: string;
  /** Resolved current user id (used to materialise the "me" shortcut). */
  meId: string;
}

const splitCsv = (raw: string | null): string[] =>
  raw
    ? raw
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
    : [];

/**
 * Parses task filter query params into a normalised, validated structure.
 * Invalid values are silently dropped — filtering should never surface 400s
 * for "looks weird" input. Auth/scope errors are out of scope here.
 */
export function parseTaskFilters(
  params: URLSearchParams,
  currentUserId: string
): TaskFilters {
  const rawAssignees = splitCsv(params.get("assignee"));
  const rawPriorities = splitCsv(params.get("priority"));
  const rawStatuses = splitCsv(params.get("status"));
  const rawSearch = params.get("search") ?? "";

  const assigneeIds: string[] = [];
  let includeUnassigned = false;
  let includeMe = false;
  for (const value of rawAssignees) {
    const lower = value.toLowerCase();
    if (lower === "unassigned") {
      includeUnassigned = true;
    } else if (lower === "me") {
      includeMe = true;
    } else {
      assigneeIds.push(value);
    }
  }

  const priorities = rawPriorities
    .map((p) => p.toUpperCase())
    .filter((p): p is Priority =>
      (VALID_PRIORITIES as ReadonlyArray<string>).includes(p)
    );

  return {
    assigneeIds,
    includeUnassigned,
    includeMe,
    priorities,
    statusIds: rawStatuses,
    search: rawSearch.trim(),
    meId: currentUserId,
  };
}

/**
 * Composes a Prisma `where` fragment for `Task.findMany` from a parsed filter
 * object scoped to a single project.
 *
 * Strategy:
 *   - priorities and statusIds become single-column `in` constraints (OR within).
 *   - Assignee branch: explicit ids and "me" merge into a single `assigneeId.in`
 *     set; "unassigned" is `assigneeId IS NULL`. When both kinds are present we
 *     fan out into a top-level `OR` so they union.
 *   - Search becomes a nested `OR` across title/description placed under `AND`
 *     so it does not collide with the assignee `OR`.
 */
export function buildTaskWhere(
  projectId: string,
  filters: TaskFilters
): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = { projectId };

  if (filters.priorities.length > 0) {
    where.priority = { in: filters.priorities };
  }

  if (filters.statusIds.length > 0) {
    where.statusId = { in: filters.statusIds };
  }

  const mergedIds = [...filters.assigneeIds];
  if (filters.includeMe) {
    mergedIds.push(filters.meId);
  }

  const assigneeBranches: Prisma.TaskWhereInput[] = [];
  if (mergedIds.length > 0) {
    assigneeBranches.push({ assigneeId: { in: mergedIds } });
  }
  if (filters.includeUnassigned) {
    assigneeBranches.push({ assigneeId: null });
  }

  // If only one assignee branch, inline scalar/in onto where; if multiple, OR.
  if (assigneeBranches.length === 1) {
    const [branch] = assigneeBranches;
    if ("assigneeId" in branch) {
      const assigneeValue = branch.assigneeId;
      // Single explicit id (no unassigned) collapses `in: [x]` → scalar `x`.
      if (
        assigneeValue &&
        typeof assigneeValue === "object" &&
        "in" in assigneeValue &&
        Array.isArray(assigneeValue.in) &&
        assigneeValue.in.length === 1
      ) {
        where.assigneeId = assigneeValue.in[0];
      } else {
        where.assigneeId = assigneeValue;
      }
    }
  }

  const searchBranch: Prisma.TaskWhereInput | null =
    filters.search.length > 0
      ? {
          OR: [
            { title: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : null;

  // Decide where to place OR groups so they don't collide on the same key.
  if (assigneeBranches.length > 1 && searchBranch) {
    where.OR = assigneeBranches;
    where.AND = [searchBranch];
  } else if (assigneeBranches.length > 1) {
    where.OR = assigneeBranches;
  } else if (searchBranch) {
    // No assignee OR fan-out — search can use the top-level OR slot.
    where.OR = searchBranch.OR;
  }

  return where;
}
