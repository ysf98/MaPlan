# Security Notes

## Supabase Admin Client usage

`createSupabaseAdminClient` is intentionally restricted to one operation:

- `deleteGroupAction` in `app/groups/[groupId]/actions.ts`

Reason:

- Group deletion is a privileged destructive operation that cascades across related data (`group_members`, join requests, places/categories through FK constraints).
- We keep regular read/write flows behind RLS with the authenticated user client.
- We explicitly avoid using service-role fallback for generic `42501` errors to prevent bypassing RLS guarantees.

