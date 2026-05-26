# MaPlan

MaPlan is a social app to plan with friends: groups, invitations, shared places, personal map, and recent activity.

## Stack
- Next.js App Router
- React
- TypeScript (strict)
- Tailwind CSS
- Supabase (Auth + Postgres + RLS)
- Mapbox GL
- Google Places (server-side routes)
- Zod
- Vitest
- Playwright
- pnpm

## Main features
- Auth with Supabase.
- Groups with privacy model: `privado` / `abierto`.
- Role-based permissions: owner/member.
- Group invitations and join requests.
- Group map with place search and save flow.
- Personal map with tabs (`Lugares`, `Mapa`).
- Friends and friend requests.
- Activity feed with avatar fallback.
- Profile and group cover images.
- Place image support (`image_url`) from Google Places/manual.

## Project structure
- `app/`: routes, route handlers, server actions.
- `components/`: UI and feature components.
- `lib/`: domain logic, permissions, validation, data access.
- `supabase/`: SQL schema/RLS scripts.
- `tests/`: Vitest tests.
- `e2e/`: Playwright specs.

## Environment variables
Create `.env` with:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `GOOGLE_PLACES_API_KEY`

Optional:

- `SUPABASE_SERVICE_ROLE_KEY` (backend-only flows)
- `E2E_EMAIL`
- `E2E_PASSWORD`
- `E2E_RUN_SIGNUP=1`
- `PLAYWRIGHT_BASE_URL`

Security:
- Keep `GOOGLE_PLACES_API_KEY` server-side only.
- Never create `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`.
- Never commit secrets.

## Local development
```bash
pnpm install
pnpm dev
```

## Commands
```bash
pnpm build
pnpm test
pnpm test:e2e
pnpm test:e2e:ui
pnpm test:e2e:headed
pnpm test:e2e:report
```

## Supabase SQL order (recommended)
Run in Supabase SQL Editor:

1. `supabase/rls_friends.sql`
2. `supabase/rls_groups.sql`
3. `supabase/rls_group_invitations.sql`
4. `supabase/rls_group_activity.sql`
5. `supabase/rls_places.sql`
6. `supabase/places_images.sql`
7. `supabase/places_links.sql`
8. `supabase/places_external_provider.sql`
9. `supabase/places_city.sql`
10. `supabase/rls_personal_places.sql`

Optional/legacy migration helpers:
- `supabase/groups_privacy.sql`
- `supabase/groups_cover_image_url.sql`

### Important SQL note
If you change the return shape of `get_profiles_by_ids(uuid[])`, Postgres can fail with:
`cannot change return type of existing function`.

Fix:
```sql
drop function if exists public.get_profiles_by_ids(uuid[]);
```
Then re-run `supabase/rls_friends.sql`.

## Testing overview
- Unit/domain/security:
  - `tests/lib/*`
  - `tests/actions/*`
  - `tests/validation/*`
  - `tests/security/*`
- E2E:
  - `e2e/auth.spec.ts`
  - `e2e/navigation.spec.ts`
  - `e2e/groups.spec.ts`
  - `e2e/map.spec.ts`
  - `e2e/notifications.spec.ts`

## Troubleshooting
- `pnpm` not found:
  - install pnpm/corepack locally and re-run.
- Turbopack UTF-8 parse error:
  - rewrite file as UTF-8 (no invalid bytes).
- Group/friends avatars not shown:
  - verify `profiles.avatar_url` has values and `rls_friends.sql` is up to date.

## Current product status
- Group detail redesigned with tabs: `Lugares`, `Actividad`, `Mapa`.
- Personal map aligned to group detail style with tabs.
- Friends page redesigned and integrated with group invitations.
- Permission model enforced in UI + server actions + RLS.
