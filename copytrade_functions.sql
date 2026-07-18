-- Copy trade RPCs + status-constraint fix.
--
-- History: the original copytrade_functions.sql from the migration was never
-- saved to the repo. The create_copy_trade definition below was recovered
-- from the live Supabase project (July 2026). The status-constraint section
-- fixes a live bug: the deployed function inserts status 'Running' (the
-- app's canonical value — see CopyTradeStatus in src/types/domain.ts), but
-- the pre-existing copy_trades_status_check constraint allowed a different
-- value set, so EVERY copy-trade start failed with a 23514 check violation.
--
-- Run this whole file in the Supabase SQL editor. Safe to re-run.

-- ============================================================
-- 1. Fix the status check constraint
-- ============================================================

-- Normalize any rows written under other casings/value schemes first,
-- otherwise re-adding the constraint below would fail on existing data.
update copy_trades set status = 'Running'   where status in ('running', 'active', 'Active');
update copy_trades set status = 'Completed' where status in ('completed');
update copy_trades set status = 'Cancelled' where status in ('cancelled', 'canceled', 'Canceled');

alter table copy_trades drop constraint if exists copy_trades_status_check;
alter table copy_trades add constraint copy_trades_status_check
  check (status in ('Running', 'Completed', 'Cancelled'));

-- ============================================================
-- 2. create_copy_trade (recovered from live project, unchanged)
-- ============================================================

-- SECURITY: the financial-term params (p_roi_percent, p_expected_profit,
-- p_total_return, p_start_timestamp, p_end_timestamp, p_remaining_days) are
-- IGNORED and recomputed server-side from the trader row. The previously
-- deployed version inserted them verbatim, which — since the RPC is directly
-- callable — let a user create a $100 copy trade with total_return=1000000 and
-- end_timestamp in the past, then claim arbitrary money (bug #19). The params
-- are kept in the signature only so the existing client call is unchanged.
CREATE OR REPLACE FUNCTION public.create_copy_trade(p_id text, p_user_id text, p_trader_id text, p_trader_name text, p_amount_invested numeric, p_roi_percent numeric, p_expected_profit numeric, p_total_return numeric, p_start_timestamp timestamp with time zone, p_end_timestamp timestamp with time zone, p_remaining_days integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
declare
  v_caller text := auth.jwt()->>'sub';
  v_trader record;
  v_roi numeric;
  v_duration_days integer;
  v_expected_profit numeric;
  v_total_return numeric;
  v_start timestamptz := now();
  v_end timestamptz;
begin
  if v_caller is null or v_caller <> p_user_id then
    raise exception 'You can only copy-trade from your own account';
  end if;

  -- Source of truth: the trader row, NOT client-provided financial terms.
  select * into v_trader from traders where id = p_trader_id;
  if not found then
    raise exception 'Trader not found';
  end if;
  if v_trader.active = false then
    raise exception 'This trader is not accepting copy allocations';
  end if;

  if p_amount_invested is null or p_amount_invested <= 0 then
    raise exception 'Invalid copy amount';
  end if;
  if v_trader.min_copy_amount is not null and p_amount_invested < v_trader.min_copy_amount then
    raise exception 'Below minimum copy amount for this trader';
  end if;
  if v_trader.max_copy_amount is not null and p_amount_invested > v_trader.max_copy_amount then
    raise exception 'Above maximum copy amount for this trader';
  end if;

  v_roi := coalesce(v_trader.roi, 0);
  v_duration_days := greatest(1, coalesce(v_trader.profit_days, 30));
  v_expected_profit := round(p_amount_invested * v_roi / 100.0, 2);
  v_total_return := round(p_amount_invested + v_expected_profit, 2);
  v_end := v_start + (v_duration_days || ' days')::interval;

  perform set_config('app.bypass_balance_protection', 'true', true);
  update users set balance = balance - p_amount_invested where id = p_user_id and balance >= p_amount_invested;
  if not found then
    raise exception 'Insufficient balance';
  end if;

  insert into copy_trades (
    id, user_id, trader_id, trader_name, amount_invested, roi_percent,
    expected_profit, total_return, start_timestamp, end_timestamp,
    remaining_days, status, payout_completed, progress
  )
  values (
    p_id, p_user_id, p_trader_id, v_trader.name, p_amount_invested, v_roi,
    v_expected_profit, v_total_return, v_start, v_end,
    v_duration_days, 'Running', false, 0
  );

  insert into transactions (id, user_id, type, amount, currency, status, related_reference_id, notes)
  values ('tx-copy-' || p_id, p_user_id, 'investment', p_amount_invested, 'USD', 'completed', p_id, 'Copy trade: ' || v_trader.name);
end;
$function$;

-- ============================================================
-- 3. cancel_copy_trade (recovered from live project, July 2026)
-- ============================================================
-- Early-exit: refunds the PRINCIPAL only (amount_invested — the actual debited
-- amount, no profit), sets status 'Cancelled'. Guarded against double-refund by
-- the `status <> 'Running' or payout_completed` check. Audited secure.
CREATE OR REPLACE FUNCTION public.cancel_copy_trade(p_copy_trade_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_trade record;
  v_caller text := auth.jwt()->>'sub';
begin
  select * into v_trade from copy_trades where id = p_copy_trade_id for update;
  if not found then
    raise exception 'Copy trade not found';
  end if;
  if v_trade.user_id <> v_caller then
    raise exception 'You can only cancel your own copy trade';
  end if;
  if v_trade.status <> 'Running' or v_trade.payout_completed then
    raise exception 'This copy trade is not currently running';
  end if;

  perform set_config('app.bypass_balance_protection', 'true', true);
  update users set balance = balance + v_trade.amount_invested where id = v_caller;

  update copy_trades
  set status = 'Cancelled',
      remaining_days = 0,
      progress = 100,
      payout_completed = true,
      completed_at = now()
  where id = p_copy_trade_id;

  insert into transactions (id, user_id, type, amount, currency, status, related_reference_id, notes)
  values ('tx-uncopy-' || p_copy_trade_id, v_caller, 'payout', v_trade.amount_invested, 'USD', 'completed', p_copy_trade_id, 'Copy trade cancelled: refund');
end;
$function$;
