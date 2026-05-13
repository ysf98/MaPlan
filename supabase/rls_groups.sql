-- MaPlan: hardened baseline RLS for groups + memberships
-- Safe to re-run in Supabase SQL Editor.

-- 1) Required privileges for Data API roles
grant select, insert, update, delete on table public.groups to authenticated;
grant select, insert, update, delete on table public.group_members to authenticated;

-- 2) Recommended unique membership pair
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

-- 3) Enable RLS
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- 4) Drop all existing policies on these tables to avoid collisions
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('groups', 'group_members')
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- 5) GROUPS policies
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

create policy "groups_insert_creator_only"
on public.groups
for insert
to authenticated
with check (
  auth.uid() is not null
  and created_by = auth.uid()
);

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

-- 6) GROUP_MEMBERS policies (no recursive self-queries)
create policy "group_members_select_own"
on public.group_members
for select
to authenticated
using (user_id = auth.uid());

create policy "group_members_insert_self_only"
on public.group_members
for insert
to authenticated
with check (
  auth.uid() is not null
  and user_id = auth.uid()
);

-- Delete allowed when the caller is group owner or deleting their own row
create policy "group_members_delete_owner_or_self"
on public.group_members
for delete
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.groups g
    where g.id = group_members.group_id
      and g.created_by = auth.uid()
  )
);
