"use client";

import { useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Task } from "@/types";
import { deleteTask } from "../../actions/tasks";
import { tasksQueryKey } from "@/lib/tasks/queries";
import { SubTaskGenerator } from "../ai/SubTaskGenerator";
import { AISuggestionPanel } from "../ai/AISuggestionPanel";

export function TaskDetails({
  task,
  allTasks,
  onClose,
}: {
  task: Task;
  allTasks: Task[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();
  const subTasks = allTasks.filter((t) => t.parent_task_id === task.id);

  function handleDelete() {
    startTransition(async () => {
      await deleteTask(task.id);
      await queryClient.invalidateQueries({ queryKey: tasksQueryKey });
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={onClose}
    >
      <aside
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold leading-tight">{task.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-md bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
            {task.status.replace("_", " ")}
          </span>
          <span className="rounded-md bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
            {task.priority}
          </span>
          {task.category && (
            <span className="rounded-md bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
              {task.category}
            </span>
          )}
          {task.due_date && (
            <span className="rounded-md bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
              Due {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
        </div>

        {task.description && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-300">
            {task.description}
          </p>
        )}

        {task.ai_summary && (
          <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
            <span className="font-medium">AI summary: </span>
            {task.ai_summary}
          </div>
        )}

        {task.ai_tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {task.ai_tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[11px] text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Sub-tasks */}
        <section className="mt-6">
          <h3 className="text-sm font-semibold">Sub-tasks</h3>
          {subTasks.length > 0 ? (
            <ul className="mt-2 flex flex-col gap-1.5">
              {subTasks.map((st) => (
                <li
                  key={st.id}
                  className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/10"
                >
                  <span>{st.title}</span>
                  {typeof st.metadata?.estimatedMinutes === "number" && (
                    <span className="text-xs text-zinc-400">
                      {st.metadata.estimatedMinutes}m
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-xs text-zinc-400">No sub-tasks yet.</p>
          )}
          <div className="mt-3">
            <SubTaskGenerator taskId={task.id} />
          </div>
        </section>

        {/* AI suggestions */}
        <section className="mt-6">
          <h3 className="text-sm font-semibold">AI suggestions</h3>
          <div className="mt-2">
            <AISuggestionPanel taskId={task.id} />
          </div>
        </section>

        <div className="mt-8 border-t border-black/10 pt-4 dark:border-white/10">
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="text-sm font-medium text-red-600 hover:text-red-500 disabled:opacity-60"
          >
            {pending ? "Deleting…" : "Delete task"}
          </button>
        </div>
      </aside>
    </div>
  );
}
