import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createProjectSchema } from "@/lib/validations";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: {
        members: { some: { userId: user.id } },
      },
      include: {
        _count: { select: { tasks: true, members: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createProjectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, key, description } = validation.data;

    const existingProject = await prisma.project.findUnique({
      where: { key },
    });

    if (existingProject) {
      return NextResponse.json({ error: "Project key already exists" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name,
        key,
        description,
        members: {
          create: { userId: user.id, role: "ADMIN" },
        },
        statuses: {
          createMany: {
            data: [
              { name: "To Do", order: 0 },
              { name: "In Progress", order: 1 },
              { name: "Done", order: 2 },
            ],
          },
        },
      },
      include: {
        _count: { select: { tasks: true, members: true } },
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
