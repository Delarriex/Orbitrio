import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { getFinancialAccessError, financialActionError, ACCOUNT_RESTRICTED_MESSAGE } from "../src/services/accountAccessService";

test("financial access checks fresh status and fails closed when status cannot be verified", async () => {
  let response: any = { data: { status: "active" }, error: null };
  const client = { from: () => ({ select: () => ({ eq: () => ({ single: async () => response }) }) }) } as any;
  assert.equal(await getFinancialAccessError(client, "user"), null);
  for (const status of ["suspended", "banned", null, "unexpected"]) {
    response = { data: { status }, error: null };
    assert.equal(await getFinancialAccessError(client, "user"), ACCOUNT_RESTRICTED_MESSAGE);
  }
  response = { data: null, error: { message: "Offline" } };
  assert.match((await getFinancialAccessError(client, "user"))!, /Unable to verify/);
  assert.match((await getFinancialAccessError(client, null))!, /signed in/);
  assert.equal(financialActionError({ message: ACCOUNT_RESTRICTED_MESSAGE }, "Failed"), ACCOUNT_RESTRICTED_MESSAGE);
  assert.equal(financialActionError({ message: "internal database details" }, "Failed"), "Failed");
});

test("SQL blocks suspended/banned financial RPCs and direct writes, rolls back balances, and permits reactivation", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role authenticated;
      create schema auth;
      create function auth.jwt() returns jsonb language sql stable as $$
        select jsonb_build_object('sub', current_setting('test.user', true))
      $$;
      create table users(id text primary key, status text, balance numeric, role text default 'user');
      create function is_admin() returns boolean language sql stable as $$
        select exists(select 1 from users where id=auth.jwt()->>'sub' and role='admin')
      $$;
      create table market_prices(symbol text primary key, price numeric, updated_at timestamptz);
      create table portfolio_assets(id text primary key, user_id text, symbol text, name text, amount numeric,
        avg_buy_price numeric, current_price numeric, type text, updated_at timestamptz);
      create table investment_plans(id text primary key, name text, enabled boolean, status text,
        min_deposit numeric, max_deposit numeric, roi_percent numeric, duration_days integer);
      create table active_investments(id text primary key, user_id text, plan_id text, name text, amount numeric,
        start_date timestamptz, end_date timestamptz, roi_percent numeric, expected_profit numeric, total_return numeric,
        remaining_days integer, accumulated_profit numeric, status text, progress numeric, daily_roi_percent numeric,
        payout_transaction_id text);
      create table traders(id text primary key, name text, active boolean, min_copy_amount numeric,
        max_copy_amount numeric, roi numeric, profit_days integer);
      create table copy_trades(id text primary key, user_id text, trader_id text, trader_name text,
        amount_invested numeric, roi_percent numeric, expected_profit numeric, total_return numeric,
        start_timestamp timestamptz, end_timestamp timestamptz, remaining_days integer, status text,
        payout_completed boolean, progress numeric);
      create table transactions(id text primary key, user_id text, type text, amount numeric, currency text,
        asset text, status text, address text, destination_tag text, bank_details jsonb, paypal_email text,
        related_reference_id text, notes text);
      insert into users values ('user', 'active', 10000, 'user'), ('admin', 'active', 0, 'admin');
      insert into market_prices values ('BTC/USD', 100, now());
      insert into investment_plans values ('plan', 'Test', true, 'active', 1, 100000, 10, 30);
      insert into traders values ('trader', 'Test', true, 1, 100000, 10, 30);
      select set_config('test.user', 'user', false);
    `);
    for (const file of ["portfolio_functions.sql", "investment_functions.sql", "transaction_functions.sql", "copytrade_functions.sql", "account_suspension.sql", "account_suspension.sql"]) {
      await db.exec(await readFile(new URL(`../${file}`, import.meta.url), "utf8"));
    }
    const buy = "select buy_asset('user','BTC/USD','Bitcoin',100,100,1,'crypto')";
    const sell = (quantity: number) => `select sell_asset('user','BTC/USD',100,100,${quantity})`;
    const invest = (id: string) => `select create_investment('${id}','user','plan','Test',100,10,10,110,1,now(),now(),30)`;
    const copy = (id: string) => `select create_copy_trade('${id}','user','trader','Test',100,10,10,110,now(),now(),30)`;
    const withdraw = (id: string) => `select create_withdrawal_transaction('${id}','user',100,'USD','USD')`;
    // Active accounts still work using the actual production RPC bodies.
    await db.exec(buy);
    await db.exec(invest("existing"));
    await db.exec(copy("existing-copy"));
    await db.exec(withdraw("existing-withdrawal"));
    const snapshot = async () => (await db.query(`select
      (select balance from users where id='user') as balance,
      (select sum(amount) from portfolio_assets) as holdings,
      (select sum(amount) from active_investments) as invested,
      (select sum(amount_invested) from copy_trades) as copied,
      (select count(*) from transactions) as ledger`)).rows;
    const original = await snapshot();
    for (const status of ["suspended", "banned"]) {
      await db.exec(`update users set status='${status}' where id='user'`);
      for (const sql of [buy, sell(0.5), sell(1), invest("blocked"), copy("blocked"), withdraw("blocked"),
        "select top_up_investment('existing', 10)",
        "insert into portfolio_assets(id,user_id,amount) values ('direct','user',1)",
        "update active_investments set amount=amount+1 where id='existing'",
        "insert into transactions(id,user_id,type,amount,status) values ('direct','user','withdrawal',10,'pending')"
      ]) {
        await assert.rejects(db.exec(sql), /Trading, investing and withdrawals are disabled/, sql);
        assert.deepEqual(await snapshot(), original, "blocked actions must not change money or positions");
      }
    }
    // Triggers also run for non-admin SQL callers and cannot be disabled by the balance bypass flag.
    await db.exec(`grant usage on schema public to authenticated;
      grant select, insert, update, delete on all tables in schema public to authenticated;
      set role authenticated;
      select set_config('app.bypass_balance_protection','true',false);`);
    await assert.rejects(db.exec(buy), /Trading, investing and withdrawals are disabled/);
    await assert.rejects(db.exec("select require_active_account('user')"), /permission denied/);
    await db.exec("reset role");
    // Pending withdrawal approval is blocked, but admin rejection refunds it.
    await db.exec("select set_config('test.user','admin',false)");
    await assert.rejects(db.exec("select approve_withdrawal_transaction('existing-withdrawal')"), /Trading, investing and withdrawals are disabled/);
    await db.exec("select reject_withdrawal_transaction('existing-withdrawal')");
    assert.equal((await db.query<any>("select status from transactions where id='existing-withdrawal'")).rows[0].status, "rejected");
    // Passive maturity updates and deposit records do not create new exposure.
    await db.exec("update active_investments set progress=25 where id='existing'");
    await db.exec("insert into transactions(id,user_id,type,status) values ('deposit','user','deposit','pending')");
    await db.exec("update users set status='active' where id='user'; select set_config('test.user','user',false)");
    await db.exec(buy);
    await db.exec(sell(0.5));
    await db.exec(invest("reactivated"));
    await db.exec(copy("reactivated-copy"));
    await db.exec(withdraw("reactivated-withdrawal"));
    await db.exec("select top_up_investment('existing',10)");
  } finally {
    await db.close();
  }
});
