# Checklist de refactor seguro

Usa esta checklist antes de abrir una PR de refactor.

## Alcance
- El cambio es incremental y de bajo riesgo.
- No cambia comportamiento funcional esperado.
- No introduce cambios de modelo de datos ni migraciones no planificadas.

## Seguridad y permisos
- No se eliminan validaciones Zod.
- No se eliminan comprobaciones de autenticacion/autorizacion.
- No se debilitan politicas RLS ni flujo de Supabase.

## Compatibilidad
- No se rompen rutas publicas.
- No se rompen firmas de componentes consumidos por paginas.
- No se rompen contratos de server actions ni de API routes.

## Calidad de codigo
- Se elimina duplicacion real (no micro-optimizaciones innecesarias).
- Se evita codigo muerto y imports sin uso.
- Se mantiene consistencia de naming y lenguaje de UI.

## Testing
- `pnpm test` ejecutado o justificada la limitacion del entorno.
- `pnpm test:e2e` ejecutado si entorno disponible.
- Tests ajustados cuando el refactor cambia textos/selectores sin cambiar funcionalidad.

## CI
- Workflow no rompe por condicionantes de entorno/secrets.
- Artefactos/reportes E2E se mantienen operativos.
