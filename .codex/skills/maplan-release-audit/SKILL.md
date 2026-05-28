---
name: maplan-release-audit
description: MaPlan pre-merge and pre-deploy audit workflow. Use before merging branches, publishing to main, preparing Supabase SQL rollout, reviewing a large feature branch, removing dead code, updating tests/docs, or validating release readiness.
---

# MaPlan Release Audit

## Core workflow

1. Check branch and worktree state with `git status --short --branch`.
2. Review changed files with `git diff --stat`, `git diff --name-status`, and targeted `git diff`.
3. Search for dead code with `rg`, especially removed components, unused helpers, and stale imports.
4. Audit security-sensitive flows: auth, profiles, groups, invitations, places, RLS, API routes, and server actions.
5. Verify SQL order and idempotency when migrations changed.
6. Update `README.md`, `AGENTS.md`, or `DESIGN.md` only when project behavior or conventions changed.
7. Run validation and report exact results.

## Required validation

- `pnpm test`
- `pnpm build`
- `pnpm test:e2e` when route behavior changed or before final merge.
- If `pnpm` is unavailable in the terminal, use local binaries such as `node_modules/.bin/vitest.cmd`, `tsc.cmd`, `next.cmd`, or `playwright.cmd`, and state the limitation.

## Audit checklist

- TypeScript strict has no `any` added to hide issues.
- Zod schemas match server actions and database shapes.
- Supabase types match SQL function return values and table fields.
- RLS policies do not rely on UI-only checks.
- Security-definer functions have narrow grants.
- Google Places stays behind internal server routes.
- Mapbox token remains public-only as intended.
- Generated artifacts are not committed: `.next`, `playwright-report`, `test-results`, `*.tsbuildinfo`, `supabase/.temp`.
- E2E tests do not require unavailable credentials by default.

## Final report format

Report in Spanish with:

- Critical findings fixed or remaining.
- Files changed, grouped by area.
- SQL order and rollout notes.
- Tests/build commands executed and results.
- Manual regression checklist for groups, owner/member permissions, invitations, map, places, friends, profile, avatars, and auth.

