"use client";

import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createTaskFromNaturalLanguage } from "../../actions/tasks";
import { tasksQueryKey } from "@/lib/tasks/queries";

export function NaturalLanguageInput() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  function submit() {
    const input = value.trim();
    if (!input) return;
    setError(null);
    startTransition(async () => {
      try {
        await createTaskFromNaturalLanguage(input);
        await queryClient.invalidateQueries({ queryKey: tasksQueryKey });
        setValue("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="mb-6">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          disabled={pending}
          placeholder='Describe a task, e.g. "Email the design draft to Sam by Friday"'
          className="flex-1 rounded-lg border border-black/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-400 disabled:opacity-60 dark:border-white/15 dark:bg-zinc-950"
        />
        <button
          type="button"
          onClick={submit}
          disabled={pending || !value.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
        >
          {pending ? "Thinking…" : "Add with AI"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
