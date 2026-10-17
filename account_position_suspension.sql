-- Run AFTER account_suspension.sql and both payout-claim migrations.
-- Pauses existing positions atomically with the account status change.
-- Existing suspended/banned accounts are paused from migration time onward.
begin;

alter table public.active_investments add column if not exists paused_at timestamptz;
alter table public.active_investments add column if not exists paused_seconds numeric not null default 0;
alter table public.copy_trades add column if not exists paused_at timestamptz;
alter table public.copy_trades add column if not exists paused_seconds numeric not null default 0;

create or replace function public.sync_account_position_suspension()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_now timestamptz := clock_timestamp();
begin
  if new.status = 'active' then
    -- Extend maturity by exactly the time paused; preserve the purchase date,
    -- principal, earned progress, and original earning duration.
    update public.active_investments
    set end_date = end_date + greatest(v_now - paused_at, interval '0'),
        paused_seconds = paused_seconds + greatest(extract(epoch from v_now - paused_at), 0),
        paused_at = null
    where user_id = new.id and paused_at is not null;
    update public.copy_trades
    set end_timestamp = end_timestamp + greatest(v_now - paused_at, interval '0'),
        paused_seconds = paused_seconds + greatest(extract(epoch from v_now - paused_at), 0),
        paused_at = null
    where user_id = new.id and paused_at is not null;
  else
    update public.active_investments set paused_at = v_now
    where user_id = new.id and paused_at is null
      and status in ('Running', 'active') and payout_transaction_id is null;
    update public.copy_trades set paused_at = v_now
    where user_id = new.id and paused_at is null and status = 'Running'
      and not coalesce(payout_completed, false) and payout_transaction_id is null;
  end if;
  return new;
end;
$$;
revoke all on function public.sync_account_position_suspension() from public;

create or replace function public.guard_position_suspension()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    -- Only the nested account-status trigger may maintain pause metadata.
    -- No balance, principal, payout, or status changes can use this exception.
    if pg_trigger_depth() = 2
       and (old.paused_at is distinct from new.paused_at)
       and (to_jsonb(old) - array['paused_at','paused_seconds','end_date','end_timestamp','updated_at'])
         = (to_jsonb(new) - array['paused_at','paused_seconds','end_date','end_timestamp','updated_at']) then
      return new;
    end if;
    if old.paused_at is distinct from new.paused_at
       or old.paused_seconds is distinct from new.paused_seconds then
      raise exception 'Position pause fields can only be changed by an account status update.' using errcode = '42501';
    end if;
  elsif tg_op = 'INSERT' then
    if new.paused_at is not null or new.paused_seconds <> 0 then
      raise exception 'New positions cannot set pause fields.' using errcode = '42501';
    end if;
  end if;

  if tg_op <> 'INSERT' then
    perform public.require_active_account(old.user_id);
  end if;
  if tg_op = 'DELETE' then return old; end if;
  perform public.require_active_account(new.user_id);
  return new;
end;
$$;
revoke all on function public.guard_position_suspension() from public;

drop trigger if exists position_suspension_guard on public.active_investments;
create trigger position_suspension_guard before insert or update or delete on public.active_investments
for each row execute function public.guard_position_suspension();
drop trigger if exists position_suspension_guard on public.copy_trades;
create trigger position_suspension_guard before insert or update or delete on public.copy_trades
for each row execute function public.guard_position_suspension();

drop trigger if exists account_position_suspension on public.users;
create trigger account_position_suspension after update of status on public.users
for each row execute function public.sync_account_position_suspension();

-- Rerunning keeps the original pause timestamp. Paid/cancelled rows are untouched.
update public.users set status = status where status is distinct from 'active';

-- Claim RPC definitions follow so this file is the complete incremental upgrade.

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
set search_path = public
as $function$
declare
  v_inv record;
  v_caller text := auth.jwt()->>'sub';
begin
  -- Lock the account before the position, so suspension/resumption cannot race
  -- the maturity check or the credit. Read the updated maturity after this lock.
  perform public.require_active_account(v_caller);
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
set search_path = public
as $function$
declare
  v_ct record;
  v_caller text := auth.jwt()->>'sub';
begin
  -- Lock the account before the position, so suspension/resumption cannot race
  -- the maturity check or the credit. Read the updated maturity after this lock.
  perform public.require_active_account(v_caller);
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

commit;
