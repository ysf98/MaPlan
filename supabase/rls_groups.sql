-- MaPlan: baseline RLS policies for groups + memberships
-- Run this in Supabase SQL Editor for your project.

-- Recommended: avoid duplicate memberships.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'group_members_group_user_unique'
  ) then
    alter table public.group_members
      add constraint group_members_group_user_unique unique (group_id, user_id);
  end if;
end $$;

-- Enable RLS
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- Reset previous versions of policies (idempotent script)
drop policy if exists "groups_select_member_only" on public.groups;
drop policy if exists "groups_insert_creator_only" on public.groups;
drop policy if exists "groups_update_owner_only" on public.groups;
drop policy if exists "group_members_select_same_group" on public.group_members;
drop policy if exists "group_members_insert_self_only" on public.group_members;
drop policy if exists "group_members_delete_owner_only" on public.group_members;

-- GROUPS
-- Read only groups where current user is a member.
create policy "groups_select_member_only"
on public.groups
for select
to authenticated
using (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = groups.id
      and gm.user_id = auth.uid()
  )
);

-- Allow creating groups only as yourself.
create policy "groups_insert_creator_only"
on public.groups
for insert
to authenticated
with check (created_by = auth.uid());

-- Optional but useful for future edits: only owners can update group.
create policy "groups_update_owner_only"
on public.groups
for update
to authenticated
using (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = groups.id
      and gm.user_id = auth.uid()
      and gm.role = 'owner'
  )
)
with check (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = groups.id
      and gm.user_id = auth.uid()
      and gm.role = 'owner'
  )
);

-- GROUP_MEMBERS
-- Read only your own memberships.
create policy "group_members_select_same_group"
on public.group_members
for select
to authenticated
using (user_id = auth.uid());

-- Allow user to insert own membership (needed for create group + join by code).
create policy "group_members_insert_self_only"
on public.group_members
for insert
to authenticated
with check (user_id = auth.uid());

-- Optional hardening: only owners can remove members.
create policy "group_members_delete_owner_only"
on public.group_members
for delete
to authenticated
using (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'owner'
  )
);
