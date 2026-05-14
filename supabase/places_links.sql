-- MaPlan: links metadata for places
-- Safe to re-run in Supabase SQL Editor.

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'places' and column_name = 'original_url'
  ) then
    alter table public.places add column original_url text null;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'places' and column_name = 'source'
  ) then
    alter table public.places add column source text null;
  end if;
end $$;

alter table public.places
  alter column latitude drop not null,
  alter column longitude drop not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'places_source_check') then
    alter table public.places
      add constraint places_source_check
      check (source in ('manual', 'google_maps', 'tiktok', 'instagram', 'website') or source is null);
  end if;
end $$;

create index if not exists idx_places_group_created_at on public.places (group_id, created_at desc);
create index if not exists idx_places_source on public.places (source) where source is not null;
create index if not exists idx_places_original_url on public.places (original_url) where original_url is not null;

