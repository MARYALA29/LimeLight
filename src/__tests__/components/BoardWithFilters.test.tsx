import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BoardWithFilters } from "@/components/board/board-with-filters";
import { ProjectWithMembers, Status, Task, User } from "@/types";

// Avoid pulling in dnd-kit's heavy machinery — render a simple stub Board so we
// can assert filter wiring (which tasks reach the board) without DnD overhead.
jest.mock("@/components/board/board", () => ({
  Board: ({
    initialTasks,
    filtersActive,
  }: {
    initialTasks: Task[];
    filtersActive: boolean;
  }) => (
    <div>
      <div data-testid="board-filters-active">{String(filtersActive)}</div>
      <ul data-testid="board-tasks">
        {initialTasks.map((t) => (
          <li key={t.id} data-testid={`task-${t.id}`}>
            {t.title}
          </li>
        ))}
      </ul>
    </div>
  ),
}));

const mockReplace = jest.fn();
const mockUseSearchParams = jest.fn(() => new URLSearchParams());

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: mockReplace,
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => mockUseSearchParams(),
  usePathname: () => "/projects/p1",
  useParams: () => ({ id: "p1" }),
}));

const me: User = {
  id: "user-me",
  email: "me@test.com",
  name: "Me",
  avatarUrl: null,
  role: "USER",
  createdAt: new Date(),
};

const alice: User = { ...me, id: "user-alice", name: "Alice" };

const statuses: Status[] = [
  { id: "s-todo", name: "To Do", order: 0, projectId: "p1" },
  { id: "s-doing", name: "In Progress", order: 1, projectId: "p1" },
];

const project: ProjectWithMembers = {
  id: "p1",
  name: "Project",
  key: "PROJ",
  description: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  members: [
    {
      id: "pm1",
      userId: me.id,
      projectId: "p1",
      role: "MEMBER",
      createdAt: new Date(),
      user: me,
    },
    {
      id: "pm2",
      userId: alice.id,
      projectId: "p1",
      role: "MEMBER",
      createdAt: new Date(),
      user: alice,
    },
  ],
  statuses,
};

function task(overrides: Partial<Task>): Task {
  return {
    id: "t1",
    title: "Default task",
    description: null,
    key: "PROJ-1",
    priority: "MEDIUM",
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    projectId: "p1",
    statusId: "s-todo",
    assigneeId: null,
    creatorId: me.id,
    ...overrides,
  };
}

const initialTasks = [
  task({ id: "t1", title: "First", priority: "HIGH" }),
  task({ id: "t2", title: "Second", priority: "LOW" }),
];

beforeEach(() => {
  mockReplace.mockReset();
  mockUseSearchParams.mockReturnValue(new URLSearchParams());
  (global.fetch as jest.Mock).mockReset();
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ tasks: [] }),
  });
});

describe("BoardWithFilters", () => {
  it("renders the filter bar and forwards initial tasks to the board", () => {
    render(
      <BoardWithFilters
        project={project}
        initialTasks={initialTasks}
        members={[me, alice]}
        currentUser={me}
      />
    );

    expect(screen.getByPlaceholderText(/search tasks/i)).toBeInTheDocument();
    expect(screen.getByTestId("task-t1")).toBeInTheDocument();
    expect(screen.getByTestId("task-t2")).toBeInTheDocument();
    expect(screen.getByTestId("board-filters-active")).toHaveTextContent(
      "false"
    );
  });

  it("updates the URL when a filter is selected", async () => {
    const user = userEvent.setup();
    render(
      <BoardWithFilters
        project={project}
        initialTasks={initialTasks}
        members={[me, alice]}
        currentUser={me}
      />
    );

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: [task({ id: "t1", title: "First" })] }),
    });

    await user.click(screen.getByRole("button", { name: /^priority$/i }));
    await user.click(screen.getByRole("button", { name: /^high$/i }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled();
    });
    const lastUrl = mockReplace.mock.calls.at(-1)![0];
    expect(lastUrl).toContain("priority=HIGH");
    // Allow the triggered fetch to settle before the test exits.
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it("fetches filtered tasks from the API and replaces the list", async () => {
    const user = userEvent.setup();
    render(
      <BoardWithFilters
        project={project}
        initialTasks={initialTasks}
        members={[me, alice]}
        currentUser={me}
      />
    );

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: [task({ id: "t1", title: "Filtered" })] }),
    });

    await user.click(screen.getByRole("button", { name: /^priority$/i }));
    await user.click(screen.getByRole("button", { name: /^high$/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    const url = (global.fetch as jest.Mock).mock.calls.at(-1)![0] as string;
    expect(url).toContain("/api/projects/p1/tasks");
    expect(url).toContain("priority=HIGH");

    await waitFor(() => {
      expect(screen.getByText("Filtered")).toBeInTheDocument();
    });
    expect(screen.queryByText("Second")).not.toBeInTheDocument();
    expect(screen.getByTestId("board-filters-active")).toHaveTextContent(
      "true"
    );
    await waitFor(() => {
      expect(screen.queryByTestId("tasks-loading")).not.toBeInTheDocument();
    });
  });

  it("hydrates initial filter state from the URL", async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("priority=HIGH"));
    render(
      <BoardWithFilters
        project={project}
        initialTasks={initialTasks}
        members={[me, alice]}
        currentUser={me}
      />
    );
    expect(screen.getByTestId("active-filter-count")).toHaveTextContent("1");
    expect(screen.getByTestId("filter-chip-priority-HIGH")).toBeInTheDocument();
    // Wait for the mount-triggered fetch (active filter on mount) to settle so
    // we don't leak act() warnings into other tests.
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it("debounces search input before firing a request", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <BoardWithFilters
        project={project}
        initialTasks={initialTasks}
        members={[me, alice]}
        currentUser={me}
      />
    );

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: [] }),
    });

    const input = screen.getByPlaceholderText(/search tasks/i);
    await user.type(input, "auth");

    // Less than 300ms — no fetch yet.
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(global.fetch).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(150);
    });
    // After the debounce, exactly one fetch with the search param.
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    const url = (global.fetch as jest.Mock).mock.calls.at(-1)![0] as string;
    expect(url).toMatch(/search=auth/);

    // Drain any remaining microtasks before switching timers.
    await act(async () => {
      jest.runAllTimers();
      await Promise.resolve();
    });
    jest.useRealTimers();
    await waitFor(() => {
      expect(screen.queryByTestId("tasks-loading")).not.toBeInTheDocument();
    });
  });

  it("clears all filters and refetches an unfiltered list", async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("priority=HIGH"));
    const user = userEvent.setup();
    render(
      <BoardWithFilters
        project={project}
        initialTasks={initialTasks}
        members={[me, alice]}
        currentUser={me}
      />
    );

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: initialTasks }),
    });

    await user.click(screen.getByRole("button", { name: /clear all/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    const url = (global.fetch as jest.Mock).mock.calls.at(-1)![0] as string;
    expect(url).not.toContain("priority=");
    expect(screen.getByTestId("board-filters-active")).toHaveTextContent(
      "false"
    );
    await waitFor(() => {
      expect(screen.queryByTestId("tasks-loading")).not.toBeInTheDocument();
    });
  });
});
