import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function isGroupMember(userId: string, groupId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("group_members")
    .select("id")
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .maybeSingle();

  return !error && Boolean(data);
}

export async function isGroupOwner(userId: string, groupId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("group_members")
    .select("id")
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .eq("role", "owner")
    .maybeSingle();

  return !error && Boolean(data);
}
