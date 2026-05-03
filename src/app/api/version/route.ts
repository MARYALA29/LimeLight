import { NextResponse } from "next/server";
import pkg from "../../../../package.json";

// Captured at module load time so the timestamp reflects when the server
// process started (build time on a serverless platform), not the time the
// request was handled.
const builtAt = new Date().toISOString();

// Prefer the Vercel-provided commit SHA; fall back to a generic GIT_COMMIT
// env var so non-Vercel deployments can still set this; "unknown" if neither.
const commit =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GIT_COMMIT ||
  "unknown";

const version: string = pkg.version;

export async function GET() {
  return NextResponse.json({
    version,
    commit,
    builtAt,
  });
}
