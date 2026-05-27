import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("RLS policies baseline", () => {
  it("includes creator/member select policy for groups", () => {
    const sql = readFileSync(resolve(process.cwd(), "supabase/rls_groups.sql"), "utf8");
    expect(sql).toContain("create policy groups_select_member_or_creator");
  });

  it("prevents membership role elevation and protected group updates", () => {
    const sql = readFileSync(resolve(process.cwd(), "supabase/rls_groups.sql"), "utf8");
    expect(sql).toContain("create policy group_members_insert_creator_owner");
    expect(sql).toContain("group_members.role = 'owner'");
    expect(sql).toContain("role = 'member'");
    expect(sql).toContain("create or replace function public.enforce_group_protected_updates");
    expect(sql).toContain("new.created_by is distinct from old.created_by");
  });

  it("uses non-recursive predicates for group member mutation policies", () => {
    const sql = readFileSync(resolve(process.cwd(), "supabase/rls_groups.sql"), "utf8");
    expect(sql).toContain("create or replace function public.can_join_group_as_member");
    expect(sql).toContain("create or replace function public.can_manage_group_members");
    expect(sql).toContain("public.can_join_group_as_member(group_members.group_id, auth.uid())");
    expect(sql).toContain("public.can_manage_group_members(group_members.group_id, auth.uid())");
  });

  it("maps legacy place policy only while the legacy column exists", () => {
    const sql = readFileSync(resolve(process.cwd(), "supabase/groups_privacy.sql"), "utf8");
    expect(sql).toContain("column_name = 'place_edit_policy'");
    expect(sql).toContain("when place_edit_policy = 'owner_only' then 'privado'");
  });

  it("includes atomic RPC for friend acceptance with friendship insert", () => {
    const sql = readFileSync(resolve(process.cwd(), "supabase/rls_friends.sql"), "utf8");
    expect(sql).toContain("create or replace function public.accept_friend_request");
    expect(sql).toContain("insert into public.friendships");
    expect(sql).toContain("revoke execute on function public.accept_friend_request(uuid) from public");
    expect(sql).not.toContain("create policy profiles_select_for_friend_search");
  });

  it("creates profile data server-side during sign-up", () => {
    const sql = readFileSync(resolve(process.cwd(), "supabase/profiles_full_name.sql"), "utf8");
    expect(sql).toContain("create or replace function public.handle_new_user_profile");
    expect(sql).toContain("after insert on auth.users");
    expect(sql).toContain("new.raw_user_meta_data ->> 'username'");
  });

  it("includes atomic RPC for invitation acceptance with membership insert", () => {
    const sql = readFileSync(resolve(process.cwd(), "supabase/rls_group_invitations.sql"), "utf8");
    expect(sql).toContain("create or replace function public.accept_group_invitation");
    expect(sql).toContain("insert into public.group_members");
    expect(sql).toContain("create policy group_invitations_insert_manager");
  });

  it("includes strict owner-only policies for personal places", () => {
    const sql = readFileSync(resolve(process.cwd(), "supabase/rls_personal_places.sql"), "utf8");
    expect(sql).toContain("grant select, insert, update, delete on table public.personal_places to authenticated");
    expect(sql).toContain("create policy personal_places_select_own");
    expect(sql).toContain("create policy personal_places_insert_own");
    expect(sql).toContain("create policy personal_places_update_own");
    expect(sql).toContain("create policy personal_places_delete_own");
  });

  it("uses RPC display fields rather than exposing related full profile rows", () => {
    const sql = readFileSync(resolve(process.cwd(), "supabase/rls_places.sql"), "utf8");
    expect(sql).toContain("create policy profiles_select_self_only");
    expect(sql).toContain("using (id = auth.uid())");
    expect(sql).not.toContain("create policy profiles_select_self_or_related");
  });

  it("includes group activity table and member-only visibility policy", () => {
    const sql = readFileSync(resolve(process.cwd(), "supabase/rls_group_activity.sql"), "utf8");
    expect(sql).toContain("create table if not exists public.group_activity_events");
    expect(sql).toContain("create policy group_activity_select_group_member");
    expect(sql).toContain("create policy group_activity_insert_editor_only");
  });
});
