-- Airdrop claims: table, RLS, and atomic approve/reject RPCs.
-- Run this entire block once in the Supabase SQL editor.
-- Depends on: users, transactions, airdrops (all already migrated),
-- is_admin(), and the app.bypass_balance_protection mechanism from
-- fix_balance_protection_trigger.sql (bug #8 in MIGRATION_NOTES.md).

create table if not exists airdrop_claims (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  airdrop_id text not null references airdrops(id) on delete cascade,
  campaign_title text,
  token text not null,
  reward_amount text not null,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  admin_notes text,
  payout_transaction_id text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists airdrop_claims_user_id_idx on airdrop_claims(user_id);
create index if not exists airdrop_claims_airdrop_id_idx on airdrop_claims(airdrop_id);

alter table airdrop_claims enable row level security;

-- Same per-user-or-admin pattern as everything else: a regular user only
-- ever sees their own claims, an admin sees all of them.
drop policy if exists "airdrop_claims_select" on airdrop_claims;
create policy "airdrop_claims_select" on airdrop_claims
  for select
  using (user_id = (auth.jwt() ->> 'sub') or public.is_admin());

-- Submitting a claim doesn't touch balance, so it's a plain RLS-gated
-- insert (no RPC) — same reasoning as support ticket creation.
drop policy if exists "airdrop_claims_insert" on airdrop_claims;
create policy "airdrop_claims_insert" on airdrop_claims
  for insert
  with check (user_id = (auth.jwt() ->> 'sub') and status = 'Pending');

-- No update/delete policy for plain clients — approval/rejection go
-- through the admin-only, security-definer RPCs below.

-- Admin approves a claim: atomically credits the user's balance, records
-- a 'payout' transaction, and marks the claim Approved. Re-checks status
-- is still 'Pending' under a row lock to prevent double-payout from a
-- duplicate/racing approval click.
create or replace function approve_airdrop_claim(p_claim_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim record;
  v_reward numeric;
  v_tx_id text;
  v_name text;
  v_email text;
begin
  if not is_admin() then
    raise exception 'Only admins can approve airdrop claims';
  end if;

  select * into v_claim from airdrop_claims where id = p_claim_id for update;
  if not found then
    raise exception 'Airdrop claim not found';
  end if;

  if v_claim.status <> 'Pending' then
    raise exception 'This airdrop claim has already been reviewed';
  end if;

  select name, email into v_name, v_email from users where id = v_claim.user_id;

  -- SECURITY: derive the reward from the airdrop CAMPAIGN (source of truth),
  -- not from the user-submitted claim.reward_amount. The claim row is inserted
  -- client-side (RLS only checks user_id + status='Pending'), so a user could
  -- inflate reward_amount and, if an admin approved it, be credited the inflated
  -- value (bug #20). The FK guarantees the campaign row exists.
  select coalesce(nullif(reward_amount, '')::numeric, 0) into v_reward
  from airdrops where id = v_claim.airdrop_id;
  if v_reward is null then
    v_reward := coalesce(nullif(v_claim.reward_amount, '')::numeric, 0);
  end if;

  v_tx_id := 'tx-airdrop-' || p_claim_id;

  perform set_config('app.bypass_balance_protection', 'true', true);

  update users
  set balance = balance + v_reward
  where id = v_claim.user_id;

  insert into transactions (
    id, user_id, user_name, user_email, type, amount, currency, status, asset, notes, related_reference_id, occurred_at
  ) values (
    v_tx_id, v_claim.user_id, v_name, v_email, 'payout', v_reward, 'USD', 'completed', 'USD',
    'Approved airdrop claim ' || p_claim_id || coalesce(' for ' || v_claim.campaign_title, ''),
    p_claim_id, now()
  );

  update airdrop_claims
  set status = 'Approved', reviewed_at = now(), payout_transaction_id = v_tx_id
  where id = p_claim_id;
end;
$$;

grant execute on function approve_airdrop_claim(text) to authenticated;

-- Admin rejects a claim: no balance change, just a status flip.
create or replace function reject_airdrop_claim(p_claim_id text, p_admin_notes text default 'Rejected by admin.')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Only admins can reject airdrop claims';
  end if;

  update airdrop_claims
  set status = 'Rejected', reviewed_at = now(), admin_notes = p_admin_notes
  where id = p_claim_id and status = 'Pending';

  if not found then
    raise exception 'Airdrop claim not found or already reviewed';
  end if;
end;
$$;

grant execute on function reject_airdrop_claim(text, text) to authenticated;
