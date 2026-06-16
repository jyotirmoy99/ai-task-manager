import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ParsedTask, TaskEnrichment } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Override via GEMINI_MODEL in .env.local if needed. gemini-1.5-* models are
// retired; gemini-2.5-flash is the current fast/cheap default.
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

// `responseMimeType: "application/json"` forces the model to emit raw JSON,
// so `JSON.parse` does not choke on markdown code fences.
const model = genAI.getGenerativeModel({
  model: GEMINI_MODEL,
  generationConfig: { responseMimeType: "application/json" },
});

// Gemini occasionally returns 503 (overloaded) or 429 (rate limit) under load.
// These are transient, so retry a few times with exponential backoff before
// surfacing the error. Exported for reuse (e.g. the streaming suggest route).
export async function withRetry<T>(
  fn: () => Promise<T>,
  { retries = 3, baseDelayMs = 600 } = {},
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const retryable =
        /\b(429|500|503)\b/.test(msg) ||
        /overloaded|high demand|unavailable|rate.?limit|try again/i.test(msg);
      if (!retryable || attempt === retries) throw err;
      // 600ms, 1.2s, 2.4s — enough to ride out brief demand spikes.
      await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** attempt));
    }
  }
  throw lastError;
}

// 1. Categorize and enrich a task
export async function categorizeTask(
  title: string,
  description?: string,
): Promise<TaskEnrichment> {
  const prompt = `Analyze this task and return JSON only:
  Title: "${title}"
  Description: "${description ?? ""}"

  Return: { category: string, priority: "low"|"medium"|"high"|"urgent",
            tags: string[], summary: string, estimatedMinutes: number }`;

  const result = await withRetry(() => model.generateContent(prompt));
  return JSON.parse(result.response.text());
}

// 2. Parse natural language into a structured task
export async function parseNaturalLanguageTask(
  input: string,
): Promise<ParsedTask> {
  const prompt = `Parse this into a task. Return JSON only:
  Input: "${input}"
  Return: { title: string, description: string, dueDate: string|null,
            priority: "low"|"medium"|"high"|"urgent" }`;
  const result = await withRetry(() => model.generateContent(prompt));
  return JSON.parse(result.response.text());
}

// 3. Generate sub-tasks for a complex task
export interface SubTask {
  title: string;
  estimatedMinutes: number;
}

export async function generateSubTasks(
  title: string,
  description?: string,
): Promise<SubTask[]> {
  const prompt = `Break this task into 3-6 actionable sub-tasks. Return JSON array only:
  Task: "${title}" — ${description}
  Return: [{ title: string, estimatedMinutes: number }]`;
  const result = await withRetry(() => model.generateContent(prompt));
  return JSON.parse(result.response.text());
}
