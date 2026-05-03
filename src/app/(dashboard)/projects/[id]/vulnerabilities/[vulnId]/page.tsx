import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { VulnerabilityDetail } from "@/components/vulnerabilities/vulnerability-detail";

const userSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  role: true,
  createdAt: true,
} as const;

export default async function VulnerabilityDetailPage({
  params,
}: {
  params: Promise<{ id: string; vulnId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id, vulnId } = await params;

  const project = await prisma.project.findFirst({
    where: { id, members: { some: { userId: user.id } } },
    include: { members: true },
  });
  if (!project) notFound();

  const myMembership = project.members.find((m) => m.userId === user.id);
  if (!myMembership) notFound();

  const vulnerability = await prisma.vulnerability.findFirst({
    where: { id: vulnId, projectId: id },
    include: {
      reporter: { select: userSelect },
      assignee: { select: userSelect },
    },
  });
  if (!vulnerability) notFound();

  return (
    <div className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-sm text-orange-500 font-medium mt-1">
            {project.key}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <ProjectTabs projectId={project.id} active="vulnerabilities" />
      </div>

      <div className="mb-4">
        <Link
          href={`/projects/${project.id}/vulnerabilities`}
          className="text-sm text-orange-600 hover:text-orange-700"
        >
          ← Back to vulnerabilities
        </Link>
      </div>

      <VulnerabilityDetail
        projectId={project.id}
        vulnerability={vulnerability}
        myRole={myMembership.role}
      />
    </div>
  );
}
