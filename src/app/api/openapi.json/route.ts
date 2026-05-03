import { NextResponse } from "next/server";
import { buildOpenApiSpec } from "@/lib/openapi/build-spec";

/**
 * Public endpoint that serves the OpenAPI 3.1 document for the LimeLight
 * API. The spec is generated at request time from the Zod validators and
 * route registrations in `@/lib/openapi`. No auth is required so external
 * tooling (Swagger UI, codegen, Postman import) can consume it freely.
 *
 * The document is small and inexpensive to regenerate, but since it only
 * changes when the code changes we set a short public cache-control to
 * keep CDNs / browsers from hammering the function on every page load.
 */
export async function GET() {
  const spec = buildOpenApiSpec();
  return NextResponse.json(spec, {
    headers: {
      "cache-control": "public, max-age=60",
    },
  });
}
