-- Incremental migration to bring an existing `tasks` table up to spec.
-- Safe to run on a table that already has data — nothing is dropped.

-- 1. Cascade sub-task deletes (fixes FK violation when deleting a parent).
--    The default constraint name is tasks_parent_task_id_fkey; adjust if yours
--    differs (check: \d public.tasks  or the Supabase table editor).
alter table public.tasks
  drop constraint if exists tasks_parent_task_id_fkey;
alter table public.tasks
  add constraint tasks_parent_task_id_fkey
  foreign key (parent_task_id) references public.tasks (id) on delete cascade;

-- 2. Auto-update updated_at on every write.
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

-- 3. Default ai_tags to an empty array and backfill existing nulls.
alter table public.tasks alter column ai_tags set default '{}';
update public.tasks set ai_tags = '{}' where ai_tags is null;

-- 4. Helpful indexes.
create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_parent_idx on public.tasks (parent_task_id);

-- 5. Let filtered realtime receive UPDATE/DELETE events with user_id.
alter table public.tasks replica identity full;
