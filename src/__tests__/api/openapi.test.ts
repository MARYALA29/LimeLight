/**
 * @jest-environment node
 */
import { GET } from "@/app/api/openapi.json/route";
import pkg from "../../../package.json";

describe("GET /api/openapi.json", () => {
  it("returns 200 with application/json content type", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const ct = response.headers.get("content-type") ?? "";
    expect(ct.toLowerCase()).toContain("application/json");
  });

  it("includes a public cache-control header", async () => {
    const response = await GET();
    const cc = response.headers.get("cache-control") ?? "";
    expect(cc).toContain("public");
    expect(cc).toContain("max-age=60");
  });

  it("returns a 3.x OpenAPI document with the LimeLight title and a non-empty version", async () => {
    const response = await GET();
    const body = await response.json();

    expect(typeof body.openapi).toBe("string");
    expect(body.openapi.startsWith("3.")).toBe(true);
    expect(body.info.title).toBe("LimeLight API");
    expect(typeof body.info.version).toBe("string");
    expect(body.info.version.length).toBeGreaterThan(0);
    expect(body.info.version).toBe(pkg.version);
  });
});
