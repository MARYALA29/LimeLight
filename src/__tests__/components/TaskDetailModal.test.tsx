import { render, screen } from "@testing-library/react";
import { TaskDetailModal } from "@/components/tasks/task-detail-modal";
import { Task, Status, User } from "@/types";

// Mock the Modal component to simplify testing
jest.mock("@/components/ui", () => {
  const React = require("react");
  return {
    Modal: ({ children, title }: { children: React.ReactNode; title: React.ReactNode }) => (
      <div data-testid="modal">
        <div data-testid="modal-title">{title}</div>
        {children}
      </div>
    ),
    Button: React.forwardRef(({ children, isLoading, variant, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode; isLoading?: boolean; variant?: string }, ref: React.Ref<HTMLButtonElement>) => (
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
  };
});

const mockTask: Task = {
  id: "task-123",
  title: "Test Task",
  description: "Test description",
  key: "MFP-6",
  priority: "MEDIUM",
  order: 0,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-02"),
  projectId: "project-123",
  statusId: "status-123",
  assigneeId: "user-123",
  creatorId: "user-456",
  assignee: {
    id: "user-123",
    email: "assignee@test.com",
    name: "John Doe",
    avatarUrl: null,
    createdAt: new Date(),
  },
  creator: {
    id: "user-456",
    email: "creator@test.com",
    name: "Jane Smith",
    avatarUrl: null,
    createdAt: new Date(),
  },
  status: {
    id: "status-123",
    name: "To Do",
    order: 0,
    projectId: "project-123",
  },
};

const mockStatuses: Status[] = [
  { id: "status-123", name: "To Do", order: 0, projectId: "project-123" },
  { id: "status-456", name: "Done", order: 1, projectId: "project-123" },
];

const mockMembers: User[] = [
  { id: "user-123", email: "assignee@test.com", name: "John Doe", avatarUrl: null, createdAt: new Date() },
  { id: "user-456", email: "creator@test.com", name: "Jane Smith", avatarUrl: null, createdAt: new Date() },
];

describe("TaskDetailModal", () => {
  const defaultProps = {
    task: mockTask,
    projectId: "project-123",
    statuses: mockStatuses,
    members: mockMembers,
    onClose: jest.fn(),
    onTaskUpdated: jest.fn(),
    onTaskDeleted: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders task key in the title", () => {
    render(<TaskDetailModal {...defaultProps} />);
    expect(screen.getByText("MFP-6")).toBeInTheDocument();
  });

  it("renders external link to full page view", () => {
    render(<TaskDetailModal {...defaultProps} />);

    // Find the link by its href
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/projects/project-123/tasks/task-123");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders form fields", () => {
    render(<TaskDetailModal {...defaultProps} />);

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/assignee/i)).toBeInTheDocument();
  });

  it("renders action buttons", () => {
    render(<TaskDetailModal {...defaultProps} />);

    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
  });

  it("calls onClose when cancel is clicked", () => {
    render(<TaskDetailModal {...defaultProps} />);

    screen.getByRole("button", { name: /cancel/i }).click();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
