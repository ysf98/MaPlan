# Convenciones de carpetas

## Objetivo
Mantener una estructura predecible, limpia y fácil de escalar sin romper la velocidad de desarrollo.

## Convención de idioma
- Interfaz y documentación: español.
- Nombres de archivos y símbolos de código: inglés técnico consistente.
- Excepción: textos de UI visibles al usuario final, que siguen en español.

## Estructura principal
- `app/`: rutas y server actions por feature.
- `components/`: componentes React.
- `lib/`: lógica de dominio y utilidades de infraestructura.
- `tests/`: pruebas unitarias, integración y seguridad.
- `e2e/`: pruebas end-to-end con Playwright.
- `supabase/`: SQL de tablas, RLS y migraciones manuales.
- `docs/`: documentación técnica y de arquitectura.

## Convenciones por capa
- `app/<feature>/page.tsx`: entrada de ruta.
- `app/<feature>/actions.ts`: server actions del feature.
- `components/<feature>/*`: componentes específicos del feature.
- `components/ui/*`: primitives reutilizables de UI.
- `lib/<feature>.ts`: lógica de dominio (acceso a datos y reglas).
- `lib/map/*`: lógica reutilizable de mapa/búsqueda/geocoding.
- `lib/supabase/*`: clientes supabase (`server`, `client`, `admin`).

## Convenciones de tests
- `tests/lib/*`: tests de dominio.
- `tests/actions/*`: tests de server actions.
- `tests/validation/*`: tests de schemas/validaciones.
- `tests/security/*`: tests de políticas SQL/RLS.
- `e2e/*.spec.ts`: flujos de usuario en navegador real.

## Criterios de calidad
- Evitar duplicación entre componentes parecidos; extraer helpers comunes en `lib/*`.
- Mantener componentes grandes bajo control extrayendo lógica en hooks/helpers.
- No mezclar lógica de grupos con lógica personal de mapa; separar dominio y persistencia.
