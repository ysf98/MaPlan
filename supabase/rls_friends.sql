-- MaPlan: friends baseline (requests + friendships)
-- Safe to re-run in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- 0) Username uniqueness (fails if duplicates exist; fix manually first)
do $$
begin
  if exists (
    select username
    from public.profiles
    where username is not null and btrim(username) <> ''
    group by username
    having count(*) > 1
  ) then
    raise exception 'Duplicate usernames detected in public.profiles. Resolve duplicates before applying unique constraint.';
  end if;
end $$;

create unique index if not exists idx_profiles_username_unique
  on public.profiles (username)
  where username is not null and btrim(username) <> '';

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references auth.users(id) on delete cascade,
  user_b_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'friend_requests_status_check') then
    alter table public.friend_requests
      add constraint friend_requests_status_check
      check (status in ('pending', 'accepted', 'rejected'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'friend_requests_sender_receiver_diff') then
    alter table public.friend_requests
      add constraint friend_requests_sender_receiver_diff
      check (sender_id <> receiver_id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'friendships_user_diff') then
    alter table public.friendships
      add constraint friendships_user_diff
      check (user_a_id <> user_b_id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'friendships_user_order_check') then
    alter table public.friendships
      add constraint friendships_user_order_check
      check (user_a_id < user_b_id);
  end if;
end $$;

drop index if exists idx_friend_requests_pair_unique;

create unique index if not exists idx_friend_requests_pair_pending_unique
  on public.friend_requests (least(sender_id, receiver_id), greatest(sender_id, receiver_id))
  where status = 'pending';

create unique index if not exists idx_friendships_pair_unique
  on public.friendships (user_a_id, user_b_id);

create index if not exists idx_friend_requests_receiver_status
  on public.friend_requests (receiver_id, status, created_at desc);

create index if not exists idx_friend_requests_sender_status
  on public.friend_requests (sender_id, status, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_friend_requests_updated_at on public.friend_requests;
create trigger trg_friend_requests_updated_at
before update on public.friend_requests
for each row execute function public.set_updated_at();

grant select, insert, update, delete on table public.friend_requests to authenticated;
grant select, insert, delete on table public.friendships to authenticated;

alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;

drop policy if exists friend_requests_select_own on public.friend_requests;
drop policy if exists friend_requests_insert_sender_only on public.friend_requests;
drop policy if exists friend_requests_update_receiver_decision on public.friend_requests;
drop policy if exists friend_requests_delete_sender_pending on public.friend_requests;
drop policy if exists friendships_select_participant on public.friendships;
drop policy if exists friendships_insert_from_accepted_request on public.friendships;
drop policy if exists friendships_delete_participant on public.friendships;

create policy friend_requests_select_own
on public.friend_requests
for select to authenticated
using (sender_id = auth.uid() or receiver_id = auth.uid());

create policy friend_requests_insert_sender_only
on public.friend_requests
for insert to authenticated
with check (
  sender_id = auth.uid()
  and sender_id <> receiver_id
  and status = 'pending'
);

create policy friend_requests_update_receiver_decision
on public.friend_requests
for update to authenticated
using (
  receiver_id = auth.uid()
  and status = 'pending'
)
with check (
  receiver_id = auth.uid()
  and status in ('accepted', 'rejected')
);

create policy friend_requests_delete_sender_pending
on public.friend_requests
for delete to authenticated
using (
  sender_id = auth.uid()
  and status = 'pending'
);

create policy friendships_select_participant
on public.friendships
for select to authenticated
using (user_a_id = auth.uid() or user_b_id = auth.uid());

create policy friendships_insert_from_accepted_request
on public.friendships
for insert to authenticated
with check (
  auth.uid() in (user_a_id, user_b_id)
  and exists (
    select 1
    from public.friend_requests fr
    where fr.status = 'accepted'
      and (
        (fr.sender_id = user_a_id and fr.receiver_id = user_b_id)
        or (fr.sender_id = user_b_id and fr.receiver_id = user_a_id)
      )
  )
);

create policy friendships_delete_participant
on public.friendships
for delete to authenticated
using (auth.uid() in (user_a_id, user_b_id));

-- Allow username discovery for friend search.
-- This policy only exposes rows that have a non-empty username and only to authenticated users.
drop policy if exists profiles_select_for_friend_search on public.profiles;

create policy profiles_select_for_friend_search
on public.profiles
for select to authenticated
using (
  auth.uid() is not null
  and username is not null
  and btrim(username) <> ''
);

-- Atomic acceptance: request -> accepted + friendship insert in one transaction.
create or replace function public.accept_friend_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_id uuid;
  v_receiver_id uuid;
  v_status text;
begin
  select sender_id, receiver_id, status
  into v_sender_id, v_receiver_id, v_status
  from public.friend_requests
  where id = request_id
  for update;

  if v_sender_id is null then
    raise exception 'Solicitud no encontrada.';
  end if;

  if v_receiver_id <> auth.uid() then
    raise exception 'No tienes permisos para responder esta solicitud.';
  end if;

  if v_status <> 'pending' then
    raise exception 'Esta solicitud ya fue respondida.';
  end if;

  update public.friend_requests
  set status = 'accepted'
  where id = request_id;

  insert into public.friendships (user_a_id, user_b_id)
  values (least(v_sender_id, v_receiver_id), greatest(v_sender_id, v_receiver_id))
  on conflict (user_a_id, user_b_id) do nothing;
end;
$$;

grant execute on function public.accept_friend_request(uuid) to authenticated;

-- Stable user search endpoint for authenticated users.
create or replace function public.search_profiles_by_username(p_query text)
returns table(id uuid, username text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  return query
  select p.id, p.username
  from public.profiles p
  where p.id <> auth.uid()
    and p.username is not null
    and btrim(p.username) <> ''
    and p.username ilike ('%' || coalesce(p_query, '') || '%')
  order by p.username asc
  limit 20;
end;
$$;

grant execute on function public.search_profiles_by_username(text) to authenticated;

drop function if exists public.get_profiles_by_ids(uuid[]);

create or replace function public.get_profiles_by_ids(p_ids uuid[])
returns table(id uuid, username text, avatar_url text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  return query
  select p.id, p.username, p.avatar_url
  from public.profiles p
  where p.id = any(coalesce(p_ids, '{}'));
end;
$$;

grant execute on function public.get_profiles_by_ids(uuid[]) to authenticated;
