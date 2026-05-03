"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User } from "@/types";

interface SidebarProps {
  user: User;
}

export function Sidebar({ user: _user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-orange-100 bg-white md:block dark:border-dark-border dark:bg-dark-surface">
      <div className="flex h-16 items-center gap-3 border-b border-orange-100 px-6 dark:border-dark-border">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <Link href="/projects" className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent dark:from-orange-400 dark:to-amber-400">
          LimeLight
        </Link>
      </div>
      <nav className="p-4">
        <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-dark-text-secondary">
          Navigation
        </div>
        <Link
          href="/projects"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname === "/projects" || pathname.startsWith("/projects/")
              ? "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300"
              : "text-gray-600 hover:bg-gray-50 dark:text-dark-text-secondary dark:hover:bg-dark-surface-hover"
          )}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          Projects
        </Link>
      </nav>
    </aside>
  );
}
