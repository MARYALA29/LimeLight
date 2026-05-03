"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "./task-card";
import { Task, Status } from "@/types";

interface ColumnProps {
  status: Status;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  /** When true, the empty state reads as "filtered to nothing" rather than "drop here". */
  filtersActive?: boolean;
}

export function Column({ status, tasks, onTaskClick, filtersActive = false }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id });

  return (
    <div
      ref={setNodeRef}
      className={`w-72 flex-shrink-0 rounded-2xl bg-orange-50/50 p-4 dark:bg-dark-surface ${
        isOver ? "ring-2 ring-orange-400" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary">
          {status.name}
        </h3>
        <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-600 dark:bg-orange-500/20 dark:text-orange-300">
          {tasks.length}
        </span>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </div>
      </SortableContext>

      {tasks.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-orange-200 p-4 text-center text-sm text-gray-400 dark:border-dark-border dark:text-dark-text-secondary">
          {filtersActive ? "No tasks match your filters" : "Drop tasks here"}
        </div>
      )}
    </div>
  );
}
