/**
 * ThemeProvider tests.
 *
 * The provider:
 *   - reads an initial preference (LIGHT | DARK | SYSTEM)
 *   - applies `class="dark"` to <html> when the resolved theme is dark
 *   - re-applies when preference changes via setThemePreference
 *   - tracks the system color-scheme when preference is SYSTEM
 */
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ThemeProvider,
  useTheme,
  resolveTheme,
} from "@/components/theme/theme-provider";

function ThemeProbe() {
  const { themePreference, resolvedTheme, setThemePreference } = useTheme();
  return (
    <div>
      <span data-testid="preference">{themePreference}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setThemePreference("DARK")}>set dark</button>
      <button onClick={() => setThemePreference("LIGHT")}>set light</button>
      <button onClick={() => setThemePreference("SYSTEM")}>set system</button>
    </div>
  );
}

type MqlListener = (e: { matches: boolean }) => void;

function installMatchMedia(initialMatches = false) {
  const listeners = new Set<MqlListener>();
  const mql = {
    matches: initialMatches,
    media: "(prefers-color-scheme: dark)",
    addEventListener: (_: "change", cb: MqlListener) => listeners.add(cb),
    removeEventListener: (_: "change", cb: MqlListener) => listeners.delete(cb),
    // Older API used in some tests
    addListener: (cb: MqlListener) => listeners.add(cb),
    removeListener: (cb: MqlListener) => listeners.delete(cb),
    dispatchEvent: () => true,
    onchange: null,
  };
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: jest.fn().mockImplementation(() => mql),
  });
  return {
    setMatches(value: boolean) {
      mql.matches = value;
      listeners.forEach((l) => l({ matches: value }));
    },
  };
}

beforeEach(() => {
  document.documentElement.classList.remove("dark");
  installMatchMedia(false);
});

describe("resolveTheme", () => {
  it("returns 'dark' for DARK regardless of system", () => {
    expect(resolveTheme("DARK", true)).toBe("dark");
    expect(resolveTheme("DARK", false)).toBe("dark");
  });

  it("returns 'light' for LIGHT regardless of system", () => {
    expect(resolveTheme("LIGHT", true)).toBe("light");
    expect(resolveTheme("LIGHT", false)).toBe("light");
  });

  it("follows the system preference for SYSTEM", () => {
    expect(resolveTheme("SYSTEM", true)).toBe("dark");
    expect(resolveTheme("SYSTEM", false)).toBe("light");
  });
});

describe("ThemeProvider", () => {
  it("applies the 'dark' class when initial preference is DARK", () => {
    render(
      <ThemeProvider initialPreference="DARK">
        <ThemeProbe />
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(screen.getByTestId("preference")).toHaveTextContent("DARK");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
  });

  it("removes the 'dark' class when initial preference is LIGHT", () => {
    document.documentElement.classList.add("dark");
    render(
      <ThemeProvider initialPreference="LIGHT">
        <ThemeProbe />
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
  });

  it("uses system preference when initial preference is SYSTEM (dark)", () => {
    installMatchMedia(true);
    render(
      <ThemeProvider initialPreference="SYSTEM">
        <ThemeProbe />
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
  });

  it("uses system preference when initial preference is SYSTEM (light)", () => {
    installMatchMedia(false);
    render(
      <ThemeProvider initialPreference="SYSTEM">
        <ThemeProbe />
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
  });

  it("toggles the 'dark' class when preference changes from LIGHT to DARK", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider initialPreference="LIGHT">
        <ThemeProbe />
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    await user.click(screen.getByRole("button", { name: /set dark/i }));

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(screen.getByTestId("preference")).toHaveTextContent("DARK");
  });

  it("reacts to system preference changes when set to SYSTEM", () => {
    const mm = installMatchMedia(false);
    render(
      <ThemeProvider initialPreference="SYSTEM">
        <ThemeProbe />
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    act(() => {
      mm.setMatches(true);
    });

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("persists the preference to the API when changed", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ user: { themePreference: "DARK" } }),
    });
    const user = userEvent.setup();

    render(
      <ThemeProvider initialPreference="LIGHT">
        <ThemeProbe />
      </ThemeProvider>
    );

    await user.click(screen.getByRole("button", { name: /set dark/i }));

    const calls = (global.fetch as jest.Mock).mock.calls;
    const patchCall = calls.find((c) => c[1]?.method === "PATCH");
    expect(patchCall).toBeDefined();
    expect(patchCall![0]).toBe("/api/users/me/preferences");
    expect(JSON.parse(patchCall![1].body).themePreference).toBe("DARK");
  });

  it("does not call the API when persistOnChange is false", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider initialPreference="LIGHT" persistOnChange={false}>
        <ThemeProbe />
      </ThemeProvider>
    );

    await user.click(screen.getByRole("button", { name: /set dark/i }));

    const calls = (global.fetch as jest.Mock).mock.calls;
    expect(calls.find((c) => c[1]?.method === "PATCH")).toBeUndefined();
  });
});
