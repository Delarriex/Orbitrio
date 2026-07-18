-- market_prices: server-maintained TRUSTED price source for buy_asset/sell_asset
-- (bug #22 fix). The Express `/api/markets` route upserts live prices here using
-- the Supabase service_role key (server-only — never client). Clients cannot
-- write it (no write policy; service_role bypasses RLS). The hardened buy/sell
-- RPCs in portfolio_functions.sql read the price from HERE and ignore any
-- client-supplied price, so a user can no longer buy-low / sell-high at fake
-- prices to mint balance.
--
-- Run this file FIRST, then (re-)run portfolio_functions.sql. Safe to re-run.
-- Note: the table is empty until the server's /api/markets route runs once
-- (i.e. any client loads the app); until then buy/sell raise "No market price".

create table if not exists market_prices (
  symbol text primary key,          -- matches the feed: 'BTC/USD', 'ETH/USD', 'AAPL', …
  price numeric not null check (price > 0),
  updated_at timestamptz not null default now()
);

alter table market_prices enable row level security;

-- Public read is harmless (prices are public) and lets the client cross-check;
-- the security-definer RPCs read regardless. NO insert/update/delete policy —
-- only the server (service_role) writes prices.
drop policy if exists "market_prices_select" on market_prices;
create policy "market_prices_select" on market_prices for select using (true);
