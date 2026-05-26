-- MaPlan: add group privacy model (privado/abierto)
-- Safe to re-run in Supabase SQL Editor.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'groups' and column_name = 'privacy'
  ) then
    alter table public.groups add column privacy text not null default 'abierto';
  end if;
end $$;

update public.groups
set privacy = case
  when place_edit_policy = 'owner_only' then 'privado'
  else 'abierto'
end
where privacy is null
   or privacy not in ('privado', 'abierto');

alter table public.groups drop constraint if exists groups_privacy_check;
alter table public.groups
  add constraint groups_privacy_check
  check (privacy in ('privado', 'abierto'));

alter table public.groups drop constraint if exists groups_place_edit_policy_check;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'groups' and column_name = 'place_edit_policy'
  ) then
    alter table public.groups drop column place_edit_policy;
  end if;
end $$;
