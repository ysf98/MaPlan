# AGENTS.md

This file gives Codex and other AI coding agents the essential context needed to work safely and consistently on **MaPlan**.

## Project summary

**MaPlan** is a social map app for friend groups. Users can create groups, invite or join friends, save recommended places, explore them on a map, and manage personal or group-based recommendations.

Core product idea:

- Friend groups share places to eat, visit, go out, or save for future plans.
- The app combines a collaborative map, place search, group management, invitations, friends, and saved places.
- The experience should feel modern, simple, mobile-friendly, and social.

## Current stack

Use the existing stack. Do not introduce major framework changes unless explicitly requested.

- **Next.js App Router**
- **React**
- **TypeScript strict mode**
- **Tailwind CSS**
- **Supabase** for Auth, Postgres and RLS
- **Mapbox GL** for the visual interactive map
- **Google Places** through server-side API routes for place search and details
- **Zod** for validation
- **Vitest** for unit/library tests
- **Playwright** for E2E tests
- **pnpm** as package manager

Package manager is pinned in `package.json`:

```json
"packageManager": "pnpm@10.11.0"
```

Prefer `pnpm` commands. If a local environment cannot resolve `pnpm`, explain the issue instead of silently changing package managers.

## Important commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm test:e2e
pnpm test:e2e:ui
pnpm test:e2e:headed
pnpm test:e2e:report
```

Playwright uses `PLAYWRIGHT_BASE_URL` when provided. Otherwise it starts the local dev server with `pnpm dev`.

## Environment variables

Expected local `.env` variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
GOOGLE_PLACES_API_KEY=
```

Optional E2E variables:

```bash
E2E_EMAIL=
E2E_PASSWORD=
E2E_RUN_SIGNUP=1
PLAYWRIGHT_BASE_URL=
```

Security rules:

- Never commit `.env` files or secrets.
- Keep `GOOGLE_PLACES_API_KEY` server-side only.
- Do not rename it to `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`.
- `NEXT_PUBLIC_MAPBOX_TOKEN` is public by design and used client-side.
- Supabase anon key is public, but RLS must protect the data.

## App structure and conventions

Main directories:

- `app/` — Next.js App Router pages, layouts, route handlers, and server actions.
- `components/` — reusable UI and feature components.
- `components/map/` — map-specific UI such as `GroupMap`, search box and save draft cards.
- `components/layout/` — shell/navigation layout.
- `components/ui/` — reusable visual primitives such as buttons, cards, badges, empty states.
- `lib/` — business logic, Supabase access, auth helpers, map helpers, permissions and validations.
- `lib/supabase/` — Supabase client setup.
- `lib/map/` — map/geocoding/Google Places/address/category utilities.
- `lib/validation/` — Zod schemas.
- `types/` — shared TypeScript types, especially Supabase types.
- `supabase/` — SQL migrations and RLS policies.
- `tests/` — Vitest tests.
- `e2e/` — Playwright E2E specs.
- `.github/workflows/` — CI.

Use the `@/*` path alias already configured in `tsconfig.json`.

## Routing

Central route constants live in:

```ts
utils/constants.ts
```

Use `ROUTES` instead of hardcoding common app routes when practical.

Current important routes include:

- `/`
- `/login`
- `/register`
- `/dashboard`
- `/friends`
- `/invitations`
- `/groups`
- `/groups/new`
- `/groups/join`
- `/map`
- `/profile`

## TypeScript rules

The project uses strict TypeScript. Keep code strongly typed.

Guidelines:

- Avoid `any` unless there is a strong reason.
- Prefer narrow domain types over loose objects.
- Keep Supabase table/result types aligned with `types/supabase`.
- Validate external/user input with Zod schemas before using it in server actions or DB writes.
- Preserve `strict: true` compatibility.

## Server/client boundaries

Follow Next.js App Router patterns:

- Use Server Components by default for data fetching and protected page loading.
- Use Client Components only when needed for state, effects, forms, browser APIs, Mapbox, or interactive UI.
- Server actions should live near the route/domain they modify and should begin with `"use server"`.
- Client Components that use hooks or browser-only libraries must begin with `"use client"`.

Mapbox components are client-side because they use browser APIs.

## Authentication

Supabase Auth is used.

Important pattern:

- Server-side Supabase client is created in `lib/supabase/server.ts` with `createServerClient` from `@supabase/ssr`.
- Server actions should require an authenticated user before mutating protected data.
- Use existing helpers such as `getCurrentUser` and `requireAuthenticatedUser` instead of duplicating auth checks.

When adding protected features:

1. Resolve the current user server-side.
2. Validate the input with Zod.
3. Check permissions/membership where relevant.
4. Perform the DB operation.
5. Revalidate affected paths.
6. Return a clear state object for UI feedback.

## Supabase and RLS

Supabase is the source of truth for auth and data. RLS is important and must not be bypassed casually.

Migration files currently include policies and schema changes such as:

- `supabase/rls_groups.sql`
- `supabase/rls_places.sql`
- `supabase/places_links.sql`
- `supabase/rls_friends.sql`
- `supabase/rls_group_invitations.sql`
- `supabase/places_external_provider.sql`
- `supabase/rls_personal_places.sql`

When changing database behavior:

- Add or update SQL migration files under `supabase/`.
- Keep RLS policies consistent with the intended permissions.
- Do not assume client-side checks are enough.
- Keep group membership and ownership rules enforced server-side and/or through RLS.
- Update TypeScript Supabase types if schema changes require it.

## Core domain concepts

### Groups

Groups are collaborative spaces where users save and manage places.

Expected behaviors:

- Users can create groups.
- Users can belong to groups.
- Owners/admins may have elevated permissions.
- Join codes and invitations are part of the group flow.
- Group edit and join policies must be respected.

### Places

Places can be saved for groups or personally.

Important place fields include:

- `name`
- `address`
- `city`
- `notes`
- `category`
- `source`
- `provider`
- `external_place_id`
- `google_maps_url`
- `business_status`
- `latitude`
- `longitude`
- `status`

Current status values:

- `pending`
- `visited`
- `favorite`

Current source values:

- `manual`
- `google_maps`
- `tiktok`
- `instagram`
- `website`

Current provider values:

- `manual`
- `mapbox`
- `google_places`

Distinction:

- `source` = where the recommendation came from, such as manual, TikTok, Instagram, website or Google Maps link.
- `provider` = technical provider used to resolve the POI, such as Google Places or Mapbox.

### Friends and invitations

Friend requests, group invitations and join requests are separate social flows. Keep naming explicit so these flows do not get mixed.

## Map architecture

Map architecture has two layers:

### Visual map layer

- Mapbox is used for the actual map rendering and interaction.
- Main component: `components/map/GroupMap.tsx`.
- It handles markers, map clicks, `flyTo`, popups and draft selections.

### Place search layer

- Google Places is used for search/details through internal server API routes.
- Server routes:
  - `app/api/places/search/route.ts`
  - `app/api/places/details/route.ts`
- Client helper:
  - `lib/map/googlePlaces.ts`
- Search UI:
  - `components/map/MapSearchBox.tsx`

Flow:

1. User searches for a place.
2. The client calls an internal API route.
3. The server route calls Google Places using `GOOGLE_PLACES_API_KEY`.
4. The user selects a result.
5. Full details are retrieved.
6. The map moves to the selected location.
7. A draft save panel appears.
8. User confirms and the place is saved in Supabase.

Manual add and link/text quick search should reuse existing patterns where possible.

## Validation

Central Zod schemas live in:

```ts
lib/validation/schemas.ts
```

Use these schemas for server actions and route handlers. When adding new fields, update the relevant schema first, then update actions, UI forms, DB types and tests.

Important schemas include:

- `createGroupSchema`
- `joinGroupSchema`
- `createPlaceSchema`
- `createPersonalPlaceSchema`
- `updatePlaceStatusSchema`
- `updatePlaceLocationSchema`

Validation messages are currently Spanish/user-facing. Keep user-facing copy in Spanish unless there is a deliberate product decision to change language.

## UI and styling

Styling uses Tailwind CSS.

UI direction:

- Modern, clean, social-app feel.
- Mobile-first responsive layout.
- Rounded cards and soft borders are common patterns.
- Prefer reusable components from `components/ui/`.
- Keep empty states, loading states and errors clear.
- Avoid adding heavy UI libraries unless explicitly requested.

When improving visuals:

- Prefer incremental polish over large rewrites.
- Keep existing design language unless asked to redesign.
- Reuse `Button`, `Card`, `CategoryBadge`, `EmptyState` and layout components.
- Maintain accessibility: labels, focus states, keyboard navigation and readable contrast.

## Server actions pattern

Server actions usually follow this shape:

```ts
export type SomeActionState = {
  error: string | null;
  success: boolean;
};

export async function someAction(
  _previousState: SomeActionState,
  formData: FormData
): Promise<SomeActionState> {
  const user = await requireAuthenticatedUser("/fallback");
  const parsedInput = someSchema.safeParse({...});

  if (!parsedInput.success) {
    return { error: getValidationErrorMessage(parsedInput.error), success: false };
  }

  const result = await someDomainFunction({ userId: user.id, ...parsedInput.data });

  if (result.error) {
    return { error: result.error, success: false };
  }

  revalidatePath("/affected-path");
  return { error: null, success: true };
}
```

Preserve this pattern for consistency.

## Testing strategy

### Unit/library tests

Vitest tests live in `tests/`.

Existing examples include:

- `tests/lib/addressParsing.test.ts`
- `tests/lib/placeClassification.test.ts`
- `tests/lib/failure-detection.test.ts`

Add Vitest tests for pure logic such as:

- address parsing
- category inference
- validation helpers
- permission helpers
- URL parsing
- data transformation utilities

### E2E tests

Playwright specs live in `e2e/`.

Existing base specs include:

- `e2e/navigation.spec.ts`
- `e2e/auth.spec.ts`
- `e2e/groups.spec.ts`
- `e2e/map.spec.ts`

Use Playwright for critical user journeys:

- landing/navigation
- register/login/logout
- group creation
- joining/invitations
- map rendering fallback behavior
- adding places
- saving/searching places

Authenticated E2E tests may require `E2E_EMAIL` and `E2E_PASSWORD`.

## CI

GitHub Actions workflow:

```txt
.github/workflows/ci.yml
```

Expected behavior:

- Run `pnpm test` on PRs and pushes to `main`.
- Run Playwright E2E when required secrets are configured.

When adding tests, keep CI stable. Avoid tests that depend on real third-party APIs unless guarded, mocked, or clearly configured.

## Error handling and UX

- Show user-friendly Spanish messages.
- Do not expose internal stack traces or provider secrets.
- For external providers such as Google Places or Mapbox, handle missing keys and failed requests gracefully.
- For map unavailable states, show a useful fallback instead of blank UI.
- Keep forms resilient to slow submissions and repeated clicks.

## Coding rules for agents

When making changes:

1. First understand the existing feature and file structure.
2. Prefer small, focused changes over broad rewrites.
3. Preserve the current stack and conventions.
4. Add or update tests when changing logic.
5. Do not commit secrets.
6. Do not remove RLS/security checks.
7. Do not bypass validation.
8. Keep copy mostly Spanish because current user-facing UI is Spanish.
9. Use existing route constants, helpers, schemas and UI primitives when possible.
10. Run relevant checks or explain clearly if they cannot be run in the current environment.

## Common pitfalls to avoid

- Do not expose `GOOGLE_PLACES_API_KEY` to the browser.
- Do not use Google Places directly from Client Components.
- Do not rely only on client-side permission checks.
- Do not hardcode duplicated route strings where `ROUTES` exists.
- Do not introduce `any` to silence TypeScript errors.
- Do not change package manager from `pnpm` without explicit approval.
- Do not rewrite the whole app to solve a local issue.
- Do not add new DB columns without corresponding Supabase migration and type updates.
- Do not make E2E tests depend on unavailable credentials by default.

## Preferred implementation style

- Domain logic belongs in `lib/`.
- UI components belong in `components/`.
- Pages should compose existing components and call domain functions.
- Server actions should validate, authorize, mutate and revalidate.
- API routes should keep provider keys server-side and return normalized data to the client.
- Pure helpers should be testable without network access.

## Product direction reminders

MaPlan should evolve toward a polished social planning app:

- collaborative friend groups
- personal and group saved places
- map-first discovery
- fast place saving from search, links or manual input
- clear invitations and friend flows
- strong visual polish with good empty/loading states
- safe Supabase/RLS-backed data model

Every change should support that direction without making the codebase harder to maintain.
