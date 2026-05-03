"use client";

import { useEffect, useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Column } from "./column";
import { TaskCard } from "./task-card";
import { CreateTaskModal } from "./create-task-modal";
import { TaskDetailModal } from "../tasks/task-detail-modal";
import { Button } from "@/components/ui";
import { Task, Status, User, ProjectWithMembers } from "@/types";

interface BoardProps {
  project: ProjectWithMembers;
  initialTasks: Task[];
  members: User[];
  /** When true, columns swap their empty-state copy to "no tasks match your filters". */
  filtersActive?: boolean;
}

export function Board({ project, initialTasks, members, filtersActive = false }: BoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Sync local state when the parent supplies a new task list (e.g. filter
  // refetch). We don't try to merge optimistic edits with refetched results —
  // the parent is the source of truth for the tasks visible on the board.
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Determine target status
    let targetStatusId: string;
    let targetOrder: number;

    const overTask = tasks.find((t) => t.id === overId);
    if (overTask) {
      targetStatusId = overTask.statusId;
      targetOrder = overTask.order;
    } else {
      // Dropped on column
      targetStatusId = overId;
      const tasksInColumn = tasks.filter((t) => t.statusId === targetStatusId);
      targetOrder = tasksInColumn.length;
    }

    if (task.statusId === targetStatusId && task.order === targetOrder) return;

    // Optimistic update
    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, statusId: targetStatusId, order: targetOrder };
      }
      return t;
    });
    setTasks(updatedTasks);

    // API call
    try {
      await fetch(`/api/tasks/${taskId}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId: targetStatusId, order: targetOrder }),
      });
    } catch (error) {
      console.error("Failed to move task:", error);
      setTasks(tasks); // Revert
    }
  };

  const handleTaskCreated = (task: Task) => {
    setTasks([...tasks, task]);
    setIsCreateModalOpen(false);
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    setSelectedTask(null);
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasks(tasks.filter((t) => t.id !== taskId));
    setSelectedTask(null);
  };

  const columns = project.statuses.map((status) => ({
    status,
    tasks: tasks.filter((t) => t.statusId === status.id).sort((a, b) => a.order - b.order),
  }));

  return (
    <>
      <div className="mb-4">
        <Button onClick={() => setIsCreateModalOpen(true)}>+ Add Task</Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <Column
              key={column.status.id}
              status={column.status}
              tasks={column.tasks}
              onTaskClick={setSelectedTask}
              filtersActive={filtersActive}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} isDragging />}
        </DragOverlay>
      </DndContext>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projectId={project.id}
        statuses={project.statuses}
        members={members}
        onTaskCreated={handleTaskCreated}
      />

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          projectId={project.id}
          statuses={project.statuses}
          members={members}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
        />
      )}
    </>
  );
}
