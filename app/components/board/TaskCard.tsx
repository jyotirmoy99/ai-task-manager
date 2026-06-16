"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Priority, Task } from "@/types";

const PRIORITY_STYLES: Record<Priority, string> = {
  urgent: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  low: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
};

export function TaskCard({
  task,
  onSelect,
}: {
  task: Task;
  onSelect: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onSelect(task.id)}
      className="cursor-grab touch-none rounded-xl border border-black/10 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing dark:border-white/10 dark:bg-zinc-900"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium leading-snug">{task.title}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PRIORITY_STYLES[task.priority]}`}
        >
          {task.priority}
        </span>
      </div>

      {task.ai_summary && (
        <p className="mt-1.5 line-clamp-2 text-xs text-zinc-500">
          {task.ai_summary}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {task.category && (
          <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {task.category}
          </span>
        )}
        {task.ai_tags?.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}
