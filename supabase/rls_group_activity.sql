-- MaPlan: Group activity events (dashboard novedades)
-- Safe to re-run in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.group_activity_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  entity_id uuid null,
  entity_name text null,
  metadata jsonb null,
  created_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'group_activity_events_event_type_check'
  ) then
    alter table public.group_activity_events
      drop constraint group_activity_events_event_type_check;
  end if;

  alter table public.group_activity_events
    add constraint group_activity_events_event_type_check
    check (event_type in ('place_added', 'plan_created'));
end $$;

create index if not exists idx_group_activity_group_created_at_desc
  on public.group_activity_events (group_id, created_at desc);

create index if not exists idx_group_activity_created_at_desc
  on public.group_activity_events (created_at desc);

create index if not exists idx_group_activity_actor_created_at_desc
  on public.group_activity_events (actor_user_id, created_at desc);

grant select, insert on table public.group_activity_events to authenticated;

alter table public.group_activity_events enable row level security;

drop policy if exists group_activity_select_group_member on public.group_activity_events;
create policy group_activity_select_group_member
on public.group_activity_events
for select
to authenticated
using (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = group_activity_events.group_id
      and gm.user_id = auth.uid()
  )
);

drop policy if exists group_activity_insert_editor_only on public.group_activity_events;
create policy group_activity_insert_editor_only
on public.group_activity_events
for insert
to authenticated
with check (
  actor_user_id = auth.uid()
  and event_type in ('place_added', 'plan_created')
  and (
    exists (
      select 1
      from public.group_members gm
      where gm.group_id = group_activity_events.group_id
        and gm.user_id = auth.uid()
        and gm.role = 'owner'
    )
    or exists (
      select 1
      from public.group_members gm
      join public.groups g on g.id = gm.group_id
      where gm.group_id = group_activity_events.group_id
        and gm.user_id = auth.uid()
        and g.privacy = 'abierto'
    )
  )
);
