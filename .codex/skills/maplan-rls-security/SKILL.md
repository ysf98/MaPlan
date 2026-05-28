---
name: maplan-rls-security
description: MaPlan Supabase security and data-model workflow. Use when changing Supabase SQL, RLS policies, security-definer functions, group privacy, owner/member permissions, invitations, join requests, profiles, places, personal places, or TypeScript database types.
---

# MaPlan RLS Security

## Core workflow

1. Read `AGENTS.md`, `README.md`, and the relevant SQL files in `supabase/`.
2. Identify the domain being changed: groups, invitations, friends, profiles, group places, personal places, activity, or images.
3. Update SQL first, then TypeScript types, validation schemas, server actions, UI, and tests.
4. Enforce permissions in backend/RLS, not only in UI.
5. Add or update tests in `tests/security/`, `tests/lib/`, or `tests/actions/`.
6. Run `pnpm test`, `pnpm build`, and targeted E2E when the flow is user-visible.

## Rules to preserve

- Keep `GOOGLE_PLACES_API_KEY` server-side only.
- Keep Supabase anon key public but protected by RLS.
- Never add client-only authorization for protected mutations.
- Never bypass RLS with a service role from application code unless explicitly requested and reviewed.
- Avoid policy recursion between `groups`, `group_members`, and related tables.
- Use security-definer RPCs for limited display data when direct table policies would expose too much.
- Revoke `execute` from `public` on security-definer functions, then grant only what is needed.

## Group permission model

- `privado`: only owner/admin edits group settings, members, invitations, and places.
- `abierto`: members may edit group data, invite members, and manage places.
- Only owner/admin may change group privacy, especially to `privado`.
- Do not let members mutate protected columns such as `created_by` or `join_code`.
- Do not let members insert owner rows or delete owner membership.

## SQL order

Use the order in `README.md` when preparing Supabase rollout. If a SQL function return type changes, drop the function before recreating it, especially `get_profiles_by_ids(uuid[])`.

## Files to check

- SQL: `supabase/rls_groups.sql`, `supabase/rls_group_invitations.sql`, `supabase/rls_friends.sql`, `supabase/rls_places.sql`, `supabase/rls_personal_places.sql`.
- Types: `types/supabase.ts`.
- Validation: `lib/validation/schemas.ts`.
- Permissions/domain: `lib/groupPermissions.ts`, `lib/groups.ts`, `lib/friends.ts`, `lib/groupInvitations.ts`, `lib/places.ts`, `lib/personalPlaces.ts`.
- Actions: `app/groups/actions.ts`, `app/groups/[groupId]/actions.ts`, `app/map/actions.ts`, `app/profile/actions.ts`.
- Tests: `tests/security/rls-policies.test.ts`, `tests/lib/groupPermissions.test.ts`, `tests/actions/*`.

