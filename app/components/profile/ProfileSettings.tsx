"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/browser";
import { updateProfile } from "../../actions/profile";

export function ProfileSettings({
  userId,
  email,
  fullName,
  avatarUrl,
}: {
  userId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(fullName);
  const [savedAvatar, setSavedAvatar] = useState(avatarUrl);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const display = (name.trim() || email).trim();
  const initials = display.slice(0, 2).toUpperCase();

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        let nextAvatar = savedAvatar;

        if (file) {
          const ext = file.name.split(".").pop() ?? "png";
          const path = `${userId}/${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("avatars")
            .upload(path, file, { upsert: true });
          if (upErr) throw upErr;

          nextAvatar = supabase.storage.from("avatars").getPublicUrl(path)
            .data.publicUrl;

          // Best-effort cleanup of the user's older avatar files.
          const { data: existing } = await supabase.storage
            .from("avatars")
            .list(userId);
          const stale = (existing ?? [])
            .map((f) => `${userId}/${f.name}`)
            .filter((p) => p !== path);
          if (stale.length) {
            await supabase.storage.from("avatars").remove(stale);
          }
        }

        await updateProfile({ fullName: name, avatarUrl: nextAvatar });
        setSavedAvatar(nextAvatar);
        setFile(null);
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save profile.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
      >
        {savedAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={savedAvatar}
            alt={display}
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
            {initials}
          </span>
        )}
        <span className="hidden text-sm text-zinc-600 sm:inline dark:text-zinc-300">
          {display}
        </span>
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 overflow-y-auto bg-black/40"
            onClick={() => !pending && setOpen(false)}
          >
            <div className="flex min-h-full items-center justify-center p-4">
              <div
                className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-950"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-lg font-semibold">Profile settings</h2>

                <div className="mt-5 flex items-center gap-4">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview}
                      alt="Avatar preview"
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 text-lg font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                      {initials}
                    </span>
                  )}
                  <label className="cursor-pointer rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5">
                    Change photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <label className="mt-5 flex flex-col gap-1 text-sm font-medium">
                  Full name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-white/15"
                  />
                </label>

                <p className="mt-2 text-xs text-zinc-400">{email}</p>

                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={pending}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-800 disabled:opacity-60 dark:hover:text-zinc-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={save}
                    disabled={pending}
                    className="rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                  >
                    {pending ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
