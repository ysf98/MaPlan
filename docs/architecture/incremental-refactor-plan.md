# Plan de refactor incremental

## Objetivo
Mejorar estructura interna sin introducir regresiones funcionales.

## Estado actual
- Base sólida por features (`app/`, `components/`, `lib/`).
- Aún hay mezcla parcial entre lógica de dominio e infraestructura dentro de `lib/`.

## Fase 1 (bajo riesgo)
- Estandarizar navegación y labels en un único módulo compartido.
- Mantener helpers de mapa en `lib/map/*` para evitar duplicación.
- Eliminar código muerto (componentes sin uso).

## Fase 2 (riesgo bajo-medio)
- Crear carpetas:
  - `lib/domain/`
  - `lib/infrastructure/`
- Mover gradualmente:
  - `lib/groups.ts` -> `lib/domain/groups.ts`
  - `lib/friends.ts` -> `lib/domain/friends.ts`
  - `lib/places.ts` -> `lib/domain/places.ts`
  - `lib/personalPlaces.ts` -> `lib/domain/personalPlaces.ts`
  - `lib/supabase/*` -> `lib/infrastructure/supabase/*`
- Mantener archivos puente (re-export) para no romper imports en una sola PR.

## Fase 3 (riesgo medio)
- Extraer hooks para componentes mapa grandes:
  - `useMapDraftSelection`
  - `useMapLinkSearch`
- Reducir peso de `GroupMap` y `PersonalMap` sin cambiar su API pública.

## Fase 4 (riesgo medio)
- Revisar naming de archivos legacy con mezcla ES/EN.
- Definir checklist para PRs:
  - Sin duplicación
  - Tests añadidos/actualizados
  - Impacto de seguridad documentado

## Mitigaciones
- Cambios pequeños por fase.
- Tests ejecutados en cada fase (`pnpm test` y, si procede, `pnpm test:e2e`).
- Re-exports temporales en migraciones de rutas internas.
