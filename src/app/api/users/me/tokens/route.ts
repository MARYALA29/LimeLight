/**
 * Personal Access Token (PAT) management endpoints.
 *
 * SECURITY: These endpoints intentionally use `getCurrentUser()` (session
 * cookie only). A request authenticated by a PAT must NOT be able to mint
 * new PATs or list/revoke other PATs. Without this restriction, revocation
 * is meaningless: a stolen PAT could spawn a fresh one.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { generatePersonalAccessToken } from "@/lib/pat";
import { createPATSchema } from "@/lib/validations";
import {
  checkAndIncrementCreateRate,
  PAT_CREATE_LIMIT_PER_HOUR,
} from "@/lib/pat-rate-limit";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokens = await prisma.personalAccessToken.findMany({
    where: { userId: user.id, revokedAt: null },
    select: {
      id: true,
      name: true,
      prefix: true,
      scopes: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ personalAccessTokens: tokens });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = checkAndIncrementCreateRate(user.id);
  if (!rate.ok) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded — at most ${PAT_CREATE_LIMIT_PER_HOUR} tokens may be created per hour. Try again later.`,
      },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validation = createPATSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0].message },
      { status: 400 }
    );
  }

  const { token, tokenHash, prefix } = generatePersonalAccessToken();

  const created = await prisma.personalAccessToken.create({
    data: {
      userId: user.id,
      name: validation.data.name,
      tokenHash,
      prefix,
      scopes: ["*"],
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      scopes: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });

  // The raw token is included in the response exactly once. Clients must
  // surface it immediately and discard it — there is no way to retrieve it
  // again later.
  return NextResponse.json(
    { token, personalAccessToken: created },
    { status: 201 }
  );
}
