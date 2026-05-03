"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Board } from "./board";
import { TaskFilterBar, TaskFilterState } from "./task-filter-bar";
import type { Priority, ProjectWithMembers, Task, User } from "@/types";

interface BoardWithFiltersProps {
  project: ProjectWithMembers;
  initialTasks: Task[];
  members: User[];
  currentUser: User;
}

const EMPTY_FILTERS: TaskFilterState = {
  assigneeIds: [],
  includeMe: false,
  includeUnassigned: false,
  priorities: [],
  statusIds: [],
  search: "",
};

const VALID_PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function filtersFromSearchParams(
  params: URLSearchParams | null
): TaskFilterState {
  if (!params) return { ...EMPTY_FILTERS };

  const splitCsv = (raw: string | null) =>
    raw
      ? raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const rawAssignees = splitCsv(params.get("assignee"));
  const assigneeIds: string[] = [];
  let includeMe = false;
  let includeUnassigned = false;
  for (const v of rawAssignees) {
    const lower = v.toLowerCase();
    if (lower === "me") includeMe = true;
    else if (lower === "unassigned") includeUnassigned = true;
    else assigneeIds.push(v);
  }

  const priorities = splitCsv(params.get("priority"))
    .map((p) => p.toUpperCase() as Priority)
    .filter((p) => VALID_PRIORITIES.includes(p));

  return {
    assigneeIds,
    includeMe,
    includeUnassigned,
    priorities,
    statusIds: splitCsv(params.get("status")),
    search: (params.get("search") ?? "").trim(),
  };
}

function filtersToQueryString(filters: TaskFilterState): string {
  const params = new URLSearchParams();
  const assignees: string[] = [];
  if (filters.includeMe) assignees.push("me");
  if (filters.includeUnassigned) assignees.push("unassigned");
  assignees.push(...filters.assigneeIds);
  if (assignees.length > 0) params.set("assignee", assignees.join(","));
  if (filters.priorities.length > 0)
    params.set("priority", (filters.priorities as string[]).join(","));
  if (filters.statusIds.length > 0)
    params.set("status", filters.statusIds.join(","));
  if (filters.search.trim().length > 0) params.set("search", filters.search.trim());
  return params.toString();
}

function isFilterActive(filters: TaskFilterState): boolean {
  return (
    filters.priorities.length > 0 ||
    filters.statusIds.length > 0 ||
    filters.assigneeIds.length > 0 ||
    filters.includeMe ||
    filters.includeUnassigned ||
    filters.search.trim().length > 0
  );
}

export function BoardWithFilters({
  project,
  initialTasks,
  members,
  currentUser,
}: BoardWithFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<TaskFilterState>(() =>
    filtersFromSearchParams(searchParams)
  );
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isLoading, setIsLoading] = useState(false);

  const filtersActive = useMemo(() => isFilterActive(filters), [filters]);

  // Sync URL whenever filters change.
  useEffect(() => {
    const qs = filtersToQueryString(filters);
    const target = qs.length > 0 ? `${pathname}?${qs}` : pathname;
    // Avoid pushing duplicate URLs onto history; replace gives bookmarkable URLs
    // without breaking the back button.
    router.replace(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Fetch filtered tasks whenever filters change. We skip the very first render
  // because the server already supplied the unfiltered initial list.
  const isFirstRun = useRef(true);
  const fetchSeq = useRef(0);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      // If the URL had filters at mount, fall through to fetch the filtered set.
      if (!filtersActive) return;
    }

    const seq = ++fetchSeq.current;
    setIsLoading(true);
    const qs = filtersToQueryString(filters);
    const url = `/api/projects/${project.id}/tasks${qs ? `?${qs}` : ""}`;

    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load tasks");
        const data = await res.json();
        if (seq !== fetchSeq.current) return; // stale
        setTasks(data.tasks ?? []);
      })
      .catch((err) => {
        console.error("Filter fetch failed", err);
      })
      .finally(() => {
        if (seq === fetchSeq.current) setIsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleFiltersChange = useCallback((next: TaskFilterState) => {
    setFilters(next);
  }, []);

  return (
    <div className="space-y-4">
      <TaskFilterBar
        members={members}
        currentUser={currentUser}
        statuses={project.statuses}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />
      {isLoading && (
        <div
          data-testid="tasks-loading"
          className="text-xs text-orange-500 font-medium"
        >
          Loading tasks…
        </div>
      )}
      <Board
        project={project}
        initialTasks={tasks}
        members={members}
        filtersActive={filtersActive}
      />
    </div>
  );
}
