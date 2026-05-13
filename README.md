# MaPlan

MaPlan es una app social de mapas para grupos de amigos. Su objetivo es ayudar a guardar, organizar y compartir sitios recomendados (restaurantes, cafeterias, sitios para visitar, discotecas y planes) dentro de un mapa colaborativo por grupo.

## Vision del producto

Hoy muchas recomendaciones se pierden en chats, notas sueltas o mensajes viejos. MaPlan resuelve eso con un espacio comun donde cada grupo puede:

- Guardar lugares utiles para el grupo
- Ver recomendaciones en lista y en mapa
- Filtrar por categoria para decidir mas rapido
- Marcar estado de cada lugar (pendiente, visitado, favorito)

El foco es reducir friccion para que planear con amigos sea simple, visual y social.

## Objetivo del MVP

El MVP busca validar que un grupo puede completar el flujo principal extremo a extremo:

1. Registrarse o iniciar sesion
2. Crear un grupo o unirse a uno
3. Anadir lugares manualmente
4. Categorizar lugares
5. Ver lugares en lista
6. Ver lugares en mapa
7. Filtrar por categoria
8. Marcar lugares como pendiente, visitado o favorito

## Estado actual del proyecto

Estado: base inicial creada.

Incluye:

- Estructura de proyecto limpia y escalable con Next.js App Router
- UI inicial movil-first con componentes reutilizables
- Navegacion principal (navbar, mobile nav y sidebar)
- Paginas placeholder para las vistas clave

No incluye aun:

- Supabase (auth y base de datos)
- Integracion de mapa (Mapbox o Google Maps)
- Logica de negocio real
- API routes funcionales

## Stack tecnologico

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase (planificado para auth + DB)
- Mapbox o Google Maps API (planificado para mapa)
- Vercel (despliegue)

## Arquitectura del frontend

Estructura actual:

- `app/`: paginas y layout global
- `components/`: componentes de UI, layout y navegacion
- `lib/`: utilidades base
- `hooks/`: hooks reutilizables
- `types/`: tipos TypeScript
- `styles/`: estilos globales y tokens visuales
- `utils/`: constantes y helpers

Rutas iniciales:

- `/` landing
- `/login`
- `/register`
- `/dashboard`
- `/groups`
- `/groups/[groupId]`
- `/map`
- `/profile`

## Sistema de UI inicial

Componentes reutilizables creados:

- `Button`
- `Input`
- `Card`
- `Navbar`
- `Sidebar`
- `MobileNav`
- `AppShell` (layout principal)
- `EmptyState`
- `CategoryBadge`

Lineas de estilo:

- Minimalista y moderno
- Enfoque social
- Tarjetas redondeadas
- Espaciado limpio
- Base preparada para agregar dark mode

## Modelo de datos planificado (MVP)

Entidades objetivo:

- `profiles`
- `groups`
- `group_members`
- `categories`
- `places`

Campos clave de `places`:

- `name`
- `address`
- `latitude`
- `longitude`
- `category_id`
- `status` (`pending`, `visited`, `favorite`)
- `group_id`
- `created_by`

## Roadmap recomendado

1. Integrar Supabase Auth (register/login/logout)
2. Crear tablas y politicas RLS en Supabase
3. Implementar flujo de grupos (crear, unirse, listar)
4. Implementar flujo de lugares (crear, listar, actualizar estado)
5. Integrar mapa y marcadores
6. Implementar filtros por categoria/estado
7. Mejorar UX (loading, empty states, errores)
8. Deploy en Vercel con variables de entorno

## Como ejecutar en local

Requisitos:

- Node.js 18+
- pnpm

Pasos:

```bash
pnpm install
pnpm dev
```

Abrir en navegador:

- [http://localhost:3000](http://localhost:3000)

## Scripts disponibles

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```

## Convenciones del proyecto

- Lenguaje principal: TypeScript
- Componentes pequenos y reutilizables
- Separacion clara entre UI, logica y datos
- Escalado progresivo desde MVP a version productiva

## Funcion de la app (resumen corto)

MaPlan sirve para convertir recomendaciones dispersas en un mapa colaborativo por grupo, ayudando a decidir planes mas rapido y sin perder sitios importantes.

## Licencia

Pendiente de definir.
