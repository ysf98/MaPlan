-- MaPlan: RLS baseline for places, categories and profiles
-- Safe to re-run in Supabase SQL Editor.

grant select, insert, update, delete on table public.places to authenticated;
grant select, insert, update, delete on table public.categories to authenticated;
grant select, update on table public.profiles to authenticated;

drop index if exists public.idx_places_group_name_address_unique;
create unique index if not exists idx_places_group_name_address_city_unique
  on public.places (group_id, lower(name), lower(address), lower(coalesce(city, '')));

alter table public.places enable row level security;
alter table public.categories enable row level security;
alter table public.profiles enable row level security;

drop policy if exists places_select_group_member on public.places;
drop policy if exists places_insert_editor_only on public.places;
drop policy if exists places_update_editor_only on public.places;
drop policy if exists places_delete_owner_only on public.places;
drop policy if exists places_delete_editor_only on public.places;

drop policy if exists categories_select_group_member on public.categories;
drop policy if exists categories_insert_editor_only on public.categories;
drop policy if exists categories_update_editor_only on public.categories;
drop policy if exists categories_delete_owner_only on public.categories;
drop policy if exists categories_delete_editor_only on public.categories;

drop policy if exists profiles_select_self_or_related on public.profiles;
drop policy if exists profiles_update_self_only on public.profiles;

create policy places_select_group_member
on public.places
for select to authenticated
using (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = places.group_id
      and gm.user_id = auth.uid()
  )
);

create policy places_insert_editor_only
on public.places
for insert to authenticated
with check (
  created_by = auth.uid()
  and (
    exists (
      select 1
      from public.group_members gm
      where gm.group_id = places.group_id
        and gm.user_id = auth.uid()
        and gm.role = 'owner'
    )
    or exists (
      select 1
      from public.group_members gm
      join public.groups g on g.id = gm.group_id
      where gm.group_id = places.group_id
        and gm.user_id = auth.uid()
        and g.privacy = 'abierto'
    )
  )
);

create policy places_update_editor_only
on public.places
for update to authenticated
using (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = places.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'owner'
  )
  or exists (
    select 1
    from public.group_members gm
    join public.groups g on g.id = gm.group_id
    where gm.group_id = places.group_id
      and gm.user_id = auth.uid()
      and g.privacy = 'abierto'
  )
)
with check (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = places.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'owner'
  )
  or exists (
    select 1
    from public.group_members gm
    join public.groups g on g.id = gm.group_id
    where gm.group_id = places.group_id
      and gm.user_id = auth.uid()
      and g.privacy = 'abierto'
  )
);

create policy places_delete_editor_only
on public.places
for delete to authenticated
using (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = places.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'owner'
  )
  or exists (
    select 1
    from public.group_members gm
    join public.groups g on g.id = gm.group_id
    where gm.group_id = places.group_id
      and gm.user_id = auth.uid()
      and g.privacy = 'abierto'
  )
);

create policy categories_select_group_member
on public.categories
for select to authenticated
using (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = categories.group_id
      and gm.user_id = auth.uid()
  )
);

create policy categories_insert_editor_only
on public.categories
for insert to authenticated
with check (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = categories.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'owner'
  )
  or exists (
    select 1
    from public.group_members gm
    join public.groups g on g.id = gm.group_id
    where gm.group_id = categories.group_id
      and gm.user_id = auth.uid()
      and g.privacy = 'abierto'
  )
);

create policy categories_update_editor_only
on public.categories
for update to authenticated
using (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = categories.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'owner'
  )
  or exists (
    select 1
    from public.group_members gm
    join public.groups g on g.id = gm.group_id
    where gm.group_id = categories.group_id
      and gm.user_id = auth.uid()
      and g.privacy = 'abierto'
  )
)
with check (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = categories.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'owner'
  )
  or exists (
    select 1
    from public.group_members gm
    join public.groups g on g.id = gm.group_id
    where gm.group_id = categories.group_id
      and gm.user_id = auth.uid()
      and g.privacy = 'abierto'
  )
);

create policy categories_delete_editor_only
on public.categories
for delete to authenticated
using (
  exists (
    select 1
    from public.group_members gm
    where gm.group_id = categories.group_id
      and gm.user_id = auth.uid()
      and gm.role = 'owner'
  )
  or exists (
    select 1
    from public.group_members gm
    join public.groups g on g.id = gm.group_id
    where gm.group_id = categories.group_id
      and gm.user_id = auth.uid()
      and g.privacy = 'abierto'
  )
);

create policy profiles_select_self_or_related
on public.profiles
for select to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.group_members gm_self
    join public.group_members gm_other on gm_other.group_id = gm_self.group_id
    where gm_self.user_id = auth.uid()
      and gm_other.user_id = profiles.id
  )
  or exists (
    select 1
    from public.group_members gm_owner
    join public.group_join_requests r on r.group_id = gm_owner.group_id
    where gm_owner.user_id = auth.uid()
      and gm_owner.role = 'owner'
      and r.user_id = profiles.id
  )
);

create policy profiles_update_self_only
on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Keep friend search resilient even if SQL files are executed in different order.
drop policy if exists profiles_select_for_friend_search on public.profiles;

create policy profiles_select_for_friend_search
on public.profiles
for select to authenticated
using (
  auth.uid() is not null
  and username is not null
  and btrim(username) <> ''
);
