// Shared domain types for the AI Task Manager.
// These mirror the `tasks` table in Supabase (see supabase/schema.sql).

export type Priority = "low" | "medium" | "high" | "urgent";

export type TaskStatus = "todo" | "in_progress" | "done" | "archived";

export interface TaskMetadata {
  estimatedMinutes?: number;
  [key: string]: unknown;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  category: string | null;
  priority: Priority;
  due_date: string | null;
  ai_tags: string[];
  ai_summary: string | null;
  parent_task_id: string | null;
  metadata: TaskMetadata;
  created_at: string;
  updated_at: string;
}

// Shape returned by the Gemini categorization call.
export interface TaskEnrichment {
  category: string;
  priority: Priority;
  tags: string[];
  summary: string;
  estimatedMinutes: number;
}

// Shape returned when parsing free text into a task.
export interface ParsedTask {
  title: string;
  description: string;
  dueDate: string | null;
  priority: Priority;
}

// The three Kanban columns, in display order.
export const TASK_STATUSES: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "done", label: "Done" },
];

export const PRIORITY_ORDER: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};
