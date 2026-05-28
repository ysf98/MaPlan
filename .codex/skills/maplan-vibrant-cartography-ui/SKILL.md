---
name: maplan-vibrant-cartography-ui
description: MaPlan UI and design-system workflow. Use when changing MaPlan screens, Tailwind components, auth pages, dashboard, groups, map, friends, profile, mobile layouts, navigation, transitions, icons, or any feature that must follow the Vibrant Cartography visual identity.
---

# MaPlan Vibrant Cartography UI

## Core workflow

1. Read `DESIGN.md` before changing visuals.
2. Preserve existing app architecture: pages compose components, reusable UI belongs in `components/`, domain logic belongs in `lib/`.
3. Keep copy in Spanish.
4. Prefer small, focused UI changes over broad rewrites.
5. Check desktop and mobile layouts, with extra care for iOS safe areas, fixed nav, and map overlays.
6. Run `pnpm build` and targeted Playwright specs for changed routes.

## Visual direction

- Use Plus Jakarta Sans as the main brand font.
- Use coral actions from the design system, especially `#ff5a5f`.
- Use warm surfaces such as `#fff8f7`, `#fff0ef`, and white cards.
- Use rounded, friendly shapes: cards around `24px`, controls around `16px`, pills fully rounded.
- Use soft, low-opacity shadows; avoid harsh dark elevation.
- Keep the app mobile-first and social-map oriented.

## Components and layout

- Reuse `components/ui/Button.tsx`, `Card.tsx`, `Input.tsx`, `EmptyState.tsx`, and existing feature components when practical.
- Keep route shell/navigation behavior consistent in `components/layout/` and `components/navigation/`.
- Avoid nested forms and unsafe `useActionState` calls outside form actions or transitions.
- Keep maps interactive: controls above Mapbox must use correct z-index and pointer events.
- If adding tabs, preserve accessible `role`, `aria-selected`, keyboard/focus behavior, and stable query/state behavior.

## Feature-specific checks

- Auth pages: full viewport background, safe-area colors, logo consistency, and clear CTA links.
- Dashboard: avoid duplicate data fetching and keep activity/avatar fallbacks clear.
- Groups: preserve owner/member actions, settings visibility, tabs (`Lugares`, `Actividad`, `Mapa`), and invitation flows.
- Map: keep search and selected-place card inside the visual map area without blocking map gestures unintentionally.
- Friends: preserve invitations, requests, friend avatars, and fallback initials.
- Profile: keep image upload limits and unique `@usuario` behavior aligned with validation.
