import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentUserOrPATUser } from "@/lib/auth-pat";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  // Accepts either a session cookie or a PAT in the Authorization header.
  const authResult = await getCurrentUserOrPATUser(request);

  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ user: authResult.user });
}

export async function PATCH(request: NextRequest) {
  // Profile updates remain session-only — we don't want a PAT to be able
  // to change a user's display name or avatar URL.
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const validation = updateProfileSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0].message },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: currentUser.id },
    data: validation.data,
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user: updated });
}
