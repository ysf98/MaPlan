-- MaPlan: Google Places rating metadata for group and personal places.
-- Safe to re-run in Supabase SQL Editor.

alter table public.places
  add column if not exists rating numeric,
  add column if not exists user_ratings_total integer;

alter table public.personal_places
  add column if not exists rating numeric,
  add column if not exists user_ratings_total integer;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'places_rating_check') then
    alter table public.places
      add constraint places_rating_check check (rating is null or (rating >= 0 and rating <= 5));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'places_user_ratings_total_check') then
    alter table public.places
      add constraint places_user_ratings_total_check check (user_ratings_total is null or user_ratings_total >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'personal_places_rating_check') then
    alter table public.personal_places
      add constraint personal_places_rating_check check (rating is null or (rating >= 0 and rating <= 5));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'personal_places_user_ratings_total_check') then
    alter table public.personal_places
      add constraint personal_places_user_ratings_total_check check (user_ratings_total is null or user_ratings_total >= 0);
  end if;
end $$;
