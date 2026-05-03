/**
 * Inline script injected into the <head> to set the `dark` class on
 * <html> *before* React hydrates. This prevents a flash of the wrong
 * theme on initial page load.
 *
 * Order of preference:
 *   1. The server-rendered preference (passed in via `serverPreference`)
 *   2. Cached preference in localStorage (for unauthenticated users)
 *   3. The system color-scheme via `prefers-color-scheme`
 */
import { THEME_STORAGE_KEY, type ThemePreference } from "./theme-provider";

interface ThemeScriptProps {
  serverPreference?: ThemePreference | null;
}

export function ThemeScript({ serverPreference }: ThemeScriptProps) {
  const safe = serverPreference ?? null;
  // The script body is intentionally compact and dependency-free. It must
  // run synchronously in the document <head> for no-flash behaviour.
  const code = `
(function() {
  try {
    var key = ${JSON.stringify(THEME_STORAGE_KEY)};
    var serverPref = ${JSON.stringify(safe)};
    var stored = null;
    try { stored = window.localStorage.getItem(key); } catch (e) {}
    var pref = serverPref || stored || 'SYSTEM';
    var resolved;
    if (pref === 'DARK') {
      resolved = 'dark';
    } else if (pref === 'LIGHT') {
      resolved = 'light';
    } else {
      resolved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    var root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.style.colorScheme = resolved;
  } catch (e) {}
})();`;

  return (
    <script
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: code }}
    />
  );
}
