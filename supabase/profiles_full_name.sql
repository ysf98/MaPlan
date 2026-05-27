-- MaPlan: perfiles con nombre personal + @usuario unico
-- Safe to re-run in Supabase SQL Editor.

alter table public.profiles
  add column if not exists full_name text;

-- Backfill inicial para no dejar vacio el nombre en usuarios existentes.
update public.profiles
set full_name = username
where (full_name is null or btrim(full_name) = '')
  and username is not null
  and btrim(username) <> '';

-- Profile creation must not depend on a browser insert after sign-up: when
-- email confirmation is enabled the new user has no authenticated session yet.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    nullif(lower(btrim(new.raw_user_meta_data ->> 'username')), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), '')
  )
  on conflict (id) do update
  set
    username = coalesce(excluded.username, public.profiles.username),
    full_name = coalesce(excluded.full_name, public.profiles.full_name);

  return new;
end;
$$;

revoke execute on function public.handle_new_user_profile() from public;

drop trigger if exists trg_create_profile_after_signup on auth.users;
create trigger trg_create_profile_after_signup
after insert on auth.users
for each row execute function public.handle_new_user_profile();
