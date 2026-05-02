import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SettingsPage from "@/app/(dashboard)/projects/[id]/settings/page";

jest.mock("@/components/ui", () => {
  const React = require("react");
  return {
    Button: React.forwardRef(
      (
        {
          children,
          variant,
          size,
          isLoading,
          ...props
        }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
          children: React.ReactNode;
          variant?: string;
          size?: string;
          isLoading?: boolean;
        },
        ref: React.Ref<HTMLButtonElement>
      ) => (
        <button ref={ref} {...props}>
          {isLoading ? "Loading..." : children}
        </button>
      )
    ),
    Input: React.forwardRef(
      (
        {
          label,
          error,
          ...props
        }: { label?: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>,
        ref: React.Ref<HTMLInputElement>
      ) => (
        <div>
          {label && <label htmlFor={props.id}>{label}</label>}
          <input ref={ref} {...props} />
          {error && <span role="alert">{error}</span>}
        </div>
      )
    ),
    Textarea: React.forwardRef(
      (
        {
          label,
          error,
          ...props
        }: { label?: string; error?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>,
        ref: React.Ref<HTMLTextAreaElement>
      ) => (
        <div>
          {label && <label htmlFor={props.id}>{label}</label>}
          <textarea ref={ref} {...props} />
        </div>
      )
    ),
    Select: React.forwardRef(
      (
        {
          label,
          options,
          error,
          ...props
        }: {
          label?: string;
          error?: string;
          options: { value: string; label: string }[];
        } & React.SelectHTMLAttributes<HTMLSelectElement>,
        ref: React.Ref<HTMLSelectElement>
      ) => (
        <div>
          {label && <label htmlFor={props.id}>{label}</label>}
          <select ref={ref} {...props}>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )
    ),
    Avatar: ({ name }: { name: string }) => <div data-testid="avatar">{name}</div>,
    Badge: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <span className={className} data-testid="badge">
        {children}
      </span>
    ),
  };
});

const mockMe = {
  id: "user-me",
  email: "me@test.com",
  name: "Me",
  avatarUrl: null,
  role: "USER",
  createdAt: "2024-01-01T00:00:00.000Z",
};

const mockProject = {
  id: "test-project-id",
  name: "Demo Project",
  key: "DEMO",
  description: "A test project",
  members: [
    {
      id: "member-1",
      role: "ADMIN",
      userId: "user-me",
      user: { ...mockMe },
    },
    {
      id: "member-2",
      role: "MEMBER",
      userId: "user-other",
      user: {
        id: "user-other",
        email: "other@test.com",
        name: "Other User",
        avatarUrl: null,
        role: "USER",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    },
  ],
};

const setupFetchMocks = (project = mockProject, me = mockMe) => {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url === "/api/auth/me") {
      return Promise.resolve({ ok: true, json: async () => ({ user: me }) });
    }
    if (url === `/api/projects/${project.id}`) {
      return Promise.resolve({ ok: true, json: async () => ({ project }) });
    }
    return Promise.resolve({ ok: false, json: async () => ({ error: "Not found" }) });
  });
};

describe("SettingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders project name and description in editable fields", async () => {
    setupFetchMocks();
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/project name/i)).toHaveValue("Demo Project");
    });

    expect(screen.getByLabelText(/description/i)).toHaveValue("A test project");
  });

  it("lists all members with names and emails", async () => {
    setupFetchMocks();
    render(<SettingsPage />);

    await waitFor(() => {
      // Avatar mock + member list both render "Me"
      expect(screen.getAllByText(/Me/).length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText("Other User").length).toBeGreaterThan(0);
    expect(screen.getByText("other@test.com")).toBeInTheDocument();
  });

  it("shows add member form for admins", async () => {
    setupFetchMocks();
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /add member/i })).toBeInTheDocument();
  });

  it("hides add member form for non-admin members", async () => {
    const projectAsMember = {
      ...mockProject,
      members: [
        {
          id: "member-1",
          role: "MEMBER",
          userId: "user-me",
          user: { ...mockMe },
        },
      ],
    };
    setupFetchMocks(projectAsMember);
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/Me/).length).toBeGreaterThan(0);
    });

    expect(screen.queryByRole("button", { name: /add member/i })).not.toBeInTheDocument();
  });

  it("submits POST to add a member when form is filled", async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ user: mockMe }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ project: mockProject }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          member: {
            id: "member-3",
            role: "MEMBER",
            userId: "user-new",
            user: {
              id: "user-new",
              email: "new@test.com",
              name: "New User",
              avatarUrl: null,
              role: "USER",
              createdAt: "2024-01-01",
            },
          },
        }),
      });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/email/i), "new@test.com");
    await user.click(screen.getByRole("button", { name: /add member/i }));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const postCall = calls.find((c) => c[1]?.method === "POST");
      expect(postCall).toBeDefined();
    });

    const postCall = (global.fetch as jest.Mock).mock.calls.find(
      (c) => c[1]?.method === "POST"
    );
    expect(postCall![0]).toBe(`/api/projects/${mockProject.id}/members`);
    expect(JSON.parse(postCall![1].body).email).toBe("new@test.com");
  });
});
