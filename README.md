# MaPlan

MaPlan is a social app for friend groups where users can save places, manage invitations, and explore spots on a map.

## Stack

- Next.js (App Router)
- TypeScript (strict)
- Tailwind CSS
- Supabase (Auth + Postgres + RLS)
- Mapbox (visual map)
- Google Places (POI search)
- Vitest

## Map Architecture

### Visual map layer

- Mapbox remains the visual and interaction layer.
- Main container: `components/map/GroupMap.tsx`.

### Place search layer

- Search is handled with Google Places through server-side API routes:
  - `app/api/places/search/route.ts`
  - `app/api/places/details/route.ts`
- Client helpers:
  - `lib/map/googlePlaces.ts`
  - `components/map/MapSearchBox.tsx`

Flow:
1. User types in search.
2. `MapSearchBox` calls the internal search API.
3. User selects a result.
4. `GroupMap` retrieves full details.
5. Map does `flyTo`, creates draft selection, and shows save panel.
6. User confirms and place is saved in Supabase.

### Manual add and link search

- Manual add is available from search dropdown:
  - "No aparece? Anadir manualmente"
  - Fields: name, address, city/town.
- Link/text quick search is available below the map and reuses Google Places search.

## External provider fields

`places` now supports technical source metadata for POIs:

- `provider`
- `external_place_id`
- `google_maps_url`
- `business_status`

`source` is still kept for recommendation origin (manual, google_maps link, tiktok, etc.).

## Security notes

- Google key is server-side only:
  - `GOOGLE_PLACES_API_KEY`
- Do not expose it with `NEXT_PUBLIC_*`.
- In Google Cloud, restrict by API and by application environment when deployed.

## Environment variables

Create `.env` with:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `GOOGLE_PLACES_API_KEY`

## SQL migrations (Supabase)

Run in Supabase SQL editor:

1. `supabase/rls_groups.sql`
2. `supabase/rls_places.sql`
3. `supabase/places_links.sql`
4. `supabase/rls_friends.sql`
5. `supabase/rls_group_invitations.sql`
6. `supabase/places_external_provider.sql`

`places_external_provider.sql` adds:
- provider columns
- provider check constraint
- index `(provider, external_place_id)`
- partial unique `(group_id, provider, external_place_id)` when `external_place_id is not null`

## Shared map utilities

- `lib/map/addressParsing.ts`
  - city/province/address parsing helpers reused by API routes
- `lib/map/placeClassification.ts`
  - visible place-type label inference
  - internal category inference for saving

## Development

```bash
pnpm install
pnpm dev
```

If `pnpm` is not in PATH in your shell, run with your local package manager setup or from the terminal where `pnpm` is available.

## Tests

Standard:

```bash
pnpm test
```

### New tests

- `tests/lib/addressParsing.test.ts`
- `tests/lib/placeClassification.test.ts`
- `tests/lib/failure-detection.test.ts`

### Controlled failing test (detection check)

This test is skipped by default and fails only when an env var is enabled.

PowerShell:

```powershell
$env:TEST_FAIL_DETECTION='1'
npx vitest run tests/lib/failure-detection.test.ts
Remove-Item Env:TEST_FAIL_DETECTION
```

Expected behavior:
- without env var: test is skipped
- with env var: test fails intentionally

