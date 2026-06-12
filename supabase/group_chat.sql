-- MaPlan: group chat messages with optional plan/place context.
-- Safe to re-run in Supabase SQL Editor after group_plans.sql.

create table if not exists public.group_chat_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  kind text not null default 'message',
  plan_id uuid null references public.group_plans(id) on delete set null,
  place_id uuid null references public.places(id) on delete set null,
  plan_place_id uuid null references public.group_plan_places(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.group_chat_reads (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz not null,
  updated_at timestamptz not null default now(),
  constraint group_chat_reads_group_user_pk primary key (group_id, user_id)
);

do $$
begin
  alter table public.group_chat_messages add column if not exists kind text not null default 'message';
  alter table public.group_chat_messages add column if not exists plan_id uuid null;
  alter table public.group_chat_messages add column if not exists place_id uuid null;
  alter table public.group_chat_messages add column if not exists plan_place_id uuid null;

  if not exists (select 1 from pg_constraint where conname = 'group_chat_messages_kind_check') then
    alter table public.group_chat_messages
      add constraint group_chat_messages_kind_check check (kind in ('message', 'plan_suggestion', 'place_comment'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'group_chat_messages_plan_id_fkey') then
    alter table public.group_chat_messages
      add constraint group_chat_messages_plan_id_fkey
      foreign key (plan_id) references public.group_plans(id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'group_chat_messages_place_id_fkey') then
    alter table public.group_chat_messages
      add constraint group_chat_messages_place_id_fkey
      foreign key (place_id) references public.places(id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'group_chat_messages_plan_place_id_fkey') then
    alter table public.group_chat_messages
      add constraint group_chat_messages_plan_place_id_fkey
      foreign key (plan_place_id) references public.group_plan_places(id) on delete set null;
  end if;
end $$;

create index if not exists idx_group_chat_messages_group_created
on public.group_chat_messages (group_id, created_at desc);

create index if not exists idx_group_chat_messages_sender
on public.group_chat_messages (sender_id);

create index if not exists idx_group_chat_reads_user_group
on public.group_chat_reads (user_id, group_id);

alter table public.group_chat_messages replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'group_chat_messages'
    ) then
    alter publication supabase_realtime add table public.group_chat_messages;
  end if;
end $$;

create or replace function public.set_group_chat_messages_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_group_chat_messages_updated_at on public.group_chat_messages;
create trigger trg_group_chat_messages_updated_at
before update on public.group_chat_messages
for each row execute function public.set_group_chat_messages_updated_at();

create or replace function public.set_group_chat_reads_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_group_chat_reads_updated_at on public.group_chat_reads;
create trigger trg_group_chat_reads_updated_at
before update on public.group_chat_reads
for each row execute function public.set_group_chat_reads_updated_at();

grant select, insert, update, delete on table public.group_chat_messages to authenticated;
grant select, insert, update, delete on table public.group_chat_reads to authenticated;

alter table public.group_chat_messages enable row level security;
alter table public.group_chat_reads enable row level security;

drop policy if exists group_chat_messages_select_group_member on public.group_chat_messages;
drop policy if exists group_chat_messages_insert_group_member on public.group_chat_messages;
drop policy if exists group_chat_messages_update_sender on public.group_chat_messages;
drop policy if exists group_chat_messages_delete_sender on public.group_chat_messages;
drop policy if exists group_chat_reads_select_self_member on public.group_chat_reads;
drop policy if exists group_chat_reads_insert_self_member on public.group_chat_reads;
drop policy if exists group_chat_reads_update_self_member on public.group_chat_reads;
drop policy if exists group_chat_reads_delete_self_member on public.group_chat_reads;

create policy group_chat_messages_select_group_member
on public.group_chat_messages
for select to authenticated
using (
  public.can_access_group(group_id, auth.uid())
);

create policy group_chat_messages_insert_group_member
on public.group_chat_messages
for insert to authenticated
with check (
  sender_id = auth.uid()
  and public.can_access_group(group_id, auth.uid())
  and (
    plan_id is null
    or exists (
      select 1
      from public.group_plans gp
      where gp.id = group_chat_messages.plan_id
        and gp.group_id = group_chat_messages.group_id
    )
  )
  and (
    place_id is null
    or exists (
      select 1
      from public.places p
      where p.id = group_chat_messages.place_id
        and p.group_id = group_chat_messages.group_id
    )
  )
  and (
    plan_place_id is null
    or exists (
      select 1
      from public.group_plan_places gpp
      join public.group_plans gp on gp.id = gpp.plan_id
      where gpp.id = group_chat_messages.plan_place_id
        and gp.group_id = group_chat_messages.group_id
    )
  )
);

create policy group_chat_messages_update_sender
on public.group_chat_messages
for update to authenticated
using (
  sender_id = auth.uid()
  and public.can_access_group(group_id, auth.uid())
)
with check (
  sender_id = auth.uid()
  and public.can_access_group(group_id, auth.uid())
);

create policy group_chat_messages_delete_sender
on public.group_chat_messages
for delete to authenticated
using (
  sender_id = auth.uid()
  and public.can_access_group(group_id, auth.uid())
);

create policy group_chat_reads_select_self_member
on public.group_chat_reads
for select to authenticated
using (
  user_id = auth.uid()
  and public.can_access_group(group_id, auth.uid())
);

create policy group_chat_reads_insert_self_member
on public.group_chat_reads
for insert to authenticated
with check (
  user_id = auth.uid()
  and public.can_access_group(group_id, auth.uid())
);

create policy group_chat_reads_update_self_member
on public.group_chat_reads
for update to authenticated
using (
  user_id = auth.uid()
  and public.can_access_group(group_id, auth.uid())
)
with check (
  user_id = auth.uid()
  and public.can_access_group(group_id, auth.uid())
);

create policy group_chat_reads_delete_self_member
on public.group_chat_reads
for delete to authenticated
using (
  user_id = auth.uid()
  and public.can_access_group(group_id, auth.uid())
);
