import { createClient } from "@/lib/supabase/server";
import type { Task } from "@/types";
import { signOut } from "../(auth)/actions";
import { KanbanBoard } from "../components/board/KanbanBoard";
import { CreateTaskModal } from "../components/task/CreateTaskModal";
import { NaturalLanguageInput } from "../components/task/NaturalLanguageInput";
import { ProfileSettings } from "../components/profile/ProfileSettings";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The proxy guarantees an authenticated user, but guard for type-safety.
  if (!user) return null;

  const [{ data: tasks }, { data: profile }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single(),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="sticky top-0 z-10 border-b border-black/10 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-black/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight">
              AI Task Manager
            </h1>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-900">
              Gemini
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ProfileSettings
              userId={user.id}
              email={user.email ?? ""}
              fullName={profile?.full_name ?? ""}
              avatarUrl={profile?.avatar_url ?? null}
            />
            <CreateTaskModal />
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <NaturalLanguageInput />
        <KanbanBoard
          initialTasks={(tasks as Task[]) ?? []}
          userId={user.id}
        />
      </main>
    </div>
  );
}
