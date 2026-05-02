import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "@/components/projects/header";
import { User } from "@/types";

jest.mock("@/components/ui", () => ({
  Avatar: ({ name }: { name: string }) => <div data-testid="avatar">{name}</div>,
}));

const baseUser: User = {
  id: "user-1",
  email: "demo@example.com",
  name: "Demo User",
  avatarUrl: null,
  role: "USER",
  createdAt: new Date("2024-01-01"),
};

const adminUser: User = { ...baseUser, name: "Admin User", role: "ADMIN", email: "admin@limelight.com" };

describe("Header", () => {
  it("shows the user's name in the trigger button", () => {
    render(<Header user={baseUser} />);
    expect(screen.getAllByText("Demo User").length).toBeGreaterThan(0);
  });

  it("shows Profile link in the dropdown when opened", async () => {
    const user = userEvent.setup();
    render(<Header user={baseUser} />);

    await user.click(screen.getByRole("button", { name: /demo user/i }));

    const profileLink = screen.getByRole("link", { name: /profile/i });
    expect(profileLink).toBeInTheDocument();
    expect(profileLink).toHaveAttribute("href", "/profile");
  });

  it("shows USER role badge in the dropdown for regular users", async () => {
    const user = userEvent.setup();
    render(<Header user={baseUser} />);

    await user.click(screen.getByRole("button", { name: /demo user/i }));

    // Role text appears in trigger and in dropdown badge
    expect(screen.getAllByText(/^user$/i).length).toBeGreaterThanOrEqual(2);
  });

  it("shows ADMIN role badge in the dropdown for admin users", async () => {
    const user = userEvent.setup();
    render(<Header user={adminUser} />);

    await user.click(screen.getByRole("button", { name: /admin user/i }));

    expect(screen.getAllByText(/^admin$/i).length).toBeGreaterThanOrEqual(2);
  });

  it("shows Sign out button in the dropdown", async () => {
    const user = userEvent.setup();
    render(<Header user={baseUser} />);

    await user.click(screen.getByRole("button", { name: /demo user/i }));

    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });
});
