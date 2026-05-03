import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { updateVulnerabilitySchema } from "@/lib/validations";
import {
  canTransition,
  VulnStatus,
} from "@/lib/vulnerability-state-machine";

const userSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  role: true,
  createdAt: true,
} as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; vulnId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, vulnId } = await params;

    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId: user.id },
    });
    if (!member) {
      return NextResponse.json(
        { error: "Not a member of this project" },
        { status: 403 }
      );
    }

    const vulnerability = await prisma.vulnerability.findFirst({
      where: { id: vulnId, projectId },
      include: {
        reporter: { select: userSelect },
        assignee: { select: userSelect },
      },
    });

    if (!vulnerability) {
      return NextResponse.json(
        { error: "Vulnerability not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ vulnerability });
  } catch (error) {
    console.error("Get vulnerability error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; vulnId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, vulnId } = await params;
    const body = await request.json();
    const validation = updateVulnerabilitySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId: user.id },
    });
    if (!member) {
      return NextResponse.json(
        { error: "Not a member of this project" },
        { status: 403 }
      );
    }
    if (member.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only project admins can update vulnerabilities" },
        { status: 403 }
      );
    }

    const existing = await prisma.vulnerability.findFirst({
      where: { id: vulnId, projectId },
      select: { id: true, status: true, patchedAt: true, verifiedAt: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Vulnerability not found" },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = { ...validation.data };

    if (validation.data.status) {
      const from = existing.status as VulnStatus;
      const to = validation.data.status as VulnStatus;
      if (!canTransition(from, to)) {
        return NextResponse.json(
          { error: `Invalid status transition: ${from} → ${to}` },
          { status: 400 }
        );
      }
      // Auto-stamp lifecycle timestamps when entering terminal-ish states.
      if (to === "PATCHED" && !existing.patchedAt) {
        data.patchedAt = new Date();
      }
      if (to === "VERIFIED" && !existing.verifiedAt) {
        data.verifiedAt = new Date();
      }
    }

    const vulnerability = await prisma.vulnerability.update({
      where: { id: vulnId },
      data,
      include: {
        reporter: { select: userSelect },
        assignee: { select: userSelect },
      },
    });

    return NextResponse.json({ vulnerability });
  } catch (error) {
    console.error("Update vulnerability error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
