import type { Config } from "tailwindcss";

const config: Config = {
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
        },
        warning: {
          DEFAULT: "#EAB308",
          light: "#FEF9C3",
        },
        danger: {
          DEFAULT: "#EF4444",
          light: "#FEE2E2",
        },
        background: "#FFFBF5",
        surface: "#FFFFFF",
        border: "#FED7AA",
        "text-primary": "#1C1917",
        "text-secondary": "#78716C",
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
