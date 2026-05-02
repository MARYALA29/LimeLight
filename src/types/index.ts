import { Priority, Role, SystemRole } from "@prisma/client";

export type { Priority, Role, SystemRole };

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: SystemRole;
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

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
