import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { VulnerabilitiesList } from "@/components/vulnerabilities/vulnerabilities-list";

const userSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  role: true,
  createdAt: true,
} as const;

export default async function ProjectVulnerabilitiesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, members: { some: { userId: user.id } } },
    include: {
      members: { include: { user: { select: userSelect } } },
    },
  });

  if (!project) {
    notFound();
  }

  const myMembership = project.members.find((m) => m.userId === user.id);
  if (!myMembership) {
    notFound();
  }

  const vulnerabilities = await prisma.vulnerability.findMany({
    where: { projectId: id },
    include: {
      reporter: { select: userSelect },
      assignee: { select: userSelect },
    },
    orderBy: [{ severity: "desc" }, { reportedAt: "desc" }],
  });

  return (
    <div className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-sm text-orange-500 font-medium mt-1">
            {project.key}
          </p>
        </div>
        <Link
          href={`/projects/${project.id}/settings`}
          className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:border-orange-300 transition-colors"
        >
          Settings
        </Link>
      </div>

      <div className="mb-6">
        <ProjectTabs projectId={project.id} active="vulnerabilities" />
      </div>

      <VulnerabilitiesList
        projectId={project.id}
        members={project.members.map((m) => m.user)}
        currentUser={{
          ...user,
          createdAt: user.createdAt,
        }}
        myRole={myMembership.role}
        initialVulnerabilities={vulnerabilities}
      />
    </div>
  );
}
