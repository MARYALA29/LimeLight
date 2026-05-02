import { z } from "zod";

// Auth validations
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Project validations
export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  key: z
    .string()
    .min(2, "Key must be at least 2 characters")
    .max(10, "Key must be at most 10 characters")
    .regex(/^[A-Z]+$/, "Key must be uppercase letters only"),
  description: z.string().max(500, "Description too long").optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long").optional(),
  description: z.string().max(500, "Description too long").optional(),
});

// Task validations
export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(2000, "Description too long").optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  statusId: z.string().optional(),
  assigneeId: z.string().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long").optional(),
  description: z.string().max(2000, "Description too long").optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  statusId: z.string().optional(),
  assigneeId: z.string().optional().nullable(),
});

export const moveTaskSchema = z.object({
  statusId: z.string(),
  order: z.number().int().min(0),
});

// Status validations
export const createStatusSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
});

export const updateStatusSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long").optional(),
  order: z.number().int().min(0).optional(),
});

// Member validations
export const addMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "MEMBER"]).optional(),
});

export const updateMemberSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"], {
    errorMap: () => ({ message: "Role must be ADMIN or MEMBER" }),
  }),
});

// Profile validations
export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name too long"),
    avatarUrl: z
      .string()
      .url("Invalid URL")
      .or(z.literal(""))
      .optional()
      .nullable(),
  })
  .strip();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmNewPassword: z.string().min(1, "Please confirm the new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

// Vulnerability validations
const VULN_SEVERITY = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const VULN_STATUS = [
  "OPEN",
  "TRIAGED",
  "IN_PROGRESS",
  "PATCHED",
  "VERIFIED",
  "WONT_FIX",
  "DUPLICATE",
] as const;
const EXPLOIT_STATUS = ["UNKNOWN", "THEORETICAL", "POC", "IN_THE_WILD"] as const;

// CVE ids look like CVE-YYYY-NNNNN+ (year, 4-digit min sequence). GHSA ids
// look like GHSA-xxxx-xxxx-xxxx (alphanumeric quartets).
const CVE_REGEX = /^CVE-\d{4}-\d{4,}$/;
const GHSA_REGEX = /^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/;

export const createVulnerabilitySchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200, "Title too long"),
    description: z.string().max(5000, "Description too long").optional(),
    severity: z.enum(VULN_SEVERITY, {
      errorMap: () => ({ message: "Severity must be LOW, MEDIUM, HIGH, or CRITICAL" }),
    }),
    cveId: z.string().regex(CVE_REGEX, "Invalid CVE id format").optional(),
    ghsaId: z.string().regex(GHSA_REGEX, "Invalid GHSA id format").optional(),
    cvssScore: z
      .number()
      .min(0, "CVSS score must be at least 0")
      .max(10, "CVSS score must be at most 10")
      .optional(),
    cvssVector: z.string().max(200).optional(),
    exploitStatus: z.enum(EXPLOIT_STATUS).optional(),
    affectedComponent: z.string().max(200).optional(),
    affectedVersions: z.string().max(100).optional(),
    fixedVersion: z.string().max(100).optional(),
    assigneeId: z.string().optional().nullable(),
  })
  .strip();

export const updateVulnerabilitySchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional().nullable(),
    severity: z.enum(VULN_SEVERITY).optional(),
    cveId: z.string().regex(CVE_REGEX, "Invalid CVE id format").optional().nullable(),
    ghsaId: z.string().regex(GHSA_REGEX, "Invalid GHSA id format").optional().nullable(),
    cvssScore: z.number().min(0).max(10).optional().nullable(),
    cvssVector: z.string().max(200).optional().nullable(),
    exploitStatus: z.enum(EXPLOIT_STATUS).optional(),
    affectedComponent: z.string().max(200).optional().nullable(),
    affectedVersions: z.string().max(100).optional().nullable(),
    fixedVersion: z.string().max(100).optional().nullable(),
    status: z.enum(VULN_STATUS).optional(),
    assigneeId: z.string().optional().nullable(),
  })
  .strip();

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type CreateStatusInput = z.infer<typeof createStatusSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateVulnerabilityInput = z.infer<typeof createVulnerabilitySchema>;
export type UpdateVulnerabilityInput = z.infer<typeof updateVulnerabilitySchema>;
