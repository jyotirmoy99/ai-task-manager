import { supabase } from "@/lib/supabase/browser";
import type { Task } from "@/types";

// Client-side fetch used by React Query. RLS scopes rows to the current user,
// so no explicit user filter is required here.
export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as Task[]) ?? [];
}

export const tasksQueryKey = ["tasks"] as const;
