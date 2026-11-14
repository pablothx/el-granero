# El Granero 🌾

[English](README.en.md) · **Español**

App web instalable (PWA) para organizar las tareas de la casa en familia. Cada Miembro ve lo que le toca hoy, lo tilda cuando lo hace, y los Adultos ven cómo va toda la Familia. También tiene dos listas de compras compartidas.

Pensada para usarse desde el celular, fácil para los chicos (eligen su avatar y ponen un PIN de 4 dígitos) y para correr gratis en el plan free de Cloudflare.

## Qué hace

**Familia y acceso**
- Una sola Familia por instalación, con Miembros **Adultos** y **Chicos**, cada uno con avatar (emoji + color) y PIN.
- Cada celular o tablet se **vincula una sola vez** con la **Clave de la casa**. Después alcanza con tocar tu avatar y poner el PIN.
- Las acciones de Adulto piden volver a ingresar el PIN si pasaron más de 5 minutos.
- 5 PIN incorrectos bloquean a ese Miembro en ese dispositivo por 5 minutos; 5 Claves incorrectas bloquean esa IP por 15 minutos.
- Los Adultos ven los dispositivos vinculados, pueden desvincular uno o cambiar la Clave (lo que desvincula a todos los demás).

**Tareas**
- Cada Tarea tiene un Miembro asignado y una frecuencia: **Diaria** (todos los días o algunos días de la semana), **Semanal** (lunes a domingo) o **Mensual** (mes calendario).
- Cada Período genera una **Ocurrencia**, que está *Pendiente*, *Cumplida* o *No cumplida* (si el Período terminó sin tilde).
- **Hoy**: lo que le toca a cada uno, con tilde instantáneo.
- **Vista Familia**: los Adultos ven el avance de todos y el historial de lo que quedó sin hacer.
- Las Tareas y los Miembros se pueden editar, reasignar, archivar y reactivar.

**Compras**
- Dos listas fijas: **Súper** y **Generales**. Cualquiera anota un Ítem, avisa si ya hay uno parecido, y lo marca como comprado; los comprados desaparecen a las 24 horas.

**Sin conexión**
- La app se instala en la pantalla de inicio y se puede **consultar sin conexión** con los últimos datos. Los cambios necesitan conexión: si no hay, se avisa en vez de encolarlos.
- Se actualiza sola cuando hay una versión nueva.

## Stack

| Capa | Tecnología |
|---|---|
| Front | React 19, Vite, React Router, TanStack Query (persistido en IndexedDB), Tailwind 4, shadcn/ui |
| PWA | vite-plugin-pwa (Workbox), actualización automática |
| API | Hono + Zod, en un Cloudflare Worker |
| Base de datos | Cloudflare D1 (SQLite) con Drizzle ORM y migraciones de drizzle-kit |
| Tareas programadas | Cron Trigger diario (00:05 hora de Buenos Aires) que genera las Ocurrencias |
| Tests | Vitest con `@cloudflare/vitest-plugin` (Worker real + D1 local) y Testing Library (jsdom) |
| Lenguaje | TypeScript |

Un solo Worker sirve la app estática y la API en `/api/*` (ver [ADR 0004](docs/adr/0004-un-solo-worker-con-assets.md)).

## Requisitos

- Node 22 o más nuevo.
- **npm 11.** Con el npm 10 que trae Node 22 la instalación falla por un bug del resolvedor. Si tu npm es más viejo, usá `npx npm@11 …` en lugar de `npm …`.
- Una cuenta de Cloudflare (solo para desplegar).

## Correr en local

```bash
npm install
cp .dev.vars.example .dev.vars      # token de instalación para desarrollo
npm run db:migrate:local            # crea la D1 local
npm run dev                         # app + API + D1 en http://localhost:5173
```

La primera vez la app pide la **configuración inicial**: el token de instalación (`granero-dev` en local), la Clave de la casa, la zona horaria y el primer Adulto.

> Si en `localhost:5173` aparece otra app, es el service worker de otro proyecto que usó ese puerto: borrá los datos del sitio (`chrome://settings/content/all?searchSubpage=localhost`) o probá en una ventana de incógnito.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Front, API y D1 local juntos |
| `npm test` | Todos los tests (proyectos `worker` y `cliente`) |
| `npm test -- --project worker` | Solo los tests del Worker |
| `npm run typecheck` | Chequeo de tipos |
| `npm run build` | Build de producción |
| `npm run db:generate` | Genera una migración después de cambiar el esquema |
| `npm run db:migrate:local` | Aplica las migraciones a la D1 local |
| `npm run cf-typegen` | Regenera los tipos de `Env` después de cambiar `wrangler.jsonc` |
| `npm run deploy` | Build, migraciones remotas y `wrangler deploy` |

## Desplegar en Cloudflare

```bash
npx wrangler login
npx wrangler d1 create el-granero          # copiá el database_id a wrangler.jsonc
npx wrangler secret put TOKEN_INSTALACION  # un token largo y aleatorio
npm run deploy
```

Después entrá a la URL que te da Wrangler, hacé la configuración inicial con ese token y vinculá los dispositivos de la Familia con la Clave de la casa. El token solo sirve mientras la Familia no está configurada.

## Tests

- **`worker`** (`test/`): prueban la API por HTTP, en el runtime real de Workers y contra una D1 local. El reloj es fijo (`relojFijo`) para probar Períodos, bloqueos y el Cron, y cada dispositivo se simula con `Sistema.dispositivo()`, que guarda sus propias cookies.
- **`cliente`** (`src/client/**/*.test.tsx`): tests de componentes con jsdom.

## Estructura

```
src/
  shared/    esquema de la base, Períodos y frecuencias, validaciones (lo usan front y Worker)
  worker/    API Hono, sesiones y PIN, Ocurrencias, Cron
  client/    app React: pantallas, componentes y consultas
test/        tests del Worker
drizzle/     migraciones de D1
docs/adr/    decisiones de arquitectura
CONTEXT.md   glosario del dominio
```

## Documentación

- [`CONTEXT.md`](CONTEXT.md): el lenguaje del dominio (Familia, Miembro, Tarea, Ocurrencia, Período, Lista…). El código usa estos mismos términos en español ([ADR 0006](docs/adr/0006-dominio-en-espanol-en-el-codigo.md)).
- [`docs/adr/`](docs/adr/): las decisiones de arquitectura y por qué se tomaron.
- `.scratch/el-granero-mvp/`: la spec del MVP y sus tickets.

## Seguridad

- Cookies `HttpOnly`, `Secure` y `SameSite=Strict`; la sesión se renueva con el uso.
- PIN y Clave de la casa guardados con PBKDF2; los tokens de dispositivo y sesión, como hash SHA-256.
- Límite de intentos de PIN (por Miembro y dispositivo) y de Clave (por IP).

## Próximamente

Ideas para la v2: **Granos** (puntos por tareas cumplidas), **rotación** de tareas entre Miembros y **notificaciones push**.
