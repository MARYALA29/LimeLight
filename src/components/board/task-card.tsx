"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Avatar, Badge } from "@/components/ui";
import { cn, getPriorityColor } from "@/lib/utils";
import { Task } from "@/types";

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onClick?: () => void;
}

export function TaskCard({ task, isDragging, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-xl border border-orange-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-orange-200 dark:border-dark-border dark:bg-dark-surface-hover dark:hover:border-orange-500/40",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <p className="text-xs text-orange-500 font-medium dark:text-orange-400">{task.key}</p>
      <h4 className="mt-1 text-sm font-medium text-gray-900 line-clamp-2 dark:text-dark-text-primary">
        {task.title}
      </h4>

      <div className="mt-3 flex items-center justify-between">
        <Badge className={getPriorityColor(task.priority)}>
          {task.priority.toLowerCase()}
        </Badge>
        {task.assignee && (
          <Avatar name={task.assignee.name} src={task.assignee.avatarUrl} size="sm" />
        )}
      </div>
    </div>
  );
}
