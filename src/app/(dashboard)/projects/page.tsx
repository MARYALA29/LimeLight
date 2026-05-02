import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui";

export default async function ProjectsPage() {
  const user = await getCurrentUser();

  const projects = await prisma.project.findMany({
    where: { members: { some: { userId: user!.id } } },
    include: { _count: { select: { tasks: true, members: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">Manage and track all your projects</p>
        </div>
        <Link href="/projects/new">
          <Button>+ New Project</Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-orange-100 p-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-6">
            <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-6">Create your first project to get started</p>
          <Link href="/projects/new">
            <Button>Create your first project</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div className="bg-white rounded-2xl border border-orange-100 p-6 cursor-pointer transition-all hover:shadow-lg hover:border-orange-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{project.key.slice(0, 2)}</span>
                  </div>
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-600">
                    {project.key}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.name}</h3>
                {project.description && (
                  <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                    {project.description}
                  </p>
                )}
                <div className="flex gap-4 text-sm text-gray-400 pt-4 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {project._count.tasks} tasks
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {project._count.members} members
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
