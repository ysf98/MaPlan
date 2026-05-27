-- MaPlan: group invitations baseline
-- Safe to re-run in Supabase SQL Editor.
-- Run this after rls_groups.sql and rls_friends.sql.

create extension if not exists pgcrypto;

create table if not exists public.group_invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete cascade,
  invited_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'group_invitations_status_check') then
    alter table public.group_invitations
      add constraint group_invitations_status_check
      check (status in ('pending', 'accepted', 'rejected'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'group_invitations_not_self') then
    alter table public.group_invitations
      add constraint group_invitations_not_self
      check (invited_by <> invited_user_id);
  end if;
end $$;

create unique index if not exists idx_group_invitations_group_user_unique
  on public.group_invitations (group_id, invited_user_id);

create index if not exists idx_group_invitations_invited_user_status
  on public.group_invitations (invited_user_id, status, created_at desc);

create index if not exists idx_group_invitations_group_status
  on public.group_invitations (group_id, status, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_group_invitations_updated_at on public.group_invitations;
create trigger trg_group_invitations_updated_at
before update on public.group_invitations
for each row execute function public.set_updated_at();

grant select, insert, update on table public.group_invitations to authenticated;

alter table public.group_invitations enable row level security;

drop policy if exists group_invitations_select_invited_or_owner on public.group_invitations;
drop policy if exists group_invitations_insert_owner_only on public.group_invitations;
drop policy if exists group_invitations_insert_manager on public.group_invitations;
drop policy if exists group_invitations_update_invited_decision on public.group_invitations;
drop policy if exists group_invitations_update_owner_reinvite on public.group_invitations;
drop policy if exists group_members_insert_self_invitation_accepted on public.group_members;
drop policy if exists groups_select_invited_user on public.groups;

create or replace function public.can_manage_group_invitations(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = p_user_id
      and (
        gm.role = 'owner'
        or exists (
          select 1
          from public.groups g
          where g.id = p_group_id
            and g.privacy = 'abierto'
        )
      )
  );
$$;

revoke execute on function public.can_manage_group_invitations(uuid, uuid) from public;
grant execute on function public.can_manage_group_invitations(uuid, uuid) to authenticated;

create policy group_invitations_select_invited_or_owner
on public.group_invitations
for select to authenticated
using (
  invited_user_id = auth.uid()
  or public.can_manage_group_invitations(group_invitations.group_id, auth.uid())
);

create policy group_invitations_insert_manager
on public.group_invitations
for insert to authenticated
with check (
  invited_by = auth.uid()
  and status = 'pending'
  and invited_by <> invited_user_id
  and public.can_manage_group_invitations(group_invitations.group_id, auth.uid())
  and exists (
    select 1
    from public.friendships f
    where
      (f.user_a_id = least(invited_by, invited_user_id) and f.user_b_id = greatest(invited_by, invited_user_id))
  )
);

create policy group_invitations_update_invited_decision
on public.group_invitations
for update to authenticated
using (
  invited_user_id = auth.uid()
  and status = 'pending'
)
with check (
  invited_user_id = auth.uid()
  and status in ('accepted', 'rejected')
);

-- Allow owner to reactivate a previous invitation (re-invite flow).
create policy group_invitations_update_owner_reinvite
on public.group_invitations
for update to authenticated
using (
  public.can_manage_group_invitations(group_invitations.group_id, auth.uid())
)
with check (
  public.can_manage_group_invitations(group_invitations.group_id, auth.uid())
  and invited_by = auth.uid()
  and invited_by <> invited_user_id
  and status = 'pending'
  and exists (
    select 1
    from public.friendships f
    where f.user_a_id = least(group_invitations.invited_by, group_invitations.invited_user_id)
      and f.user_b_id = greatest(group_invitations.invited_by, group_invitations.invited_user_id)
  )
);

create policy group_members_insert_self_invitation_accepted
on public.group_members
for insert to authenticated
with check (
  user_id = auth.uid()
  and role = 'member'
  and exists (
    select 1
    from public.group_invitations gi
    where gi.group_id = group_members.group_id
      and gi.invited_user_id = auth.uid()
      and gi.status = 'accepted'
  )
);

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

-- Atomic acceptance: invitation -> accepted + group membership insert in one transaction.
create or replace function public.accept_group_invitation(invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
  v_invited_user_id uuid;
  v_status text;
begin
  select group_id, invited_user_id, status
  into v_group_id, v_invited_user_id, v_status
  from public.group_invitations
  where id = invitation_id
  for update;

  if v_group_id is null then
    raise exception 'Invitacion no encontrada.';
  end if;

  if v_invited_user_id <> auth.uid() then
    raise exception 'No tienes permisos para responder esta invitacion.';
  end if;

  if v_status <> 'pending' then
    raise exception 'Esta invitacion ya fue respondida.';
  end if;

  update public.group_invitations
  set status = 'accepted'
  where id = invitation_id;

  insert into public.group_members (group_id, user_id, role)
  values (v_group_id, v_invited_user_id, 'member')
  on conflict (group_id, user_id) do nothing;
end;
$$;

revoke execute on function public.accept_group_invitation(uuid) from public;
grant execute on function public.accept_group_invitation(uuid) to authenticated;
