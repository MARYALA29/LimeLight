"use client";

import { useTheme, type ThemePreference } from "./theme-provider";

const OPTIONS: { value: ThemePreference; label: string; description: string }[] =
  [
    { value: "LIGHT", label: "Light", description: "Always light" },
    { value: "DARK", label: "Dark", description: "Always dark" },
    {
      value: "SYSTEM",
      label: "System",
      description: "Follow your OS preference",
    },
  ];

interface ThemeToggleProps {
  /** Optional id used to label the radiogroup for accessibility. */
  id?: string;
}

/**
 * Light / Dark / System theme picker. Renders as a radiogroup so it remains
 * keyboard-accessible.
 */
export function ThemeToggle({ id = "theme-toggle" }: ThemeToggleProps) {
  const { themePreference, setThemePreference } = useTheme();

  return (
    <div role="radiogroup" aria-labelledby={`${id}-label`} className="space-y-2">
      <span id={`${id}-label`} className="sr-only">
        Theme preference
      </span>
      <div className="inline-flex gap-1 rounded-xl border border-orange-100 bg-white p-1 dark:border-dark-border dark:bg-dark-surface">
        {OPTIONS.map((option) => {
          const selected = themePreference === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={option.label}
              title={option.description}
              onClick={() => setThemePreference(option.value)}
              className={
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
                (selected
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-gray-600 hover:bg-orange-50 dark:text-dark-text-secondary dark:hover:bg-dark-surface-hover")
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
