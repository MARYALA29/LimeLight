import type { Config } from "tailwindcss";

const config: Config = {
  // Class-based dark mode: applied by toggling `class="dark"` on <html>
  // (handled by ThemeProvider). The orange primary palette stays vibrant in
  // both modes; surfaces and text shift to neutral-900 / neutral-100 in dark.
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#F97316",
          hover: "#EA580C",
          light: "#FFF7ED",
          dark: "#C2410C",
        },
        secondary: {
          DEFAULT: "#FB923C",
          hover: "#F97316",
        },
        accent: {
          DEFAULT: "#FBBF24",
          light: "#FEF3C7",
        },
        success: {
          DEFAULT: "#22C55E",
          light: "#DCFCE7",
          // Slightly desaturated for dark surfaces
          dark: "#16A34A",
        },
        warning: {
          DEFAULT: "#EAB308",
          light: "#FEF9C3",
          dark: "#CA8A04",
        },
        danger: {
          DEFAULT: "#EF4444",
          light: "#FEE2E2",
          dark: "#DC2626",
        },
        // Light-mode tokens (existing behaviour preserved)
        background: "#FFFBF5",
        surface: "#FFFFFF",
        border: "#FED7AA",
        "text-primary": "#1C1917",
        "text-secondary": "#78716C",
        // Dark-mode tokens — used via the `dark:` variant
        "dark-background": "#0A0A0A",
        "dark-surface": "#171717",
        "dark-surface-hover": "#262626",
        "dark-border": "#404040",
        "dark-text-primary": "#FAFAFA",
        "dark-text-secondary": "#A3A3A3",
        // Status colors tuned for dark mode (todo/in-progress/done)
        "status-todo": {
          light: "#E5E7EB",
          dark: "#374151",
        },
        "status-in-progress": {
          light: "#DBEAFE",
          dark: "#1E3A8A",
        },
        "status-done": {
          light: "#DCFCE7",
          dark: "#14532D",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
