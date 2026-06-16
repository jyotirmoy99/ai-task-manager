"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "../actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    undefined,
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">AI Task Manager</p>

        <form action={formAction} className="mt-6 flex flex-col gap-4">
          {mode === "signup" && (
            <label className="flex flex-col gap-1 text-sm font-medium">
              Full name
              <input
                name="fullName"
                type="text"
                autoComplete="name"
                className="rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-white/15"
                placeholder="Ada Lovelace"
              />
            </label>
          )}

          <label className="flex flex-col gap-1 text-sm font-medium">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-white/15"
              placeholder="you@example.com"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              className="rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-white/15"
              placeholder="••••••••"
            />
          </label>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {pending
              ? "Please wait…"
              : mode === "signin"
                ? "Sign in"
                : "Sign up"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
        >
          {mode === "signin"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
