import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createVulnerabilitySchema } from "@/lib/validations";

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId: user.id },
    });
    if (!member) {
      return NextResponse.json(
        { error: "Not a member of this project" },
        { status: 403 }
      );
    }

    const vulnerabilities = await prisma.vulnerability.findMany({
      where: { projectId },
      include: {
        reporter: { select: userSelect },
        assignee: { select: userSelect },
      },
      orderBy: [{ severity: "desc" }, { reportedAt: "desc" }],
    });

    return NextResponse.json({ vulnerabilities });
  } catch (error) {
    console.error("List vulnerabilities error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
    const validation = createVulnerabilitySchema.safeParse(body);

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
        { error: "Only project admins can report vulnerabilities" },
        { status: 403 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const vulnerability = await prisma.vulnerability.create({
      data: {
        ...validation.data,
        projectId,
        reporterId: user.id,
      },
      include: {
        reporter: { select: userSelect },
        assignee: { select: userSelect },
      },
    });

    return NextResponse.json({ vulnerability }, { status: 201 });
  } catch (error) {
    console.error("Create vulnerability error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
