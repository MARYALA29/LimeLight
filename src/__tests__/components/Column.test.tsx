import { render, screen } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { Column } from "@/components/board/column";
import { Status } from "@/types";

const status: Status = {
  id: "s1",
  name: "To Do",
  order: 0,
  projectId: "p1",
};

function renderColumn(
  props: Partial<React.ComponentProps<typeof Column>> = {}
) {
  return render(
    <DndContext>
      <Column
        status={status}
        tasks={[]}
        onTaskClick={() => {}}
        filtersActive={false}
        {...props}
      />
    </DndContext>
  );
}

describe("Column", () => {
  it("shows the default empty drop zone when no filters are active", () => {
    renderColumn();
    expect(screen.getByText(/drop tasks here/i)).toBeInTheDocument();
  });

  it("shows a 'no tasks match your filters' empty state when filters are active", () => {
    renderColumn({ filtersActive: true });
    expect(
      screen.getByText(/no tasks match your filters/i)
    ).toBeInTheDocument();
  });

  it("does not render the empty state when tasks are present", () => {
    renderColumn({
      filtersActive: true,
      tasks: [
        {
          id: "t1",
          title: "T",
          description: null,
          key: "K-1",
          priority: "MEDIUM",
          order: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          projectId: "p1",
          statusId: "s1",
          assigneeId: null,
          creatorId: "u1",
        },
      ],
    });
    expect(
      screen.queryByText(/no tasks match your filters/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/drop tasks here/i)).not.toBeInTheDocument();
  });
});
