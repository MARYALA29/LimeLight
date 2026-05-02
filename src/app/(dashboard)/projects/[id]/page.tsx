import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Board } from "@/components/board/board";

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
          user: { select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true } },
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
      assignee: { select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true } },
      creator: { select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true } },
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
      </div>
      <Board
        project={project}
        initialTasks={tasks}
        members={project.members.map((m) => m.user)}
      />
    </div>
  );
}
