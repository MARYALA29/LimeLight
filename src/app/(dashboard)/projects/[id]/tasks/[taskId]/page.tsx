"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateTaskSchema, UpdateTaskInput } from "@/lib/validations";
import { Button, Input, Textarea, Select, Avatar, Badge } from "@/components/ui";
import { Task, Status, User } from "@/types";
import { formatDate, getPriorityColor } from "@/lib/utils";

export default function TaskPage() {
  const params = useParams<{ id: string; taskId: string }>();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<UpdateTaskInput>({
    resolver: zodResolver(updateTaskSchema),
  });

  useEffect(() => {
    if (!params.taskId || !params.id) return;

    const fetchData = async () => {
      try {
        // Fetch task
        const taskRes = await fetch(`/api/tasks/${params.taskId}`);
        if (!taskRes.ok) {
          setError("Task not found");
          setIsLoading(false);
          return;
        }
        const taskData = await taskRes.json();
        setTask(taskData.task);
        reset({
          title: taskData.task.title,
          description: taskData.task.description || "",
          priority: taskData.task.priority,
          statusId: taskData.task.statusId,
          assigneeId: taskData.task.assigneeId || "",
        });

        // Fetch project for statuses and members
        const projectRes = await fetch(`/api/projects/${params.id}`);
        if (projectRes.ok) {
          const projectData = await projectRes.json();
          setProjectName(projectData.project.name);
          setStatuses(projectData.project.statuses);
          setMembers(projectData.project.members.map((m: { user: User }) => m.user));
        }
      } catch {
        setError("Failed to load task");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.taskId, params.id, reset]);

  const onSubmit = async (data: UpdateTaskInput) => {
    if (!task) return;
    setIsSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          assigneeId: data.assigneeId || null,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to update task");
        return;
      }

      setTask(result.task);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !params.id) return;
    if (!confirm("Are you sure you want to delete this task?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });

      if (!res.ok) {
        const result = await res.json();
        setError(result.error || "Failed to delete task");
        return;
      }

      router.push(`/projects/${params.id}`);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-orange-100 p-12 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Task not found</h2>
          <p className="text-gray-500 mb-6">The task you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          <Link href={`/projects`}>
            <Button>Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/projects" className="hover:text-orange-500 transition-colors">
          Projects
        </Link>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link href={`/projects/${params.id}`} className="hover:text-orange-500 transition-colors">
          {projectName}
        </Link>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-orange-500 font-medium">{task.key}</span>
      </div>

      <div className="bg-white rounded-2xl border border-orange-100 shadow-sm">
        {/* Header */}
        <div className="border-b border-orange-100 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-orange-500">{task.key}</span>
              <Badge className={getPriorityColor(task.priority)}>
                {task.priority.toLowerCase()}
              </Badge>
            </div>
            <Link href={`/projects/${params.id}`}>
              <Button variant="outline" size="sm">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Board
              </Button>
            </Link>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-8">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600 mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="col-span-2 space-y-6">
              <Input
                id="title"
                label="Title"
                error={errors.title?.message}
                {...register("title")}
              />

              <Textarea
                id="description"
                label="Description"
                error={errors.description?.message}
                className="min-h-[200px]"
                {...register("description")}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Select
                id="statusId"
                label="Status"
                options={statuses.map((s) => ({ value: s.id, label: s.name }))}
                {...register("statusId")}
              />

              <Select
                id="priority"
                label="Priority"
                options={[
                  { value: "LOW", label: "Low" },
                  { value: "MEDIUM", label: "Medium" },
                  { value: "HIGH", label: "High" },
                  { value: "URGENT", label: "Urgent" },
                ]}
                {...register("priority")}
              />

              <Select
                id="assigneeId"
                label="Assignee"
                options={[
                  { value: "", label: "Unassigned" },
                  ...members.map((m) => ({ value: m.id, label: m.name })),
                ]}
                {...register("assigneeId")}
              />

              {/* Task Info */}
              <div className="border-t border-orange-100 pt-6 space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Details</h4>

                {task.assignee && (
                  <div className="flex items-center gap-3">
                    <Avatar name={task.assignee.name} src={task.assignee.avatarUrl} size="sm" />
                    <div>
                      <p className="text-xs text-gray-400">Assignee</p>
                      <p className="text-sm text-gray-900">{task.assignee.name}</p>
                    </div>
                  </div>
                )}

                {task.creator && (
                  <div className="flex items-center gap-3">
                    <Avatar name={task.creator.name} src={task.creator.avatarUrl} size="sm" />
                    <div>
                      <p className="text-xs text-gray-400">Created by</p>
                      <p className="text-sm text-gray-900">{task.creator.name}</p>
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-500 pt-2 space-y-1">
                  <p>Created: {formatDate(task.createdAt)}</p>
                  <p>Updated: {formatDate(task.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-8 mt-8 border-t border-orange-100">
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Delete Task
            </Button>
            <div className="flex gap-3">
              <Link href={`/projects/${params.id}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" isLoading={isSaving}>
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
