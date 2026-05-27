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
