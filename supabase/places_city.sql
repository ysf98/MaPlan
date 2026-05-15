-- MaPlan: add city metadata to places
-- Safe to re-run in Supabase SQL Editor.

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'places' and column_name = 'city'
  ) then
    alter table public.places add column city text null;
  end if;
end $$;

create index if not exists idx_places_city on public.places (city) where city is not null;
