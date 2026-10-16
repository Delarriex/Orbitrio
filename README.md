# Orbitrio

A trading / investment platform web app: user dashboard, investment plans with maturity payouts, copy trading, crypto deposit/withdrawal, portfolio trading, airdrop claims, KYC, support tickets, notifications, and a full admin console.

## Tech stack

- **Frontend:** React + TypeScript + Vite, Tailwind CSS, React Router.
- **Auth:** [Clerk](https://clerk.com) (sign-up / sign-in / email verification / password reset). No prebuilt Clerk UI — custom forms via Clerk hooks.
- **Database + Storage:** [Supabase](https://supabase.com) (Postgres with Row-Level Security, `security definer` RPCs for anything touching balance, and Supabase Storage for deposit proofs / wallet QR codes). Clerk is configured as a Supabase third-party auth provider; the client attaches the Clerk session token to Supabase requests.
- **Transactional email:** [Resend](https://resend.com), via a server-side `/api/send-email` endpoint.
- **Server:** a small Express server (`server.ts`) that serves the Vite app and hosts the API routes (`/api/send-email`, `/api/markets`). Also deployable to Vercel (`api/*.ts` are Vercel-style handlers).

> The project was migrated off Firebase (Auth + Firestore + Storage) onto Clerk + Supabase. `MIGRATION_NOTES.md` is the authoritative record of that migration, the schema/RPC files, and every bug found and fixed — **read it before making database or auth changes.**

## Prerequisites

- Node.js 18+
- A Clerk application, a Supabase project, and a Resend account (with a verified sender domain).

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment.** Copy `.env.example` to `.env` and fill in the values:
   ```bash
   cp .env.example .env
   ```
   Required to run at all:
   - `VITE_CLERK_PUBLISHABLE_KEY` — Clerk publishable key (`pk_test_…` / `pk_live_…`).
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Supabase project URL + anon key.

   Required for email to send (server-side):
   - `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (must be a **verified** sender — the API refuses to send otherwise).

   See `.env.example` for the full annotated list. **Never commit `.env`** (it's gitignored) and **never** put the Supabase `service_role` key or any private key in it.

3. **Set up the database.** Run the SQL migration files against your Supabase project (SQL editor), **in the order listed in `MIGRATION_NOTES.md`** (section "All the RPC SQL files … in the order they were run"). The `.sql` files in this repo root create the tables, RLS policies, storage buckets, and the `security definer` RPCs.
   > Note: a few early files (core `users` schema + `is_admin()`, the deposit/withdrawal/investment/portfolio RPCs, and the balance-protection trigger) were not preserved in the repo during the migration — `MIGRATION_NOTES.md` tracks which are present vs. need reconstruction, and the hook files in `src/hooks/data/` show exactly what each RPC is called with.

4. **Configure Clerk ↔ Supabase.** In Supabase, add Clerk as a third-party auth provider so the Clerk session JWT (`sub` = user id) is accepted by RLS policies (which key off `auth.jwt() ->> 'sub'`).

## Run locally

```bash
npm run dev
```
Serves the app at `http://localhost:5173`.

For local development you can set `VITE_LOCAL_DEV=true` (and optionally `VITE_USE_MOCK_DATA=true`); leave both `false` for production. When `VITE_LOCAL_DEV=true`, transactional email is stubbed and never actually sent.

## Build

```bash
npm run build   # vite build + esbuild-bundled server (dist/)
npm run lint    # tsc --noEmit (typecheck)
```

## Account suspension alerts

Admin → Users → open a user → Suspend saves the account status, then creates an
unread notification for that user and sends an `ACCOUNT_SUSPENDED` email through
the existing Resend endpoint. The directory refreshes after the change. Repeated
clicks are disabled while saving and for accounts already suspended. User
notifications refresh every 15 seconds while the page is visible and on focus.

Alerts use the existing `users` update permissions and `notification_functions.sql`
table/policies. Failed status writes are shown
as errors and do not send alerts. If either delivery channel fails, the admin
sees which channel failed; the saved suspension remains in place. Delivery is
attempted from the admin session and has no background retry queue.

Real email delivery requires `VITE_LOCAL_DEV=false`, `RESEND_API_KEY`, and a
verified `RESEND_FROM_EMAIL`. Restart/rebuild after changing these settings.
Local mode stubs email successfully without sending. `npm test` covers status
write failures, duplicate actions, delivery failures, and the suspension template.

## Enforcing account suspension

Run **`account_suspension.sql` in the Supabase SQL editor** after the existing
financial migrations, then deploy the updated app. The migration is safe to rerun.
It requires the existing `users`, `portfolio_assets`, `active_investments`,
`copy_trades`, and `transactions` tables and the existing admin-only protection
for changing `users.status`/`users.role`.

Suspended and banned accounts cannot buy or sell assets, start investments,
top up investments, start copy trades, or request withdrawals. Database triggers
enforce the rule for both RPC calls and direct table writes. They lock the user
row when checking status, and a rejection rolls back the whole transaction,
including balance changes. Pending withdrawals cannot be approved during a
suspension; an admin can still reject them and refund the reserved balance.
Reactivating the account restores these actions.

The app checks current status on every financial action, refreshes status with
notifications, and displays a suspension notice with a support link. Withdrawal
success messages and emails now wait for a successful database response.
Local Postgres tests exercise the actual financial RPCs, direct writes, rollback,
rejection/refund, reactivation, and rerunning the migration. The hosted migration
must be applied separately; a frontend check alone cannot secure direct API calls.

## Project structure

```
src/lib/supabase.ts          Supabase client (memoized on Clerk session) + storage helpers
src/hooks/useCurrentUser.ts  Identity/role hook (Clerk + Supabase)
src/hooks/data/              One hook per feature (traders, transactions, investments, …)
src/context/OrbitContext.tsx Assembles all hooks, exposes them via useOrbit()
src/pages/ , src/components/ UI
api/send-email.ts            Server-side Resend handler
server.ts                    Express server (dev + prod) + /api routes
*.sql                        Supabase schema / RLS / RPC migrations (see MIGRATION_NOTES.md)
```

## Before going to production

- Switch Clerk from **development** to **production** keys.
- Set `VITE_LOCAL_DEV`, `VITE_USE_MOCK_DATA`, `VITE_MAINTENANCE_MODE` to `false` in the production environment.
- Ensure `RESEND_FROM_EMAIL` is a verified domain sender and `ORBITRIO_ALLOWED_ORIGINS` lists your real origin(s).
