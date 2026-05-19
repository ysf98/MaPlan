create table if not exists public.personal_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text,
  city text,
  latitude double precision not null,
  longitude double precision not null,
  category text,
  notes text,
  source text,
  provider text,
  external_place_id text,
  google_maps_url text,
  business_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists personal_places_user_id_idx on public.personal_places(user_id);
create index if not exists personal_places_created_at_desc_idx on public.personal_places(created_at desc);
create unique index if not exists personal_places_provider_external_place_unique_idx
  on public.personal_places(user_id, provider, external_place_id)
  where external_place_id is not null;

create or replace function public.set_personal_places_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_personal_places_updated_at on public.personal_places;
create trigger set_personal_places_updated_at
before update on public.personal_places
for each row execute function public.set_personal_places_updated_at();

alter table public.personal_places enable row level security;

drop policy if exists personal_places_select_own on public.personal_places;
create policy personal_places_select_own
on public.personal_places
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists personal_places_insert_own on public.personal_places;
create policy personal_places_insert_own
on public.personal_places
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists personal_places_update_own on public.personal_places;
create policy personal_places_update_own
on public.personal_places
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists personal_places_delete_own on public.personal_places;
create policy personal_places_delete_own
on public.personal_places
for delete
to authenticated
using (auth.uid() = user_id);
