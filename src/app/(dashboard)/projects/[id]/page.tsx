import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Board } from "@/components/board/board";
import { ProjectTabs } from "@/components/projects/project-tabs";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: {
      id,
      members: { some: { userId: user!.id } },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, email: true, name: true, avatarUrl: true, role: true, createdAt: true } },
        },
      },
      statuses: { orderBy: { order: "asc" } },
    },
  });

  if (!project) {
    notFound();
  }

  const tasks = await prisma.task.findMany({
    where: { projectId: id },
    include: {
      assignee: { select: { id: true, email: true, name: true, avatarUrl: true, role: true, createdAt: true } },
      creator: { select: { id: true, email: true, name: true, avatarUrl: true, role: true, createdAt: true } },
      status: true,
    },
    orderBy: { order: "asc" },
  });

  return (
    <div className="h-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-sm text-orange-500 font-medium mt-1">{project.key}</p>
        </div>
        <Link
          href={`/projects/${project.id}/settings`}
          className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:border-orange-300 transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Settings
        </Link>
      </div>

      <div className="mb-6">
        <ProjectTabs projectId={project.id} active="board" />
      </div>

      <Board
        project={project}
        initialTasks={tasks}
        members={project.members.map((m) => m.user)}
      />
    </div>
  );
}
