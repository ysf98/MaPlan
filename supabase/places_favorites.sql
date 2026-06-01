-- MaPlan: split group place favorite from visit status.
alter table public.places
  add column if not exists is_favorite boolean not null default false;

update public.places
set is_favorite = true,
    status = 'pending'
where status = 'favorite';

alter table public.places drop constraint if exists places_status_check;
alter table public.places
  add constraint places_status_check
  check (status in ('pending', 'visited'));

create index if not exists idx_places_group_favorite
on public.places (group_id, is_favorite)
where is_favorite = true;
