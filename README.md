# Kanban — full-stack demo on Cloudflare Workers

A mildly complex Trello-style Kanban app built to demo a modern full-stack TypeScript setup running entirely on **one Cloudflare Worker**.

| Layer        | Tech |
|--------------|------|
| Routing      | [TanStack Router](https://tanstack.com/router) (file-based, type-safe) |
| Data fetching| [TanStack Query](https://tanstack.com/query) (optimistic updates) |
| UI           | [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS v4](https://tailwindcss.com) + dark mode |
| Drag & drop  | [dnd-kit](https://dndkit.com) |
| API          | [Hono](https://hono.dev) |
| Auth         | [Better Auth](https://better-auth.com) (email + password) |
| ORM          | [Drizzle](https://orm.drizzle.team) |
| Database     | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite) |
| Runtime/build| [Cloudflare Workers](https://developers.cloudflare.com/workers/) + [Vite](https://vite.dev) via `@cloudflare/vite-plugin` |

## Features

- Email/password auth with sessions (Better Auth) and guarded routes
- Boards → columns → cards, with labels, due dates, completion, and comments
- Drag-and-drop cards within and across columns, persisted with fractional positions
- Optimistic UI for every mutation (TanStack Query cache updates + rollback on error)
- Polished, responsive shadcn UI with light/dark theme toggle
- Seeded demo account so the app looks alive on first open

## Architecture

A single Worker serves both the API and the SPA:

- `src/worker/` — Hono app. Better Auth owns `/api/auth/**`; the rest of `/api/**` is the REST API (boards, columns, cards, labels, comments) with per-request ownership checks.
- `src/client/` — React SPA (TanStack Router/Query, shadcn).
- `src/shared/` — DTO types shared by both sides.

Routing is configured in `wrangler.jsonc` with `run_worker_first: ["/api/*"]`, so the Worker handles every API request while the assets layer serves the SPA (with `single-page-application` fallback for client-side routes). `@cloudflare/vite-plugin` builds the client and the Worker from one `vite build`.

## Local development

> Requires Node 20+ (developed on Node 24). Everything runs locally against a miniflare-managed D1 — no Cloudflare account needed for dev.

```bash
npm install

# 1. Create your local dev secret
cp .dev.vars.example .dev.vars     # already present in this repo; edit if you like

# 2. Create the local D1 tables
npm run db:migrate:local

# 3. Start the dev server (client + worker + local D1, with HMR)
npm run dev                        # http://localhost:5173

# 4. (optional) Seed a demo account + sample boards — server must be running
npm run db:seed:local
```

### Demo credentials (after seeding)

```
email:    demo@kanban.dev
password: demo1234
```

Or just sign up with any email/password on the login screen.

## Deploy to Cloudflare

You said you'd wire up the repo connection yourself — here's what the project needs.

1. **Create the D1 database** and copy its id into `wrangler.jsonc` (`d1_databases[0].database_id`):

   ```bash
   npx wrangler d1 create kanban-db
   ```

2. **Set the auth secret** as a Worker secret (do *not* commit it):

   ```bash
   npx wrangler secret put BETTER_AUTH_SECRET     # e.g. `openssl rand -base64 32`
   ```

3. **Apply migrations to the remote D1:**

   ```bash
   npm run db:migrate:remote
   ```

4. **Deploy.** Either manually:

   ```bash
   npm run deploy        # runs `vite build` then `wrangler deploy`
   ```

   …or set up **automatic deploys from the repo** (Workers Builds → Connect to Git):
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy`
   - Run `npm run db:migrate:remote` whenever migrations change (Workers Builds can run it as a build step, or apply it manually before deploy).

5. **(optional) Seed the deployment.** If the deployment is publicly reachable:

   ```bash
   SEED_BASE_URL=https://<your-worker-url> npm run db:seed:remote
   ```

   If it sits behind an access gate (e.g. Cloudflare Access) the HTTP seeder
   can't authenticate, so load the pre-built SQL seed straight into D1 instead:

   ```bash
   npx wrangler d1 execute kanban-db --remote --file=drizzle/seed-demo.sql
   ```

   Both create the demo account (`demo@kanban.dev` / `demo1234`) and sample boards.

> `BETTER_AUTH_URL` is optional — without it Better Auth derives the origin from the incoming request, which is correct for this same-origin app. Set it to your deployed URL to silence the dev warning.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server (client + worker + local D1) |
| `npm run build` | Production build (client assets + worker) |
| `npm run preview` | Build, then serve the production build locally |
| `npm run typecheck` | `tsc -b` across client / worker / node projects |
| `npm run deploy` | Build and `wrangler deploy` |
| `npm run db:generate` | Generate a Drizzle migration from `schema.ts` |
| `npm run db:migrate:local` / `:remote` | Apply migrations to local / remote D1 |
| `npm run db:seed:local` / `:remote` | Seed demo data via the HTTP API (server must be running) |
| `npm run cf-typegen` | Regenerate `worker-configuration.d.ts` from `wrangler.jsonc` |

## Project layout

```
src/
  client/                React SPA
    routes/              File-based TanStack routes (__root, login, signup, _authed/boards…)
    components/          App + shadcn/ui components (board/, ui/)
    hooks/               TanStack Query hooks (use-boards, use-board, use-card)
    lib/                 api client, auth client, board-cache helpers, query keys
  worker/                Hono API
    routes/              boards, columns, cards, labels, comments
    lib/                 middleware, ownership checks, serializers
    db/                  Drizzle schema + D1 client
    auth.ts              Better Auth config
  shared/types.ts        DTOs shared by client + worker
drizzle/migrations/      Generated SQL migrations
```
