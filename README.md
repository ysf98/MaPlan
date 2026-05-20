# MaPlan

MaPlan es una aplicación social para organizar planes entre amigos. Permite crear grupos, invitar personas, guardar lugares y explorar recomendaciones en mapa.

## Stack técnico
- Next.js (App Router)
- TypeScript (modo estricto)
- Tailwind CSS
- Supabase (Auth + Postgres + RLS)
- Mapbox (render de mapa)
- Google Places (búsqueda de puntos de interés)
- Vitest (unit/integration/security)
- Playwright (E2E)

## Estructura del proyecto
- `app/`: rutas y server actions por feature.
- `components/`: componentes de UI y componentes por dominio.
- `lib/`: lógica de negocio, utilidades y servicios.
- `tests/`: pruebas unitarias, integración y seguridad.
- `e2e/`: pruebas end-to-end.
- `supabase/`: scripts SQL (tablas, constraints, RLS).
- `docs/`: documentación técnica.

Documentación de arquitectura:
- Convenciones de carpetas: [folder-conventions.md](/c:/Users/Worten/Desktop/Maplan/docs/architecture/folder-conventions.md)
- Plan incremental de refactor: [incremental-refactor-plan.md](/c:/Users/Worten/Desktop/Maplan/docs/architecture/incremental-refactor-plan.md)
- Checklist de refactor seguro: [safe-refactor-checklist.md](/c:/Users/Worten/Desktop/Maplan/docs/architecture/safe-refactor-checklist.md)

## Funcionalidades principales
- Autenticación con Supabase.
- Gestión de grupos y miembros.
- Invitaciones a grupos y solicitudes de amistad.
- Mapa colaborativo por grupo.
- `Mi mapa`: mapa personal con lugares individuales por usuario.

## Mapa (grupo y personal)
### Mapa de grupo
- Se usa dentro del detalle de cada grupo.
- Permite buscar lugares (Google Places), crear borradores y guardar.
- Respeta permisos del grupo para edición.

### Mi mapa (personal)
- Sección individual en `/map`.
- Datos totalmente separados de los grupos.
- Tabla dedicada: `personal_places`.
- Políticas RLS para que cada usuario solo vea/modifique sus propios registros.

## Variables de entorno
Crea un archivo `.env` con:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (solo backend seguro)
- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `GOOGLE_PLACES_API_KEY`

## SQL en Supabase
Ejecuta en Supabase SQL Editor:

1. `supabase/rls_groups.sql`
2. `supabase/rls_places.sql`
3. `supabase/places_links.sql`
4. `supabase/rls_friends.sql`
5. `supabase/rls_group_invitations.sql`
6. `supabase/places_external_provider.sql`
7. `supabase/rls_personal_places.sql`

Notas:
- `rls_personal_places.sql` crea `personal_places`, índices, trigger de `updated_at` y políticas RLS por `auth.uid()`.

## Desarrollo local
```bash
pnpm install
pnpm dev
```

## Scripts
- `pnpm dev`: servidor de desarrollo.
- `pnpm build`: build de producción.
- `pnpm start`: arranque en producción.
- `pnpm lint`: linting.
- `pnpm test`: suite Vitest.
- `pnpm test:e2e`: suite Playwright.
- `pnpm test:e2e:ui`: runner UI de Playwright.
- `pnpm test:e2e:headed`: ejecución con navegador visible.
- `pnpm test:e2e:report`: abrir informe HTML de Playwright.

## Testing
### Vitest
Cobertura por carpetas:
- `tests/lib/*`: dominio.
- `tests/actions/*`: server actions.
- `tests/validation/*`: schemas.
- `tests/security/*`: SQL/RLS.

### Playwright
Specs base:
- `e2e/navigation.spec.ts`
- `e2e/auth.spec.ts`
- `e2e/groups.spec.ts`
- `e2e/map.spec.ts`
- `e2e/notifications.spec.ts`

Instalación de browser en local/CI:
```bash
pnpm exec playwright install --with-deps chromium
```

Variables opcionales para E2E autenticado:
- `E2E_EMAIL`
- `E2E_PASSWORD`
- `E2E_RUN_SIGNUP=1`
- `PLAYWRIGHT_BASE_URL` (para usar una URL ya desplegada)

## CI (GitHub Actions)
Workflow: `.github/workflows/ci.yml`

- Job `unit`: corre `pnpm test`.
- Job `e2e`: instala Chromium y corre `pnpm test:e2e` solo si existen secrets mínimos de Supabase.

Secrets recomendados:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN` (recomendado)
- `GOOGLE_PLACES_API_KEY` (recomendado)
- `E2E_EMAIL` y `E2E_PASSWORD` (para tests autenticados)
- `E2E_RUN_SIGNUP` (opcional)

## Seguridad
- No expongas claves privadas en cliente.
- `GOOGLE_PLACES_API_KEY` debe mantenerse server-side.
- El acceso a datos personales se controla por RLS en `personal_places`.
- Revisa también notas en [security-notes.md](/c:/Users/Worten/Desktop/Maplan/docs/security-notes.md).

## Estado actual
- Navegación desktop simplificada (sin sidebar redundante).
- Título de sección visible en navbar (`MaPlan - Sección`).
- Cierre de sesión movido a la sección `Perfil`.
