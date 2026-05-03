/**
 * Revoke a Personal Access Token.
 *
 * Soft delete by setting `revokedAt`. Revoked tokens are kept for audit
 * but cannot authenticate (see `auth-pat.ts`). Like the create/list
 * routes, this endpoint requires a session cookie — PAT auth cannot
 * revoke other PATs.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Look up by id AND userId so users can only revoke their own tokens.
  // Also reject already-revoked tokens with 404 to keep the contract simple.
  const existing = await prisma.personalAccessToken.findFirst({
    where: { id, userId: user.id, revokedAt: null },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Token not found" }, { status: 404 });
  }

  await prisma.personalAccessToken.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
