import {
  Priority,
  Role,
  SystemRole,
  ThemePreference,
  VulnSeverity,
  VulnStatus,
  ExploitStatus,
} from "@prisma/client";

export type {
  Priority,
  Role,
  SystemRole,
  ThemePreference,
  VulnSeverity,
  VulnStatus,
  ExploitStatus,
};

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: SystemRole;
  /**
   * Optional because not every Prisma `select` includes this column —
   * components that need it (the theme provider, profile page) read it
   * from the auth-aware API which always selects it. Defaults to SYSTEM.
   */
  themePreference?: ThemePreference;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    tasks: number;
    members: number;
  };
}

export interface ProjectWithMembers extends Project {
  members: ProjectMember[];
  statuses: Status[];
}

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: Role;
  createdAt: Date;
  user: User;
}

export interface Status {
  id: string;
  name: string;
  order: number;
  projectId: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  key: string;
  priority: Priority;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  statusId: string;
  assigneeId: string | null;
  creatorId: string;
  assignee?: User | null;
  creator?: User;
  status?: Status;
}

export interface BoardColumn {
  status: Status;
  tasks: Task[];
}

export interface Vulnerability {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  cveId: string | null;
  ghsaId: string | null;
  severity: VulnSeverity;
  cvssScore: number | null;
  cvssVector: string | null;
  exploitStatus: ExploitStatus;
  affectedComponent: string | null;
  affectedVersions: string | null;
  fixedVersion: string | null;
  status: VulnStatus;
  reportedAt: Date;
  patchedAt: Date | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  reporterId: string;
  assigneeId: string | null;
  reporter?: User;
  assignee?: User | null;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
