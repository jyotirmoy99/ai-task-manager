"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchTasks, tasksQueryKey } from "@/lib/tasks/queries";
import { updateTaskStatus } from "../../actions/tasks";
import { useRealtimeTasks } from "@/hooks/useRealtimeTasks";
import { TASK_STATUSES, type Task, type TaskStatus } from "@/types";
import { TaskColumn } from "./TaskColumn";
import { TaskDetails } from "../task/TaskDetails";

export function KanbanBoard({
  initialTasks,
  userId,
}: {
  initialTasks: Task[];
  userId: string;
}) {
  const queryClient = useQueryClient();
  useRealtimeTasks(userId);

  const { data: tasks = [] } = useQuery({
    queryKey: tasksQueryKey,
    queryFn: fetchTasks,
    initialData: initialTasks,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Require a small drag distance so a plain click opens details instead of
  // starting a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  // Only top-level tasks live on the board; sub-tasks are shown in details.
  const columns = useMemo(() => {
    const topLevel = tasks.filter((t) => !t.parent_task_id);
    return TASK_STATUSES.map((status) => ({
      ...status,
      tasks: topLevel.filter((t) => t.status === status.id),
    }));
  }, [tasks]);

  const selectedTask = tasks.find((t) => t.id === selectedId) ?? null;

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic update — realtime/refetch will reconcile.
    queryClient.setQueryData<Task[]>(tasksQueryKey, (prev) =>
      (prev ?? []).map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t,
      ),
    );

    try {
      await updateTaskStatus(taskId, newStatus);
    } catch {
      queryClient.invalidateQueries({ queryKey: tasksQueryKey });
    }
  }

  return (
    <>
      {/* Stable id avoids an SSR/CSR hydration mismatch in dnd-kit's
          auto-generated accessibility ids (aria-describedby). */}
      <DndContext id="kanban-board" sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {columns.map((column) => (
            <TaskColumn
              key={column.id}
              id={column.id}
              label={column.label}
              tasks={column.tasks}
              onSelect={setSelectedId}
            />
          ))}
        </div>
      </DndContext>

      {selectedTask && (
        <TaskDetails
          task={selectedTask}
          allTasks={tasks}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}
