import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";

beforeEach(() => {
  document.documentElement.classList.remove("dark");
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: jest.fn().mockImplementation(() => ({
      matches: false,
      media: "(prefers-color-scheme: dark)",
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ user: {} }),
  });
});

function renderWithProvider(initial: "LIGHT" | "DARK" | "SYSTEM" = "SYSTEM") {
  return render(
    <ThemeProvider initialPreference={initial} persistOnChange={false}>
      <ThemeToggle />
    </ThemeProvider>
  );
}

describe("ThemeToggle", () => {
  it("renders Light, Dark, and System options", () => {
    renderWithProvider();
    expect(screen.getByRole("radio", { name: /light/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /dark/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /system/i })).toBeInTheDocument();
  });

  it("marks the current preference as checked", () => {
    renderWithProvider("DARK");
    expect(screen.getByRole("radio", { name: /dark/i })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByRole("radio", { name: /light/i })).toHaveAttribute(
      "aria-checked",
      "false"
    );
  });

  it("changes preference when an option is clicked", async () => {
    const user = userEvent.setup();
    renderWithProvider("LIGHT");
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    await user.click(screen.getByRole("radio", { name: /dark/i }));

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(screen.getByRole("radio", { name: /dark/i })).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  it("returns to system preference when System is selected", async () => {
    const user = userEvent.setup();
    renderWithProvider("DARK");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    await user.click(screen.getByRole("radio", { name: /system/i }));

    // System with prefers-color-scheme: light => no dark class
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
