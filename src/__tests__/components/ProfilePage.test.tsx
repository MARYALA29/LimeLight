import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfilePage from "@/app/(dashboard)/profile/page";

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
    Avatar: ({ name }: { name: string }) => <div data-testid="avatar">{name}</div>,
    Badge: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <span className={className} data-testid="badge">
        {children}
      </span>
    ),
  };
});

const mockAdmin = {
  id: "admin-1",
  email: "admin@limelight.com",
  name: "Admin User",
  avatarUrl: null,
  role: "ADMIN",
  createdAt: "2024-01-01T00:00:00.000Z",
};

const mockUser = {
  id: "user-1",
  email: "demo@example.com",
  name: "Demo User",
  avatarUrl: null,
  role: "USER",
  createdAt: "2024-01-01T00:00:00.000Z",
};

describe("ProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders user name, email, and role for a regular user", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/^name$/i)).toHaveValue("Demo User");
    });

    // Email is shown in both header and details grid — both are valid renderings
    expect(screen.getAllByText("demo@example.com").length).toBeGreaterThan(0);
    const badges = screen.getAllByTestId("badge");
    expect(badges.some((b) => /user/i.test(b.textContent || ""))).toBe(true);
  });

  it("renders ADMIN badge for admin users", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockAdmin }),
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/^name$/i)).toHaveValue("Admin User");
    });

    const badges = screen.getAllByTestId("badge");
    expect(badges.some((b) => /admin/i.test(b.textContent || ""))).toBe(true);
  });

  it("submits PATCH request when saving profile changes", async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { ...mockUser, name: "New Name" } }),
      });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/^name$/i)).toHaveValue("Demo User");
    });

    const nameInput = screen.getByLabelText(/^name$/i);
    await user.clear(nameInput);
    await user.type(nameInput, "New Name");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    const patchCall = (global.fetch as jest.Mock).mock.calls.find(
      (call) => call[1]?.method === "PATCH"
    );
    expect(patchCall).toBeDefined();
    expect(patchCall![0]).toBe("/api/auth/me");
    expect(JSON.parse(patchCall![1].body).name).toBe("New Name");
  });

  it("shows error when fetching profile fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Unauthorized" }),
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/unable to load profile/i)).toBeInTheDocument();
    });
  });

  it("renders the change password form", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /change password/i })).toBeInTheDocument();
  });

  it("submits POST to /api/auth/change-password with the form values", async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/current password/i), "oldpw123");
    await user.type(screen.getByLabelText(/^new password$/i), "newpw456");
    await user.type(screen.getByLabelText(/confirm new password/i), "newpw456");
    await user.click(screen.getByRole("button", { name: /change password/i }));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const passwordCall = calls.find((c) => c[0] === "/api/auth/change-password");
      expect(passwordCall).toBeDefined();
    });

    const passwordCall = (global.fetch as jest.Mock).mock.calls.find(
      (c) => c[0] === "/api/auth/change-password"
    );
    expect(passwordCall![1].method).toBe("POST");
    const body = JSON.parse(passwordCall![1].body);
    expect(body.currentPassword).toBe("oldpw123");
    expect(body.newPassword).toBe("newpw456");
    expect(body.confirmNewPassword).toBe("newpw456");
  });

  it("shows error when confirmation does not match new password", async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/current password/i), "oldpw123");
    await user.type(screen.getByLabelText(/^new password$/i), "newpw456");
    await user.type(screen.getByLabelText(/confirm new password/i), "different");
    await user.click(screen.getByRole("button", { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    // Should NOT have called the API
    const calls = (global.fetch as jest.Mock).mock.calls;
    expect(calls.find((c) => c[0] === "/api/auth/change-password")).toBeUndefined();
  });
});
