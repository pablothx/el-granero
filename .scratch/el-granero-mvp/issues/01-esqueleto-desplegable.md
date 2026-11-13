# 01: Esqueleto desplegable

**What to build:** El repo pasa de vacío a una app que se despliega y se instala: un único Worker de Cloudflare sirve el build de React + Vite y una API Hono, con D1 accesible vía Drizzle. La app se instala en el celular como PWA y muestra una pantalla "El Granero" con un dato leído de D1. Queda todo listo para que los tickets siguientes solo agreguen comportamiento: el reloj inyectable (única fuente de "ahora" del Worker), el handler de Cron conectado (vacío) en el horario de las 00:05 de la Familia, Vitest corriendo dentro del runtime de Workers contra una D1 local real, y el script de deploy.

Ver la spec (`.scratch/el-granero-mvp/spec.md`), secciones Arquitectura y Despliegue, y ADR 0004, 0006 y 0007.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Un solo paquete npm; `vite dev` levanta front, API y D1 local juntos con `@cloudflare/vite-plugin` (sin Cloudflare Pages).
- [ ] Drizzle configurado contra D1, con migraciones generadas y aplicables en local y en remoto.
- [ ] Un endpoint de la API lee de D1, y la pantalla inicial lo muestra usando el cliente RPC de Hono con TanStack Query y React Router v7.
- [ ] Tailwind y shadcn/ui configurados; la pantalla inicial es mobile first.
- [ ] `vite-plugin-pwa` en modo `autoUpdate`: la app es instalable (manifest, íconos, service worker que cachea el shell).
- [ ] El Worker obtiene la hora de un reloj inyectable que los tests pueden fijar y avanzar; ningún otro código lee la hora del sistema.
- [ ] Un Cron Trigger está declarado y conectado a un handler `scheduled` que por ahora no hace nada; un test lo dispara.
- [ ] Vitest con `@cloudflare/vitest-pool-workers` corre al menos un test verde que hace una request HTTP al Worker contra D1 local con migraciones aplicadas.
- [ ] Un script `deploy` aplica las migraciones remotas de D1 y después corre `wrangler deploy`.
- [ ] Todo dentro del free tier de Cloudflare.
