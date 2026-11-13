# 01: Esqueleto desplegable

**What to build:** El repo pasa de vacío a una app que se despliega y se instala: un único Worker de Cloudflare sirve el build de React + Vite y una API Hono, con D1 accesible vía Drizzle. La app se instala en el celular como PWA y muestra una pantalla "El Granero" con un dato leído de D1. Queda todo listo para que los tickets siguientes solo agreguen comportamiento: el reloj inyectable (única fuente de "ahora" del Worker), el handler de Cron conectado (vacío) en el horario de las 00:05 de la Familia, Vitest corriendo dentro del runtime de Workers contra una D1 local real, y el script de deploy.

Ver la spec (`.scratch/el-granero-mvp/spec.md`), secciones Arquitectura y Despliegue, y ADR 0004, 0006 y 0007.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Un solo paquete npm; `vite dev` levanta front, API y D1 local juntos con `@cloudflare/vite-plugin` (sin Cloudflare Pages).
- [x] Drizzle configurado contra D1, con migraciones generadas y aplicables en local y en remoto.
- [x] Un endpoint de la API lee de D1, y la pantalla inicial lo muestra usando el cliente RPC de Hono con TanStack Query y React Router v7.
- [x] Tailwind y shadcn/ui configurados; la pantalla inicial es mobile first.
- [x] `vite-plugin-pwa` en modo `autoUpdate`: la app es instalable (manifest, íconos, service worker que cachea el shell).
- [x] El Worker obtiene la hora de un reloj inyectable que los tests pueden fijar y avanzar; ningún otro código lee la hora del sistema.
- [x] Un Cron Trigger está declarado y conectado a un handler `scheduled` que por ahora no hace nada; un test lo dispara.
- [x] Vitest con `@cloudflare/vitest-pool-workers` corre al menos un test verde que hace una request HTTP al Worker contra D1 local con migraciones aplicadas.
- [ ] Un script `deploy` aplica las migraciones remotas de D1 y después corre `wrangler deploy`.
- [x] Todo dentro del free tier de Cloudflare.

## Comments

**2026-11-13, implementación:** todo verificado en local (tests, `tsc -b`, build, `vite dev` y `vite preview` con service worker y manifest). Queda pendiente el primer deploy real, que requiere la cuenta de Cloudflare: `wrangler login`, `wrangler d1 create el-granero` (copiar el `database_id` a `wrangler.jsonc`) y `npm run deploy`. El script `deploy` existe pero no se corrió contra remoto.

Desvíos respecto de la spec: `@cloudflare/vitest-pool-workers` está deprecado y se usa su reemplazo `@cloudflare/vitest-plugin` (con Vitest 5); React Router es la v8 (la spec decía v7, que era la última conocida al diseñar).
