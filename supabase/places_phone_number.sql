-- MaPlan: phone numbers for group and personal places.
-- Safe to re-run in Supabase SQL Editor.

alter table public.places
  add column if not exists phone_number text;

alter table public.personal_places
  add column if not exists phone_number text;
