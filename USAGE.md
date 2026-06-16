# AI Task Manager — Usage Guide

A practical, step-by-step walkthrough: from a fresh clone to using every feature, with concrete examples. For architecture and tech details, see the [README](README.md).

---

## Table of contents

1. [One-time setup](#1-one-time-setup)
2. [Run the app](#2-run-the-app)
3. [Create your account](#3-create-your-account)
4. [Set up your profile](#4-set-up-your-profile)
5. [Add tasks](#5-add-tasks)
6. [Let the AI work for you](#6-let-the-ai-work-for-you)
7. [Organize on the Kanban board](#7-organize-on-the-kanban-board)
8. [Task details](#8-task-details)
9. [Realtime sync](#9-realtime-sync)
10. [Example workflows & recipes](#10-example-workflows--recipes)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. One-time setup

### a. Install dependencies

```bash
npm install
```

### b. Add your environment variables

Copy the example and fill in your keys:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

- Supabase keys: **Supabase dashboard → Project Settings → API**
- Gemini key: **https://aistudio.google.com/app/apikey**

### c. Run the database SQL

In the Supabase **SQL Editor**, run these files **in order**. Each is safe to re-run.

| Order | File | What it does |
| ----- | ---- | ------------ |
| 1 | [`supabase/schema.sql`](supabase/schema.sql) | Creates `profiles` + `tasks`, RLS, triggers, realtime |
| 2 | [`supabase/profiles.sql`](supabase/profiles.sql) | Profile RLS + auto-create-on-signup trigger |
| 3 | [`supabase/storage.sql`](supabase/storage.sql) | `avatars` storage bucket + upload policies |

> Already have tables from an earlier version? Run [`supabase/migration.sql`](supabase/migration.sql) instead of `schema.sql` to patch them without losing data, then run `profiles.sql` and `storage.sql`.

### d. Configure email auth

**Supabase dashboard → Authentication → Providers → Email**:

- Make sure **Email** is enabled.
- For quick local testing, turn **Confirm email** *off* so sign-up logs you straight in. (Leave it on for production.)

---

## 2. Run the app

```bash
npm run dev
```

Open **http://localhost:3000**. You'll be redirected to `/login`.

---

## 3. Create your account

1. On the login screen, click **"Need an account? Sign up"**.
2. Fill in:
   - **Full name** — e.g. `Ada Lovelace`
   - **Email** — e.g. `ada@example.com`
   - **Password** — at least 6 characters
3. Click **Sign up**.

**What happens:**
- If "Confirm email" is **off** → you land on the dashboard immediately.
- If it's **on** → you'll see *"Check your inbox to confirm your email, then sign in."* Click the link in the email, then sign in.

> Behind the scenes, your name is saved to your account, and a database trigger automatically creates your row in the `profiles` table.

---

## 4. Set up your profile

1. In the top-right of the dashboard, click your **avatar / name**.
2. In the **Profile settings** dialog:
   - Click **Change photo** and pick an image → you'll see a live preview.
   - Edit your **Full name** if you like.
3. Click **Save**.

**Result:** the photo uploads to Supabase Storage, your header updates instantly, and any previous avatar file is cleaned up automatically (you keep exactly one).

---

## 5. Add tasks

There are two ways to add a task.

### Option A — Natural language (fastest)

Use the input bar at the top of the board. Just describe the task in plain English:

| You type | The AI produces |
| -------- | --------------- |
| `Email the design draft to Sam by Friday` | **Title:** Email design draft to Sam · **Due:** Friday · **Category:** Communication · **Priority:** medium |
| `Urgent: fix the login bug before the demo tomorrow` | **Title:** Fix login bug · **Priority:** urgent · **Category:** Bug · **Due:** tomorrow |
| `Plan Q3 marketing campaign` | **Title:** Plan Q3 marketing campaign · **Category:** Marketing · **Priority:** high · plus tags + a summary |

Press **Enter** (or click **Add with AI**). The task appears in the **To Do** column, already categorized, prioritized, tagged, and summarized.

### Option B — Structured form

1. Click **+ New task** (top-right).
2. Enter a **title** and optional **description**.
3. Click **Create**.

Gemini still enriches it automatically — you don't pick the category/priority/tags yourself; the AI infers them from your text.

**Example:**
- **Title:** `Write onboarding docs for new hires`
- **Description:** `Cover repo setup, deploy process, and the on-call rotation.`
- → categorized as *Documentation*, priority *medium*, tagged `#onboarding #docs`, with a one-line summary.

---

## 6. Let the AI work for you

### Automatic enrichment

Every task you create is analyzed by Google Gemini, which fills in:
- **Category** (e.g. Bug, Marketing, Documentation)
- **Priority** (`low` / `medium` / `high` / `urgent`)
- **Tags** (e.g. `#onboarding`)
- **Summary** (a one-line gist)
- **Estimated minutes** (stored in metadata)

### Break a task into sub-tasks

For anything complex:

1. Click a task card to open its **details** panel.
2. Click **✨ Break into sub-tasks**.

**Example** — for *"Plan Q3 marketing campaign"*, you might get:
- Define campaign goals and KPIs — `30m`
- Research target audience segments — `45m`
- Draft content calendar — `60m`
- Set budget and allocate channels — `30m`

These are saved as child tasks and listed in the details panel.

### Get AI suggestions

In the same details panel, click **💡 Suggest improvements**. Gemini streams concise, actionable advice for that task in real time (you'll see the text appear word by word).

---

## 7. Organize on the Kanban board

The board has three columns: **To Do → In Progress → Done**.

- **Drag any card** from one column to another to change its status.
- The change is saved immediately and persists across reloads.
- A counter on each column header shows how many tasks it holds.

> Tip: a quick *click* opens task details; *click-and-drag* moves the card. (Dragging needs a small movement before it kicks in, so clicks won't accidentally move cards.)

---

## 8. Task details

Click any card to open the side panel, where you can:

- Read the full **description** and **AI summary**
- See **status**, **priority**, **category**, and **due date**
- View and generate **sub-tasks**
- Get **AI suggestions**
- **Delete** the task (this also removes its sub-tasks)

---

## 9. Realtime sync

Open the app in **two browser tabs** (or two devices) signed in as the same user:

1. Create or move a task in one tab.
2. Watch it appear/update in the other **without refreshing**.

This is powered by Supabase Realtime — database changes invalidate the local cache and trigger an automatic refresh.

---

## 10. Example workflows & recipes

This section is a hands-on cookbook: copy these into the **"Add with AI"** bar (the natural-language input at the top of the board) and watch how Gemini turns them into structured tasks.

### 10.1 A library of natural-language inputs

#### 💼 Work & communication

| Type this | What you get |
| --------- | ------------ |
| `Send the Q2 revenue report to finance by end of day` | Title trimmed, **Category:** Finance, **Priority:** high, **Due:** today |
| `Schedule a 1:1 with my manager next week` | **Category:** Meetings, tags `#1on1`, due ~next week |
| `Follow up with the client who didn't reply to the proposal` | **Category:** Sales/Communication, **Priority:** medium |
| `Prepare slides for Monday's all-hands` | **Category:** Presentation, **Due:** Monday |

#### 🐛 Engineering

| Type this | What you get |
| --------- | ------------ |
| `Urgent: production checkout is throwing 500s, fix before noon` | **Priority:** urgent, **Category:** Bug, **Due:** today |
| `Refactor the auth module to use the new session API` | **Category:** Refactor, tags `#auth`, **Priority:** medium |
| `Write unit tests for the payment service` | **Category:** Testing, tags `#tests #payments` |
| `Investigate slow dashboard load times` | **Category:** Performance, **Priority:** high |

#### 🏠 Personal

| Type this | What you get |
| --------- | ------------ |
| `Book dentist appointment for next month` | **Category:** Health, due ~next month |
| `Buy groceries: milk, eggs, coffee` | **Category:** Errands, summary lists the items |
| `Renew car insurance before it expires on the 30th` | **Priority:** high, **Due:** the 30th |

> **How it reads dates:** phrases like *today, tomorrow, Friday, next week, on the 30th* are parsed into the task's **due date**. No special syntax needed — just write naturally.

### 10.2 Recipe: plan a project end-to-end

Goal: take a fuzzy idea and turn it into an organized, actionable plan.

1. **Capture the big task.** In the AI bar, type:
   > `Plan and launch the new company blog`

   → Lands in **To Do** as a *high priority* **Marketing/Content** task with a summary.

2. **Break it down.** Click the card → **✨ Break into sub-tasks**. You might get:
   - Choose a blogging platform — `45m`
   - Define content pillars and audience — `60m`
   - Draft an editorial calendar — `90m`
   - Set up analytics — `30m`
   - Write and publish the first post — `120m`

3. **Get advice.** Still in details, click **💡 Suggest improvements** for tips like *"start with 3 cornerstone posts before promoting"*.

4. **Work the board.** Drag sub-tasks/related tasks across **To Do → In Progress → Done** as you go.

### 10.3 Recipe: a daily workflow

A simple routine for using the app every day:

1. **Morning brain-dump.** Type everything on your mind into the AI bar, one line at a time:
   > `Reply to Sarah's email`
   > `Review the PR from Alex`
   > `Prep for the 2pm demo`

   Each becomes a categorized card in **To Do**.

2. **Triage by priority.** Cards show a colored priority badge (`urgent` red → `low` grey). Start at the top.

3. **Pull, don't push.** Drag the task you're actively doing into **In Progress** (keep this column short — ideally 1–2 cards).

4. **Close the loop.** Move finished work to **Done**. Delete anything that's no longer relevant (its sub-tasks go with it).

5. **Multi-device.** Add a task from your phone's browser during a meeting — it shows up on your laptop instantly (realtime sync).

### 10.4 Tips to get better AI results

The quality of categorization, tags, and sub-tasks depends on what you give the model.

- **Add context, not just a verb.** `Fix bug` → vague. `Fix the login redirect loop on Safari` → accurate category, tags, and priority.
- **Signal urgency in words.** Words like *urgent, ASAP, critical, before the demo* push the priority up.
- **Mention the "what" and "why"** in the description (structured form) for richer summaries and better sub-task breakdowns.
- **One task per line** in the AI bar — combine unrelated items and the AI will pick only one.
- **Re-roll if needed.** Don't like the generated sub-tasks? Delete them and click **Break into sub-tasks** again, or add more detail to the parent first.

---

## 11. Troubleshooting

| Symptom | Likely cause | Fix |
| ------- | ------------ | --- |
| Stuck on login after sign-up | "Confirm email" is on and email not confirmed | Confirm via the email link, or disable the setting for testing |
| `new row violates row-level security policy for table "profiles"` | Missing INSERT policy on `profiles` | Run [`supabase/profiles.sql`](supabase/profiles.sql) |
| Tasks won't create / AI errors | Invalid or missing `GEMINI_API_KEY` | Check `.env.local`, restart `npm run dev`; look at the terminal for the server error |
| `404 ... model is not found / not supported` | The Gemini model name is retired/unavailable | Set a current model in `.env.local`, e.g. `GEMINI_MODEL=gemini-2.5-flash`, and restart |
| Deleting a task throws a foreign-key error | `parent_task_id` missing `ON DELETE CASCADE` | Run [`supabase/migration.sql`](supabase/migration.sql) |
| Deletes/updates don't sync to other tabs | `tasks` table not set to `replica identity full` | Run [`supabase/migration.sql`](supabase/migration.sql) |
| Avatar upload fails | `avatars` bucket / policies not set up | Run [`supabase/storage.sql`](supabase/storage.sql) |
| Redirected to `/login` unexpectedly | Session expired or cookies cleared | Sign in again |

Still stuck? Check the **dev-server terminal** — server actions and route handlers log their errors there, which usually points straight at the cause.

---

Happy task managing! 🚀
