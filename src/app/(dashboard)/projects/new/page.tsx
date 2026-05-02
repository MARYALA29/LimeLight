"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProjectSchema, CreateProjectInput } from "@/lib/validations";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea } from "@/components/ui";

export default function NewProjectPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
  });

  const name = watch("name");

  const generateKey = () => {
    if (name) {
      const key = name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 5);
      setValue("key", key);
    }
  };

  const onSubmit = async (data: CreateProjectInput) => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Failed to create project");
        return;
      }

      router.push(`/projects/${result.project.id}`);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>
            )}
            <Input
              id="name"
              label="Project Name"
              placeholder="My Project"
              error={errors.name?.message}
              {...register("name")}
              onBlur={generateKey}
            />
            <Input
              id="key"
              label="Project Key"
              placeholder="MP"
              error={errors.key?.message}
              {...register("key")}
              className="uppercase"
            />
            <Textarea
              id="description"
              label="Description (optional)"
              placeholder="Describe your project..."
              error={errors.description?.message}
              {...register("description")}
            />
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isLoading}>
                Create Project
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
