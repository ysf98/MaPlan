import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("RLS policies baseline", () => {
  it("includes creator/member select policy for groups", () => {
    const sql = readFileSync(resolve(process.cwd(), "supabase/rls_groups.sql"), "utf8");
    expect(sql).toContain("create policy groups_select_member_or_creator");
  });

  it("includes atomic RPC for friend acceptance with friendship insert", () => {
    const sql = readFileSync(resolve(process.cwd(), "supabase/rls_friends.sql"), "utf8");
    expect(sql).toContain("create or replace function public.accept_friend_request");
    expect(sql).toContain("insert into public.friendships");
  });

  it("includes atomic RPC for invitation acceptance with membership insert", () => {
    const sql = readFileSync(resolve(process.cwd(), "supabase/rls_group_invitations.sql"), "utf8");
    expect(sql).toContain("create or replace function public.accept_group_invitation");
    expect(sql).toContain("insert into public.group_members");
  });

  it("includes strict owner-only policies for personal places", () => {
    const sql = readFileSync(resolve(process.cwd(), "supabase/rls_personal_places.sql"), "utf8");
    expect(sql).toContain("create policy personal_places_select_own");
    expect(sql).toContain("create policy personal_places_insert_own");
    expect(sql).toContain("create policy personal_places_update_own");
    expect(sql).toContain("create policy personal_places_delete_own");
  });

  it("includes group activity table and member-only visibility policy", () => {
    const sql = readFileSync(resolve(process.cwd(), "supabase/rls_group_activity.sql"), "utf8");
    expect(sql).toContain("create table if not exists public.group_activity_events");
    expect(sql).toContain("create policy group_activity_select_group_member");
    expect(sql).toContain("create policy group_activity_insert_editor_only");
  });
});
