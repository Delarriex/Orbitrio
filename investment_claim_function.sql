-- claim_investment_payout — user-initiated payout claim for a MATURED investment.
-- Credits total_return to the caller's balance, marks the investment Completed,
-- and writes the payout transaction. SECURITY DEFINER + bypass flag (bug #8).
--
-- IMPORTANT: this version adds the maturity guard that the previously-deployed
-- version was MISSING. Without `now() >= end_date`, a user could claim the full
-- total_return (principal + full profit) the instant after investing, with no
-- lockup — an instant-profit exploit, since the RPC (not the UI button) is the
-- real security boundary. Run this to replace the deployed function.

create or replace function public.claim_investment_payout(p_investment_id text)
  returns void
  language plpgsql
  security definer
as $function$
declare
  v_inv record;
  v_caller text := auth.jwt()->>'sub';
begin
  select * into v_inv from active_investments where id = p_investment_id for update;
  if not found then
    raise exception 'Investment not found';
  end if;
  if v_inv.user_id <> v_caller then
    raise exception 'You can only claim your own investment payout';
  end if;

  -- Idempotent: already claimed/completed → no-op (prevents double credit).
  if v_inv.status = 'Completed' or v_inv.status = 'completed' or v_inv.payout_transaction_id is not null then
    return;
  end if;

  -- Maturity guard (the fix): payout is only claimable once the term is over.
  if now() < v_inv.end_date then
    raise exception 'Investment has not matured yet';
  end if;

  perform set_config('app.bypass_balance_protection', 'true', true);
  update users set balance = balance + v_inv.total_return where id = v_caller;

  update active_investments
  set status = 'Completed',
      progress = 100,
      remaining_days = 0,
      accumulated_profit = v_inv.expected_profit,
      completed_at = now(),
      payout_transaction_id = p_investment_id || '-payout'
  where id = p_investment_id;

  insert into transactions (id, user_id, type, amount, currency, status, related_reference_id, notes)
  values (p_investment_id || '-payout', v_caller, 'payout', v_inv.total_return, 'USD', 'completed', p_investment_id, 'Matured payout: ' || v_inv.name);
end;
$function$;
