/**
 * @jest-environment node
 *
 * Coverage gate: every `route.ts` under `src/app/api/**` must have an
 * OpenAPI registration. Walking the directory tree gives us a single source
 * of truth — adding a new route handler without registering it in
 * `src/lib/openapi/registry.ts` will break this test.
 */
import fs from "node:fs";
import path from "node:path";
import { buildOpenApiSpec } from "@/lib/openapi/build-spec";

const API_ROOT = path.join(process.cwd(), "src", "app", "api");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (entry.isFile() && entry.name === "route.ts") {
      out.push(full);
    }
  }
  return out;
}

/**
 * Convert a filesystem path under src/app/api to the OpenAPI path string.
 *   .../api/projects/[id]/tasks/route.ts  ->  /api/projects/{id}/tasks
 *   .../api/openapi.json/route.ts         ->  /api/openapi.json
 */
function toOpenApiPath(routeFile: string): string {
  const rel = path.relative(API_ROOT, path.dirname(routeFile));
  const segments = rel.split(path.sep).map((segment) => {
    if (segment.startsWith("[") && segment.endsWith("]")) {
      return `{${segment.slice(1, -1)}}`;
    }
    return segment;
  });
  return ["/api", ...segments].join("/");
}

describe("OpenAPI route coverage", () => {
  const spec = buildOpenApiSpec();
  const documentedPaths = new Set(Object.keys(spec.paths ?? {}));

  const routeFiles = walk(API_ROOT);

  it("finds every route.ts file under src/app/api", () => {
    expect(routeFiles.length).toBeGreaterThan(0);
  });

  it.each(routeFiles.map((f) => [toOpenApiPath(f), f]))(
    "registers OpenAPI metadata for %s",
    (openapiPath) => {
      expect(documentedPaths.has(openapiPath)).toBe(true);
    }
  );
});
