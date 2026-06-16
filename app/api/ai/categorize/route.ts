import { createClient } from "@/lib/supabase/server";
import { categorizeTask } from "@/lib/gemini/service";

// POST /api/ai/categorize
// Body: { title: string, description?: string }
// Returns Gemini's enrichment (category, priority, tags, summary, estimate).
// Useful for previewing AI output before committing a task.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { title, description } = await req.json();
  if (!title || typeof title !== "string") {
    return Response.json({ error: "title is required" }, { status: 400 });
  }

  const enrichment = await categorizeTask(title, description);
  return Response.json(enrichment);
}
