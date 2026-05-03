/**
 * Builds the LimeLight OpenAPI 3.1 document. Pulls the registered schemas
 * + paths out of `registry.ts` and runs them through the v3.1 generator.
 *
 * The version field is sourced from `package.json` so the docs stay in
 * lockstep with `/api/version`.
 */
import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";

import pkg from "../../../package.json";
import { createRegistry } from "./registry";

export interface BuiltSpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths?: Record<string, unknown>;
  components?: {
    schemas?: Record<string, unknown>;
    securitySchemes?: Record<string, unknown>;
  };
  tags?: Array<{ name: string; description?: string }>;
  servers?: Array<{ url: string; description?: string }>;
  [key: string]: unknown;
}

export function buildOpenApiSpec(): BuiltSpec {
  const registry = createRegistry();
  const generator = new OpenApiGeneratorV31(registry.definitions);

  const document = generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "LimeLight API",
      version: pkg.version,
      description:
        "REST API for the LimeLight task-management application. Authenticate with a session cookie (`auth-token`) or a Personal Access Token (`Authorization: Bearer ll_pat_…`). PAT-management endpoints (under `/api/users/me/tokens*`) require the session cookie — a stolen PAT cannot mint or revoke tokens.",
    },
    servers: [
      {
        url: "/",
        description: "Same-origin (relative URLs)",
      },
    ],
    tags: [
      { name: "Auth", description: "Sign-up, sign-in, profile" },
      { name: "Tokens", description: "Personal Access Tokens (cookie-only)" },
      { name: "Projects", description: "Project CRUD" },
      { name: "Members", description: "Project membership management" },
      { name: "Tasks", description: "Task CRUD + drag-and-drop ordering" },
      {
        name: "Vulnerabilities",
        description: "Security tracking per project",
      },
      { name: "System", description: "Diagnostics + spec" },
    ],
  }) as BuiltSpec;

  return document;
}
