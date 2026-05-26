-- MaPlan: add image URL support for places and personal places
-- Safe to re-run in Supabase SQL Editor.

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'places' and column_name = 'image_url'
  ) then
    alter table public.places add column image_url text null;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'personal_places' and column_name = 'image_url'
  ) then
    alter table public.personal_places add column image_url text null;
  end if;
end $$;
