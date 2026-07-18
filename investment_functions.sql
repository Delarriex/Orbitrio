-- Investment purchase + top-up RPCs. Recovered from the live project (July
-- 2026) — the original investment_functions.sql was lost during the migration.
-- create_investment is the SECURITY-HARDENED version (see bug #21): it now
-- recomputes all financial terms server-side from the investment_plans row
-- instead of trusting the client-provided p_roi_percent/p_expected_profit/
-- p_total_return/p_end_date (which let a user mint an arbitrary payout, same
-- class as bug #19 for copy trades). top_up_investment already recomputes
-- server-side and is unchanged.
-- Run this whole file in the Supabase SQL editor. Safe to re-run.

-- SECURITY: financial-term params are IGNORED and recomputed from the plan.
-- Kept in the signature so the existing client call is unchanged.
create or replace function public.create_investment(
  p_id text, p_user_id text, p_plan_id text, p_name text, p_amount numeric,
  p_roi_percent numeric, p_expected_profit numeric, p_total_return numeric,
  p_daily_roi_percent numeric, p_start_date timestamptz, p_end_date timestamptz,
  p_remaining_days integer
) returns void language plpgsql security definer set search_path = public as $function$
declare
  v_caller text := auth.jwt()->>'sub';
  v_plan record;
  v_roi numeric;
  v_duration integer;
  v_expected_profit numeric;
  v_total_return numeric;
  v_daily_roi numeric;
  v_start timestamptz := now();
  v_end timestamptz;
begin
  if v_caller is null or v_caller <> p_user_id then
    raise exception 'You can only invest for your own account';
  end if;

  -- Source of truth: the plan row, NOT client-provided financial terms.
  select * into v_plan from investment_plans where id = p_plan_id;
  if not found then
    raise exception 'Investment plan not found';
  end if;
  if v_plan.enabled = false or v_plan.status <> 'active' then
    raise exception 'This investment plan is not available';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Invalid investment amount';
  end if;
  if v_plan.min_deposit is not null and p_amount < v_plan.min_deposit then
    raise exception 'Below minimum deposit for this plan';
  end if;
  if v_plan.max_deposit is not null and p_amount > v_plan.max_deposit then
    raise exception 'Above maximum deposit for this plan';
  end if;

  v_roi := coalesce(v_plan.roi_percent, 0);
  v_duration := greatest(1, coalesce(v_plan.duration_days, 1));
  v_expected_profit := round(p_amount * v_roi / 100.0, 2);
  v_total_return := round(p_amount + v_expected_profit, 2);
  v_daily_roi := round(v_roi / v_duration, 3);
  v_end := v_start + (v_duration || ' days')::interval;

  perform set_config('app.bypass_balance_protection', 'true', true);
  update users set balance = balance - p_amount where id = p_user_id and balance >= p_amount;
  if not found then
    raise exception 'Insufficient balance';
  end if;

  insert into active_investments (
    id, user_id, plan_id, name, amount, start_date, end_date,
    roi_percent, expected_profit, total_return, remaining_days,
    accumulated_profit, status, progress, daily_roi_percent
  )
  values (
    p_id, p_user_id, p_plan_id, v_plan.name, p_amount, v_start, v_end,
    v_roi, v_expected_profit, v_total_return, v_duration,
    0, 'Running', 0, v_daily_roi
  );

  insert into transactions (id, user_id, type, amount, currency, status, related_reference_id, notes)
  values (p_id || '-tx', p_user_id, 'investment', p_amount, 'USD', 'completed', p_id, 'Investment: ' || v_plan.name);
end;
$function$;

-- top_up_investment: recomputes expected_profit/total_return server-side from
-- the investment's own stored roi_percent (secure — no client financial terms
-- trusted). Recovered as-is from the live project.
create or replace function public.top_up_investment(p_investment_id text, p_amount numeric)
returns void language plpgsql security definer set search_path = public as $function$
declare
  v_inv record;
  v_caller text := auth.jwt()->>'sub';
  v_new_amount numeric;
  v_expected_profit numeric;
  v_total_return numeric;
begin
  select * into v_inv from active_investments where id = p_investment_id for update;
  if not found then
    raise exception 'Investment not found';
  end if;
  if v_inv.user_id <> v_caller then
    raise exception 'You can only top up your own investment';
  end if;
  if v_inv.status in ('Completed', 'completed') or v_inv.payout_transaction_id is not null then
    raise exception 'Completed investments cannot be topped up';
  end if;

  perform set_config('app.bypass_balance_protection', 'true', true);
  update users set balance = balance - p_amount where id = v_caller and balance >= p_amount;
  if not found then
    raise exception 'Insufficient balance';
  end if;

  v_new_amount := v_inv.amount + p_amount;
  v_expected_profit := round(v_new_amount * (coalesce(v_inv.roi_percent, 0) / 100), 2);
  v_total_return := v_new_amount + v_expected_profit;

  update active_investments
  set amount = v_new_amount,
      expected_profit = v_expected_profit,
      total_return = v_total_return,
      status = 'Running'
  where id = p_investment_id;

  insert into transactions (id, user_id, type, amount, currency, status, related_reference_id)
  values ('tx-topup-' || p_investment_id || '-' || extract(epoch from now())::text, v_caller, 'investment', p_amount, 'USD', 'completed', p_investment_id);
end;
$function$;
