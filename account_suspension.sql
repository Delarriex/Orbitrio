-- Run AFTER the existing core schema and financial migrations in Supabase.
-- These triggers apply to direct writes AND security-definer RPCs. A failed
-- check rolls back the whole RPC, including any earlier balance changes.
begin;

create or replace function public.require_active_account(p_user_id text)
returns void language plpgsql security definer set search_path = public as $$
declare v_status text;
begin
  -- Serialize financial actions with the admin's status update. Once suspend
  -- commits, a later action must observe the suspended state.
  select status into v_status from public.users where id = p_user_id for update;
  if not found or v_status is distinct from 'active' then
    raise exception 'Your account is suspended or restricted. Trading, investing and withdrawals are disabled. Please contact support.'
      using errcode = '42501';
  end if;
end;
$$;
revoke all on function public.require_active_account(text) from public;

create or replace function public.guard_account_financial_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    perform public.require_active_account(old.user_id);
    return old;
  end if;
  if tg_op = 'UPDATE' and old.user_id is distinct from new.user_id then
    perform public.require_active_account(old.user_id);
  end if;
  perform public.require_active_account(new.user_id);
  return new;
end;
$$;
revoke all on function public.guard_account_financial_activity() from public;

-- Buys and sells (including sales that remove the final holding).
drop trigger if exists account_active_portfolio_insert on public.portfolio_assets;
create trigger account_active_portfolio_insert before insert on public.portfolio_assets
for each row execute function public.guard_account_financial_activity();
drop trigger if exists account_active_portfolio_update on public.portfolio_assets;
create trigger account_active_portfolio_update before update on public.portfolio_assets
for each row when (old.amount is distinct from new.amount or old.user_id is distinct from new.user_id)
execute function public.guard_account_financial_activity();
drop trigger if exists account_active_portfolio_delete on public.portfolio_assets;
create trigger account_active_portfolio_delete before delete on public.portfolio_assets
for each row execute function public.guard_account_financial_activity();

-- New investments and top-ups. Maturity/progress updates remain possible.
drop trigger if exists account_active_investment_insert on public.active_investments;
create trigger account_active_investment_insert before insert on public.active_investments
for each row execute function public.guard_account_financial_activity();
drop trigger if exists account_active_investment_update on public.active_investments;
create trigger account_active_investment_update before update on public.active_investments
for each row when (old.amount is distinct from new.amount or old.user_id is distinct from new.user_id)
execute function public.guard_account_financial_activity();

drop trigger if exists account_active_copy_insert on public.copy_trades;
create trigger account_active_copy_insert before insert on public.copy_trades
for each row execute function public.guard_account_financial_activity();
drop trigger if exists account_active_copy_update on public.copy_trades;
create trigger account_active_copy_update before update on public.copy_trades
for each row when (old.amount_invested is distinct from new.amount_invested or old.user_id is distinct from new.user_id)
execute function public.guard_account_financial_activity();

-- No new withdrawal/investment ledger entries, even through a direct API call.
drop trigger if exists account_active_transaction_insert on public.transactions;
create trigger account_active_transaction_insert before insert on public.transactions
for each row when (new.type in ('withdrawal', 'investment'))
execute function public.guard_account_financial_activity();

-- Pending withdrawals cannot be approved while suspended. Admin rejection
-- and its refund still work, so funds are not stranded in a pending request.
drop trigger if exists account_active_transaction_update on public.transactions;
create trigger account_active_transaction_update before update on public.transactions
for each row when (
  new.type = 'withdrawal' and new.status is distinct from 'rejected'
  and (old.type is distinct from new.type or old.status is distinct from new.status
    or old.user_id is distinct from new.user_id or old.amount is distinct from new.amount)
)
execute function public.guard_account_financial_activity();

commit;
