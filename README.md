# MaPlan

MaPlan es una app social de mapas para guardar, organizar y compartir lugares con amigos. Permite crear grupos, invitar usuarios, guardar recomendaciones, explorar sitios en Mapbox, buscar lugares con Google Places y mantener un mapa personal con estados como `Pendiente`, `Visitado` y `Favorito`.

## Funcionalidades principales

- Autenticación con Supabase.
- Dashboard con grupos, invitaciones y actividad reciente.
- Grupos con privacidad `abierto` / `privado`.
- Permisos por rol: `owner` / `member`.
- Invitaciones de grupo y solicitudes de unión.
- Amigos y solicitudes de amistad.
- Mapa de grupo con búsqueda, guardado y filtros.
- Mapa personal con pestañas `Lugares` y `Mapa`.
- Lugares personales con estado `Pendiente`, `Visitado` y `Favorito`.
- Vista global de listas en perfil: todos, favoritos, pendientes y visitados.
- Perfil editable con contadores reales.
- Logros de explorador: Cartógrafo, Gourmet, Naturalista y Deportista.
- Imágenes de lugares desde Google Places o guardado manual.
- Enlaces de Google Maps compatibles con web y móvil.
- Notificaciones y actividad de grupo.
- RLS y validaciones server-side para proteger datos.

## Stack

- Next.js App Router
- React
- TypeScript en modo estricto
- Tailwind CSS
- Supabase Auth, Postgres y RLS
- Mapbox GL
- Google Places mediante rutas API server-side
- Zod
- Vitest
- Playwright
- pnpm

El package manager está fijado en `package.json`:

```json
"packageManager": "pnpm@10.11.0"
```

## Requisitos de entorno

Crea un archivo `.env` local con:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
NEXT_PUBLIC_MAPBOX_STYLE=
GOOGLE_PLACES_API_KEY=
```

`NEXT_PUBLIC_MAPBOX_STYLE` es opcional; si no se define, la app usa el estilo por defecto de Mapbox.

Variables opcionales para E2E:

```bash
E2E_EMAIL=
E2E_PASSWORD=
E2E_RUN_SIGNUP=1
PLAYWRIGHT_BASE_URL=
```

Reglas de seguridad:

- No commitear `.env` ni secretos.
- Mantener `GOOGLE_PLACES_API_KEY` solo en servidor.
- No crear `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`.
- La anon key de Supabase es pública, pero RLS debe proteger los datos.
- No usar service role en cliente.

## Desarrollo local

```bash
pnpm install
pnpm dev
```

## Comandos

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm test
pnpm test:e2e
pnpm test:e2e:ui
pnpm test:e2e:headed
pnpm test:e2e:report
```

Si `pnpm` no está disponible en el entorno local, instala pnpm/Corepack antes de cambiar de package manager.

## Estructura del proyecto

- `app/`: rutas App Router, layouts, route handlers y server actions.
- `components/`: componentes UI y de feature.
- `components/map/`: Mapbox, buscador, tarjetas de lugar, mapa personal y mapa de grupo.
- `components/groups/`: vistas, tabs, miembros, invitaciones y controles de grupo.
- `components/profile/`: perfil, listas globales y logros.
- `components/ui/`: primitivas visuales reutilizables.
- `lib/`: lógica de dominio, permisos, Supabase, validación y helpers.
- `lib/map/`: Google Places, geocoding, distancias, URLs de Google Maps y clasificación.
- `lib/profilePlaces.ts`: agregación de lugares personales y de grupos para el perfil.
- `lib/profileAchievements.ts`: cálculo de logros de explorador.
- `lib/validation/`: schemas Zod.
- `types/`: tipos compartidos, especialmente Supabase.
- `supabase/`: SQL, schema y RLS.
- `tests/`: tests Vitest.
- `e2e/`: tests Playwright.

## Rutas principales

Las rutas comunes viven en `utils/constants.ts` bajo `ROUTES`.

- `/`
- `/login`
- `/register`
- `/dashboard`
- `/friends`
- `/invitations`
- `/notifications`
- `/groups`
- `/groups/new`
- `/groups/join`
- `/groups/[groupId]`
- `/map`
- `/profile`
- `/profile/places`

## Modelo de dominio

### Grupos

Los grupos son espacios colaborativos donde los usuarios guardan lugares. Pueden ser:

- `abierto`: los miembros pueden colaborar según las reglas actuales.
- `privado`: solo owner/admin tiene permisos elevados.

La pertenencia se gestiona en `group_members`; el creador real del grupo también se trata como owner aunque falte una fila legacy de membresía.

### Lugares de grupo

Los lugares compartidos viven en `places`.

Los estados personales por usuario de lugares de grupo viven en `group_place_user_states`:

- `status`: `pending` / `visited`
- `is_favorite`: boolean

Esto permite que cada usuario tenga sus propios favoritos y visitados dentro de un mismo grupo.

### Lugares personales

Los lugares del mapa personal viven en `personal_places` e incluyen:

- `status`: `pending` / `visited`
- `is_favorite`: boolean
- `provider`, `external_place_id`, `google_maps_url`
- imagen, teléfono, coordenadas y categoría.

### Perfil, listas y logros

El perfil usa agregación real desde `lib/profilePlaces.ts`:

- lugares personales;
- lugares de grupos visibles para el usuario;
- estados personales de grupo.

La ruta `/profile/places` permite filtrar:

- todos;
- favoritos;
- pendientes;
- visitados.

Los logros se calculan en `lib/profileAchievements.ts`:

- Cartógrafo: cualquier lugar guardado.
- Gourmet: comida, restaurantes, bares, cafeterías, etc.
- Naturalista: parques, montes, rutas, playas, naturaleza, etc.
- Deportista: gimnasio, pistas, deporte, fútbol, pádel, etc.

## Mapa y búsqueda de lugares

MaPlan separa dos capas:

- Mapbox renderiza el mapa visual, marcadores, cámara y controles.
- Google Places se consulta solo desde rutas API server-side.

Rutas relevantes:

- `app/api/places/search/route.ts`
- `app/api/places/details/route.ts`
- `app/api/places/nearby/route.ts`
- `app/api/places/photo/route.ts`

Componentes relevantes:

- `components/map/GroupMap.tsx`
- `components/map/PersonalMap.tsx`
- `components/map/MapSearchBox.tsx`
- `components/map/MapPlaceCard.tsx`
- `components/map/SimplePlacesList.tsx`
- `components/map/useMapboxResize.ts`

Los enlaces de Google Maps deben construirse con `lib/map/googleMapsUrl.ts` para funcionar bien en web y móvil.

## Orden SQL recomendado en Supabase

Ejecutar en Supabase SQL Editor en este orden:

1. `supabase/profiles_full_name.sql`
2. `supabase/rls_friends.sql`
3. `supabase/groups_cover_image_url.sql`
4. `supabase/groups_privacy.sql`
5. `supabase/rls_groups.sql`
6. `supabase/rls_group_invitations.sql`
7. `supabase/rls_group_activity.sql`
8. `supabase/places_links.sql`
9. `supabase/places_external_provider.sql`
10. `supabase/places_city.sql`
11. `supabase/rls_places.sql`
12. `supabase/group_place_user_states.sql`
13. `supabase/rls_personal_places.sql`
14. `supabase/places_images.sql`
15. `supabase/places_favorites.sql`
16. `supabase/places_phone_number.sql`

Notas:

- La mayoría de scripts son idempotentes y usan `if not exists` / `drop policy if exists`.
- `groups_privacy.sql` migra flags legacy si existen.
- `profiles_full_name.sql` y `groups_cover_image_url.sql` son necesarios para la versión actual.
- Si cambia el retorno de una función SQL, Postgres puede fallar con `cannot change return type of existing function`.

Solución habitual:

```sql
drop function if exists public.get_profiles_by_ids(uuid[]);
```

Después vuelve a ejecutar el SQL que recrea la función.

## Testing

Tests unitarios, dominio y seguridad:

- `tests/lib/*`
- `tests/actions/*`
- `tests/validation/*`
- `tests/security/*`

E2E:

- `e2e/auth.spec.ts`
- `e2e/navigation.spec.ts`
- `e2e/groups.spec.ts`
- `e2e/map.spec.ts`
- `e2e/notifications.spec.ts`

Playwright usa `PLAYWRIGHT_BASE_URL` si está definido; si no, arranca el dev server con `pnpm dev`.

## Troubleshooting

- `pnpm` no encontrado: instala pnpm/Corepack y vuelve a ejecutar.
- Falta Mapbox: revisa `NEXT_PUBLIC_MAPBOX_TOKEN`.
- No carga Google Places: revisa `GOOGLE_PLACES_API_KEY` en servidor.
- La ubicación del navegador no funciona: usa HTTPS o `localhost`, y revisa permisos del navegador.
- Imágenes externas raras: algunas fotos de Google pueden traer márgenes internos; las tarjetas intentan disimularlo con fondo desenfocado.
- Mapbox gris o mal dimensionado en móvil: revisar `useMapboxResize.ts`.
- Avatares o perfiles no aparecen: revisar `profiles_full_name.sql` y políticas de `rls_friends.sql`.

## Estado actual del producto

- Detalle de grupo con tabs `Lugares`, `Actividad` y `Mapa`.
- Mapa personal alineado con el estilo de grupos.
- Estados personales y de grupo para favoritos, pendientes y visitados.
- Perfil con contadores agregados reales.
- Listas globales en `/profile/places`.
- Logros de explorador calculados desde lugares reales.
- Amigos, invitaciones, solicitudes y notificaciones integradas.
- Modelo de permisos enforced en UI, server actions y RLS.
