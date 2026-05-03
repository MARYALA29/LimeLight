/**
 * Single source of truth for the LimeLight OpenAPI document.
 *
 * Walks the existing Zod validators in `@/lib/validations` and registers
 * each as a named component schema. Then walks every public API route and
 * registers it with the request body / parameter / response shapes it
 * actually accepts.
 *
 * IMPORTANT: any new Zod validator or new `route.ts` under `src/app/api`
 * MUST be wired up here. The Jest coverage gate in
 * `src/__tests__/lib/openapi/coverage.test.ts` walks the filesystem and
 * fails CI when a route has no registration.
 */
import {
  OpenAPIRegistry,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import {
  addMemberSchema,
  changePasswordSchema,
  createPATSchema,
  createProjectSchema,
  createStatusSchema,
  createTaskSchema,
  createVulnerabilitySchema,
  loginSchema,
  moveTaskSchema,
  registerSchema,
  updateMemberSchema,
  updateProfileSchema,
  updateProjectSchema,
  updateStatusSchema,
  updateTaskSchema,
  updateVulnerabilitySchema,
} from "@/lib/validations";

// Bolt OpenAPI metadata helpers onto Zod. Calling this is idempotent.
extendZodWithOpenApi(z);

// ---------------------------------------------------------------------------
// Shared response shapes used by many routes. These don't have a Zod
// validator counterpart in the codebase yet (responses aren't validated at
// runtime), so we define lightweight schemas here purely for documentation.
// ---------------------------------------------------------------------------

const ErrorResponseSchema = z
  .object({ error: z.string() })
  .openapi("ErrorResponse");

const SuccessResponseSchema = z
  .object({ success: z.boolean() })
  .openapi("SuccessResponse");

const UserSchema = z
  .object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
    avatarUrl: z.string().url().nullable().optional(),
    role: z.string().optional(),
    themePreference: z.enum(["LIGHT", "DARK", "SYSTEM"]).optional(),
    createdAt: z.string().datetime().optional(),
  })
  .openapi("User");

const ProjectSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    key: z.string(),
    description: z.string().nullable().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi("Project");

const StatusSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    order: z.number().int(),
    projectId: z.string(),
  })
  .openapi("Status");

const TaskSchema = z
  .object({
    id: z.string(),
    key: z.string(),
    title: z.string(),
    description: z.string().nullable().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    order: z.number().int(),
    projectId: z.string(),
    statusId: z.string(),
    creatorId: z.string(),
    assigneeId: z.string().nullable().optional(),
    status: StatusSchema.optional(),
    creator: UserSchema.optional(),
    assignee: UserSchema.nullable().optional(),
  })
  .openapi("Task");

const ProjectMemberSchema = z
  .object({
    id: z.string(),
    projectId: z.string(),
    userId: z.string(),
    role: z.enum(["ADMIN", "MEMBER"]),
    user: UserSchema.optional(),
  })
  .openapi("ProjectMember");

const VulnerabilitySchema = z
  .object({
    id: z.string(),
    projectId: z.string(),
    title: z.string(),
    description: z.string().nullable().optional(),
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    status: z.enum([
      "OPEN",
      "TRIAGED",
      "IN_PROGRESS",
      "PATCHED",
      "VERIFIED",
      "WONT_FIX",
      "DUPLICATE",
    ]),
    cveId: z.string().nullable().optional(),
    ghsaId: z.string().nullable().optional(),
    cvssScore: z.number().nullable().optional(),
    cvssVector: z.string().nullable().optional(),
    exploitStatus: z
      .enum(["UNKNOWN", "THEORETICAL", "POC", "IN_THE_WILD"])
      .optional(),
    affectedComponent: z.string().nullable().optional(),
    affectedVersions: z.string().nullable().optional(),
    fixedVersion: z.string().nullable().optional(),
    reporterId: z.string(),
    assigneeId: z.string().nullable().optional(),
    reportedAt: z.string().datetime(),
    patchedAt: z.string().datetime().nullable().optional(),
    verifiedAt: z.string().datetime().nullable().optional(),
    reporter: UserSchema.optional(),
    assignee: UserSchema.nullable().optional(),
  })
  .openapi("Vulnerability");

const PersonalAccessTokenSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    prefix: z.string(),
    scopes: z.array(z.string()),
    lastUsedAt: z.string().datetime().nullable().optional(),
    createdAt: z.string().datetime(),
  })
  .openapi("PersonalAccessToken");

const VersionResponseSchema = z
  .object({
    version: z.string(),
    commit: z.string(),
    builtAt: z.string().datetime(),
  })
  .openapi("VersionResponse");

// ---------------------------------------------------------------------------
// Update profile schema in `validations.ts` is `.strip()`ed which produces
// a ZodEffects, and update vulnerability is the same. Wrapping with
// `.openapi(...)` works on either, but for the strict types below we cast
// to a normal Zod schema.
// ---------------------------------------------------------------------------

export function createRegistry(): OpenAPIRegistry {
  const registry = new OpenAPIRegistry();

  // -- Security schemes -------------------------------------------------

  registry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "ll_pat_…",
    description:
      "Personal Access Token. Send as `Authorization: Bearer ll_pat_…`.",
  });

  registry.registerComponent("securitySchemes", "cookieAuth", {
    type: "apiKey",
    in: "cookie",
    name: "auth-token",
    description: "Session cookie set by `/api/auth/login`.",
  });

  // -- Reusable named schemas (Zod-derived) -----------------------------
  // `register(name, schema)` returns a wrapped schema whose generated
  // representation is a $ref to `#/components/schemas/${name}`. Use the
  // wrapped value in `requestBody` / `responses` / params to keep paths
  // referencing the named schemas instead of inlining them.

  const RegisterInput = registry.register("RegisterInput", registerSchema);
  const LoginInput = registry.register("LoginInput", loginSchema);
  const UpdateProfileInput = registry.register(
    "UpdateProfileInput",
    updateProfileSchema
  );
  const ChangePasswordInput = registry.register(
    "ChangePasswordInput",
    changePasswordSchema
  );
  const AddMemberInput = registry.register("AddMemberInput", addMemberSchema);
  const UpdateMemberInput = registry.register(
    "UpdateMemberInput",
    updateMemberSchema
  );
  const CreateProjectInput = registry.register(
    "CreateProjectInput",
    createProjectSchema
  );
  const UpdateProjectInput = registry.register(
    "UpdateProjectInput",
    updateProjectSchema
  );
  const CreateTaskInput = registry.register("CreateTaskInput", createTaskSchema);
  const UpdateTaskInput = registry.register("UpdateTaskInput", updateTaskSchema);
  const MoveTaskInput = registry.register("MoveTaskInput", moveTaskSchema);
  // CreateStatusInput / UpdateStatusInput aren't currently wired to a route
  // handler, but they exist in `validations.ts` so we expose them as named
  // schemas anyway.
  registry.register("CreateStatusInput", createStatusSchema);
  registry.register("UpdateStatusInput", updateStatusSchema);
  const CreateVulnerabilityInput = registry.register(
    "CreateVulnerabilityInput",
    createVulnerabilitySchema
  );
  const UpdateVulnerabilityInput = registry.register(
    "UpdateVulnerabilityInput",
    updateVulnerabilitySchema
  );
  const CreatePATInput = registry.register("CreatePATInput", createPATSchema);

  // -- Common helpers ---------------------------------------------------

  const cookieAuth: Array<Record<string, string[]>> = [{ cookieAuth: [] }];
  const bearerOrCookie: Array<Record<string, string[]>> = [
    { bearerAuth: [] },
    { cookieAuth: [] },
  ];

  const jsonBody = <T extends z.ZodTypeAny>(schema: T) => ({
    content: { "application/json": { schema } },
  });

  const errorResponse = (description: string) => ({
    description,
    content: { "application/json": { schema: ErrorResponseSchema } },
  });

  // ===================================================================
  // Auth
  // ===================================================================

  registry.registerPath({
    method: "post",
    path: "/api/auth/register",
    tags: ["Auth"],
    summary: "Register a new user",
    description:
      "Creates a user, sets a session cookie, and returns the user record.",
    request: { body: jsonBody(RegisterInput) },
    responses: {
      200: {
        description: "User created",
        content: {
          "application/json": {
            schema: z.object({ user: UserSchema }),
          },
        },
      },
      400: errorResponse("Validation error or user already exists"),
      500: errorResponse("Internal server error"),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/auth/login",
    tags: ["Auth"],
    summary: "Log in with email + password",
    description:
      "On success, sets the session cookie and returns the user record.",
    request: { body: jsonBody(LoginInput) },
    responses: {
      200: {
        description: "Logged in",
        content: {
          "application/json": {
            schema: z.object({ user: UserSchema }),
          },
        },
      },
      400: errorResponse("Invalid request body"),
      401: errorResponse("Invalid credentials"),
      500: errorResponse("Internal server error"),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/auth/logout",
    tags: ["Auth"],
    summary: "Log out",
    description: "Clears the session cookie.",
    responses: {
      200: {
        description: "Logged out",
        content: {
          "application/json": { schema: SuccessResponseSchema },
        },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/auth/me",
    tags: ["Auth"],
    summary: "Get the currently authenticated user",
    description:
      "Accepts either a session cookie or a PAT in the Authorization header.",
    security: bearerOrCookie,
    responses: {
      200: {
        description: "Current user",
        content: {
          "application/json": {
            schema: z.object({ user: UserSchema }),
          },
        },
      },
      401: errorResponse("Unauthorized"),
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/auth/me",
    tags: ["Auth"],
    summary: "Update the current user's profile",
    description:
      "Session-only. PAT auth cannot change a user's display name, avatar URL, or theme preference.",
    security: cookieAuth,
    request: { body: jsonBody(UpdateProfileInput) },
    responses: {
      200: {
        description: "Updated user",
        content: {
          "application/json": {
            schema: z.object({ user: UserSchema }),
          },
        },
      },
      400: errorResponse("Validation error"),
      401: errorResponse("Unauthorized"),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/auth/change-password",
    tags: ["Auth"],
    summary: "Change the current user's password",
    description: "Requires the current password to authorize the change.",
    security: cookieAuth,
    request: { body: jsonBody(ChangePasswordInput) },
    responses: {
      200: {
        description: "Password changed",
        content: {
          "application/json": { schema: SuccessResponseSchema },
        },
      },
      400: errorResponse("Validation error or wrong current password"),
      401: errorResponse("Unauthorized"),
      404: errorResponse("User not found"),
      500: errorResponse("Internal server error"),
    },
  });

  // ===================================================================
  // Personal Access Tokens
  // ===================================================================
  // PAT-management endpoints are intentionally cookie-only — a stolen PAT
  // must not be able to mint or revoke tokens.

  registry.registerPath({
    method: "get",
    path: "/api/users/me/tokens",
    tags: ["Tokens"],
    summary: "List the current user's active PATs",
    description:
      "Cookie auth only — PATs cannot list tokens (security: revocation must be meaningful).",
    security: cookieAuth,
    responses: {
      200: {
        description: "Active tokens",
        content: {
          "application/json": {
            schema: z.object({
              personalAccessTokens: z.array(PersonalAccessTokenSchema),
            }),
          },
        },
      },
      401: errorResponse("Unauthorized"),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/users/me/tokens",
    tags: ["Tokens"],
    summary: "Create a new PAT",
    description:
      "Cookie auth only. Returns the raw token exactly once — clients must surface it immediately.",
    security: cookieAuth,
    request: { body: jsonBody(CreatePATInput) },
    responses: {
      201: {
        description: "Token created",
        content: {
          "application/json": {
            schema: z.object({
              token: z.string(),
              personalAccessToken: PersonalAccessTokenSchema,
            }),
          },
        },
      },
      400: errorResponse("Validation error or invalid JSON body"),
      401: errorResponse("Unauthorized"),
      429: errorResponse("Rate limit exceeded"),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/users/me/tokens/{id}",
    tags: ["Tokens"],
    summary: "Revoke a PAT",
    description: "Cookie auth only. Soft-deletes the token by setting `revokedAt`.",
    security: cookieAuth,
    request: {
      params: z.object({
        id: z.string().openapi({
          description: "ID of the PAT to revoke",
          example: "ckxyz123",
        }),
      }),
    },
    responses: {
      200: {
        description: "Token revoked",
        content: {
          "application/json": { schema: SuccessResponseSchema },
        },
      },
      401: errorResponse("Unauthorized"),
      404: errorResponse("Token not found"),
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/users/me/preferences",
    tags: ["Tokens"],
    summary: "Update the current user's theme preference",
    description: "Updates only the theme preference field. Session-only.",
    security: cookieAuth,
    request: {
      body: jsonBody(
        z
          .object({
            themePreference: z.enum(["LIGHT", "DARK", "SYSTEM"]),
          })
          .openapi("UpdateThemePreferenceInput")
      ),
    },
    responses: {
      200: {
        description: "Updated user",
        content: {
          "application/json": {
            schema: z.object({ user: UserSchema }),
          },
        },
      },
      400: errorResponse("Validation error"),
      401: errorResponse("Unauthorized"),
    },
  });

  // ===================================================================
  // Projects
  // ===================================================================

  registry.registerPath({
    method: "get",
    path: "/api/projects",
    tags: ["Projects"],
    summary: "List projects the current user is a member of",
    security: cookieAuth,
    responses: {
      200: {
        description: "Projects list",
        content: {
          "application/json": {
            schema: z.object({ projects: z.array(ProjectSchema) }),
          },
        },
      },
      401: errorResponse("Unauthorized"),
      500: errorResponse("Internal server error"),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/projects",
    tags: ["Projects"],
    summary: "Create a project",
    description:
      "Adds the creator as an ADMIN and seeds default statuses (To Do / In Progress / Done).",
    security: cookieAuth,
    request: { body: jsonBody(CreateProjectInput) },
    responses: {
      201: {
        description: "Project created",
        content: {
          "application/json": {
            schema: z.object({ project: ProjectSchema }),
          },
        },
      },
      400: errorResponse("Validation error or duplicate project key"),
      401: errorResponse("Unauthorized"),
      500: errorResponse("Internal server error"),
    },
  });

  const projectIdParam = z.object({
    id: z.string().openapi({ description: "Project ID" }),
  });

  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}",
    tags: ["Projects"],
    summary: "Get a project by ID",
    security: cookieAuth,
    request: { params: projectIdParam },
    responses: {
      200: {
        description: "Project",
        content: {
          "application/json": {
            schema: z.object({ project: ProjectSchema }),
          },
        },
      },
      401: errorResponse("Unauthorized"),
      404: errorResponse("Project not found"),
      500: errorResponse("Internal server error"),
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/projects/{id}",
    tags: ["Projects"],
    summary: "Update a project",
    description: "Requires ADMIN role on the project.",
    security: cookieAuth,
    request: {
      params: projectIdParam,
      body: jsonBody(UpdateProjectInput),
    },
    responses: {
      200: {
        description: "Project updated",
        content: {
          "application/json": {
            schema: z.object({ project: ProjectSchema }),
          },
        },
      },
      400: errorResponse("Validation error"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Not authorized to update this project"),
      500: errorResponse("Internal server error"),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/projects/{id}",
    tags: ["Projects"],
    summary: "Delete a project",
    description: "Requires ADMIN role on the project.",
    security: cookieAuth,
    request: { params: projectIdParam },
    responses: {
      200: {
        description: "Project deleted",
        content: {
          "application/json": { schema: SuccessResponseSchema },
        },
      },
      401: errorResponse("Unauthorized"),
      403: errorResponse("Not authorized to delete this project"),
      500: errorResponse("Internal server error"),
    },
  });

  // ===================================================================
  // Members
  // ===================================================================

  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/members",
    tags: ["Members"],
    summary: "Add a member to a project",
    description: "Requires ADMIN role on the project.",
    security: cookieAuth,
    request: {
      params: projectIdParam,
      body: jsonBody(AddMemberInput),
    },
    responses: {
      201: {
        description: "Member added",
        content: {
          "application/json": {
            schema: z.object({ member: ProjectMemberSchema }),
          },
        },
      },
      400: errorResponse("Validation error"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Only project admins can add members"),
      404: errorResponse("No user found with that email"),
      409: errorResponse("User is already a member of this project"),
      500: errorResponse("Internal server error"),
    },
  });

  const projectAndMemberParams = z.object({
    id: z.string().openapi({ description: "Project ID" }),
    memberId: z.string().openapi({ description: "Project membership ID" }),
  });

  registry.registerPath({
    method: "patch",
    path: "/api/projects/{id}/members/{memberId}",
    tags: ["Members"],
    summary: "Update a project member's role",
    security: cookieAuth,
    request: {
      params: projectAndMemberParams,
      body: jsonBody(UpdateMemberInput),
    },
    responses: {
      200: {
        description: "Member updated",
        content: {
          "application/json": {
            schema: z.object({ member: ProjectMemberSchema }),
          },
        },
      },
      400: errorResponse("Validation error or last-admin guard"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Only project admins can update members"),
      404: errorResponse("Member not found"),
      500: errorResponse("Internal server error"),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/projects/{id}/members/{memberId}",
    tags: ["Members"],
    summary: "Remove a project member",
    security: cookieAuth,
    request: { params: projectAndMemberParams },
    responses: {
      200: {
        description: "Member removed",
        content: {
          "application/json": { schema: SuccessResponseSchema },
        },
      },
      400: errorResponse("Last-admin guard"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Only project admins can remove members"),
      404: errorResponse("Member not found"),
      500: errorResponse("Internal server error"),
    },
  });

  // ===================================================================
  // Tasks
  // ===================================================================

  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/tasks",
    tags: ["Tasks"],
    summary: "List tasks in a project",
    description:
      "Supports filter query parameters (e.g. assigneeId, statusId, priority). See `parseTaskFilters` for the full set.",
    security: cookieAuth,
    request: {
      params: projectIdParam,
      query: z
        .object({
          assigneeId: z.string().optional(),
          statusId: z.string().optional(),
          priority: z
            .enum(["LOW", "MEDIUM", "HIGH", "URGENT"])
            .optional(),
          mine: z.string().optional().openapi({
            description: "Set to '1' to only show tasks assigned to the caller.",
          }),
        })
        .openapi("TaskListQuery"),
    },
    responses: {
      200: {
        description: "Tasks list",
        content: {
          "application/json": {
            schema: z.object({ tasks: z.array(TaskSchema) }),
          },
        },
      },
      401: errorResponse("Unauthorized"),
      403: errorResponse("Not a member of this project"),
      500: errorResponse("Internal server error"),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/tasks",
    tags: ["Tasks"],
    summary: "Create a task in a project",
    security: cookieAuth,
    request: {
      params: projectIdParam,
      body: jsonBody(CreateTaskInput),
    },
    responses: {
      201: {
        description: "Task created",
        content: {
          "application/json": {
            schema: z.object({ task: TaskSchema }),
          },
        },
      },
      400: errorResponse("Validation error or no status available"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Not a member of this project"),
      404: errorResponse("Project not found"),
      500: errorResponse("Internal server error"),
    },
  });

  const taskIdParam = z.object({
    id: z.string().openapi({ description: "Task ID" }),
  });

  registry.registerPath({
    method: "get",
    path: "/api/tasks/{id}",
    tags: ["Tasks"],
    summary: "Get a task by ID",
    security: cookieAuth,
    request: { params: taskIdParam },
    responses: {
      200: {
        description: "Task",
        content: {
          "application/json": {
            schema: z.object({ task: TaskSchema }),
          },
        },
      },
      401: errorResponse("Unauthorized"),
      404: errorResponse("Task not found"),
      500: errorResponse("Internal server error"),
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/tasks/{id}",
    tags: ["Tasks"],
    summary: "Update a task",
    security: cookieAuth,
    request: {
      params: taskIdParam,
      body: jsonBody(UpdateTaskInput),
    },
    responses: {
      200: {
        description: "Task updated",
        content: {
          "application/json": {
            schema: z.object({ task: TaskSchema }),
          },
        },
      },
      400: errorResponse("Validation error"),
      401: errorResponse("Unauthorized"),
      404: errorResponse("Task not found"),
      500: errorResponse("Internal server error"),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/tasks/{id}",
    tags: ["Tasks"],
    summary: "Delete a task",
    security: cookieAuth,
    request: { params: taskIdParam },
    responses: {
      200: {
        description: "Task deleted",
        content: {
          "application/json": { schema: SuccessResponseSchema },
        },
      },
      401: errorResponse("Unauthorized"),
      404: errorResponse("Task not found"),
      500: errorResponse("Internal server error"),
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/tasks/{id}/move",
    tags: ["Tasks"],
    summary: "Move a task to a new status / order",
    description:
      "Reorders tasks atomically and updates the moved task's status + order.",
    security: cookieAuth,
    request: {
      params: taskIdParam,
      body: jsonBody(MoveTaskInput),
    },
    responses: {
      200: {
        description: "Task moved",
        content: {
          "application/json": {
            schema: z.object({ task: TaskSchema }),
          },
        },
      },
      400: errorResponse("Validation error"),
      401: errorResponse("Unauthorized"),
      404: errorResponse("Task not found"),
      500: errorResponse("Internal server error"),
    },
  });

  // ===================================================================
  // Vulnerabilities
  // ===================================================================

  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/vulnerabilities",
    tags: ["Vulnerabilities"],
    summary: "List vulnerabilities for a project",
    security: cookieAuth,
    request: { params: projectIdParam },
    responses: {
      200: {
        description: "Vulnerabilities list",
        content: {
          "application/json": {
            schema: z.object({
              vulnerabilities: z.array(VulnerabilitySchema),
            }),
          },
        },
      },
      401: errorResponse("Unauthorized"),
      403: errorResponse("Not a member of this project"),
      500: errorResponse("Internal server error"),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/projects/{id}/vulnerabilities",
    tags: ["Vulnerabilities"],
    summary: "Report a new vulnerability",
    description: "Requires ADMIN role on the project.",
    security: cookieAuth,
    request: {
      params: projectIdParam,
      body: jsonBody(CreateVulnerabilityInput),
    },
    responses: {
      201: {
        description: "Vulnerability reported",
        content: {
          "application/json": {
            schema: z.object({ vulnerability: VulnerabilitySchema }),
          },
        },
      },
      400: errorResponse("Validation error"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Only project admins can report vulnerabilities"),
      404: errorResponse("Project not found"),
      500: errorResponse("Internal server error"),
    },
  });

  const projectAndVulnParams = z.object({
    id: z.string().openapi({ description: "Project ID" }),
    vulnId: z.string().openapi({ description: "Vulnerability ID" }),
  });

  registry.registerPath({
    method: "get",
    path: "/api/projects/{id}/vulnerabilities/{vulnId}",
    tags: ["Vulnerabilities"],
    summary: "Get a vulnerability by ID",
    security: cookieAuth,
    request: { params: projectAndVulnParams },
    responses: {
      200: {
        description: "Vulnerability",
        content: {
          "application/json": {
            schema: z.object({ vulnerability: VulnerabilitySchema }),
          },
        },
      },
      401: errorResponse("Unauthorized"),
      403: errorResponse("Not a member of this project"),
      404: errorResponse("Vulnerability not found"),
      500: errorResponse("Internal server error"),
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/projects/{id}/vulnerabilities/{vulnId}",
    tags: ["Vulnerabilities"],
    summary: "Update a vulnerability",
    description:
      "Requires ADMIN role on the project. Status transitions are validated against a state machine.",
    security: cookieAuth,
    request: {
      params: projectAndVulnParams,
      body: jsonBody(UpdateVulnerabilityInput),
    },
    responses: {
      200: {
        description: "Vulnerability updated",
        content: {
          "application/json": {
            schema: z.object({ vulnerability: VulnerabilitySchema }),
          },
        },
      },
      400: errorResponse("Validation error or invalid status transition"),
      401: errorResponse("Unauthorized"),
      403: errorResponse("Only project admins can update vulnerabilities"),
      404: errorResponse("Vulnerability not found"),
      500: errorResponse("Internal server error"),
    },
  });

  // ===================================================================
  // Misc / System
  // ===================================================================

  registry.registerPath({
    method: "get",
    path: "/api/version",
    tags: ["System"],
    summary: "Get the deployed version + commit + build timestamp",
    description: "Public endpoint for diagnostics. No auth required.",
    responses: {
      200: {
        description: "Version info",
        content: {
          "application/json": { schema: VersionResponseSchema },
        },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/openapi.json",
    tags: ["System"],
    summary: "Get the OpenAPI specification for this API",
    description:
      "Returns the OpenAPI 3.1 document describing every public endpoint. No auth required.",
    responses: {
      200: {
        description: "OpenAPI document",
        content: {
          "application/json": {
            schema: z.object({}).passthrough().openapi("OpenApiDocument"),
          },
        },
      },
    },
  });

  return registry;
}
