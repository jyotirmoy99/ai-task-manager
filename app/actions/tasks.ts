"use server";
import { createClient } from "@/lib/supabase/server";
import {
  categorizeTask,
  generateSubTasks,
  parseNaturalLanguageTask,
} from "@/lib/gemini/service";
import { revalidatePath } from "next/cache";
import type { TaskStatus } from "@/types";

// Resolve the current user or throw — every mutation runs on their behalf and
// is further constrained by row-level security in the database.
async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

// Create a task from the structured modal form. AI enrichment (category,
// priority, tags, summary) is generated server-side before the insert.
export async function createTask(formData: FormData) {
  const { supabase, user } = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title) throw new Error("Title is required");

  const ai = await categorizeTask(title, description);

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title,
      description,
      status: "todo",
      category: ai.category,
      priority: ai.priority,
      ai_tags: ai.tags,
      ai_summary: ai.summary,
      metadata: { estimatedMinutes: ai.estimatedMinutes },
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/dashboard");
  return data;
}

// Create a task from free-form text. Gemini parses it into a structured task
// first, then the normal categorization pipeline enriches it.
export async function createTaskFromNaturalLanguage(input: string) {
  const { supabase, user } = await requireUser();

  const text = input.trim();
  if (!text) throw new Error("Input is required");

  const parsed = await parseNaturalLanguageTask(text);
  const ai = await categorizeTask(parsed.title, parsed.description);

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title: parsed.title,
      description: parsed.description,
      status: "todo",
      priority: parsed.priority ?? ai.priority,
      category: ai.category,
      due_date: parsed.dueDate,
      ai_tags: ai.tags,
      ai_summary: ai.summary,
      metadata: { estimatedMinutes: ai.estimatedMinutes },
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/dashboard");
  return data;
}

// Move a task between Kanban columns (todo / in_progress / done).
export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const { supabase } = await requireUser();

  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId);

  if (error) throw error;
  revalidatePath("/dashboard");
}

// Delete a task and any sub-tasks that reference it.
export async function deleteTask(taskId: string) {
  const { supabase } = await requireUser();

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
  revalidatePath("/dashboard");
}

// Break a complex task into actionable sub-tasks using Gemini, persisting each
// as a child task linked via parent_task_id.
export async function generateTaskBreakdown(taskId: string) {
  const { supabase, user } = await requireUser();

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select()
    .eq("id", taskId)
    .single();
  if (fetchError) throw fetchError;

  const subTasks = await generateSubTasks(task.title, task.description);

  const inserts = subTasks.map((st) => ({
    user_id: user.id,
    title: st.title,
    status: "todo" as const,
    priority: task.priority,
    parent_task_id: taskId,
    metadata: { estimatedMinutes: st.estimatedMinutes },
  }));

  const { error } = await supabase.from("tasks").insert(inserts);
  if (error) throw error;

  revalidatePath("/dashboard");
  return inserts.length;
}
