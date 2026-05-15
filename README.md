# MaPlan

MaPlan es una app social (Next.js + Supabase) para crear grupos de amigos y guardar lugares recomendados.

## Estado actual

Implementado:
- Auth (registro/login/logout) con Supabase.
- Grupos: crear, listar, detalle, salir y eliminar (owner).
- Modos de acceso a grupo:
  - `invite_only` (default)
  - `request_to_join`
  - `open_by_code`
- Solicitudes de unión por código (cuando aplica).
- Sistema de amigos:
  - buscar por `username`
  - enviar/aceptar/rechazar solicitudes
  - eliminar amistad
- Invitaciones a grupo:
  - owner invita amigos
  - invitado acepta/rechaza
  - inserción en `group_members` sin duplicados
- Lugares por grupo (lista), creación y cambio de estado.
- Validaciones con Zod.
- Tests unitarios y de acciones con Vitest.

## Stack

- Next.js App Router
- TypeScript (strict)
- Tailwind CSS
- Supabase (Auth + Postgres + RLS)
- Server Actions
- Zod
- Vitest
- pnpm

## Estructura clave

- `app/`: rutas y server actions
- `components/`: UI y vistas de dominio
- `lib/`: lógica de negocio (groups, friends, invitations, places, permissions)
- `supabase/`: SQL de schema/RLS
- `tests/`: tests de validación y acciones

## Variables de entorno

En `.env`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (solo para tareas administrativas puntuales; no usado como fallback genérico de permisos)

## SQL a ejecutar en Supabase

Ejecuta en SQL Editor (una query nueva por archivo) en este orden:

1. `supabase/rls_groups.sql`
2. `supabase/rls_places.sql`
3. `supabase/places_links.sql`
4. `supabase/rls_friends.sql`
5. `supabase/rls_group_invitations.sql` (depende de groups + friends)

Notas:
- Los scripts son idempotentes en lo posible (`if exists` / `if not exists`).
- Si hay datos legacy, corrige duplicados antes de crear constraints únicas (especialmente usernames).

## Desarrollo local

```bash
pnpm install
pnpm dev
```

## Tests

```bash
pnpm test
```

Cobertura actual:
- Schemas Zod (groups, places, friends, invitations).
- Server actions principales.
- Casos de seguridad en capa de acciones/permisos.

## Checklist de release interna (pre-mapa)

1. `pnpm test` en verde.
2. Crear grupo nuevo y verificar default `join_policy = invite_only`.
3. Owner puede invitar a un amigo y el invitado puede aceptar/rechazar.
4. Usuario no owner no puede cambiar settings ni borrar grupo.
5. Usuario no miembro no puede crear/leer lugares de grupos ajenos.
6. Join por codigo solo funciona para `open_by_code` (y request flow para `request_to_join`).
7. Verificar que no se usa `SUPABASE_SERVICE_ROLE_KEY` como bypass de RLS en flujos de usuario.

## Flujo principal de producto (actual)

1. Usuario A agrega a Usuario B como amigo.
2. Owner crea grupo (default `invite_only`).
3. Owner invita a B al grupo.
4. B acepta invitación.
5. B entra en `group_members` y accede al grupo.

`join_code` sigue disponible como fallback para grupos con política compatible.

## Roadmap corto

- Endurecer más tests de seguridad RLS extremo a extremo.
- Mejorar observabilidad/errores de acciones.
- Integración de mapa real (siguiente gran bloque).

## Siguiente fase (mapa)

Preparado en MVP social:
- `places` con `latitude` y `longitude` nullable.
- `places` con `original_url` y `source`.
- Helper `hasValidCoordinates(place)` para diferenciar lugares geolocalizados.
- Filtros de lista por estado, categoria y fuente.

Pendiente de implementar:
- Integracion Mapbox/Google Maps.
- Geocoding desde direccion/enlace.
- Marcadores y vista de mapa enlazada a detalle de lugar.
