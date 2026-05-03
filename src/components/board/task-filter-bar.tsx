"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Priority, Status, User } from "@/types";

export interface TaskFilterState {
  assigneeIds: string[];
  includeMe: boolean;
  includeUnassigned: boolean;
  priorities: Priority[] | string[];
  statusIds: string[];
  search: string;
}

interface TaskFilterBarProps {
  members: User[];
  currentUser: User;
  statuses: Status[];
  filters: TaskFilterState;
  onFiltersChange: (next: TaskFilterState) => void;
}

const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const PRIORITY_LABEL: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

const SEARCH_DEBOUNCE_MS = 300;

export function TaskFilterBar({
  members,
  currentUser,
  statuses,
  filters,
  onFiltersChange,
}: TaskFilterBarProps) {
  const [searchDraft, setSearchDraft] = useState(filters.search);
  const [openPanel, setOpenPanel] = useState<
    "assignee" | "priority" | "status" | null
  >(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keep local draft in sync if filters.search changes externally (URL, clear-all).
  useEffect(() => {
    setSearchDraft(filters.search);
  }, [filters.search]);

  // Debounce search updates -> filters.
  useEffect(() => {
    if (searchDraft === filters.search) return;
    const handle = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchDraft });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  // Global "/" focuses the search input — but not while typing in another input.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const activeCount = useMemo(() => {
    return (
      filters.priorities.length +
      filters.statusIds.length +
      filters.assigneeIds.length +
      (filters.includeMe ? 1 : 0) +
      (filters.includeUnassigned ? 1 : 0) +
      (filters.search.trim().length > 0 ? 1 : 0)
    );
  }, [filters]);

  const togglePriority = (p: Priority) => {
    const set = new Set(filters.priorities as Priority[]);
    if (set.has(p)) set.delete(p);
    else set.add(p);
    onFiltersChange({ ...filters, priorities: Array.from(set) });
  };

  const toggleStatus = (id: string) => {
    const set = new Set(filters.statusIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onFiltersChange({ ...filters, statusIds: Array.from(set) });
  };

  const toggleAssignee = (id: string) => {
    const set = new Set(filters.assigneeIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onFiltersChange({ ...filters, assigneeIds: Array.from(set) });
  };

  const toggleMe = () =>
    onFiltersChange({ ...filters, includeMe: !filters.includeMe });

  const toggleUnassigned = () =>
    onFiltersChange({
      ...filters,
      includeUnassigned: !filters.includeUnassigned,
    });

  const clearAll = () =>
    onFiltersChange({
      assigneeIds: [],
      includeMe: false,
      includeUnassigned: false,
      priorities: [],
      statusIds: [],
      search: "",
    });

  const clearSearch = () => {
    setSearchDraft("");
    onFiltersChange({ ...filters, search: "" });
  };

  const memberById = useMemo(() => {
    const map = new Map<string, User>();
    for (const m of members) map.set(m.id, m);
    return map;
  }, [members]);

  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-3 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <input
            ref={searchInputRef}
            type="text"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search tasks (press / to focus)"
            aria-label="Search tasks"
            className="w-full h-10 rounded-lg border border-gray-200 bg-white pl-9 pr-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-colors"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M11 19a8 8 0 110-16 8 8 0 010 16z"
            />
          </svg>
          {searchDraft.length > 0 && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              ×
            </button>
          )}
        </div>

        <FilterDropdown
          label="Assignee"
          isOpen={openPanel === "assignee"}
          onToggle={() =>
            setOpenPanel(openPanel === "assignee" ? null : "assignee")
          }
        >
          <PanelRow>
            <PillButton
              label="Me"
              active={filters.includeMe}
              onClick={toggleMe}
            />
            <PillButton
              label="Unassigned"
              active={filters.includeUnassigned}
              onClick={toggleUnassigned}
            />
          </PanelRow>
          <PanelRow>
            {members
              .filter((m) => m.id !== currentUser.id)
              .map((m) => (
                <PillButton
                  key={m.id}
                  label={m.name}
                  active={filters.assigneeIds.includes(m.id)}
                  onClick={() => toggleAssignee(m.id)}
                />
              ))}
          </PanelRow>
        </FilterDropdown>

        <FilterDropdown
          label="Priority"
          isOpen={openPanel === "priority"}
          onToggle={() =>
            setOpenPanel(openPanel === "priority" ? null : "priority")
          }
        >
          <PanelRow>
            {PRIORITIES.map((p) => (
              <PillButton
                key={p}
                label={PRIORITY_LABEL[p]}
                active={(filters.priorities as Priority[]).includes(p)}
                onClick={() => togglePriority(p)}
              />
            ))}
          </PanelRow>
        </FilterDropdown>

        <FilterDropdown
          label="Status"
          isOpen={openPanel === "status"}
          onToggle={() =>
            setOpenPanel(openPanel === "status" ? null : "status")
          }
        >
          <PanelRow>
            {statuses.map((s) => (
              <PillButton
                key={s.id}
                label={s.name}
                active={filters.statusIds.includes(s.id)}
                onClick={() => toggleStatus(s.id)}
              />
            ))}
          </PanelRow>
        </FilterDropdown>

        {activeCount > 0 && (
          <span
            data-testid="active-filter-count"
            className="ml-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-500 px-2 text-xs font-semibold text-white"
          >
            {activeCount}
          </span>
        )}

        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="ml-auto text-xs font-medium text-orange-600 hover:text-orange-700"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {(filters.priorities as Priority[]).map((p) => (
            <Chip
              key={`p-${p}`}
              testId={`filter-chip-priority-${p}`}
              label={`Priority: ${PRIORITY_LABEL[p] ?? p}`}
              onRemove={() => togglePriority(p)}
            />
          ))}
          {filters.statusIds.map((sid) => {
            const status = statuses.find((s) => s.id === sid);
            return (
              <Chip
                key={`s-${sid}`}
                testId={`filter-chip-status-${sid}`}
                label={`Status: ${status?.name ?? sid}`}
                onRemove={() => toggleStatus(sid)}
              />
            );
          })}
          {filters.includeMe && (
            <Chip
              testId="filter-chip-assignee-me"
              label="Assignee: Me"
              onRemove={toggleMe}
            />
          )}
          {filters.includeUnassigned && (
            <Chip
              testId="filter-chip-assignee-unassigned"
              label="Assignee: Unassigned"
              onRemove={toggleUnassigned}
            />
          )}
          {filters.assigneeIds.map((id) => {
            const m = memberById.get(id);
            return (
              <Chip
                key={`a-${id}`}
                testId={`filter-chip-assignee-${id}`}
                label={`Assignee: ${m?.name ?? id}`}
                onRemove={() => toggleAssignee(id)}
              />
            );
          })}
          {filters.search.trim().length > 0 && (
            <Chip
              testId="filter-chip-search"
              label={`Search: ${filters.search}`}
              onRemove={clearSearch}
            />
          )}
        </div>
      )}
    </div>
  );
}

function FilterDropdown({
  label,
  isOpen,
  onToggle,
  children,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          isOpen
            ? "border-orange-500 bg-orange-50 text-orange-700"
            : "border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50"
        }`}
      >
        {label}
        <svg
          className="h-3 w-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-10 mt-2 min-w-[16rem] rounded-xl border border-orange-100 bg-white p-3 shadow-lg space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

function PanelRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function PillButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-orange-500 bg-orange-500 text-white"
          : "border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50"
      }`}
    >
      {label}
    </button>
  );
}

function Chip({
  label,
  onRemove,
  testId,
}: {
  label: string;
  onRemove: () => void;
  testId: string;
}) {
  return (
    <span
      data-testid={testId}
      className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 border border-orange-200"
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="rounded-full text-orange-500 hover:text-orange-700"
      >
        ×
      </button>
    </span>
  );
}
