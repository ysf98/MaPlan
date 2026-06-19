-- MaPlan: Realtime publication for global notifications.
-- Safe to re-run after the friends, groups, invitations, activity and chat SQL files.

alter table public.friend_requests replica identity full;
alter table public.group_invitations replica identity full;
alter table public.group_activity_events replica identity full;
alter table public.group_chat_messages replica identity full;
alter table public.group_join_requests replica identity full;
alter table public.places replica identity full;
alter table public.group_plans replica identity full;

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    return;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'friend_requests'
  ) then
    alter publication supabase_realtime add table public.friend_requests;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'group_invitations'
  ) then
    alter publication supabase_realtime add table public.group_invitations;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'group_activity_events'
  ) then
    alter publication supabase_realtime add table public.group_activity_events;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'group_chat_messages'
  ) then
    alter publication supabase_realtime add table public.group_chat_messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'group_join_requests'
  ) then
    alter publication supabase_realtime add table public.group_join_requests;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'places'
  ) then
    alter publication supabase_realtime add table public.places;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'group_plans'
  ) then
    alter publication supabase_realtime add table public.group_plans;
  end if;
end $$;
