-- MaPlan: perfiles con nombre personal + @usuario unico
-- Safe to re-run in Supabase SQL Editor.

alter table public.profiles
  add column if not exists full_name text;

alter table public.profiles
  add column if not exists deleted_at timestamptz;

-- Backfill inicial para no dejar vacio el nombre en usuarios existentes.
update public.profiles
set full_name = username
where (full_name is null or btrim(full_name) = '')
  and username is not null
  and btrim(username) <> '';

create or replace function public.generate_profile_username(p_user_id uuid, p_requested_username text default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base_username text;
  v_candidate text;
  v_suffix integer := 0;
begin
  v_base_username := lower(btrim(coalesce(p_requested_username, '')));
  v_base_username := regexp_replace(v_base_username, '[^a-z0-9_.-]+', '', 'g');

  if length(v_base_username) < 3 or length(v_base_username) > 30 then
    v_base_username := 'user_' || substring(replace(p_user_id::text, '-', '') from 1 for 8);
  end if;

  v_candidate := substring(v_base_username from 1 for 30);

  while exists (
    select 1
    from public.profiles
    where username = v_candidate
      and id <> p_user_id
  ) loop
    v_suffix := v_suffix + 1;
    v_candidate := substring(v_base_username from 1 for greatest(3, 30 - length(v_suffix::text) - 1)) || '_' || v_suffix::text;
  end loop;

  return v_candidate;
end;
$$;

revoke execute on function public.generate_profile_username(uuid, text) from public;

-- Profile creation must not depend on a browser insert after sign-up: when
-- email confirmation is enabled the new user has no authenticated session yet.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requested_username text;
begin
  v_requested_username := nullif(lower(btrim(coalesce(
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'preferred_username'
  ))), '');

  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    public.generate_profile_username(new.id, v_requested_username),
    nullif(btrim(coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )), '')
  )
  on conflict (id) do update
  set
    username = coalesce(public.profiles.username, excluded.username),
    full_name = coalesce(excluded.full_name, public.profiles.full_name);

  return new;
end;
$$;

revoke execute on function public.handle_new_user_profile() from public;

drop trigger if exists trg_create_profile_after_signup on auth.users;
create trigger trg_create_profile_after_signup
after insert on auth.users
for each row execute function public.handle_new_user_profile();
