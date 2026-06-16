import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { GEMINI_MODEL, withRetry } from "@/lib/gemini/service";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { taskId } = await req.json();
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const { data: task } = await supabase
    .from("tasks")
    .select()
    .eq("id", taskId)
    .single();

  try {
    // Retry the (non-streamed) request setup; transient 503/429s self-heal.
    const stream = await withRetry(() =>
      model.generateContentStream(
        `You are a productivity assistant. Suggest concrete, actionable workflow
improvements for the following task. Reply in concise GitHub-flavored Markdown
(use a short intro line and a bullet list).

Task: "${task.title}"
Details: "${task.description ?? "none"}"`,
      ),
    );

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream.stream) {
          controller.enqueue(encoder.encode(chunk.text()));
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    const overloaded = /overloaded|high demand|unavailable|503/i.test(msg);
    return new Response(
      overloaded
        ? "The AI model is busy right now. Please try again in a moment."
        : "Failed to generate suggestions.",
      { status: overloaded ? 503 : 500 },
    );
  }
}
