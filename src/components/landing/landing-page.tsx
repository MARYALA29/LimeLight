import Link from "next/link";
import { Button } from "@/components/ui";

const FEATURES = [
  {
    title: "Kanban Boards",
    description:
      "Visualize work as it moves from backlog to done with drag-and-drop boards your whole team can read at a glance.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    ),
    accent: "orange",
  },
  {
    title: "Team Collaboration",
    description:
      "Assign owners, leave comments, and @mention teammates so context lives next to the work — not scattered across chat threads.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    ),
    accent: "amber",
  },
  {
    title: "Track Progress",
    description:
      "Priority levels, status updates, and due dates surface what's at risk before it slips, so launches stay on schedule.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    ),
    accent: "orange",
  },
  {
    title: "Lightning Fast",
    description:
      "Built on Next.js with a Postgres-backed API. Pages load instantly and changes sync in real time across every open tab.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    ),
    accent: "amber",
  },
  {
    title: "Built for Focus",
    description:
      "A clean, opinionated interface that strips away the noise so your team can spend time shipping, not configuring tools.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    ),
    accent: "orange",
  },
  {
    title: "Secure by Default",
    description:
      "Role-based access, hashed credentials, and per-project membership keep sensitive work visible only to the people who need it.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    ),
    accent: "amber",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Create your project",
    description:
      "Spin up a new project in seconds and invite your team. No templates to wade through, no setup wizard to abandon.",
  },
  {
    number: "02",
    title: "Plan the work",
    description:
      "Add tasks, set priorities, and assign owners. Drag cards across the board as work moves from idea to in-review to shipped.",
  },
  {
    number: "03",
    title: "Ship with clarity",
    description:
      "Track progress on a single board everyone trusts. Spot blockers early and celebrate what your team has delivered.",
  },
];

const STATS = [
  { label: "Setup time", value: "< 60s" },
  { label: "Open source", value: "MIT" },
  { label: "Built on", value: "Next.js 14" },
  { label: "Test coverage", value: "TDD" },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <header className="container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              LimeLight
            </span>
          </div>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-orange-600 hover:bg-orange-50">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="container mx-auto px-6 pt-20 pb-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clipRule="evenodd"
                />
              </svg>
              Simple. Fast. Powerful.
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Illuminate Your{" "}
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                Workflow
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              The modern task management platform that helps teams organize, track, and deliver
              projects with clarity and speed. Plan in the morning, ship by the evening.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="px-8 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 transition-shadow"
                >
                  Start Free Today
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 border-orange-200 hover:bg-orange-50"
                >
                  Sign In
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              No credit card required · Free for small teams · Self-host friendly
            </p>
          </div>
        </section>

        <section
          data-testid="stats-section"
          className="container mx-auto px-6 pb-24"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto bg-white rounded-2xl border border-orange-100 shadow-sm p-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-gray-600 uppercase tracking-wide">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-6 pb-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything your team needs to ship
            </h2>
            <p className="text-lg text-gray-600">
              LimeLight brings planning, execution, and visibility into one focused workspace —
              without the bloat of legacy project trackers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                data-testid="feature-card"
                className="bg-white rounded-2xl p-8 shadow-sm border border-orange-100 hover:shadow-lg transition-shadow"
              >
                <div
                  className={`h-12 w-12 rounded-xl flex items-center justify-center mb-6 ${
                    feature.accent === "amber" ? "bg-amber-100" : "bg-orange-100"
                  }`}
                >
                  <svg
                    className={`h-6 w-6 ${
                      feature.accent === "amber" ? "text-amber-600" : "text-orange-600"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-6 pb-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Up and running in three steps
            </h2>
            <p className="text-lg text-gray-600">
              Skip the onboarding marathon. LimeLight is opinionated about defaults so your team
              can start tracking real work immediately.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {STEPS.map((step) => (
              <div
                key={step.number}
                data-testid="how-step"
                className="relative bg-white rounded-2xl p-8 border border-orange-100 shadow-sm"
              >
                <div className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section data-testid="final-cta" className="container mx-auto px-6 pb-24">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 p-12 md:p-16 text-center max-w-5xl mx-auto shadow-xl shadow-orange-500/20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Bring your projects into the light
            </h2>
            <p className="text-lg md:text-xl text-orange-50 max-w-2xl mx-auto mb-8">
              Set up your first board in under a minute. Invite your team, drop in your tasks, and
              watch the work move forward — together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="px-8 bg-white text-orange-600 hover:bg-orange-50 shadow-lg"
                >
                  Start Free Today
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 border-white text-white hover:bg-white/10"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-orange-100 py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="font-semibold text-gray-700">LimeLight</span>
          </div>
          <div>Built with Next.js, Tailwind CSS, and PostgreSQL</div>
        </div>
      </footer>
    </div>
  );
}
