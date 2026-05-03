/**
 * Authentication helpers that accept either a session cookie or a Personal
 * Access Token (PAT) via the `Authorization: Bearer <token>` header.
 *
 * Existing route handlers can opt in by replacing `getCurrentUser()` with
 * `getCurrentUserOrPATUser(request)`. PAT-management endpoints should NOT
 * use this helper — they require a session cookie so a stolen PAT can't
 * mint or revoke other tokens.
 */

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { TOKEN_PREFIX, hashToken, verifyTokenAgainstHash } from "@/lib/pat";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: "USER" | "ADMIN";
  createdAt: Date;
};

export interface AuthResult {
  user: AuthenticatedUser;
  /** True when the request was authenticated by a PAT instead of a session cookie. */
  viaPAT: boolean;
  /** The PAT id, present only when `viaPAT === true`. */
  tokenId?: string;
}

/** Debounce window for `lastUsedAt` updates: at most one DB write per token per minute. */
const LAST_USED_DEBOUNCE_MS = 60_000;

/**
 * Per-process in-memory map: tokenId -> last time we wrote `lastUsedAt`.
 * Best-effort across a single Node process; if the process restarts we may
 * write twice in one minute, which is fine.
 */
const lastUsedWriteCache = new Map<string, number>();

/** Test-only — clear the debounce cache between tests. */
export function __resetPATLastUsedCacheForTests() {
  lastUsedWriteCache.clear();
}

function extractBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization") ?? request.headers.get("Authorization");
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const candidate = match[1].trim();
  if (!candidate.startsWith(TOKEN_PREFIX)) return null;
  return candidate;
}

async function authenticateViaPAT(token: string): Promise<AuthResult | null> {
  const tokenHash = hashToken(token);

  const record = await prisma.personalAccessToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
        },
      },
    },
  });

  if (!record) return null;
  if (record.revokedAt) return null;
  // Belt-and-suspenders: verify with a constant-time compare even though we
  // matched on the hash. Guards against a future where the lookup is changed.
  if (!verifyTokenAgainstHash(token, record.tokenHash)) return null;

  // Debounced lastUsedAt update — at most once per minute per token.
  const now = Date.now();
  const lastWrite = lastUsedWriteCache.get(record.id) ?? 0;
  if (now - lastWrite >= LAST_USED_DEBOUNCE_MS) {
    lastUsedWriteCache.set(record.id, now);
    // Fire-and-forget; we don't want to fail the request if this update fails.
    try {
      const updateResult = prisma.personalAccessToken.update({
        where: { id: record.id },
        data: { lastUsedAt: new Date(now) },
      });
      if (
        updateResult &&
        typeof (updateResult as Promise<unknown>).catch === "function"
      ) {
        (updateResult as Promise<unknown>).catch(() => {
          lastUsedWriteCache.delete(record.id);
        });
      }
    } catch {
      lastUsedWriteCache.delete(record.id);
    }
  }

  return {
    user: record.user as AuthenticatedUser,
    viaPAT: true,
    tokenId: record.id,
  };
}

/**
 * Resolve the current user from either a session cookie OR a PAT in the
 * `Authorization: Bearer ...` header. Session cookie takes precedence —
 * a logged-in user with a PAT in the header still authenticates as a
 * session user (so PAT-mgmt endpoints that check `viaPAT` see false).
 */
export async function getCurrentUserOrPATUser(
  request: NextRequest
): Promise<AuthResult | null> {
  const sessionUser = await getCurrentUser();
  if (sessionUser) {
    return { user: sessionUser as AuthenticatedUser, viaPAT: false };
  }

  const bearer = extractBearerToken(request);
  if (!bearer) return null;
  return authenticateViaPAT(bearer);
}
