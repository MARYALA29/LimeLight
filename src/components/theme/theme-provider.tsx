"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ThemePreference = "LIGHT" | "DARK" | "SYSTEM";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "limelight-theme";

/**
 * Resolve a `ThemePreference` against the current system color-scheme to a
 * concrete light / dark theme.
 */
export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean
): ResolvedTheme {
  if (preference === "DARK") return "dark";
  if (preference === "LIGHT") return "light";
  return systemPrefersDark ? "dark" : "light";
}

interface ThemeContextValue {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setThemePreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

interface ThemeProviderProps {
  children: ReactNode;
  /** Preference seeded from the server (or storage). Defaults to SYSTEM. */
  initialPreference?: ThemePreference;
  /**
   * When true (the default), changes to the preference are persisted to
   * `/api/auth/me`. Set to false to skip the network call (useful in tests
   * or for unauthenticated pages).
   */
  persistOnChange?: boolean;
}

function applyThemeClass(theme: ResolvedTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  // Also expose the resolved theme for native form-control color schemes.
  root.style.colorScheme = theme;
}

function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({
  children,
  initialPreference = "SYSTEM",
  persistOnChange = true,
}: ThemeProviderProps) {
  const [themePreference, setThemePreferenceState] =
    useState<ThemePreference>(initialPreference);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() =>
    getSystemPrefersDark()
  );

  // Track which preference value we've already persisted so we don't fire a
  // PATCH for the initial value seeded from the server.
  const lastPersistedRef = useRef<ThemePreference>(initialPreference);

  // Watch the system preference; update only matters when preference is SYSTEM.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent | { matches: boolean }) => {
      setSystemPrefersDark(e.matches);
    };
    // Modern API
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
    // Legacy fallback (Safari < 14)
    type LegacyMql = MediaQueryList & {
      addListener: (cb: (e: MediaQueryListEvent) => void) => void;
      removeListener: (cb: (e: MediaQueryListEvent) => void) => void;
    };
    const legacy = mql as LegacyMql;
    legacy.addListener(onChange);
    return () => legacy.removeListener(onChange);
  }, []);

  const resolvedTheme = useMemo(
    () => resolveTheme(themePreference, systemPrefersDark),
    [themePreference, systemPrefersDark]
  );

  // Apply the class to <html> any time the resolved theme changes.
  useEffect(() => {
    applyThemeClass(resolvedTheme);
  }, [resolvedTheme]);

  const setThemePreference = useCallback(
    (preference: ThemePreference) => {
      setThemePreferenceState(preference);
      // Mirror to localStorage as a defensive cache for the no-flash script.
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem(THEME_STORAGE_KEY, preference);
        }
      } catch {
        // Storage may be unavailable (private mode, quota); ignore.
      }
      if (
        persistOnChange &&
        typeof fetch === "function" &&
        lastPersistedRef.current !== preference
      ) {
        lastPersistedRef.current = preference;
        // Fire-and-forget; failures are non-fatal — the user's local
        // preference still applies for this session.
        try {
          const result = fetch("/api/users/me/preferences", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ themePreference: preference }),
          });
          if (result && typeof (result as Promise<unknown>).catch === "function") {
            (result as Promise<unknown>).catch(() => {
              /* swallow — non-fatal */
            });
          }
        } catch {
          /* swallow — non-fatal */
        }
      }
    },
    [persistOnChange]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ themePreference, resolvedTheme, setThemePreference }),
    [themePreference, resolvedTheme, setThemePreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
