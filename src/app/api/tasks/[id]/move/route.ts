import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { moveTaskSchema } from "@/lib/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = moveTaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 });
    }

    const { statusId, order } = validation.data;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: { include: { members: { where: { userId: user.id } } } } },
    });

    if (!task || task.project.members.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const oldStatusId = task.statusId;
    const oldOrder = task.order;

    // Update other tasks' orders
    if (statusId === oldStatusId) {
      // Moving within same column
      if (order > oldOrder) {
        await prisma.task.updateMany({
          where: {
            statusId,
            order: { gt: oldOrder, lte: order },
            id: { not: id },
          },
          data: { order: { decrement: 1 } },
        });
      } else if (order < oldOrder) {
        await prisma.task.updateMany({
          where: {
            statusId,
            order: { gte: order, lt: oldOrder },
            id: { not: id },
          },
          data: { order: { increment: 1 } },
        });
      }
    } else {
      // Moving to different column
      await prisma.task.updateMany({
        where: {
          statusId: oldStatusId,
          order: { gt: oldOrder },
        },
        data: { order: { decrement: 1 } },
      });

      await prisma.task.updateMany({
        where: {
          statusId,
          order: { gte: order },
        },
        data: { order: { increment: 1 } },
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { statusId, order },
      include: {
        assignee: { select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true } },
        creator: { select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true } },
        status: true,
      },
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error("Move task error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
