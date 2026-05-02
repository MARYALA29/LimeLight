"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTaskSchema, CreateTaskInput } from "@/lib/validations";
import { Modal, Button, Input, Textarea, Select } from "@/components/ui";
import { Task, Status, User } from "@/types";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  statuses: Status[];
  members: User[];
  onTaskCreated: (task: Task) => void;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  projectId,
  statuses,
  members,
  onTaskCreated,
}: CreateTaskModalProps) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { priority: "MEDIUM" },
  });

  const onSubmit = async (data: CreateTaskInput) => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to create task");
        return;
      }

      onTaskCreated(result.task);
      reset();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Task">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>
        )}

        <Input
          id="title"
          label="Title"
          placeholder="Task title"
          error={errors.title?.message}
          {...register("title")}
        />

        <Textarea
          id="description"
          label="Description"
          placeholder="Describe the task..."
          error={errors.description?.message}
          {...register("description")}
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
          id="statusId"
          label="Status"
          options={statuses.map((s) => ({ value: s.id, label: s.name }))}
          {...register("statusId")}
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

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
}
