"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Task, TaskStatus } from "@/types";
import { TaskCard } from "./TaskCard";

export function TaskColumn({
  id,
  label,
  tasks,
  onSelect,
}: {
  id: TaskStatus;
  label: string;
  tasks: Task[];
  onSelect: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[60vh] flex-col gap-3 rounded-2xl border p-3 transition-colors ${
        isOver
          ? "border-zinc-400 bg-zinc-100/60 dark:border-zinc-600 dark:bg-zinc-900/60"
          : "border-black/10 bg-white/50 dark:border-white/10 dark:bg-zinc-950/40"
      }`}
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold">{label}</h2>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onSelect={onSelect} />
        ))}
        {tasks.length === 0 && (
          <p className="px-1 py-8 text-center text-xs text-zinc-400">
            Drop tasks here
          </p>
        )}
      </div>
    </div>
  );
}
