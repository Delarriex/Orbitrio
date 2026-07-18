-- Investment plan catalog: table + RLS. Plain CRUD (admin write / public
-- read), no balance involved, so no RPCs. Same shape as deposit_wallets/traders.
-- Run this entire block once in the Supabase SQL editor.

create table if not exists investment_plans (
  id text primary key,
  name text not null,
  min_deposit numeric not null,
  max_deposit numeric not null,
  duration_days integer not null,
  roi_percent numeric not null,
  roi_cap_percent numeric,
  description text not null default '',
  status text not null default 'active',
  enabled boolean not null default true,
  display_order integer not null default 0,
  badge text,
  accent_color text
);

alter table investment_plans enable row level security;

-- Read: public. Mirrors the old Firestore rule (`allow read: if true`) —
-- the plan catalog is shown to signed-out visitors too.
drop policy if exists "investment_plans_select" on investment_plans;
create policy "investment_plans_select" on investment_plans
  for select
  using (true);

-- Write: admin only. Mirrors the old Firestore rule (`allow write: if isAdmin()`).
drop policy if exists "investment_plans_insert" on investment_plans;
create policy "investment_plans_insert" on investment_plans
  for insert
  with check (public.is_admin());

drop policy if exists "investment_plans_update" on investment_plans;
create policy "investment_plans_update" on investment_plans
  for update
  using (public.is_admin());

drop policy if exists "investment_plans_delete" on investment_plans;
create policy "investment_plans_delete" on investment_plans
  for delete
  using (public.is_admin());

-- Seed the same 5 default tiers the app used to seed client-side on first
-- load (that seeding was gated on a Firebase Auth admin check that has been
-- dead since the Clerk cutover, so it never actually ran against production
-- — seeding it here instead, once, idempotently).
insert into investment_plans (id, name, min_deposit, max_deposit, duration_days, roi_percent, roi_cap_percent, description, status, enabled, display_order, badge, accent_color)
values
  ('plan-bronze', 'Bronze Tier', 100, 999, 7, 12, 12, 'An entry-level plan with a short lockup period. Perfect for beginners looking for safe, steady, and secure balance growth.', 'active', true, 10, null, '#CD7F32'),
  ('plan-silver', 'Silver Tier', 1000, 4999, 10, 18, 18, 'An upgraded plan designed for growing portfolios. Earn higher daily rewards with a flexible, medium-term commitment.', 'active', true, 20, null, '#94a3b8'),
  ('plan-gold', 'Gold Tier', 5000, 9999, 14, 24, 24, 'A premium plan tailored for serious investors. Get maximized return rates with structured capital protection.', 'active', true, 30, 'Popular', '#FFB11A'),
  ('plan-platinum', 'Platinum Tier', 10000, 49999, 21, 36, 36, 'An elite wealth plan featuring top-tier yield generation and priority balance scaling for large accounts.', 'active', true, 40, null, '#818cf8'),
  ('plan-diamond', 'Diamond Tier', 50000, 10000000, 30, 48, 48, 'Our highest-level institutional allocation. Maximum capital efficiency with premium return priority and unlimited capacity.', 'active', true, 50, 'Elite VIP', '#22d3ee')
on conflict (id) do nothing;
