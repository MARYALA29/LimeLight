import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeScript } from "@/components/theme/theme-script";
import { getCurrentUser } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LimeLight - Task Management",
  description: "Illuminate your workflow with LimeLight task management",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Resolve the user's preference server-side so the no-flash inline
  // script can apply the correct class before hydration. Falls back to
  // SYSTEM for unauthenticated visitors or when the auth lookup fails
  // (e.g. during a build where the database isn't reachable).
  let initialPreference: "LIGHT" | "DARK" | "SYSTEM" = "SYSTEM";
  try {
    const user = await getCurrentUser();
    if (user?.themePreference) {
      initialPreference = user.themePreference;
    }
  } catch {
    // Fall through with SYSTEM default.
  }

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <ThemeScript serverPreference={initialPreference} />
      </head>
      <body
        className={`${inter.className} h-full bg-background text-text-primary antialiased dark:bg-dark-background dark:text-dark-text-primary`}
      >
        <ThemeProvider initialPreference={initialPreference}>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
