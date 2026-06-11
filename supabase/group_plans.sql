-- MaPlan: group plans, planned places and attendance votes.
-- Safe to re-run in Supabase SQL Editor.

create table if not exists public.group_plans (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text null,
  planned_date timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.group_plan_places (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.group_plans(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  added_by uuid not null references auth.users(id) on delete cascade,
  planned_at timestamptz null,
  note text null,
  created_at timestamptz not null default now()
);

create table if not exists public.group_plan_votes (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.group_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  vote text not null default 'attending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'group_plan_places_plan_place_unique') then
    alter table public.group_plan_places
      add constraint group_plan_places_plan_place_unique unique (plan_id, place_id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'group_plan_votes_plan_user_unique') then
    alter table public.group_plan_votes
      add constraint group_plan_votes_plan_user_unique unique (plan_id, user_id);
  end if;

  alter table public.group_plan_votes drop constraint if exists group_plan_votes_vote_check;
  alter table public.group_plan_votes
    add constraint group_plan_votes_vote_check check (vote in ('attending', 'maybe', 'not_attending'));
end $$;

create index if not exists idx_group_plans_group_created
on public.group_plans (group_id, created_at desc);

create index if not exists idx_group_plans_group_planned_date
on public.group_plans (group_id, planned_date asc nulls last);

create index if not exists idx_group_plan_places_plan
on public.group_plan_places (plan_id, created_at asc);

create index if not exists idx_group_plan_places_place
on public.group_plan_places (place_id);

create index if not exists idx_group_plan_votes_plan
on public.group_plan_votes (plan_id);

create or replace function public.can_access_group(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.groups g
    where g.id = p_group_id
      and (
        g.created_by = p_user_id
        or exists (
          select 1
          from public.group_members gm
          where gm.group_id = p_group_id
            and gm.user_id = p_user_id
        )
      )
  );
$$;

create or replace function public.can_edit_group_shared_content(p_group_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.groups g
    where g.id = p_group_id
      and (
        g.created_by = p_user_id
        or exists (
          select 1
          from public.group_members gm
          where gm.group_id = p_group_id
            and gm.user_id = p_user_id
            and gm.role = 'owner'
        )
        or (
          g.privacy = 'abierto'
          and exists (
            select 1
            from public.group_members gm
            where gm.group_id = p_group_id
              and gm.user_id = p_user_id
          )
        )
      )
  );
$$;

revoke execute on function public.can_access_group(uuid, uuid) from public;
revoke execute on function public.can_edit_group_shared_content(uuid, uuid) from public;
grant execute on function public.can_access_group(uuid, uuid) to authenticated;
grant execute on function public.can_edit_group_shared_content(uuid, uuid) to authenticated;

create or replace function public.set_group_plans_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_group_plans_updated_at on public.group_plans;
create trigger trg_group_plans_updated_at
before update on public.group_plans
for each row execute function public.set_group_plans_updated_at();

drop trigger if exists trg_group_plan_votes_updated_at on public.group_plan_votes;
create trigger trg_group_plan_votes_updated_at
before update on public.group_plan_votes
for each row execute function public.set_group_plans_updated_at();

grant select, insert, update, delete on table public.group_plans to authenticated;
grant select, insert, update, delete on table public.group_plan_places to authenticated;
grant select, insert, update, delete on table public.group_plan_votes to authenticated;

alter table public.group_plans enable row level security;
alter table public.group_plan_places enable row level security;
alter table public.group_plan_votes enable row level security;

drop policy if exists group_plans_select_group_member on public.group_plans;
drop policy if exists group_plans_insert_editor_only on public.group_plans;
drop policy if exists group_plans_update_creator_only on public.group_plans;
drop policy if exists group_plans_delete_creator_only on public.group_plans;

drop policy if exists group_plan_places_select_group_member on public.group_plan_places;
drop policy if exists group_plan_places_insert_editor_only on public.group_plan_places;
drop policy if exists group_plan_places_update_creator_only on public.group_plan_places;
drop policy if exists group_plan_places_delete_creator_only on public.group_plan_places;

drop policy if exists group_plan_votes_select_group_member on public.group_plan_votes;
drop policy if exists group_plan_votes_insert_self_member on public.group_plan_votes;
drop policy if exists group_plan_votes_update_self_member on public.group_plan_votes;
drop policy if exists group_plan_votes_delete_self_member on public.group_plan_votes;

create policy group_plans_select_group_member
on public.group_plans
for select to authenticated
using (
  public.can_access_group(group_id, auth.uid())
);

create policy group_plans_insert_editor_only
on public.group_plans
for insert to authenticated
with check (
  created_by = auth.uid()
  and (planned_date is null or planned_date::date >= timezone('Europe/Madrid', now())::date)
  and public.can_edit_group_shared_content(group_id, auth.uid())
);

create policy group_plans_update_creator_only
on public.group_plans
for update to authenticated
using (
  created_by = auth.uid()
)
with check (
  created_by = auth.uid()
  and (planned_date is null or planned_date::date >= timezone('Europe/Madrid', now())::date)
  and public.can_access_group(group_id, auth.uid())
);

create policy group_plans_delete_creator_only
on public.group_plans
for delete to authenticated
using (
  created_by = auth.uid()
);

create policy group_plan_places_select_group_member
on public.group_plan_places
for select to authenticated
using (
  exists (
    select 1
    from public.group_plans gp
    where gp.id = group_plan_places.plan_id
      and public.can_access_group(gp.group_id, auth.uid())
  )
);

create policy group_plan_places_insert_editor_only
on public.group_plan_places
for insert to authenticated
with check (
  added_by = auth.uid()
  and exists (
    select 1
    from public.group_plans gp
    join public.places p on p.id = group_plan_places.place_id
    where gp.id = group_plan_places.plan_id
      and p.group_id = gp.group_id
      and (gp.planned_date is null or gp.planned_date::date >= timezone('Europe/Madrid', now())::date)
      and public.can_edit_group_shared_content(gp.group_id, auth.uid())
  )
);

create policy group_plan_places_update_creator_only
on public.group_plan_places
for update to authenticated
using (
  exists (
    select 1
    from public.group_plans gp
    where gp.id = group_plan_places.plan_id
      and gp.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.group_plans gp
    join public.places p on p.id = group_plan_places.place_id
    where gp.id = group_plan_places.plan_id
      and p.group_id = gp.group_id
      and gp.created_by = auth.uid()
      and (gp.planned_date is null or gp.planned_date::date >= timezone('Europe/Madrid', now())::date)
  )
);

create policy group_plan_places_delete_creator_only
on public.group_plan_places
for delete to authenticated
using (
  exists (
    select 1
    from public.group_plans gp
    where gp.id = group_plan_places.plan_id
      and gp.created_by = auth.uid()
  )
);

create policy group_plan_votes_select_group_member
on public.group_plan_votes
for select to authenticated
using (
  exists (
    select 1
    from public.group_plans gp
    where gp.id = group_plan_votes.plan_id
      and public.can_access_group(gp.group_id, auth.uid())
  )
);

create policy group_plan_votes_insert_self_member
on public.group_plan_votes
for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.group_plans gp
    where gp.id = group_plan_votes.plan_id
      and public.can_access_group(gp.group_id, auth.uid())
  )
);

create policy group_plan_votes_update_self_member
on public.group_plan_votes
for update to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.group_plans gp
    where gp.id = group_plan_votes.plan_id
      and public.can_access_group(gp.group_id, auth.uid())
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.group_plans gp
    where gp.id = group_plan_votes.plan_id
      and public.can_access_group(gp.group_id, auth.uid())
  )
);

create policy group_plan_votes_delete_self_member
on public.group_plan_votes
for delete to authenticated
using (
  user_id = auth.uid()
);
