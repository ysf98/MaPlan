# AGENTS.md

Este archivo da a Codex y otros agentes de código el contexto necesario para trabajar de forma segura y consistente en **MaPlan**.

## Resumen del producto

**MaPlan** es una app social de mapas para guardar, organizar y compartir lugares con amigos.

La app combina:

- grupos de amigos;
- mapa colaborativo de grupo;
- mapa personal;
- selector de mapas;
- mapa principal Explore para búsqueda y guardado multi-destino;
- búsqueda de lugares con Google Places;
- visualización con Mapbox;
- amigos, invitaciones y solicitudes;
- perfil con listas globales;
- logros de explorador;
- estados personales por lugar: `Pendiente`, `Visitado` y `Favorito`.

El producto debe sentirse moderno, móvil, social y muy claro. La copy visible está mayoritariamente en español.

## Stack actual

Usa el stack existente. No introduzcas cambios grandes de framework sin petición explícita.

- Next.js App Router
- React
- TypeScript strict
- Tailwind CSS
- Supabase Auth, Postgres y RLS
- Mapbox GL
- Google Places mediante API routes server-side
- Zod
- Vitest
- Playwright
- pnpm

El package manager está fijado en `package.json`:

```json
"packageManager": "pnpm@10.11.0"
```

Prefiere comandos `pnpm`. Si `pnpm` no está disponible, explícalo en vez de cambiar silenciosamente a otro package manager.

## Comandos importantes

```bash
pnpm install
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

Playwright usa `PLAYWRIGHT_BASE_URL` si está definido. Si no, arranca el dev server con `pnpm dev`.

## Variables de entorno

Variables esperadas en `.env`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
NEXT_PUBLIC_MAPBOX_STYLE=
GOOGLE_PLACES_API_KEY=
```

`NEXT_PUBLIC_MAPBOX_STYLE` es opcional.

Variables E2E opcionales:

```bash
E2E_EMAIL=
E2E_PASSWORD=
E2E_RUN_SIGNUP=1
PLAYWRIGHT_BASE_URL=
```

Reglas:

- Nunca commitear `.env` ni secretos.
- Mantener `GOOGLE_PLACES_API_KEY` solo server-side.
- No renombrarla a `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`.
- `NEXT_PUBLIC_MAPBOX_TOKEN` es pública por diseño.
- La anon key de Supabase es pública, pero RLS debe proteger los datos.
- No usar service role en cliente.

## Estructura y convenciones

- `app/`: rutas App Router, layouts, route handlers y server actions.
- `components/`: UI y features reutilizables.
- `components/map/`: Mapbox, búsqueda, tarjetas, mapa personal y mapa de grupo.
- `components/explore/`: mapa Explore fullscreen y guardado multi-destino.
- `components/maps/`: selector entre mapas grupales y mapa personal.
- `components/groups/`: vistas de grupo, tabs, miembros, invitaciones y permisos.
- `components/profile/`: perfil, listas globales y logros.
- `components/layout/`: shell y navegación.
- `components/ui/`: primitivas visuales.
- `lib/`: lógica de dominio, permisos, Supabase, validación y helpers.
- `lib/map/`: Google Places, geocoding, URLs, distancia y clasificación.
- `lib/profilePlaces.ts`: agregación de lugares del perfil.
- `lib/profileAchievements.ts`: cálculo de logros.
- `lib/saveDestinations.ts`: destinos disponibles para guardar lugares desde Explore.
- `lib/supabase/`: clientes Supabase.
- `lib/validation/`: schemas Zod.
- `types/`: tipos compartidos y Supabase.
- `supabase/`: SQL, schema y RLS.
- `tests/`: Vitest.
- `e2e/`: Playwright.

Usa el alias `@/*` configurado en `tsconfig.json`.

## Rutas

Las constantes viven en:

```ts
utils/constants.ts
```

Usa `ROUTES` cuando sea práctico.

Rutas importantes:

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
- `/maps`
- `/map`
- `/explore`
- `/profile`
- `/profile/places`

## TypeScript

El proyecto usa TypeScript estricto.

- Evita `any`.
- Prefiere tipos de dominio concretos.
- Mantén `types/supabase.ts` alineado con SQL.
- Valida entradas externas con Zod.
- No silencies errores de tipos con casts amplios.

## Server/client boundaries

- Usa Server Components para carga protegida y data fetching.
- Usa Client Components solo para estado, efectos, formularios, browser APIs, Mapbox o UI interactiva.
- Server actions deben empezar con `"use server"`.
- Componentes con hooks o Mapbox deben empezar con `"use client"`.
- Mapbox vive en cliente.
- Google Places se consulta solo desde API routes server-side.

## Autenticación

Supabase Auth es la fuente de identidad.

Patrones importantes:

- Cliente server-side: `lib/supabase/server.ts`.
- Para páginas protegidas usa `getCurrentUser`.
- Para mutations usa `requireAuthenticatedUser`.
- Las server actions deben autenticar, validar, comprobar permisos, mutar y revalidar.

## Supabase, SQL y RLS

Supabase es la fuente de verdad. No dependas solo de checks de UI.

Archivos SQL relevantes:

- `supabase/profiles_full_name.sql`
- `supabase/rls_friends.sql`
- `supabase/groups_cover_image_url.sql`
- `supabase/groups_privacy.sql`
- `supabase/rls_groups.sql`
- `supabase/rls_group_invitations.sql`
- `supabase/rls_group_activity.sql`
- `supabase/places_links.sql`
- `supabase/places_external_provider.sql`
- `supabase/places_city.sql`
- `supabase/rls_places.sql`
- `supabase/group_place_user_states.sql`
- `supabase/rls_personal_places.sql`
- `supabase/places_images.sql`
- `supabase/places_favorites.sql`
- `supabase/places_phone_number.sql`

Al cambiar base de datos:

- Actualiza SQL en `supabase/`.
- Mantén RLS coherente.
- Actualiza `types/supabase.ts` si cambia schema.
- Añade tests en `tests/security/` o `tests/lib/`.
- No expongas datos de grupos ajenos.
- No crees bypass con service role desde app code.

## Conceptos de dominio

### Grupos

Los grupos son espacios colaborativos.

- `groups`: metadata, privacidad, owner real (`created_by`), join code.
- `group_members`: membresía y rol.
- Privacidad: `abierto` / `privado`.
- Roles: `owner` / `member`.
- El creador del grupo cuenta como owner aunque falte una fila legacy en `group_members`.

### Lugares de grupo

Los lugares compartidos viven en `places`.

Campos importantes:

- `name`
- `address`
- `city`
- `category_id`
- `source`
- `provider`
- `external_place_id`
- `google_maps_url`
- `business_status`
- `phone_number`
- `image_url`
- `latitude`
- `longitude`

Los estados personales de lugares de grupo viven en `group_place_user_states`:

- `status`: `pending` / `visited`
- `is_favorite`: boolean

### Lugares personales

Los lugares del mapa personal viven en `personal_places`.

Incluyen:

- `status`: `pending` / `visited`
- `is_favorite`: boolean
- `category`
- `provider`
- `external_place_id`
- `google_maps_url`
- `phone_number`
- `image_url`
- coordenadas.

### Selector de mapas y Explore

`/maps` es la ruta del botón `Mapa` en la barra inferior. Es una vista simple con dos tarjetas:

- `Mapas Grupales`: lleva a `/groups`.
- `Mapa Personal`: lleva a `/map`.

`/explore` es el mapa principal del botón central de la navegación. Es una vista fullscreen/inmersiva:

- no muestra la barra inferior;
- usa cabecera overlay con botón atrás;
- tiene buscador Google Places;
- permite tocar el mapa;
- muestra una tarjeta de lugar;
- permite guardar en `Mapa personal` o en grupos donde el usuario pueda crear lugares.

La lista de destinos se calcula con `lib/saveDestinations.ts`. La server action vive en `app/explore/actions.ts` y reutiliza `createPersonalPlace` / `createPlace`. No confíes solo en destinos visibles en UI: el backend debe seguir validando permisos y duplicados.

### Perfil, listas y logros

El perfil no debe usar métricas decorativas.

- Contadores agregados: usar `lib/profilePlaces.ts`.
- Listas rápidas: enlazar a `/profile/places`.
- Vista global: personales + grupos visibles + estados de usuario.
- Logros: calcular desde `lib/profileAchievements.ts`.

Tipos relevantes:

- `ProfilePlaceItem`
- `ProfilePlacesFilter`
- `ProfileAchievement`
- `ProfileAchievementLevel`

## Arquitectura de mapa

### Capa visual

Mapbox renderiza el mapa, marcadores, `flyTo`, filtros, selección y tarjetas.

Componentes:

- `components/explore/ExploreMap.tsx`
- `components/maps/MapsHubView.tsx`
- `components/map/GroupMap.tsx`
- `components/map/PersonalMap.tsx`
- `components/map/MapPlaceCard.tsx`
- `components/map/MapMobileTabs.tsx`
- `components/map/UserLocationButton.tsx`
- `components/map/useMapboxResize.ts`

`useMapboxResize.ts` es importante para evitar mapas grises o mal dimensionados en móvil.

### Capa de búsqueda

Google Places se usa vía rutas internas:

- `app/api/places/search/route.ts`
- `app/api/places/details/route.ts`
- `app/api/places/nearby/route.ts`
- `app/api/places/photo/route.ts`

No uses Google Places directamente desde componentes cliente.

Los enlaces de Google Maps deben construirse/normalizarse con:

```ts
lib/map/googleMapsUrl.ts
```

## Validación

Schemas Zod:

```ts
lib/validation/schemas.ts
```

Schemas importantes:

- `createGroupSchema`
- `joinGroupSchema`
- `createPlaceSchema`
- `createPersonalPlaceSchema`
- `saveExploredPlaceSchema`
- `updatePlaceStatusSchema`
- `updatePlaceFavoriteSchema`
- `updatePersonalPlaceStatusSchema`
- `updatePersonalPlaceFavoriteSchema`
- `removeGroupMemberSchema`

Mantén mensajes de validación en español.

## UI y diseño

Sigue `DESIGN.md` y la identidad **Vibrant Cartography**.

- Superficies cálidas.
- Coral como acción principal (`#ff5a5f` / `#c6283a`).
- Plus Jakarta Sans.
- Mobile-first.
- Tarjetas redondeadas y sombras suaves.
- Reutiliza `Button`, `Card`, `Input`, `EmptyState`, `CategoryBadge`.
- No añadas librerías UI pesadas sin petición explícita.
- No cambies `MapPlaceCard` salvo necesidad clara.
- Las vistas fullscreen de mapa pueden usar `AppShell fullBleed`; no debe ocultar navegación en páginas normales.

## Server actions

Patrón recomendado:

```ts
export async function someAction(
  _previousState: SomeActionState,
  formData: FormData
): Promise<SomeActionState> {
  const user = await requireAuthenticatedUser("/fallback");
  const parsedInput = schema.safeParse({...});

  if (!parsedInput.success) {
    return { error: getValidationErrorMessage(parsedInput.error), success: false };
  }

  const result = await domainFunction({ userId: user.id, ...parsedInput.data });

  if (result.error) {
    return { error: result.error, success: false };
  }

  revalidatePath("/affected-path");
  return { error: null, success: true };
}
```

## Tests

Vitest:

- Helpers puros: `tests/lib/`
- Server actions: `tests/actions/`
- Validación: `tests/validation/`
- Seguridad/RLS: `tests/security/`

Playwright:

- `e2e/auth.spec.ts`
- `e2e/navigation.spec.ts`
- `e2e/groups.spec.ts`
- `e2e/map.spec.ts`
- `e2e/notifications.spec.ts`

Añade tests cuando cambies lógica de dominio, permisos, validación, SQL o acciones.

## Reglas para agentes

1. Lee el código existente antes de editar.
2. Haz cambios pequeños y enfocados.
3. No reviertas cambios ajenos.
4. No elimines checks de RLS/permisos.
5. No expongas claves server-side.
6. Usa `ROUTES` cuando sea práctico.
7. Usa helpers existentes antes de duplicar lógica.
8. Mantén copy visible en español.
9. Mantén TypeScript estricto.
10. Ejecuta `tsc --noEmit` y tests relevantes cuando cambies código.
11. Si solo cambias documentación, no hace falta ejecutar tests.
12. Explica claramente cualquier check que no se pueda ejecutar.

## Errores comunes a evitar

- Exponer `GOOGLE_PLACES_API_KEY`.
- Llamar Google Places desde cliente.
- Usar solo permisos de UI para proteger mutations.
- Hardcodear rutas ya disponibles en `ROUTES`.
- Crear métricas de perfil sin lógica real.
- Romper la agregación de `/profile/places`.
- Duplicar lógica de guardado entre Explore, mapa personal y grupos.
- Mostrar destinos de guardado en Explore sin validar de nuevo en backend.
- Cambiar `personal_places` o `group_place_user_states` sin actualizar tipos/tests.
- Cambiar package manager sin aprobación.
- Reescribir una pantalla completa para arreglar un detalle local.

## Dirección de producto

MaPlan debe evolucionar hacia una app social de planificación:

- grupos colaborativos;
- lugares personales y compartidos;
- mapa como experiencia central;
- Explore como entrada rápida para guardar lugares en cualquier destino permitido;
- listas globales útiles;
- perfil con progreso real;
- logros ligeros;
- invitaciones y amigos claros;
- permisos seguros con Supabase/RLS;
- UI pulida y móvil.

Cada cambio debe hacer la app más útil sin volver la arquitectura más difícil de mantener.

## Skills locales de Codex

Skills versionadas en `.codex/skills/`:

- `maplan-rls-security`: usar para SQL, RLS, privacidad, permisos y tipos Supabase.
- `maplan-vibrant-cartography-ui`: usar para cambios de UI, diseño, navegación, mapas, perfil y mobile.
- `maplan-release-audit`: usar antes de merges, despliegues, rollout SQL o revisiones grandes.
