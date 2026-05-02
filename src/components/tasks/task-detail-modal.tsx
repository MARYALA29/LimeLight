"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateTaskSchema, UpdateTaskInput } from "@/lib/validations";
import { Modal, Button, Input, Textarea, Select } from "@/components/ui";
import { Task, Status, User } from "@/types";
import { formatDate } from "@/lib/utils";

interface TaskDetailModalProps {
  task: Task;
  projectId: string;
  statuses: Status[];
  members: User[];
  onClose: () => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

export function TaskDetailModal({
  task,
  projectId,
  statuses,
  members,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}: TaskDetailModalProps) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<UpdateTaskInput>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      statusId: task.statusId,
      assigneeId: task.assigneeId || "",
    },
  });

  const onSubmit = async (data: UpdateTaskInput) => {
    setIsLoading(true);
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

      onTaskUpdated(result.task);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });

      if (!res.ok) {
        const result = await res.json();
        setError(result.error || "Failed to delete task");
        return;
      }

      onTaskDeleted(task.id);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const titleWithLink = (
    <div className="flex items-center gap-2">
      <span>{task.key}</span>
      <Link
        href={`/projects/${projectId}/tasks/${task.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-400 hover:text-orange-500 transition-colors"
        title="Open in new tab"
        onClick={(e) => e.stopPropagation()}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </Link>
    </div>
  );

  return (
    <Modal isOpen={true} onClose={onClose} title={titleWithLink} className="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>
        )}

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
          {...register("description")}
        />

        <div className="grid grid-cols-2 gap-4">
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
        </div>

        <Select
          id="assigneeId"
          label="Assignee"
          options={[
            { value: "", label: "Unassigned" },
            ...members.map((m) => ({ value: m.id, label: m.name })),
          ]}
          {...register("assigneeId")}
        />

        <div className="border-t border-orange-100 pt-4 text-sm text-gray-500">
          <p>Created: {formatDate(task.createdAt)} by {task.creator?.name}</p>
          <p>Updated: {formatDate(task.updatedAt)}</p>
        </div>

        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            Delete
          </Button>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
