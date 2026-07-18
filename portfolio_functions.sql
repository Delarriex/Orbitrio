-- Portfolio buy/sell RPCs — HARDENED (bug #22 fix).
--
-- The previously-deployed versions trusted the client's p_amount / p_price /
-- p_quantity, letting a user buy an asset at a fake low price and sell it at a
-- fake high price to mint balance (withdrawable = real loss). These versions
-- read the TRUSTED price from the server-maintained `market_prices` table
-- (populated by the Express /api/markets route via the service_role key) and
-- ignore the client-supplied price entirely:
--   • buy:  user chooses a dollar amount to spend; quantity = amount / trusted_price
--   • sell: user chooses a quantity to sell;       credit  = quantity * trusted_price
-- If no fresh price exists for the symbol, the trade is rejected (safe halt).
--
-- Requires market_prices.sql to have been run first. Run this whole file in the
-- Supabase SQL editor. Safe to re-run.

create or replace function public.buy_asset(p_user_id text, p_symbol text, p_name text, p_amount numeric, p_price numeric, p_quantity numeric, p_asset_type text)
returns void language plpgsql security definer set search_path = public as $function$
declare
  v_caller text := auth.jwt()->>'sub';
  v_existing record;
  v_price numeric;
  v_updated timestamptz;
  v_quantity numeric;
  v_new_qty numeric;
  v_new_avg numeric;
begin
  if v_caller is null or v_caller <> p_user_id then
    raise exception 'You can only trade your own account';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Invalid trade amount';
  end if;

  -- TRUSTED price only. Client p_price / p_quantity are ignored.
  select price, updated_at into v_price, v_updated from market_prices where symbol = p_symbol;
  if not found then
    raise exception 'No market price available for %', p_symbol;
  end if;
  if v_updated < now() - interval '15 minutes' then
    raise exception 'Market price for % is stale; trading temporarily unavailable', p_symbol;
  end if;

  v_quantity := round(p_amount / v_price, 8);
  if v_quantity <= 0 then
    raise exception 'Trade amount too small for current price';
  end if;

  perform set_config('app.bypass_balance_protection', 'true', true);
  update users set balance = balance - p_amount where id = p_user_id and balance >= p_amount;
  if not found then
    raise exception 'Insufficient balance';
  end if;

  select * into v_existing from portfolio_assets where user_id = p_user_id and symbol = p_symbol for update;
  if found then
    v_new_qty := v_existing.amount + v_quantity;
    v_new_avg := round(((v_existing.amount * v_existing.avg_buy_price) + p_amount) / v_new_qty, 2);
    update portfolio_assets set amount = v_new_qty, avg_buy_price = v_new_avg, current_price = v_price, updated_at = now() where id = v_existing.id;
  else
    insert into portfolio_assets (id, user_id, symbol, name, amount, avg_buy_price, current_price, type)
    values (gen_random_uuid()::text, p_user_id, p_symbol, p_name, v_quantity, v_price, v_price, p_asset_type);
  end if;

  insert into transactions (id, user_id, type, amount, currency, status, related_reference_id, notes)
  values ('tx-buy-' || p_user_id || '-' || extract(epoch from now())::text, p_user_id, 'investment', p_amount, 'USD', 'completed', p_symbol,
    'Purchased ' || v_quantity || ' units of ' || p_symbol || ' at $' || v_price);
end;
$function$;

create or replace function public.sell_asset(p_user_id text, p_symbol text, p_amount numeric, p_price numeric, p_quantity numeric)
returns void language plpgsql security definer set search_path = public as $function$
declare
  v_caller text := auth.jwt()->>'sub';
  v_existing record;
  v_price numeric;
  v_updated timestamptz;
  v_amount numeric;
  v_new_qty numeric;
begin
  if v_caller is null or v_caller <> p_user_id then
    raise exception 'You can only trade your own account';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Invalid sell quantity';
  end if;

  select * into v_existing from portfolio_assets where user_id = p_user_id and symbol = p_symbol for update;
  if not found or v_existing.amount < p_quantity then
    raise exception 'Insufficient holdings to sell';
  end if;

  -- TRUSTED price only. Client p_amount / p_price are ignored.
  select price, updated_at into v_price, v_updated from market_prices where symbol = p_symbol;
  if not found then
    raise exception 'No market price available for %', p_symbol;
  end if;
  if v_updated < now() - interval '15 minutes' then
    raise exception 'Market price for % is stale; trading temporarily unavailable', p_symbol;
  end if;

  v_amount := round(p_quantity * v_price, 2);
  v_new_qty := v_existing.amount - p_quantity;

  if v_new_qty <= 0.000001 then
    delete from portfolio_assets where id = v_existing.id;
  else
    update portfolio_assets set amount = v_new_qty, current_price = v_price, updated_at = now() where id = v_existing.id;
  end if;

  perform set_config('app.bypass_balance_protection', 'true', true);
  update users set balance = balance + v_amount where id = p_user_id;

  insert into transactions (id, user_id, type, amount, currency, status, related_reference_id, notes)
  values ('tx-sell-' || p_user_id || '-' || extract(epoch from now())::text, p_user_id, 'payout', v_amount, 'USD', 'completed', p_symbol,
    'Sold ' || p_quantity || ' units of ' || p_symbol || ' at $' || v_price);
end;
$function$;
