"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { createTask } from "../../actions/tasks";
import { tasksQueryKey } from "@/lib/tasks/queries";

export function CreateTaskModal() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  function handleAction(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createTask(formData);
        await queryClient.invalidateQueries({ queryKey: tasksQueryKey });
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        + New task
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 overflow-y-auto bg-black/40"
            onClick={() => !pending && setOpen(false)}
          >
            <div className="flex min-h-full items-center justify-center p-4">
              <div
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-950"
                onClick={(e) => e.stopPropagation()}
              >
            <h2 className="text-lg font-semibold">New task</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Gemini will categorize, prioritize, and tag it automatically.
            </p>

            <form action={handleAction} className="mt-4 flex flex-col gap-3">
              <input
                name="title"
                required
                autoFocus
                placeholder="Task title"
                className="rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-white/15"
              />
              <textarea
                name="description"
                rows={4}
                placeholder="Description (optional)"
                className="resize-none rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-white/15"
              />

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-800 disabled:opacity-60 dark:hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  {pending ? "Creating…" : "Create"}
                </button>
              </div>
              </form>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
