import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createTaskSchema } from "@/lib/validations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const member = await prisma.projectMember.findFirst({
      where: { projectId: id, userId: user.id },
    });

    if (!member) {
      return NextResponse.json({ error: "Not a member of this project" }, { status: 403 });
    }

    const tasks = await prisma.task.findMany({
      where: { projectId: id },
      include: {
        assignee: { select: { id: true, email: true, name: true, avatarUrl: true, role: true, createdAt: true } },
        creator: { select: { id: true, email: true, name: true, avatarUrl: true, role: true, createdAt: true } },
        status: true,
      },
      orderBy: [{ status: { order: "asc" } }, { order: "asc" }],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Get tasks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const body = await request.json();
    const validation = createTaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId: user.id },
    });

    if (!member) {
      return NextResponse.json({ error: "Not a member of this project" }, { status: 403 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { statuses: { orderBy: { order: "asc" }, take: 1 } },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const taskCount = await prisma.task.count({ where: { projectId } });
    const key = `${project.key}-${taskCount + 1}`;

    const statusId = validation.data.statusId || project.statuses[0]?.id;
    if (!statusId) {
      return NextResponse.json({ error: "No status available" }, { status: 400 });
    }

    const maxOrder = await prisma.task.aggregate({
      where: { projectId, statusId },
      _max: { order: true },
    });

    const task = await prisma.task.create({
      data: {
        title: validation.data.title,
        description: validation.data.description,
        priority: validation.data.priority || "MEDIUM",
        key,
        order: (maxOrder._max.order ?? -1) + 1,
        projectId,
        statusId,
        creatorId: user.id,
        assigneeId: validation.data.assigneeId,
      },
      include: {
        assignee: { select: { id: true, email: true, name: true, avatarUrl: true, role: true, createdAt: true } },
        creator: { select: { id: true, email: true, name: true, avatarUrl: true, role: true, createdAt: true } },
        status: true,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
