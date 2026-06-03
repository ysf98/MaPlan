-- MaPlan: RLS + schema baseline for groups and join requests
-- Safe to re-run in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- 1) Columns for group policies
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'groups' and column_name = 'privacy'
  ) then
    alter table public.groups add column privacy text not null default 'abierto';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'groups' and column_name = 'join_policy'
  ) then
    alter table public.groups add column join_policy text not null default 'invite_only';
  end if;
end $$;

alter table public.groups
  alter column join_policy set default 'invite_only';

do $$
begin
  alter table public.groups drop constraint if exists groups_join_policy_check;

  if not exists (select 1 from pg_constraint where conname = 'groups_join_policy_check') then
    alter table public.groups
      add constraint groups_join_policy_check
      check (join_policy in ('invite_only', 'open_by_code', 'request_to_join'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'groups_privacy_check') then
    alter table public.groups
      add constraint groups_privacy_check
      check (privacy in ('privado', 'abierto'));
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

-- RLS-safe predicates for membership mutations. Keeping their internal reads
-- behind security definer prevents the groups <-> group_members policy cycle.
drop function if exists public.is_group_creator(uuid);

create or replace function public.is_group_creator(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.groups g
    where g.id = p_group_id
      and g.created_by = p_user_id
  );
$$;

create or replace function public.can_join_group_as_member(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.groups g
    where g.id = p_group_id
      and g.join_policy = 'open_by_code'
  )
  or exists (
    select 1
    from public.group_join_requests r
    where r.group_id = p_group_id
      and r.user_id = p_user_id
      and r.status = 'approved'
  );
$$;

create or replace function public.can_manage_group_members(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.groups g
    where g.id = p_group_id
      and (
        g.created_by = p_user_id
        or (
          g.privacy = 'abierto'
          and exists (
            select 1
            from public.group_members gm
            where gm.group_id = p_group_id
              and gm.user_id = p_user_id
          )
        )
      )
  );
$$;

revoke execute on function public.is_group_creator(uuid, uuid) from public;
revoke execute on function public.can_join_group_as_member(uuid, uuid) from public;
revoke execute on function public.can_manage_group_members(uuid, uuid) from public;
grant execute on function public.is_group_creator(uuid, uuid) to authenticated;
grant execute on function public.can_join_group_as_member(uuid, uuid) to authenticated;
grant execute on function public.can_manage_group_members(uuid, uuid) to authenticated;

-- Enforce protected columns for editors that can update an open group.
-- RLS controls who may edit; this trigger controls which sensitive values
-- may be changed even through a direct Supabase client request.
create or replace function public.enforce_group_protected_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is distinct from old.created_by
    or new.join_code is distinct from old.join_code then
    raise exception 'No se pueden cambiar campos protegidos del grupo.';
  end if;

  if new.privacy is distinct from old.privacy
    and not exists (
      select 1
      from public.group_members gm
      where gm.group_id = old.id
        and gm.user_id = auth.uid()
        and gm.role = 'owner'
    ) then
    raise exception 'Solo el administrador puede cambiar la privacidad del grupo.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_groups_protected_updates on public.groups;
create trigger trg_groups_protected_updates
before update on public.groups
for each row execute function public.enforce_group_protected_updates();

revoke execute on function public.enforce_group_protected_updates() from public;

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
  or exists (
      select 1
      from public.group_join_requests r
      where r.group_id = groups.id
        and r.user_id = auth.uid()
    )
  -- Limited discoverability for code-based access flows.
  -- This keeps invite_only groups private while allowing join-by-code and request-by-code
  -- to resolve target groups without service-role bypass.
  or groups.join_policy in ('open_by_code', 'request_to_join')
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
  or (
    groups.privacy = 'abierto'
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = groups.id
        and gm.user_id = auth.uid()
    )
  )
)
with check (
  exists (
    select 1 from public.group_members gm
    where gm.group_id = groups.id
      and gm.user_id = auth.uid()
      and gm.role = 'owner'
  )
  or (
    groups.privacy = 'abierto'
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = groups.id
        and gm.user_id = auth.uid()
    )
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

-- NOTE:
-- Avoid recursive checks between groups -> group_members -> groups policies.
-- Members can always read their own membership row; richer roster access is exposed
-- through get_group_members_with_profiles() (security definer RPC).

create policy group_members_insert_self_join_allowed
on public.group_members
for insert to authenticated
with check (
  auth.uid() is not null
  and user_id = auth.uid()
  and role = 'member'
  and public.can_join_group_as_member(group_members.group_id, auth.uid())
);

create policy group_members_insert_creator_owner
on public.group_members
for insert to authenticated
with check (
  group_members.user_id = auth.uid()
  and group_members.role = 'owner'
  and public.is_group_creator(group_members.group_id, auth.uid())
);

create policy group_members_delete_owner_or_self
on public.group_members
for delete to authenticated
using (
  role = 'member'
  and (
    user_id = auth.uid()
    or public.can_manage_group_members(group_members.group_id, auth.uid())
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

-- Atomic approval for request_to_join:
-- updates request status and membership in a single transaction.
create or replace function public.approve_group_join_request(p_group_id uuid, p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_user_id uuid;
  v_request_group_id uuid;
  v_request_status text;
begin
  select r.user_id, r.group_id, r.status
  into v_request_user_id, v_request_group_id, v_request_status
  from public.group_join_requests r
  where r.id = p_request_id
  for update;

  if v_request_user_id is null then
    raise exception 'No se encontro la solicitud.';
  end if;

  if v_request_group_id <> p_group_id then
    raise exception 'La solicitud no pertenece al grupo indicado.';
  end if;

  if not exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = auth.uid()
      and gm.role = 'owner'
  ) then
    raise exception 'No tienes permisos para gestionar solicitudes de este grupo.';
  end if;

  if v_request_status <> 'pending' then
    raise exception 'La solicitud ya fue revisada.';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (p_group_id, v_request_user_id, 'member')
  on conflict (group_id, user_id) do nothing;

  update public.group_join_requests
  set
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = now()
  where id = p_request_id;
end;
$$;

revoke execute on function public.approve_group_join_request(uuid, uuid) from public;
grant execute on function public.approve_group_join_request(uuid, uuid) to authenticated;

-- Safe member listing for UI previews:
-- members can read roster data of groups they belong to, without broadening
-- direct SELECT policies on group_members.
create or replace function public.get_group_members_with_profiles(p_group_id uuid, p_limit integer default null)
returns table (
  user_id uuid,
  role text,
  created_at timestamptz,
  username text,
  avatar_url text
)
language sql
security definer
set search_path = public
as $$
  with authorized as (
    select exists (
      select 1
      from public.group_members gm_auth
      where gm_auth.group_id = p_group_id
        and gm_auth.user_id = auth.uid()
    ) as ok
  )
  select
    gm.user_id,
    gm.role,
    gm.created_at,
    p.username,
    p.avatar_url
  from public.group_members gm
  join authorized a on a.ok
  left join public.profiles p on p.id = gm.user_id
  where gm.group_id = p_group_id
  order by gm.created_at asc
  limit case when p_limit is null or p_limit <= 0 then null else p_limit end;
$$;

revoke execute on function public.get_group_members_with_profiles(uuid, integer) from public;
grant execute on function public.get_group_members_with_profiles(uuid, integer) to authenticated;

create or replace function public.kick_group_member(p_group_id uuid, p_member_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_user_id uuid;
  v_target_role text;
begin
  select g.created_by
  into v_owner_user_id
  from public.groups g
  where g.id = p_group_id;

  if v_owner_user_id is null then
    raise exception 'Grupo invalido.';
  end if;

  if auth.uid() is null or not (
    v_owner_user_id = auth.uid()
    or exists (
      select 1
      from public.group_members gm
      where gm.group_id = p_group_id
        and gm.user_id = auth.uid()
        and gm.role = 'owner'
    )
  ) then
    raise exception 'Solo el administrador puede expulsar miembros.';
  end if;

  if p_member_user_id = v_owner_user_id then
    raise exception 'No puedes expulsar al administrador del grupo.';
  end if;

  select gm.role
  into v_target_role
  from public.group_members gm
  where gm.group_id = p_group_id
    and gm.user_id = p_member_user_id
  for update;

  if v_target_role is null then
    raise exception 'El miembro ya no pertenece al grupo.';
  end if;

  if v_target_role <> 'member' then
    raise exception 'No puedes expulsar al administrador del grupo.';
  end if;

  delete from public.group_members
  where group_id = p_group_id
    and user_id = p_member_user_id;

  delete from public.group_join_requests
  where group_id = p_group_id
    and user_id = p_member_user_id;

  update public.group_invitations
  set status = 'rejected', updated_at = now()
  where group_id = p_group_id
    and invited_user_id = p_member_user_id
    and status = 'pending';
end;
$$;

revoke execute on function public.kick_group_member(uuid, uuid) from public;
grant execute on function public.kick_group_member(uuid, uuid) to authenticated;

-- If invitations table exists, keep visibility for invited users on groups
-- so invitation UIs can show group names (not only IDs) after re-running this file.
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'group_invitations'
  ) then
    drop policy if exists groups_select_invited_user on public.groups;

    create policy groups_select_invited_user
    on public.groups
    for select to authenticated
    using (
      exists (
        select 1
        from public.group_invitations gi
        where gi.group_id = groups.id
          and gi.invited_user_id = auth.uid()
          and gi.status in ('pending', 'accepted')
      )
    );
  end if;
end $$;
