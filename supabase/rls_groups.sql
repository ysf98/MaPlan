-- MaPlan: RLS + schema baseline for groups and join requests
-- Safe to re-run in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- 1) Columns for group policies
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'groups' and column_name = 'place_edit_policy'
  ) then
    alter table public.groups add column place_edit_policy text not null default 'members_can_edit';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'groups' and column_name = 'join_policy'
  ) then
    alter table public.groups add column join_policy text not null default 'open_by_code';
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'groups_place_edit_policy_check') then
    alter table public.groups
      add constraint groups_place_edit_policy_check
      check (place_edit_policy in ('owner_only', 'members_can_edit'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'groups_join_policy_check') then
    alter table public.groups
      add constraint groups_join_policy_check
      check (join_policy in ('open_by_code', 'request_to_join'));
  end if;
end $$;

-- 2) Join requests table
create table if not exists public.group_join_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  message text null,
  reviewed_by uuid null references auth.users(id) on delete set null,
  reviewed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'group_join_requests_status_check') then
    alter table public.group_join_requests
      add constraint group_join_requests_status_check
      check (status in ('pending', 'approved', 'rejected'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'group_join_requests_group_user_unique') then
    alter table public.group_join_requests
      add constraint group_join_requests_group_user_unique unique (group_id, user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'group_join_requests' and indexname = 'idx_group_join_requests_group_status'
  ) then
    create index idx_group_join_requests_group_status on public.group_join_requests (group_id, status, created_at desc);
  end if;

  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'group_join_requests' and indexname = 'idx_group_join_requests_user'
  ) then
    create index idx_group_join_requests_user on public.group_join_requests (user_id, created_at desc);
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_group_join_requests_updated_at on public.group_join_requests;
create trigger trg_group_join_requests_updated_at
before update on public.group_join_requests
for each row execute function public.set_updated_at();

-- 3) Grants
grant select, insert, update, delete on table public.groups to authenticated;
grant select, insert, update, delete on table public.group_members to authenticated;
grant select, insert, update, delete on table public.group_join_requests to authenticated;

-- 4) RLS enable
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_join_requests enable row level security;

-- 5) Unique membership safeguard
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'group_members_group_user_unique'
  ) then
    alter table public.group_members
      add constraint group_members_group_user_unique unique (group_id, user_id);
  end if;
end $$;

-- 6) Drop existing policies for deterministic setup
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('groups', 'group_members', 'group_join_requests')
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- 7) GROUPS policies
-- Important: the creator must be able to read the newly created group row
-- right after INSERT (before group_members owner row exists), otherwise
-- `insert(...).select("id").single()` is blocked by RLS.
create policy groups_select_member_or_creator
on public.groups
for select to authenticated
using (
  created_by = auth.uid()
  or exists (
      select 1
      from public.group_members gm
      where gm.group_id = groups.id
        and gm.user_id = auth.uid()
    )
);

create policy groups_insert_creator_only
on public.groups
for insert to authenticated
with check (
  auth.uid() is not null
  and created_by = auth.uid()
);

create policy groups_update_owner_only
on public.groups
for update to authenticated
using (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = groups.id
      and gm.user_id = auth.uid()
      and gm.role = 'owner'
  )
)
with check (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = groups.id
      and gm.user_id = auth.uid()
      and gm.role = 'owner'
  )
);

create policy groups_delete_creator_or_owner
on public.groups
for delete to authenticated
using (
  created_by = auth.uid()
  or exists (
    select 1
    from public.group_members gm
    where gm.group_id = groups.id
      and gm.user_id = auth.uid()
      and gm.role = 'owner'
  )
);

-- 8) GROUP_MEMBERS policies
create policy group_members_select_own
on public.group_members
for select to authenticated
using (user_id = auth.uid());

create policy group_members_insert_self_join_allowed
on public.group_members
for insert to authenticated
with check (
  auth.uid() is not null
  and user_id = auth.uid()
  and role = 'member'
  and (
    exists (
      select 1
      from public.groups g
      where g.id = group_members.group_id
        and g.join_policy = 'open_by_code'
    )
    or exists (
      select 1
      from public.group_join_requests r
      where r.group_id = group_members.group_id
        and r.user_id = auth.uid()
        and r.status = 'approved'
    )
  )
);

create policy group_members_insert_owner_manage
on public.group_members
for insert to authenticated
with check (
  exists (
    select 1 from public.groups g
    where g.id = group_members.group_id
      and g.created_by = auth.uid()
  )
);

create policy group_members_delete_owner_or_self
on public.group_members
for delete to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.groups g
    where g.id = group_members.group_id
      and g.created_by = auth.uid()
  )
);

-- 9) GROUP JOIN REQUESTS policies
create policy group_join_requests_select_own_or_owner
on public.group_join_requests
for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.group_members gm
    where gm.group_id = group_join_requests.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'owner'
  )
);

create policy group_join_requests_insert_self_pending
on public.group_join_requests
for insert to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'
);

create policy group_join_requests_update_owner_review
on public.group_join_requests
for update to authenticated
using (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = group_join_requests.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'owner'
  )
)
with check (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = group_join_requests.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'owner'
  )
  and status in ('approved', 'rejected')
);

create policy group_join_requests_update_requester_reopen
on public.group_join_requests
for update to authenticated
using (
  user_id = auth.uid()
)
with check (
  user_id = auth.uid()
  and status = 'pending'
);
