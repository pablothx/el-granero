## Skills de agentes

### Gestor de issues

Las issues viven como archivos markdown locales en `.scratch/<feature>/`. Ver `docs/agents/issue-tracker.md`.

### Etiquetas de triaje

Se usan las etiquetas por defecto (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), registradas como líneas `Status:` en los archivos de issue. Ver `docs/agents/triage-labels.md`.

### Documentación de dominio

Contexto único: un `CONTEXT.md` y `docs/adr/` en la raíz del repo. Ver `docs/agents/domain.md`.

## Comandos

Requiere **npm 11** (con el npm 10 de Node 22 la instalación falla por un bug del resolvedor). Usar `npx npm@11 …` si el npm del sistema es más viejo.

- `npm run dev`: front, API y D1 local juntos (aplicar antes `npm run db:migrate:local`).
- `npm test`: tests del Worker en el runtime de Workers, contra D1 local. El reloj se fija con `relojFijo` (ver `test/`).
- `npm run typecheck` / `npm run build`.
- `npm run db:generate`: genera una migración de Drizzle después de cambiar el esquema.
- `npm run cf-typegen`: regenera los tipos de `Env` y del runtime después de cambiar `wrangler.jsonc`.
- `npm run deploy`: build, migraciones remotas de D1 y `wrangler deploy`.
