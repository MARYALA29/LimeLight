/**
 * @jest-environment node
 *
 * Validates that the OpenAPI registry produces a spec covering every public
 * route surface and that the spec stays in lockstep with the Zod validators
 * (request/response schemas referenced via $ref under components.schemas).
 */
import { buildOpenApiSpec } from "@/lib/openapi/build-spec";

describe("OpenAPI registry", () => {
  const spec = buildOpenApiSpec();

  it("declares OpenAPI 3.1.x", () => {
    expect(typeof spec.openapi).toBe("string");
    expect(spec.openapi.startsWith("3.1")).toBe(true);
  });

  it("includes the standard info block", () => {
    expect(spec.info).toBeDefined();
    expect(spec.info.title).toBe("LimeLight API");
    expect(typeof spec.info.version).toBe("string");
    expect(spec.info.version.length).toBeGreaterThan(0);
  });

  it("documents the expected route surface", () => {
    const expected = [
      "/api/auth/register",
      "/api/auth/login",
      "/api/auth/logout",
      "/api/auth/me",
      "/api/auth/change-password",
      "/api/users/me/tokens",
      "/api/users/me/tokens/{id}",
      "/api/users/me/preferences",
      "/api/projects",
      "/api/projects/{id}",
      "/api/projects/{id}/members",
      "/api/projects/{id}/members/{memberId}",
      "/api/projects/{id}/tasks",
      "/api/tasks/{id}",
      "/api/tasks/{id}/move",
      "/api/projects/{id}/vulnerabilities",
      "/api/projects/{id}/vulnerabilities/{vulnId}",
      "/api/version",
      "/api/openapi.json",
    ];

    for (const path of expected) {
      expect(spec.paths?.[path]).toBeDefined();
    }
  });

  it("registers each Zod schema under components.schemas", () => {
    const expectedSchemas = [
      "RegisterInput",
      "LoginInput",
      "UpdateProfileInput",
      "ChangePasswordInput",
      "AddMemberInput",
      "UpdateMemberInput",
      "CreateProjectInput",
      "UpdateProjectInput",
      "CreateTaskInput",
      "UpdateTaskInput",
      "MoveTaskInput",
      "CreateStatusInput",
      "UpdateStatusInput",
      "CreateVulnerabilityInput",
      "UpdateVulnerabilityInput",
      "CreatePATInput",
    ];

    const components = spec.components ?? {};
    const schemas = (components as { schemas?: Record<string, unknown> }).schemas ?? {};

    for (const name of expectedSchemas) {
      expect(schemas[name]).toBeDefined();
    }
  });

  it("declares both bearer and cookie security schemes", () => {
    const components = spec.components ?? {};
    const securitySchemes =
      (components as { securitySchemes?: Record<string, unknown> }).securitySchemes ??
      {};

    expect(securitySchemes.bearerAuth).toBeDefined();
    expect(securitySchemes.cookieAuth).toBeDefined();
  });

  it("requires cookie auth (only) for PAT-management endpoints", () => {
    const tokenPaths = [
      "/api/users/me/tokens",
      "/api/users/me/tokens/{id}",
    ];

    for (const path of tokenPaths) {
      const ops = spec.paths?.[path] as Record<string, { security?: Array<Record<string, unknown>> }>;
      expect(ops).toBeDefined();
      const operations = Object.values(ops).filter(
        (op): op is { security: Array<Record<string, unknown>> } =>
          typeof op === "object" && op !== null && "security" in op
      );
      expect(operations.length).toBeGreaterThan(0);
      for (const op of operations) {
        // every security entry must reference cookieAuth, never bearerAuth
        for (const entry of op.security) {
          expect(Object.keys(entry)).toContain("cookieAuth");
          expect(Object.keys(entry)).not.toContain("bearerAuth");
        }
      }
    }
  });

  it("references a Zod-derived schema by $ref in at least one request body", () => {
    const registerOp = (spec.paths?.["/api/auth/register"] as Record<string, unknown>)
      ?.post as
      | {
          requestBody?: {
            content?: { "application/json"?: { schema?: { $ref?: string } } };
          };
        }
      | undefined;

    const ref = registerOp?.requestBody?.content?.["application/json"]?.schema?.$ref;
    expect(ref).toBe("#/components/schemas/RegisterInput");
  });
});
