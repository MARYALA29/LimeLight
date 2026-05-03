import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskFilterBar } from "@/components/board/task-filter-bar";
import { Status, User } from "@/types";

const me: User = {
  id: "user-me",
  email: "me@test.com",
  name: "Me",
  avatarUrl: null,
  role: "USER",
  createdAt: new Date("2024-01-01"),
};

const alice: User = {
  ...me,
  id: "user-alice",
  email: "alice@test.com",
  name: "Alice",
};

const bob: User = {
  ...me,
  id: "user-bob",
  email: "bob@test.com",
  name: "Bob",
};

const statuses: Status[] = [
  { id: "s-todo", name: "To Do", order: 0, projectId: "p1" },
  { id: "s-doing", name: "In Progress", order: 1, projectId: "p1" },
  { id: "s-done", name: "Done", order: 2, projectId: "p1" },
];

const baseProps = {
  members: [me, alice, bob],
  currentUser: me,
  statuses,
  filters: {
    assigneeIds: [] as string[],
    includeMe: false,
    includeUnassigned: false,
    priorities: [] as string[],
    statusIds: [] as string[],
    search: "",
  },
  onFiltersChange: jest.fn(),
};

describe("TaskFilterBar", () => {
  beforeEach(() => {
    baseProps.onFiltersChange.mockReset();
  });

  it("renders a search input with a placeholder", () => {
    render(<TaskFilterBar {...baseProps} />);
    const input = screen.getByPlaceholderText(/search tasks/i);
    expect(input).toBeInTheDocument();
  });

  it("debounces search input updates", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onFiltersChange = jest.fn();
    render(
      <TaskFilterBar
        {...baseProps}
        onFiltersChange={onFiltersChange}
      />
    );

    const input = screen.getByPlaceholderText(/search tasks/i);
    await user.type(input, "abc");

    // Less than 300ms — no callback yet.
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(onFiltersChange).not.toHaveBeenCalled();

    // After 300ms, the callback fires once with the final value.
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(onFiltersChange).toHaveBeenCalled();
    const last = onFiltersChange.mock.calls.at(-1)![0];
    expect(last.search).toBe("abc");

    jest.useRealTimers();
  });

  it("focuses the search input when '/' is pressed", async () => {
    const user = userEvent.setup();
    render(<TaskFilterBar {...baseProps} />);
    // Move focus away from any default focus
    document.body.focus();
    await user.keyboard("/");
    const input = screen.getByPlaceholderText(/search tasks/i);
    expect(input).toHaveFocus();
  });

  it("does not steal focus from another input when '/' is typed there", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <input data-testid="other" />
        <TaskFilterBar {...baseProps} />
      </div>
    );
    const other = screen.getByTestId("other");
    other.focus();
    await user.keyboard("/");
    expect(other).toHaveFocus();
  });

  it("clears the search input via the clear button", async () => {
    const user = userEvent.setup();
    const onFiltersChange = jest.fn();
    render(
      <TaskFilterBar
        {...baseProps}
        filters={{ ...baseProps.filters, search: "auth" }}
        onFiltersChange={onFiltersChange}
      />
    );

    await user.click(screen.getByRole("button", { name: /clear search/i }));
    const last = onFiltersChange.mock.calls.at(-1)![0];
    expect(last.search).toBe("");
  });

  it("opens the priority popover and toggles a priority", async () => {
    const user = userEvent.setup();
    const onFiltersChange = jest.fn();
    render(
      <TaskFilterBar
        {...baseProps}
        onFiltersChange={onFiltersChange}
      />
    );

    await user.click(screen.getByRole("button", { name: /^priority$/i }));
    await user.click(screen.getByRole("button", { name: /^high$/i }));

    const last = onFiltersChange.mock.calls.at(-1)![0];
    expect(last.priorities).toEqual(["HIGH"]);
  });

  it("opens the status popover and toggles status ids", async () => {
    const user = userEvent.setup();
    const onFiltersChange = jest.fn();
    render(
      <TaskFilterBar {...baseProps} onFiltersChange={onFiltersChange} />
    );

    await user.click(screen.getByRole("button", { name: /^status$/i }));
    await user.click(screen.getByRole("button", { name: /^to do$/i }));

    const last = onFiltersChange.mock.calls.at(-1)![0];
    expect(last.statusIds).toEqual(["s-todo"]);
  });

  it("opens the assignee popover and toggles members + me + unassigned", async () => {
    const user = userEvent.setup();
    const onFiltersChange = jest.fn();
    render(
      <TaskFilterBar {...baseProps} onFiltersChange={onFiltersChange} />
    );

    await user.click(screen.getByRole("button", { name: /^assignee$/i }));
    await user.click(screen.getByRole("button", { name: /^me$/i }));
    expect(onFiltersChange.mock.calls.at(-1)![0].includeMe).toBe(true);

    await user.click(screen.getByRole("button", { name: /^unassigned$/i }));
    expect(onFiltersChange.mock.calls.at(-1)![0].includeUnassigned).toBe(true);

    await user.click(screen.getByRole("button", { name: /alice/i }));
    expect(onFiltersChange.mock.calls.at(-1)![0].assigneeIds).toContain(
      "user-alice"
    );
  });

  it("shows the active filter count on the filter button", () => {
    render(
      <TaskFilterBar
        {...baseProps}
        filters={{
          ...baseProps.filters,
          priorities: ["HIGH"],
          statusIds: ["s-todo"],
          includeMe: true,
          search: "auth",
        }}
      />
    );
    // 1 priority + 1 status + 1 assignee shortcut + 1 search = 4
    expect(screen.getByTestId("active-filter-count")).toHaveTextContent("4");
  });

  it("renders a clear-all button only when filters are active", async () => {
    const user = userEvent.setup();
    const onFiltersChange = jest.fn();
    const { rerender } = render(
      <TaskFilterBar {...baseProps} onFiltersChange={onFiltersChange} />
    );
    expect(
      screen.queryByRole("button", { name: /clear all/i })
    ).not.toBeInTheDocument();

    rerender(
      <TaskFilterBar
        {...baseProps}
        filters={{ ...baseProps.filters, priorities: ["HIGH"] }}
        onFiltersChange={onFiltersChange}
      />
    );

    await user.click(screen.getByRole("button", { name: /clear all/i }));
    const last = onFiltersChange.mock.calls.at(-1)![0];
    expect(last.priorities).toEqual([]);
    expect(last.search).toBe("");
  });

  it("renders chips for each active filter", () => {
    render(
      <TaskFilterBar
        {...baseProps}
        filters={{
          ...baseProps.filters,
          priorities: ["HIGH"],
          statusIds: ["s-todo"],
          includeMe: true,
          includeUnassigned: true,
          assigneeIds: ["user-alice"],
        }}
      />
    );
    expect(screen.getByTestId("filter-chip-priority-HIGH")).toBeInTheDocument();
    expect(screen.getByTestId("filter-chip-status-s-todo")).toBeInTheDocument();
    expect(screen.getByTestId("filter-chip-assignee-me")).toBeInTheDocument();
    expect(
      screen.getByTestId("filter-chip-assignee-unassigned")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("filter-chip-assignee-user-alice")
    ).toBeInTheDocument();
  });
});
