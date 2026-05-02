import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { updateMemberSchema } from "@/lib/validations";

async function requireProjectAdmin(projectId: string, userId: string) {
  return prisma.projectMember.findFirst({
    where: { projectId, userId, role: "ADMIN" },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, memberId } = await params;
    const body = await request.json();
    const validation = updateMemberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const admin = await requireProjectAdmin(id, user.id);
    if (!admin) {
      return NextResponse.json(
        { error: "Only project admins can update members" },
        { status: 403 }
      );
    }

    const target = await prisma.projectMember.findFirst({
      where: { id: memberId, projectId: id },
    });

    if (!target) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // If demoting an admin, ensure at least one admin remains
    if (target.role === "ADMIN" && validation.data.role === "MEMBER") {
      const adminCount = await prisma.projectMember.count({
        where: { projectId: id, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the only admin of this project" },
          { status: 400 }
        );
      }
    }

    const member = await prisma.projectMember.update({
      where: { id: memberId },
      data: { role: validation.data.role },
      include: {
        user: {
          select: { id: true, email: true, name: true, avatarUrl: true, role: true, createdAt: true },
        },
      },
    });

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Update member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, memberId } = await params;

    const admin = await requireProjectAdmin(id, user.id);
    if (!admin) {
      return NextResponse.json(
        { error: "Only project admins can remove members" },
        { status: 403 }
      );
    }

    const target = await prisma.projectMember.findFirst({
      where: { id: memberId, projectId: id },
    });

    if (!target) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Don't allow removing the last admin
    if (target.role === "ADMIN") {
      const adminCount = await prisma.projectMember.count({
        where: { projectId: id, role: "ADMIN" },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the only admin of this project" },
          { status: 400 }
        );
      }
    }

    await prisma.projectMember.delete({ where: { id: memberId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
