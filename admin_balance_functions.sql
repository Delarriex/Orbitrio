-- Admin manual balance override: atomic RPC, admin-only.
-- Run this once in the Supabase SQL editor.
-- Depends on: users table, transactions table, is_admin(), and the
-- app.bypass_balance_protection mechanism added by
-- fix_balance_protection_trigger.sql (bug #8 in MIGRATION_NOTES.md).
-- If that trigger fix hasn't been run yet, run it first — this function
-- will otherwise be silently blocked from updating users.balance even
-- though it's admin-gated, because the trigger checks who's signed in,
-- not which function is calling it.

create or replace function admin_update_user_balance(
  p_user_id text,
  p_new_balance numeric,
  p_label text default 'Admin Balance Edit',
  p_notes text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_balance numeric;
  v_name text;
  v_email text;
  v_delta numeric;
  v_tx_id text;
begin
  if not is_admin() then
    raise exception 'Only admins can override a user balance directly';
  end if;

  select balance, name, email into v_current_balance, v_name, v_email
  from users
  where id = p_user_id;

  if not found then
    raise exception 'User % not found', p_user_id;
  end if;

  v_delta := p_new_balance - v_current_balance;
  v_tx_id := 'tx-adj-' || p_user_id || '-' || extract(epoch from clock_timestamp())::bigint;

  perform set_config('app.bypass_balance_protection', 'true', true);

  update users
  set balance = p_new_balance
  where id = p_user_id;

  insert into transactions (
    id, user_id, user_name, user_email, type, amount, currency, status, asset, notes, occurred_at
  ) values (
    v_tx_id, p_user_id, v_name, v_email, 'adjustment', abs(v_delta), 'USD', 'completed', 'USD',
    coalesce(nullif(p_notes, ''), p_label), now()
  );
end;
$$;

grant execute on function admin_update_user_balance(text, numeric, text, text) to authenticated;
