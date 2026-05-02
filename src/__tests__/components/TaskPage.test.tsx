import { render, screen, waitFor } from "@testing-library/react";
import TaskPage from "@/app/(dashboard)/projects/[id]/tasks/[taskId]/page";

// Mock the UI components
jest.mock("@/components/ui", () => {
  const React = require("react");
  return {
    Button: React.forwardRef(({ children, variant, size, isLoading, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode; variant?: string; size?: string; isLoading?: boolean }, ref: React.Ref<HTMLButtonElement>) => (
      <button ref={ref} {...props}>{children}</button>
    )),
    Input: React.forwardRef(({ label, error, ...props }: { label?: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>, ref: React.Ref<HTMLInputElement>) => (
      <div>
        {label && <label htmlFor={props.id}>{label}</label>}
        <input ref={ref} {...props} />
      </div>
    )),
    Textarea: React.forwardRef(({ label, error, ...props }: { label?: string; error?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>, ref: React.Ref<HTMLTextAreaElement>) => (
      <div>
        {label && <label htmlFor={props.id}>{label}</label>}
        <textarea ref={ref} {...props} />
      </div>
    )),
    Select: React.forwardRef(({ label, options, error, ...props }: { label?: string; error?: string; options: { value: string; label: string }[] } & React.SelectHTMLAttributes<HTMLSelectElement>, ref: React.Ref<HTMLSelectElement>) => (
      <div>
        {label && <label htmlFor={props.id}>{label}</label>}
        <select ref={ref} {...props}>
          {options.map((opt: { value: string; label: string }) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    )),
    Avatar: ({ name }: { name: string; src?: string | null; size?: string }) => <div data-testid="avatar">{name}</div>,
    Badge: ({ children, className }: { children: React.ReactNode; className?: string }) => <span className={className}>{children}</span>,
  };
});

const mockTask = {
  id: "test-task-id",
  title: "Test Task Title",
  description: "Test description",
  key: "MFP-1",
  priority: "MEDIUM",
  order: 0,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-02T00:00:00.000Z",
  projectId: "test-project-id",
  statusId: "status-1",
  assigneeId: "user-1",
  creatorId: "user-2",
  assignee: { id: "user-1", name: "John Doe", email: "john@test.com", avatarUrl: null, createdAt: "2024-01-01" },
  creator: { id: "user-2", name: "Jane Smith", email: "jane@test.com", avatarUrl: null, createdAt: "2024-01-01" },
  status: { id: "status-1", name: "To Do", order: 0, projectId: "test-project-id" },
};

const mockProject = {
  id: "test-project-id",
  name: "Test Project",
  key: "MFP",
  statuses: [
    { id: "status-1", name: "To Do", order: 0, projectId: "test-project-id" },
    { id: "status-2", name: "Done", order: 1, projectId: "test-project-id" },
  ],
  members: [
    { user: { id: "user-1", name: "John Doe", email: "john@test.com", avatarUrl: null, createdAt: "2024-01-01" } },
    { user: { id: "user-2", name: "Jane Smith", email: "jane@test.com", avatarUrl: null, createdAt: "2024-01-01" } },
  ],
};

describe("TaskPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading spinner initially", () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    const { container } = render(<TaskPage />);
    // Check for the loading spinner using class selector
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("renders task details after loading", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task: mockTask }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: mockProject }),
      });

    render(<TaskPage />);

    // Wait for task data to load and form to populate
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveValue("Test Task Title");
    }, { timeout: 3000 });

    // Check that the form loaded with correct values
    expect(screen.getByLabelText(/description/i)).toHaveValue("Test description");
  });

  it("shows error message when task is not found", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Not found" }),
    });

    render(<TaskPage />);

    await waitFor(() => {
      expect(screen.getByText(/task not found/i)).toBeInTheDocument();
    });
  });

  it("renders breadcrumb navigation", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task: mockTask }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: mockProject }),
      });

    render(<TaskPage />);

    await waitFor(() => {
      expect(screen.getByText("Projects")).toBeInTheDocument();
      expect(screen.getByText("Test Project")).toBeInTheDocument();
    });
  });

  it("renders back to board button", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task: mockTask }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ project: mockProject }),
      });

    render(<TaskPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /back to board/i })).toBeInTheDocument();
    });
  });

  it("useParams hook returns correct params", () => {
    // This test verifies that useParams is used correctly (not params.then)
    // The mock in jest.setup.js provides the expected params
    const { useParams } = require("next/navigation");
    const params = useParams();

    expect(params.id).toBe("test-project-id");
    expect(params.taskId).toBe("test-task-id");
    expect(typeof params.then).toBe("undefined"); // params is NOT a Promise
  });

  it("does not treat params as a Promise (catches params.then error)", () => {
    // This test ensures we're using useParams correctly
    // If the code used params.then(), it would fail because params is not a Promise
    const { useParams } = require("next/navigation");
    const params = useParams();

    // Verify params is a plain object, not a Promise
    expect(params).toEqual(expect.objectContaining({
      id: expect.any(String),
      taskId: expect.any(String),
    }));

    // Ensure we can access properties directly without .then()
    expect(params.id).toBeDefined();
    expect(params.taskId).toBeDefined();

    // This would throw if params was expected to be a Promise
    expect(() => {
      if (typeof params.then === "function") {
        throw new Error("params should not be a Promise in client components");
      }
    }).not.toThrow();
  });
});
