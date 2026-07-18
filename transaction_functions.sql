-- Deposit + withdrawal RPCs. Recovered from the live project (July 2026) — the
-- original transaction_functions.sql was lost during the migration. These are
-- the CURRENTLY-DEPLOYED definitions, transcribed verbatim for the repo record.
--
-- SECURITY (July 2026 RPC audit): bug #23 is now FIXED for the real-money model —
-- `complete_own_deposit_transaction` is neutralized (always raises), so a user
-- can no longer self-credit a deposit. All deposits stay 'pending' until an admin
-- verifies the payment and credits via approve_deposit_transaction. Every other
-- function here is admin-gated or debits-only and was found secure.

-- Admin approves a deposit → credits balance. Admin verifies the real payment
-- first, so trusting the stored amount is fine. Guarded against re-approval.
create or replace function public.approve_deposit_transaction(p_transaction_id text, p_notes text default '')
returns void language plpgsql security definer as $function$
declare v_tx record;
begin
  if not is_admin() then raise exception 'Only an admin can approve deposits'; end if;
  select * into v_tx from transactions where id = p_transaction_id for update;
  if not found then raise exception 'Transaction % not found', p_transaction_id; end if;
  if v_tx.status <> 'pending' then return; end if;
  update transactions set status = 'completed', notes = coalesce(p_notes, notes) where id = p_transaction_id;
  perform set_config('app.bypass_balance_protection', 'true', true);
  update users set balance = balance + v_tx.amount where id = v_tx.user_id;
end;
$function$;

create or replace function public.reject_deposit_transaction(p_transaction_id text, p_notes text default '')
returns void language plpgsql security definer as $function$
declare v_tx record;
begin
  if not is_admin() then raise exception 'Only an admin can reject deposits'; end if;
  select * into v_tx from transactions where id = p_transaction_id for update;
  if not found then raise exception 'Transaction % not found', p_transaction_id; end if;
  if v_tx.status <> 'pending' then return; end if;
  update transactions set status = 'rejected', notes = coalesce(p_notes, notes) where id = p_transaction_id;
end;
$function$;

-- bug #23 FIXED (real-money decision): a user can NO LONGER self-credit a
-- deposit. This function is neutralized — it always raises. All deposits now
-- stay 'pending' until an admin credits them via approve_deposit_transaction
-- after verifying the real payment. Kept as a raising stub (rather than dropped)
-- so any stale caller fails loudly instead of silently hitting a missing RPC.
create or replace function public.complete_own_deposit_transaction(p_transaction_id text)
returns void language plpgsql security definer as $function$
begin
  raise exception 'Deposits must be verified and approved by an admin; self-completion is disabled';
end;
$function$;

-- User requests a withdrawal → debits balance immediately (held), creates a
-- pending row. Can't withdraw more than balance. Secure.
create or replace function public.create_withdrawal_transaction(p_id text, p_user_id text, p_amount numeric, p_currency text, p_asset text, p_address text default null, p_destination_tag text default null, p_bank_details jsonb default null, p_paypal_email text default null)
returns void language plpgsql security definer as $function$
declare
  v_balance numeric;
  v_caller text := auth.jwt()->>'sub';
begin
  if v_caller is null or v_caller <> p_user_id then raise exception 'You can only request a withdrawal for your own account'; end if;
  select balance into v_balance from users where id = p_user_id for update;
  if v_balance is null then raise exception 'User not found'; end if;
  if v_balance < p_amount then raise exception 'Insufficient balance'; end if;
  perform set_config('app.bypass_balance_protection', 'true', true);
  update users set balance = balance - p_amount where id = p_user_id;
  insert into transactions (id, user_id, type, amount, currency, asset, status, address, destination_tag, bank_details, paypal_email)
  values (p_id, p_user_id, 'withdrawal', p_amount, p_currency, p_asset, 'pending', p_address, p_destination_tag, p_bank_details, p_paypal_email);
end;
$function$;

-- Admin approves withdrawal → just marks completed (balance already debited). Secure.
create or replace function public.approve_withdrawal_transaction(p_transaction_id text, p_notes text default '')
returns void language plpgsql security definer as $function$
declare v_tx record;
begin
  if not is_admin() then raise exception 'Only an admin can approve withdrawals'; end if;
  select * into v_tx from transactions where id = p_transaction_id for update;
  if not found then raise exception 'Transaction % not found', p_transaction_id; end if;
  if v_tx.status <> 'pending' then return; end if;
  update transactions set status = 'completed', notes = coalesce(p_notes, notes) where id = p_transaction_id;
end;
$function$;

-- Admin rejects withdrawal → marks rejected AND refunds the held amount.
-- Guarded against double-refund by the pending check. Secure.
create or replace function public.reject_withdrawal_transaction(p_transaction_id text, p_notes text default '')
returns void language plpgsql security definer as $function$
declare v_tx record;
begin
  if not is_admin() then raise exception 'Only an admin can reject withdrawals'; end if;
  select * into v_tx from transactions where id = p_transaction_id for update;
  if not found then raise exception 'Transaction % not found', p_transaction_id; end if;
  if v_tx.status <> 'pending' then return; end if;
  update transactions set status = 'rejected', notes = coalesce(p_notes, notes) where id = p_transaction_id;
  perform set_config('app.bypass_balance_protection', 'true', true);
  update users set balance = balance + v_tx.amount where id = v_tx.user_id;
end;
$function$;
