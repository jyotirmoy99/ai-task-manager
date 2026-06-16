"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Update the current user's profile. The avatar file itself is uploaded
// client-side to Supabase Storage; here we only persist the resulting URL.
export async function updateProfile(input: {
  fullName: string;
  avatarUrl?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const row: { id: string; full_name: string; avatar_url?: string | null } = {
    id: user.id,
    full_name: input.fullName.trim(),
  };
  // Only touch avatar_url when the caller provides one (undefined = leave as-is).
  if (input.avatarUrl !== undefined) row.avatar_url = input.avatarUrl;

  // Upsert in case the profile row doesn't exist yet (e.g. older accounts).
  const { error } = await supabase.from("profiles").upsert(row);
  if (error) throw error;

  revalidatePath("/dashboard");
}
