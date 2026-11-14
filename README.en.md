# El Granero 🌾

**English** · [Español](README.md)

An installable web app (PWA) for sharing household chores as a family. Each member sees what they have to do today and ticks it off when done; adults see how the whole family is doing. It also includes two shared shopping lists.

Built mobile-first, kid-friendly (pick your avatar, enter a 4-digit PIN), and designed to run on Cloudflare's free tier.

> The app's UI is in Spanish, and so are the domain terms in the code (see [ADR 0006](docs/adr/0006-dominio-en-espanol-en-el-codigo.md)). The glossary below maps the main ones.

## Features

**Family and access**
- One family per installation, with **adult** (*Adulto*) and **kid** (*Chico*) members, each with an avatar (emoji + colour) and a PIN.
- Each phone or tablet is **linked once** using the **house key** (*Clave de la casa*). After that, you just tap your avatar and enter your PIN.
- Adult actions ask for the PIN again if more than 5 minutes have passed.
- 5 wrong PINs lock that member on that device for 5 minutes; 5 wrong house keys lock that IP for 15 minutes.
- Adults can see linked devices, unlink one, or change the house key (which unlinks every other device).

**Chores**
- Each chore (*Tarea*) is assigned to a member and has a frequency: **daily** (every day or selected weekdays), **weekly** (Monday to Sunday) or **monthly** (calendar month).
- Each period creates an **occurrence** (*Ocurrencia*) that is *pending*, *done*, or *missed* (the period ended without a tick).
- **Today** (*Hoy*): what each person has to do, with instant ticking.
- **Family view** (*Vista Familia*): adults see everyone's progress and the history of missed chores.
- Chores and members can be edited, reassigned, archived and restored.

**Shopping**
- Two fixed lists: **Groceries** (*Súper*) and **General** (*Generales*). Anyone can add an item, gets a warning if a similar one already exists, and can mark it as bought; bought items disappear after 24 hours.

**Offline**
- The app installs to the home screen and can be **browsed offline** with the latest data. Changes need a connection: when offline the app says so instead of queueing them.
- It updates itself when a new version is deployed.

## Glossary

| Spanish | English |
|---|---|
| Familia / Miembro | Family / member |
| Adulto / Chico | Adult / kid |
| Clave de la casa | House key (shared secret used to link devices) |
| Dispositivo vinculado | Linked device |
| Tarea / Ocurrencia / Período | Chore / occurrence / period |
| Pendiente / Cumplida / No cumplida | Pending / done / missed |
| Archivada | Archived |
| Lista / Ítem / Comprado | Shopping list / item / bought |

The full definitions are in [`CONTEXT.md`](CONTEXT.md) (in Spanish).

## Stack

| Layer | Technology |
|---|---|
| Front end | React 19, Vite, React Router, TanStack Query (persisted to IndexedDB), Tailwind 4, shadcn/ui |
| PWA | vite-plugin-pwa (Workbox), auto-update |
| API | Hono + Zod, on a Cloudflare Worker |
| Database | Cloudflare D1 (SQLite) with Drizzle ORM and drizzle-kit migrations |
| Scheduled jobs | Daily Cron Trigger (00:05 Buenos Aires time) that generates occurrences |
| Tests | Vitest with `@cloudflare/vitest-plugin` (real Workers runtime + local D1) and Testing Library (jsdom) |
| Language | TypeScript |

A single Worker serves both the static app and the API under `/api/*` (see [ADR 0004](docs/adr/0004-un-solo-worker-con-assets.md)).

## Requirements

- Node 22 or newer.
- **npm 11.** The npm 10 bundled with Node 22 fails to install because of a resolver bug. If your npm is older, run `npx npm@11 …` instead of `npm …`.
- A Cloudflare account (only to deploy).

## Running locally

```bash
npm install
cp .dev.vars.example .dev.vars      # installation token for development
npm run db:migrate:local            # creates the local D1 database
npm run dev                         # app + API + D1 at http://localhost:5173
```

On first run the app asks for the **initial setup**: the installation token (`granero-dev` locally), the house key, the time zone and the first adult.

> If a different app shows up at `localhost:5173`, it is another project's service worker that used that port: clear the site data (`chrome://settings/content/all?searchSubpage=localhost`) or try an incognito window.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Front end, API and local D1 together |
| `npm test` | All tests (`worker` and `cliente` projects) |
| `npm test -- --project worker` | Worker tests only |
| `npm run typecheck` | Type check |
| `npm run build` | Production build |
| `npm run db:generate` | Generates a migration after a schema change |
| `npm run db:migrate:local` | Applies migrations to the local D1 |
| `npm run cf-typegen` | Regenerates the `Env` types after changing `wrangler.jsonc` |
| `npm run deploy` | Build, remote migrations and `wrangler deploy` |

## Deploying to Cloudflare

```bash
npx wrangler login
npx wrangler d1 create el-granero          # copy the database_id into wrangler.jsonc
npx wrangler secret put TOKEN_INSTALACION  # a long random token
npm run deploy
```

Then open the URL Wrangler prints, run the initial setup with that token, and link the family's devices with the house key. The token only works while the family has not been set up.

## Tests

- **`worker`** (`test/`): exercise the API over HTTP, in the real Workers runtime against a local D1. The clock is fixed (`relojFijo`) to test periods, lockouts and the cron job, and each device is simulated with `Sistema.dispositivo()`, which keeps its own cookies.
- **`cliente`** (`src/client/**/*.test.tsx`): component tests with jsdom.

## Layout

```
src/
  shared/    database schema, periods and frequencies, validation (used by both front end and Worker)
  worker/    Hono API, sessions and PINs, occurrences, cron
  client/    React app: screens, components and queries
test/        Worker tests
drizzle/     D1 migrations
docs/adr/    architecture decision records
CONTEXT.md   domain glossary
```

## Documentation

- [`CONTEXT.md`](CONTEXT.md): the domain language (in Spanish).
- [`docs/adr/`](docs/adr/): architecture decisions and why they were made (in Spanish).
- `.scratch/el-granero-mvp/`: the MVP spec and its tickets.

## Security

- `HttpOnly`, `Secure`, `SameSite=Strict` cookies; sessions renew with use.
- PINs and the house key are stored with PBKDF2; device and session tokens as SHA-256 hashes.
- Attempt limits on PINs (per member and device) and on the house key (per IP).

## Roadmap

Ideas for v2: **Granos** (points for completed chores), chore **rotation** between members, and **push notifications**.
