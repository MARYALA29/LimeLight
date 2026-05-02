"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateProjectSchema,
  UpdateProjectInput,
  addMemberSchema,
  AddMemberInput,
} from "@/lib/validations";
import { Avatar, Badge, Button, Input, Textarea, Select } from "@/components/ui";
import { User } from "@/types";

interface ProjectMemberData {
  id: string;
  role: "ADMIN" | "MEMBER";
  userId: string;
  user: User;
}

interface ProjectData {
  id: string;
  name: string;
  key: string;
  description: string | null;
  members: ProjectMemberData[];
}

export default function SettingsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [me, setMe] = useState<User | null>(null);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [projectError, setProjectError] = useState("");
  const [projectSuccess, setProjectSuccess] = useState("");
  const [memberError, setMemberError] = useState("");
  const [memberSuccess, setMemberSuccess] = useState("");
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);

  const {
    register: registerProject,
    handleSubmit: handleSubmitProject,
    formState: { errors: projectErrors },
    reset: resetProject,
  } = useForm<UpdateProjectInput>({
    resolver: zodResolver(updateProjectSchema),
  });

  const {
    register: registerMember,
    handleSubmit: handleSubmitMember,
    formState: { errors: memberErrors },
    reset: resetMember,
  } = useForm<AddMemberInput>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { role: "MEMBER" },
  });

  useEffect(() => {
    if (!params.id) return;
    const fetchData = async () => {
      try {
        const [meRes, projectRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch(`/api/projects/${params.id}`),
        ]);

        if (!projectRes.ok) {
          setLoadError("Unable to load project");
          setIsLoading(false);
          return;
        }

        const meData = await meRes.json();
        const projectData = await projectRes.json();

        setMe(meData.user);
        setProject(projectData.project);
        resetProject({
          name: projectData.project.name,
          description: projectData.project.description ?? "",
        });
      } catch {
        setLoadError("Unable to load project");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [params.id, resetProject]);

  const onSubmitProject = async (data: UpdateProjectInput) => {
    if (!project) return;
    setIsSavingProject(true);
    setProjectError("");
    setProjectSuccess("");

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        setProjectError(result.error || "Failed to update project");
        return;
      }
      setProject({ ...project, ...result.project });
      setProjectSuccess("Project updated");
    } catch {
      setProjectError("An error occurred. Please try again.");
    } finally {
      setIsSavingProject(false);
    }
  };

  const onSubmitMember = async (data: AddMemberInput) => {
    if (!project) return;
    setIsAddingMember(true);
    setMemberError("");
    setMemberSuccess("");

    try {
      const res = await fetch(`/api/projects/${project.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        setMemberError(result.error || "Failed to add member");
        return;
      }
      setProject({ ...project, members: [...project.members, result.member] });
      setMemberSuccess(`Added ${result.member.user.name} to the project`);
      resetMember({ email: "", role: "MEMBER" });
    } catch {
      setMemberError("An error occurred. Please try again.");
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: "ADMIN" | "MEMBER") => {
    if (!project) return;
    setMemberError("");

    try {
      const res = await fetch(`/api/projects/${project.id}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const result = await res.json();
      if (!res.ok) {
        setMemberError(result.error || "Failed to update role");
        return;
      }
      setProject({
        ...project,
        members: project.members.map((m) => (m.id === memberId ? result.member : m)),
      });
    } catch {
      setMemberError("An error occurred. Please try again.");
    }
  };

  const handleRemoveMember = async (memberId: string, name: string) => {
    if (!project) return;
    if (!confirm(`Remove ${name} from this project?`)) return;
    setMemberError("");

    try {
      const res = await fetch(`/api/projects/${project.id}/members/${memberId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const result = await res.json();
        setMemberError(result.error || "Failed to remove member");
        return;
      }
      setProject({
        ...project,
        members: project.members.filter((m) => m.id !== memberId),
      });
    } catch {
      setMemberError("An error occurred. Please try again.");
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    if (
      !confirm(
        `Delete project "${project.name}"? This cannot be undone and will remove all tasks and members.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) {
        const result = await res.json();
        setProjectError(result.error || "Failed to delete project");
        return;
      }
      router.push("/projects");
    } catch {
      setProjectError("An error occurred. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (loadError || !project || !me) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-600">
          {loadError || "Project not found"}
        </div>
      </div>
    );
  }

  const myMembership = project.members.find((m) => m.userId === me.id);
  const isAdmin = myMembership?.role === "ADMIN";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/projects" className="hover:text-orange-500 transition-colors">
          Projects
        </Link>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link
          href={`/projects/${project.id}`}
          className="hover:text-orange-500 transition-colors"
        >
          {project.name}
        </Link>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-orange-500 font-medium">Settings</span>
      </div>

      {/* Project info */}
      <div className="bg-white rounded-2xl border border-orange-100 shadow-sm">
        <div className="border-b border-orange-100 px-8 py-6">
          <h2 className="text-xl font-bold text-gray-900">Project Information</h2>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin
              ? "Update your project's name and description"
              : "Only project admins can edit these details"}
          </p>
        </div>

        <form onSubmit={handleSubmitProject(onSubmitProject)} className="p-8 space-y-4">
          {projectError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {projectError}
            </div>
          )}
          {projectSuccess && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-700">
              {projectSuccess}
            </div>
          )}

          <Input
            id="project-name"
            label="Project Name"
            disabled={!isAdmin}
            error={projectErrors.name?.message}
            {...registerProject("name")}
          />
          <Textarea
            id="project-description"
            label="Description"
            disabled={!isAdmin}
            error={projectErrors.description?.message}
            {...registerProject("description")}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Project Key
            </label>
            <p className="text-sm text-gray-900 font-mono">{project.key}</p>
            <p className="text-xs text-gray-400 mt-0.5">Project key cannot be changed</p>
          </div>

          {isAdmin && (
            <div className="flex justify-end pt-2">
              <Button type="submit" isLoading={isSavingProject}>
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </div>

      {/* Members */}
      <div className="bg-white rounded-2xl border border-orange-100 shadow-sm">
        <div className="border-b border-orange-100 px-8 py-6">
          <h2 className="text-xl font-bold text-gray-900">Members</h2>
          <p className="text-sm text-gray-500 mt-1">
            {project.members.length} {project.members.length === 1 ? "person" : "people"}{" "}
            with access
          </p>
        </div>

        <div className="p-8 space-y-4">
          {memberError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {memberError}
            </div>
          )}
          {memberSuccess && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-700">
              {memberSuccess}
            </div>
          )}

          {isAdmin && (
            <form
              onSubmit={handleSubmitMember(onSubmitMember)}
              className="rounded-xl border border-orange-100 bg-orange-50/50 p-4"
            >
              <p className="text-sm font-medium text-gray-700 mb-3">Invite a teammate</p>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_auto] gap-3 items-end">
                <Input
                  id="member-email"
                  label="Email"
                  placeholder="someone@example.com"
                  error={memberErrors.email?.message}
                  {...registerMember("email")}
                />
                <Select
                  id="member-role"
                  label="Role"
                  options={[
                    { value: "MEMBER", label: "Member" },
                    { value: "ADMIN", label: "Admin" },
                  ]}
                  {...registerMember("role")}
                />
                <Button type="submit" isLoading={isAddingMember}>
                  Add Member
                </Button>
              </div>
            </form>
          )}

          <div className="divide-y divide-orange-50">
            {project.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={member.user.name} src={member.user.avatarUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.user.name}
                      {member.userId === me.id && (
                        <span className="ml-2 text-xs text-gray-400">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{member.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin && member.userId !== me.id ? (
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleRoleChange(
                          member.id,
                          e.target.value as "ADMIN" | "MEMBER"
                        )
                      }
                      className="rounded-lg border border-orange-200 bg-white px-2 py-1 text-xs text-gray-700 focus:border-orange-500 focus:outline-none"
                      aria-label={`Change role for ${member.user.name}`}
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  ) : (
                    <Badge
                      className={
                        member.role === "ADMIN"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-700"
                      }
                    >
                      {member.role === "ADMIN" ? "Admin" : "Member"}
                    </Badge>
                  )}

                  {isAdmin && member.userId !== me.id && (
                    <button
                      onClick={() => handleRemoveMember(member.id, member.user.name)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      aria-label={`Remove ${member.user.name}`}
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Danger zone */}
      {isAdmin && (
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm">
          <div className="border-b border-red-100 px-8 py-6">
            <h2 className="text-xl font-bold text-red-700">Danger Zone</h2>
            <p className="text-sm text-gray-500 mt-1">
              Deleting a project removes all tasks and member associations
            </p>
          </div>
          <div className="p-8 flex justify-end">
            <Button type="button" variant="danger" onClick={handleDeleteProject}>
              Delete Project
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
