# AI Task Manager

An AI-powered task manager built on **Next.js 16 (App Router)**, **Supabase**, and **Google Gemini**. Capture tasks in plain English, let Gemini categorize and prioritize them, break complex work into sub-tasks, and get workflow suggestions — all on a realtime Kanban board.

> 📖 **New here?** See the [step-by-step Usage Guide](USAGE.md) for setup and feature walkthroughs with examples.

---

## Features

- 🧠 **AI task enrichment** — every new task is auto-categorized, prioritized, tagged, and summarized by Gemini.
- ⌨️ **Natural-language capture** — type _"Email the design draft to Sam by Friday"_ and it becomes a structured task.
- 🪄 **Sub-task generation** — break any task into 3–6 actionable steps with time estimates.
- 💡 **Streaming AI suggestions** — get concise, actionable workflow improvements streamed token-by-token.
- 🗂️ **Drag-and-drop Kanban** — move tasks across _To Do → In Progress → Done_ (dnd-kit).
- ⚡ **Realtime sync** — Supabase Postgres changes invalidate the React Query cache instantly across tabs/devices.
- 🔐 **Auth + Row Level Security** — email/password auth; every row is scoped to its owner in the database.

---

## Tech stack

| Concern        | Choice                                            |
| -------------- | ------------------------------------------------- |
| Framework      | Next.js 16 (App Router, Server Actions, Proxy)    |
| UI             | React 19, Tailwind CSS v4                         |
| Database/Auth  | Supabase (Postgres + Auth + Realtime)             |
| AI             | Google Gemini (`@google/generative-ai`)           |
| Client state   | TanStack React Query 5                            |
| Drag & drop    | dnd-kit                                            |

> **Note on Next.js 16:** several APIs changed from earlier versions used here.
> `cookies()` is now **async** (must be `await`ed), and **Middleware was renamed to Proxy** — the auth gate lives in `proxy.ts` at the project root, not `middleware.ts`.

---

## Architecture

```
Browser (Client Components)                Server
─────────────────────────────             ─────────────────────────────
KanbanBoard ──useQuery──┐
  TaskColumn            │  fetchTasks() ──► Supabase (RLS)
    TaskCard            │
NaturalLanguageInput ───┼── Server Actions ─► Gemini + Supabase insert
CreateTaskModal ────────┤   (app/actions/tasks.ts)
TaskDetails             │
  SubTaskGenerator ─────┘
  AISuggestionPanel ──fetch──► /api/ai/suggest (streaming Route Handler)

useRealtimeTasks ──postgres_changes──► invalidate ["tasks"] ──► refetch
proxy.ts ──getUser()──► redirect unauthenticated users to /login
```

### Data flow

1. A task is created via the **modal** (structured) or **natural-language input** (free text).
2. The relevant **server action** calls Gemini to enrich/parse, then inserts into Supabase.
3. Supabase **Realtime** broadcasts the change; `useRealtimeTasks` invalidates the React Query cache, which refetches.
4. Dragging a card calls `updateTaskStatus` (optimistic update + server action).

---

## Project structure

```
app/
├─ (auth)/
│  ├─ actions.ts            # signIn / signUp / signOut server actions
│  └─ login/page.tsx        # email/password auth form
├─ actions/
│  └─ tasks.ts              # task CRUD + AI server actions
├─ api/ai/
│  ├─ categorize/route.ts   # POST → Gemini enrichment (JSON)
│  └─ suggest/route.ts      # POST → streamed workflow suggestions
├─ components/
│  ├─ board/                # KanbanBoard, TaskColumn, TaskCard
│  ├─ task/                 # CreateTaskModal, NaturalLanguageInput, TaskDetails
│  └─ ai/                   # SubTaskGenerator, AISuggestionPanel
├─ dashboard/page.tsx       # main app screen (server component)
├─ hooks/useRealtimeTasks.ts
├─ lib/
│  ├─ gemini/service.ts     # Gemini calls (categorize, parse, sub-tasks)
│  ├─ supabase/server.ts    # server client (async cookies)
│  ├─ supabase/browser.ts   # browser client
│  └─ tasks/queries.ts      # client-side fetchTasks + query key
├─ types/index.ts           # shared domain types
├─ layout.tsx               # root layout + Providers
├─ page.tsx                 # redirects to /dashboard
└─ providers.tsx            # React Query provider
proxy.ts                    # auth gate (Next 16 Proxy)
supabase/schema.sql         # tables, RLS, realtime, triggers
```

---

## Getting started

### 1. Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### 2. Install

```bash
npm install
```

### 3. Configure environment

Copy the example and fill in your keys:

```bash
cp .env.example .env.local
```

| Variable                        | Where to find it                          |
| ------------------------------- | ----------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase → Project Settings → API         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API         |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase → Project Settings → API (secret)|
| `GEMINI_API_KEY`                | Google AI Studio                          |

### 4. Set up the database

Open the Supabase **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql). This creates the `tasks` table, enables Row Level Security, sets up the `updated_at` trigger, and adds the table to the realtime publication.

In **Authentication → Providers**, ensure **Email** is enabled. For the smoothest local experience you may disable "Confirm email" so sign-up logs you in immediately.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`; sign up, and you'll land on the dashboard.

---

## Scripts

| Command          | Description                       |
| ---------------- | --------------------------------- |
| `npm run dev`    | Start the dev server              |
| `npm run build`  | Production build                  |
| `npm run start`  | Run the production build          |
| `npm run lint`   | Lint with ESLint                  |

---

## How the AI works

All Gemini calls live in [`app/lib/gemini/service.ts`](app/lib/gemini/service.ts) and run **server-side only** (the API key is never exposed to the browser):

- **`categorizeTask`** → `{ category, priority, tags, summary, estimatedMinutes }`
- **`parseNaturalLanguageTask`** → `{ title, description, dueDate, priority }`
- **`generateSubTasks`** → `[{ title, estimatedMinutes }]`

The model is configured with `responseMimeType: "application/json"` so responses parse reliably. Suggestions are streamed from [`app/api/ai/suggest/route.ts`](app/api/ai/suggest/route.ts) via a `ReadableStream`.

---

## Deployment

Deploy to [Vercel](https://vercel.com/new) and add the four environment variables in the project settings. The Supabase database and the Gemini key work the same in production — no extra configuration required.
