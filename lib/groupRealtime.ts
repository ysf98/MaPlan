export const GROUP_REALTIME_TABLES = ["places", "group_plans"] as const;

export function getGroupRealtimeFilter(groupId: string): string {
  return `group_id=eq.${groupId}`;
}
