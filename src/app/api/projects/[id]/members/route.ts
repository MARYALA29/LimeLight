import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { addMemberSchema } from "@/lib/validations";

async function requireProjectAdmin(projectId: string, userId: string) {
  return prisma.projectMember.findFirst({
    where: { projectId, userId, role: "ADMIN" },
  });
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

    const { id } = await params;
    const body = await request.json();
    const validation = addMemberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const admin = await requireProjectAdmin(id, user.id);
    if (!admin) {
      return NextResponse.json(
        { error: "Only project admins can add members" },
        { status: 403 }
      );
    }

    const target = await prisma.user.findUnique({
      where: { email: validation.data.email },
      select: { id: true, email: true, name: true, avatarUrl: true, role: true, createdAt: true },
    });

    if (!target) {
      return NextResponse.json(
        { error: "No user found with that email" },
        { status: 404 }
      );
    }

    const existing = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: target.id, projectId: id } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User is already a member of this project" },
        { status: 409 }
      );
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId: id,
        userId: target.id,
        role: validation.data.role || "MEMBER",
      },
      include: {
        user: {
          select: { id: true, email: true, name: true, avatarUrl: true, role: true, createdAt: true },
        },
      },
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error("Add member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
