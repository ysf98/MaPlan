-- Add technical provider metadata for external place sources (Google Places, Mapbox, manual).
-- Safe to re-run.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'places' and column_name = 'provider'
  ) then
    alter table public.places add column provider text null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'places' and column_name = 'external_place_id'
  ) then
    alter table public.places add column external_place_id text null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'places' and column_name = 'google_maps_url'
  ) then
    alter table public.places add column google_maps_url text null;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'places' and column_name = 'business_status'
  ) then
    alter table public.places add column business_status text null;
  end if;
end $$;

do $$
begin
  alter table public.places drop constraint if exists places_provider_check;
  alter table public.places
    add constraint places_provider_check
    check (provider is null or provider in ('manual', 'mapbox', 'google_places'));
exception
  when duplicate_object then null;
end $$;

create index if not exists idx_places_provider_external_place_id
on public.places (provider, external_place_id);

create unique index if not exists idx_places_group_provider_external_unique
on public.places (group_id, provider, external_place_id)
where external_place_id is not null;
