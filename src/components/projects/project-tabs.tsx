import Link from "next/link";

type Tab = "board" | "vulnerabilities";

interface Props {
  projectId: string;
  active: Tab;
}

const TABS: { id: Tab; label: string; path: (id: string) => string }[] = [
  { id: "board", label: "Board", path: (id) => `/projects/${id}` },
  {
    id: "vulnerabilities",
    label: "Vulnerabilities",
    path: (id) => `/projects/${id}/vulnerabilities`,
  },
];

export function ProjectTabs({ projectId, active }: Props) {
  return (
    <nav className="border-b border-orange-100">
      <ul className="flex gap-1 -mb-px">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <li key={tab.id}>
              <Link
                href={tab.path(projectId)}
                aria-current={isActive ? "page" : undefined}
                className={`inline-block px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-600 hover:text-orange-600 hover:border-orange-200"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
