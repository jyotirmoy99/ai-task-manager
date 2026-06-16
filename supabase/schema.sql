-- AI Task Manager — database schema
-- Run this in the Supabase SQL editor (or `supabase db push`) for your project.

-- Profiles table ----------------------------------------------------------
-- App-specific user info (auth.users cannot be extended with columns).
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  avatar_url text,
  updated_at timestamptz not null default now()
);

-- Tasks table -------------------------------------------------------------
create table if not exists public.tasks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  title          text not null,
  description    text,
  status         text not null default 'todo'
                   check (status in ('todo', 'in_progress', 'done', 'archived')),
  category       text,
  priority       text not null default 'medium'
                   check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date       timestamptz,
  ai_tags        text[] not null default '{}',
  ai_summary     text,
  parent_task_id uuid references public.tasks (id) on delete cascade,
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_parent_idx on public.tasks (parent_task_id);

-- Keep updated_at fresh on every write.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- Row Level Security ------------------------------------------------------
alter table public.tasks enable row level security;

drop policy if exists "Users manage their own tasks" on public.tasks;
create policy "Users manage their own tasks"
  on public.tasks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Profiles RLS: each user reads/updates only their own profile.
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile row on sign-up, copying full_name/avatar_url from the
-- auth metadata set by supabase.auth.signUp({ options: { data } }).
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Realtime ----------------------------------------------------------------
-- Enables the postgres_changes subscription used by useRealtimeTasks.
alter publication supabase_realtime add table public.tasks;

-- replica identity full so filtered UPDATE/DELETE events include user_id.
alter table public.tasks replica identity full;
