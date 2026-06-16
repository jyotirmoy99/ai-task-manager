"use client";

import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { generateTaskBreakdown } from "../../actions/tasks";
import { tasksQueryKey } from "@/lib/tasks/queries";

export function SubTaskGenerator({ taskId }: { taskId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  function generate() {
    setMessage(null);
    startTransition(async () => {
      try {
        const count = await generateTaskBreakdown(taskId);
        await queryClient.invalidateQueries({ queryKey: tasksQueryKey });
        setMessage(`Added ${count} sub-task${count === 1 ? "" : "s"}.`);
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "Failed to generate.");
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={generate}
        disabled={pending}
        className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/5"
      >
        {pending ? "Generating…" : "✨ Break into sub-tasks"}
      </button>
      {message && <p className="mt-2 text-xs text-zinc-500">{message}</p>}
    </div>
  );
}
