import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/projects");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              LimeLight
            </span>
          </div>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-orange-600 hover:bg-orange-50">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            Simple. Fast. Powerful.
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Illuminate Your
            <span className="block bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              Workflow
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            The modern task management platform that helps teams organize, track, and deliver projects with clarity and speed.
          </p>

          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="px-8 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-shadow">
                Start Free Today
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="px-8 border-orange-200 hover:bg-orange-50">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-32 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-orange-100 hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center mb-6">
              <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Kanban Boards</h3>
            <p className="text-gray-600">Visualize your workflow with intuitive drag-and-drop boards that keep everyone aligned.</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-orange-100 hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center mb-6">
              <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Team Collaboration</h3>
            <p className="text-gray-600">Assign tasks, share updates, and keep your team in sync with real-time collaboration.</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-orange-100 hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center mb-6">
              <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Track Progress</h3>
            <p className="text-gray-600">Monitor project health with priority levels and status updates at a glance.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-orange-100 py-8">
        <div className="container mx-auto px-6 text-center text-gray-500 text-sm">
          Built with Next.js, Tailwind CSS, and PostgreSQL
        </div>
      </footer>
    </div>
  );
}
