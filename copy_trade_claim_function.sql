-- claim_copy_trade_payout — user-initiated payout claim for a MATURED copy trade.
-- Mirrors claim_investment_payout: credits total_return to the caller's balance,
-- marks the copy trade Completed + paid, writes the payout transaction.
-- SECURITY DEFINER + bug-#8 bypass flag + maturity guard from the start.
--
-- Copy trades were designed to mature and pay out (see buildCopyTrade / the
-- DashboardPortfolio UI), but this claim RPC never existed — only create/cancel
-- did. This adds it. Run the whole file in the Supabase SQL editor.

-- Defensive: these columns mirror active_investments and are read by
-- rowToCopyTrade; add them if a prior schema lacked them. Idempotent.
alter table copy_trades add column if not exists completed_at timestamptz;
alter table copy_trades add column if not exists payout_transaction_id text;

create or replace function public.claim_copy_trade_payout(p_copy_trade_id text)
  returns void
  language plpgsql
  security definer
as $function$
declare
  v_ct record;
  v_caller text := auth.jwt()->>'sub';
begin
  select * into v_ct from copy_trades where id = p_copy_trade_id for update;
  if not found then
    raise exception 'Copy trade not found';
  end if;
  if v_ct.user_id <> v_caller then
    raise exception 'You can only claim your own copy trade payout';
  end if;

  -- Idempotent: already claimed → no-op (prevents double credit).
  if v_ct.status = 'Completed' or v_ct.payout_completed or v_ct.payout_transaction_id is not null then
    return;
  end if;

  -- A cancelled copy trade was already refunded (principal) — not claimable.
  if v_ct.status = 'Cancelled' then
    raise exception 'A cancelled copy trade cannot be claimed';
  end if;

  -- Maturity guard: payout is only claimable once the term is over.
  if now() < v_ct.end_timestamp then
    raise exception 'Copy trade has not matured yet';
  end if;

  perform set_config('app.bypass_balance_protection', 'true', true);
  update users set balance = balance + v_ct.total_return where id = v_caller;

  update copy_trades
  set status = 'Completed',
      payout_completed = true,
      progress = 100,
      remaining_days = 0,
      completed_at = now(),
      payout_transaction_id = p_copy_trade_id || '-payout'
  where id = p_copy_trade_id;

  insert into transactions (id, user_id, type, amount, currency, status, related_reference_id, notes)
  values (p_copy_trade_id || '-payout', v_caller, 'payout', v_ct.total_return, 'USD', 'completed', p_copy_trade_id, 'Copy trade payout: ' || v_ct.trader_name);
end;
$function$;
