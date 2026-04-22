# P&L Tracker Pro

Profit and loss tracker for freelancers / small businesses. Income, expenses, taxes, recurring transactions, subscriptions, reports.

## Repo Layout Note

The git repo lives in the NESTED folder: `Personal-Apps/p-l-tracker-pro/p-l-tracker-pro/`. The outer `p-l-tracker-pro/` is just a container. All work happens in the inner directory.

## Stack

- **Frontend:** React 19 + TypeScript + Vite 6, Tailwind (utility classes inline), Recharts for charts
- **Backend:** Supabase (Postgres + Auth) plus an Express/TypeScript API layer in `api/` (tsx watch in dev, tsc build for prod) and Supabase Edge Functions under `supabase/functions/`
- **State:** React hooks + localStorage for user prefs

## Layout

```
App.tsx                      Root component, view routing
components/
  Dashboard.tsx              P&L summary + charts
  TransactionsPage.tsx       Transaction list / filters
  TransactionsGrid.tsx       Spreadsheet-style grid
  ReportsPage.tsx            P&L report generator
  TaxesPage.tsx              Tax estimates
  SubscriptionsPage.tsx      Subscription tracker
  *Modal.tsx                 Add / edit / delete dialogs
  ui/                        Reusable UI primitives
hooks/                       Custom hooks
utils/                       Supabase client, tax math, helpers
constants.ts                 Default categories, tax defaults
types.ts                     Shared TS types
api/
  src/server.ts              Express API entrypoint
  src/routes/                Route handlers
  src/middleware/            Auth, error handling
  src/supabase.ts            Service-role Supabase client
supabase/
  config.toml                Supabase CLI config
  functions/                 Edge Functions: categories, recurring, transactions, _shared
supabase_schema.sql          (Currently empty - schema lives in Supabase project / migrations)
```

## Commands

Frontend (repo root):

```bash
npm install
npm run dev       # Vite dev server
npm run build     # Vite production build
npm run preview   # Preview bundle
```

API (`api/`):

```bash
cd api
npm install
npm run dev       # tsx watch src/server.ts
npm run build     # tsc
npm start         # node dist/server.js
```

Supabase Edge Functions: `supabase functions deploy <name>` from repo root.

## Env / Secrets

`.env.local` at frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. API uses service-role key (Doppler). Prefer Doppler + `SB_`-prefixed names for Vercel sync.

## Deploy

Frontend: Vercel (Vite). Edge Functions: Supabase CLI. Express `api/` needs a host (Railway is the Matt-default).

## Quirks

- Two backend surfaces coexist: the Express API in `api/` AND Supabase Edge Functions. Confirm which one a given feature should live in before adding endpoints. Historically the Edge Functions are the active path; `api/` may be legacy.
- `supabase_schema.sql` is empty in the repo. Source of truth is the Supabase project, not this file.
- Tailwind is used via utility classes but there's no tailwind.config.ts checked in at the top level. Verify setup before assuming classes compile.
