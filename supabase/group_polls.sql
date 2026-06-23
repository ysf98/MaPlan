-- MaPlan: group place polls.
-- Safe to re-run after group_plans.sql.

create table if not exists public.group_polls (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  plan_id uuid null references public.group_plans(id) on delete cascade,
  converted_plan_id uuid null references public.group_plans(id) on delete set null,
  title text not null,
  kind text not null default 'poll',
  poll_type text not null default 'place',
  status text not null default 'open',
  closes_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint group_polls_kind_check check (kind in ('poll', 'availability')),
  constraint group_polls_type_check check (poll_type in ('place', 'date', 'time', 'custom')),
  constraint group_polls_status_check check (status in ('open', 'closed')),
  constraint group_polls_availability_type_check check (kind <> 'availability' or poll_type = 'date')
);

create table if not exists public.group_poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.group_polls(id) on delete cascade,
  label text not null,
  place_id uuid null references public.places(id) on delete set null,
  option_date date null,
  start_time time null,
  end_time time null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint group_poll_options_time_range_check check (
    end_time is null or start_time is null or end_time > start_time
  ),
  constraint group_poll_options_poll_position_unique unique (poll_id, position)
);

create table if not exists public.group_poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.group_polls(id) on delete cascade,
  option_id uuid not null references public.group_poll_options(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint group_poll_votes_poll_user_unique unique (poll_id, user_id)
);

create table if not exists public.group_availability_responses (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.group_polls(id) on delete cascade,
  option_id uuid not null references public.group_poll_options(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  response text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint group_availability_responses_value_check check (response in ('available', 'maybe', 'unavailable')),
  constraint group_availability_option_user_unique unique (option_id, user_id)
);

create index if not exists idx_group_polls_group_status
on public.group_polls (group_id, status, created_at desc);

create index if not exists idx_group_poll_options_poll_position
on public.group_poll_options (poll_id, position);

create index if not exists idx_group_poll_votes_poll_option
on public.group_poll_votes (poll_id, option_id);

create index if not exists idx_group_availability_poll_option
on public.group_availability_responses (poll_id, option_id);

create or replace function public.set_group_poll_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.enforce_group_poll_protected_updates()
returns trigger
language plpgsql
as $$
begin
  if new.group_id is distinct from old.group_id then
    raise exception 'No se puede mover una encuesta a otro grupo.';
  end if;
  if new.created_by is distinct from old.created_by then
    raise exception 'No se puede cambiar la persona creadora de la encuesta.';
  end if;
  if new.kind is distinct from old.kind or new.poll_type is distinct from old.poll_type then
    raise exception 'No se puede cambiar el tipo de una encuesta creada.';
  end if;
  if new.plan_id is distinct from old.plan_id then
    raise exception 'No se puede cambiar el plan asociado a una encuesta creada.';
  end if;
  if old.status = 'closed' and new.status <> 'closed' then
    raise exception 'No se puede volver a abrir una encuesta cerrada.';
  end if;
  if new.converted_plan_id is not null and not exists (
    select 1 from public.group_plans gp
    where gp.id = new.converted_plan_id and gp.group_id = new.group_id
  ) then
    raise exception 'El plan convertido debe pertenecer al mismo grupo.';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_group_poll_option_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  poll_group_id uuid;
begin
  if tg_op = 'UPDATE' and new.poll_id is distinct from old.poll_id then
    raise exception 'No se puede mover una opción a otra encuesta.';
  end if;

  select group_id into poll_group_id
  from public.group_polls
  where id = new.poll_id;

  if new.place_id is not null and not exists (
    select 1 from public.places p
    where p.id = new.place_id and p.group_id = poll_group_id
  ) then
    raise exception 'El lugar no pertenece al grupo de la encuesta.';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_group_poll_vote_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and (
    new.poll_id is distinct from old.poll_id or new.user_id is distinct from old.user_id
  ) then
    raise exception 'No se puede mover un voto ni cambiar su autor.';
  end if;
  if not exists (
    select 1
    from public.group_poll_options o
    join public.group_polls p on p.id = o.poll_id
    where o.id = new.option_id
      and o.poll_id = new.poll_id
      and p.kind = 'poll'
      and p.status = 'open'
  ) then
    raise exception 'La opción no pertenece a una encuesta abierta.';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_group_availability_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and (
    new.poll_id is distinct from old.poll_id or
    new.option_id is distinct from old.option_id or
    new.user_id is distinct from old.user_id
  ) then
    raise exception 'No se puede mover una respuesta ni cambiar su autor.';
  end if;
  if not exists (
    select 1
    from public.group_poll_options o
    join public.group_polls p on p.id = o.poll_id
    where o.id = new.option_id
      and o.poll_id = new.poll_id
      and p.kind = 'availability'
      and p.status = 'open'
  ) then
    raise exception 'La franja no pertenece a una consulta abierta.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_group_polls_updated_at on public.group_polls;
create trigger trg_group_polls_updated_at
before update on public.group_polls
for each row execute function public.set_group_poll_updated_at();

drop trigger if exists trg_group_polls_protected_updates on public.group_polls;
create trigger trg_group_polls_protected_updates
before update on public.group_polls
for each row execute function public.enforce_group_poll_protected_updates();

drop trigger if exists trg_group_poll_options_integrity on public.group_poll_options;
create trigger trg_group_poll_options_integrity
before insert or update on public.group_poll_options
for each row execute function public.enforce_group_poll_option_integrity();

drop trigger if exists trg_group_poll_votes_integrity on public.group_poll_votes;
create trigger trg_group_poll_votes_integrity
before insert or update on public.group_poll_votes
for each row execute function public.enforce_group_poll_vote_integrity();

drop trigger if exists trg_group_availability_integrity on public.group_availability_responses;
create trigger trg_group_availability_integrity
before insert or update on public.group_availability_responses
for each row execute function public.enforce_group_availability_integrity();

grant select, insert, update, delete on table public.group_polls to authenticated;
grant select, insert, update, delete on table public.group_poll_options to authenticated;
grant select, insert, update, delete on table public.group_poll_votes to authenticated;
grant select, insert, update, delete on table public.group_availability_responses to authenticated;

alter table public.group_polls enable row level security;
alter table public.group_poll_options enable row level security;
alter table public.group_poll_votes enable row level security;
alter table public.group_availability_responses enable row level security;

drop policy if exists group_polls_select_member on public.group_polls;
drop policy if exists group_polls_insert_editor on public.group_polls;
drop policy if exists group_polls_update_creator_or_owner on public.group_polls;
drop policy if exists group_polls_delete_creator_or_owner on public.group_polls;

create policy group_polls_select_member
on public.group_polls for select to authenticated
using (public.can_access_group(group_id, auth.uid()));

create policy group_polls_insert_editor
on public.group_polls for insert to authenticated
with check (
  created_by = auth.uid()
  and public.can_edit_group_shared_content(group_id, auth.uid())
);

create policy group_polls_update_creator_or_owner
on public.group_polls for update to authenticated
using (
  created_by = auth.uid()
  or exists (
    select 1 from public.groups g
    where g.id = group_polls.group_id
      and (
        g.created_by = auth.uid()
        or exists (
          select 1 from public.group_members gm
          where gm.group_id = g.id and gm.user_id = auth.uid() and gm.role = 'owner'
        )
      )
  )
)
with check (public.can_access_group(group_id, auth.uid()));

create policy group_polls_delete_creator_or_owner
on public.group_polls for delete to authenticated
using (
  created_by = auth.uid()
  or exists (
    select 1 from public.groups g
    where g.id = group_polls.group_id
      and (
        g.created_by = auth.uid()
        or exists (
          select 1 from public.group_members gm
          where gm.group_id = g.id and gm.user_id = auth.uid() and gm.role = 'owner'
        )
      )
  )
);

drop policy if exists group_poll_options_select_member on public.group_poll_options;
drop policy if exists group_poll_options_insert_poll_manager on public.group_poll_options;
drop policy if exists group_poll_options_update_poll_manager on public.group_poll_options;
drop policy if exists group_poll_options_delete_poll_manager on public.group_poll_options;

create policy group_poll_options_select_member
on public.group_poll_options for select to authenticated
using (
  exists (
    select 1 from public.group_polls p
    where p.id = group_poll_options.poll_id
      and public.can_access_group(p.group_id, auth.uid())
  )
);

create policy group_poll_options_insert_poll_manager
on public.group_poll_options for insert to authenticated
with check (
  exists (
    select 1 from public.group_polls p
    where p.id = group_poll_options.poll_id
      and p.status = 'open'
      and (
        p.created_by = auth.uid()
        or exists (
          select 1 from public.groups g
          where g.id = p.group_id and g.created_by = auth.uid()
        )
        or exists (
          select 1 from public.group_members gm
          where gm.group_id = p.group_id and gm.user_id = auth.uid() and gm.role = 'owner'
        )
      )
  )
);

create policy group_poll_options_update_poll_manager
on public.group_poll_options for update to authenticated
using (
  exists (
    select 1 from public.group_polls p
    where p.id = group_poll_options.poll_id
      and p.status = 'open'
      and (
        p.created_by = auth.uid()
        or exists (
          select 1 from public.groups g
          where g.id = p.group_id and g.created_by = auth.uid()
        )
        or exists (
          select 1 from public.group_members gm
          where gm.group_id = p.group_id and gm.user_id = auth.uid() and gm.role = 'owner'
        )
      )
  )
);

create policy group_poll_options_delete_poll_manager
on public.group_poll_options for delete to authenticated
using (
  exists (
    select 1 from public.group_polls p
    where p.id = group_poll_options.poll_id
      and p.status = 'open'
      and (
        p.created_by = auth.uid()
        or exists (
          select 1 from public.groups g
          where g.id = p.group_id and g.created_by = auth.uid()
        )
        or exists (
          select 1 from public.group_members gm
          where gm.group_id = p.group_id and gm.user_id = auth.uid() and gm.role = 'owner'
        )
      )
  )
);

drop policy if exists group_poll_votes_select_member on public.group_poll_votes;
drop policy if exists group_poll_votes_insert_self on public.group_poll_votes;
drop policy if exists group_poll_votes_update_self on public.group_poll_votes;
drop policy if exists group_poll_votes_delete_self on public.group_poll_votes;

create policy group_poll_votes_select_member
on public.group_poll_votes for select to authenticated
using (
  exists (
    select 1 from public.group_polls p
    where p.id = group_poll_votes.poll_id
      and public.can_access_group(p.group_id, auth.uid())
  )
);

create policy group_poll_votes_insert_self
on public.group_poll_votes for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.group_polls p
    where p.id = group_poll_votes.poll_id
      and p.status = 'open'
      and public.can_access_group(p.group_id, auth.uid())
  )
);

create policy group_poll_votes_update_self
on public.group_poll_votes for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy group_poll_votes_delete_self
on public.group_poll_votes for delete to authenticated
using (user_id = auth.uid());

drop policy if exists group_availability_select_member on public.group_availability_responses;
drop policy if exists group_availability_insert_self on public.group_availability_responses;
drop policy if exists group_availability_update_self on public.group_availability_responses;
drop policy if exists group_availability_delete_self on public.group_availability_responses;

create policy group_availability_select_member
on public.group_availability_responses for select to authenticated
using (
  exists (
    select 1 from public.group_polls p
    where p.id = group_availability_responses.poll_id
      and public.can_access_group(p.group_id, auth.uid())
  )
);

create policy group_availability_insert_self
on public.group_availability_responses for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.group_polls p
    where p.id = group_availability_responses.poll_id
      and p.status = 'open'
      and public.can_access_group(p.group_id, auth.uid())
  )
);

create policy group_availability_update_self
on public.group_availability_responses for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy group_availability_delete_self
on public.group_availability_responses for delete to authenticated
using (user_id = auth.uid());

alter table public.group_polls replica identity full;
alter table public.group_poll_options replica identity full;
alter table public.group_poll_votes replica identity full;
alter table public.group_availability_responses replica identity full;

do $$
declare
  table_name text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    return;
  end if;

  foreach table_name in array array[
    'group_polls',
    'group_poll_options',
    'group_poll_votes',
    'group_availability_responses'
  ]
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;
