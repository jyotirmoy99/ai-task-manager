"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function AISuggestionPanel({ taskId }: { taskId: string }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getSuggestions() {
    setLoading(true);
    setError(null);
    setText("");

    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });

      if (!res.ok || !res.body) {
        const detail = await res.text().catch(() => "");
        throw new Error(detail || `Request failed (${res.status})`);
      }

      // Read the streamed plain-text response chunk by chunk.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setText((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get suggestions.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={getSuggestions}
        disabled={loading}
        className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/5"
      >
        {loading ? "Thinking…" : "💡 Suggest improvements"}
      </button>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {text && (
        <div className="prose prose-sm mt-3 max-w-none rounded-lg bg-zinc-50 p-3 text-zinc-700 dark:prose-invert dark:bg-zinc-900 dark:text-zinc-200">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
