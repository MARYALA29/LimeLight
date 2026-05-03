import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateThemePreferenceSchema } from "@/lib/validations";

export async function PATCH(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const validation = updateThemePreferenceSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0].message },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: currentUser.id },
    data: { themePreference: validation.data.themePreference },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      themePreference: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user: updated });
}
