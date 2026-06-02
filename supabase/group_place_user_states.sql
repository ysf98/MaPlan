-- MaPlan: per-user state for shared group places.
-- Safe to re-run in Supabase SQL Editor.

create table if not exists public.group_place_user_states (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint group_place_user_states_status_check check (status in ('pending', 'visited')),
  constraint group_place_user_states_place_user_unique unique (place_id, user_id)
);

create index if not exists idx_group_place_user_states_user
on public.group_place_user_states (user_id);

create index if not exists idx_group_place_user_states_place
on public.group_place_user_states (place_id);

create index if not exists idx_group_place_user_states_user_status
on public.group_place_user_states (user_id, status);

create index if not exists idx_group_place_user_states_user_favorite
on public.group_place_user_states (user_id, is_favorite)
where is_favorite = true;

create or replace function public.set_group_place_user_states_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_group_place_user_states_updated_at on public.group_place_user_states;
create trigger trg_group_place_user_states_updated_at
before update on public.group_place_user_states
for each row execute function public.set_group_place_user_states_updated_at();

insert into public.group_place_user_states (place_id, user_id, status, is_favorite)
select
  p.id,
  p.created_by,
  case when p.status = 'visited' then 'visited' else 'pending' end,
  coalesce(p.is_favorite, false)
from public.places p
where p.created_by is not null
on conflict (place_id, user_id) do nothing;

grant select, insert, update, delete on table public.group_place_user_states to authenticated;

alter table public.group_place_user_states enable row level security;

drop policy if exists group_place_user_states_select_own_member on public.group_place_user_states;
drop policy if exists group_place_user_states_insert_own_member on public.group_place_user_states;
drop policy if exists group_place_user_states_update_own_member on public.group_place_user_states;
drop policy if exists group_place_user_states_delete_own_member on public.group_place_user_states;

create policy group_place_user_states_select_own_member
on public.group_place_user_states
for select to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.places p
    join public.group_members gm on gm.group_id = p.group_id
    where p.id = group_place_user_states.place_id
      and gm.user_id = auth.uid()
  )
);

create policy group_place_user_states_insert_own_member
on public.group_place_user_states
for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.places p
    join public.group_members gm on gm.group_id = p.group_id
    where p.id = group_place_user_states.place_id
      and gm.user_id = auth.uid()
  )
);

create policy group_place_user_states_update_own_member
on public.group_place_user_states
for update to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.places p
    join public.group_members gm on gm.group_id = p.group_id
    where p.id = group_place_user_states.place_id
      and gm.user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.places p
    join public.group_members gm on gm.group_id = p.group_id
    where p.id = group_place_user_states.place_id
      and gm.user_id = auth.uid()
  )
);

create policy group_place_user_states_delete_own_member
on public.group_place_user_states
for delete to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.places p
    join public.group_members gm on gm.group_id = p.group_id
    where p.id = group_place_user_states.place_id
      and gm.user_id = auth.uid()
  )
);
