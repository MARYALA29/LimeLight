/**
 * Verifies that key board surfaces opt into dark-mode styling via the
 * `dark:` Tailwind variants. We don't render an actual JSDOM-styled tree
 * here — Tailwind doesn't run in tests — so we assert the presence of
 * `dark:*` utility classes on the rendered className strings.
 */
import { render } from "@testing-library/react";
import { Column } from "@/components/board/column";
import { TaskCard } from "@/components/board/task-card";
import { DndContext } from "@dnd-kit/core";
import type { Task, Status } from "@/types";

const todoStatus: Status = {
  id: "s1",
  name: "To Do",
  order: 0,
  projectId: "p1",
};

const baseTask: Task = {
  id: "t1",
  title: "Test task",
  description: null,
  key: "P-1",
  priority: "MEDIUM",
  order: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  projectId: "p1",
  statusId: "s1",
  assigneeId: null,
  creatorId: "u1",
};

describe("Board dark mode", () => {
  it("Column declares dark-mode utility classes", () => {
    const { container } = render(
      <DndContext>
        <Column status={todoStatus} tasks={[]} onTaskClick={() => {}} />
      </DndContext>
    );
    const html = container.innerHTML;
    // The column wrapper, header, count badge, and empty state all need
    // dark variants for legibility.
    expect(html).toMatch(/dark:bg-dark-surface/);
    expect(html).toMatch(/dark:text-dark-text-primary/);
    expect(html).toMatch(/dark:border-dark-border|dark:text-dark-text-secondary/);
  });

  it("TaskCard declares dark-mode utility classes", () => {
    const { container } = render(
      <DndContext>
        <Column status={todoStatus} tasks={[baseTask]} onTaskClick={() => {}} />
      </DndContext>
    );
    const html = container.innerHTML;
    // Key, title, and surface should all have dark-mode treatment so the
    // orange primary remains vibrant against neutral-800/900 backgrounds.
    expect(html).toMatch(/dark:bg-dark-surface-hover/);
    expect(html).toMatch(/dark:text-dark-text-primary/);
    expect(html).toMatch(/dark:text-orange-400/);
  });
});
