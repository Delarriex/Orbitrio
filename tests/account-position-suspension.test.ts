import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { normalizeActiveInvestment, settleMaturedInvestments } from "../src/services/investmentsService";
import { normalizeCopyTrade, settleMaturedCopyTrades } from "../src/services/copyTradingService";

const DAY = 86400000;

test("account suspension freezes existing positions atomically, protects payouts, and resumes without losing progress", async () => {
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
        payout_transaction_id text, completed_at timestamptz);
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
    for (const file of ["portfolio_functions.sql", "investment_functions.sql", "transaction_functions.sql", "copytrade_functions.sql", "account_suspension.sql", "investment_claim_function.sql", "copy_trade_claim_function.sql"]) {
      await db.exec(await readFile(new URL(`../${file}`, import.meta.url), "utf8"));
    }

    // Upgrade accounts which were already suspended under the previous rules.
    await db.exec(`
      insert into users values ('legacy','active',1000,'user');
      select set_config('test.user','legacy',false);
      select create_investment('legacy-investment','legacy','plan','Test',100,10,10,110,1,now(),now(),30);
      select create_copy_trade('legacy-copy','legacy','trader','Test',100,10,10,110,now(),now(),30);
      update users set status='suspended' where id='legacy';
      select set_config('test.user','user',false);
    `);
    const migration = await readFile(new URL('../account_position_suspension.sql', import.meta.url), 'utf8');
    await db.exec(migration);
    const legacyPause = (await db.query<any>("select paused_at from active_investments where id='legacy-investment'")).rows[0].paused_at;
    assert.ok(legacyPause, 'previously suspended accounts are backfilled');
    await db.exec(migration);
    assert.equal(+(await db.query<any>("select paused_at from copy_trades where id='legacy-copy'")).rows[0].paused_at, +legacyPause);

    await db.exec(`
      select create_investment('running','user','plan','Test',100,10,10,110,1,now(),now(),30);
      select create_copy_trade('copy','user','trader','Test',100,10,10,110,now(),now(),30);
      select create_investment('matured','user','plan','Test',100,10,10,110,1,now(),now(),30);
      select create_copy_trade('matured-copy','user','trader','Test',100,10,10,110,now(),now(),30);
      select create_investment('paid','user','plan','Test',100,10,10,110,1,now(),now(),30);
      select create_copy_trade('cancelled','user','trader','Test',100,10,10,110,now(),now(),30);
      update active_investments set start_date=now()-interval '10 days', end_date=now()+interval '20 days' where user_id='user';
      update copy_trades set start_timestamp=now()-interval '10 days', end_timestamp=now()+interval '20 days' where user_id='user';
      update active_investments set start_date=now()-interval '31 days', end_date=now()-interval '1 day' where id in ('matured','paid');
      update copy_trades set start_timestamp=now()-interval '31 days', end_timestamp=now()-interval '1 day' where id='matured-copy';
      select claim_investment_payout('paid');
      select cancel_copy_trade('cancelled');
    `);
    const row = async (table: string, id: string) => (await db.query<any>(`select * from ${table} where id=$1`, [id])).rows[0];
    const money = async () => (await db.query(`select
      (select balance from users where id='user') as balance,
      (select sum(amount) from active_investments) as invested,
      (select sum(amount_invested) from copy_trades) as copied,
      (select count(*) from transactions) as ledger`)).rows;
    const originalMoney = await money();
    const originalInv = await row('active_investments','running');
    const originalCopy = await row('copy_trades','copy');
    const paid = await row('active_investments','paid');
    const cancelled = await row('copy_trades','cancelled');
    await db.exec("update users set status='suspended' where id='user'");
    const pausedInv = await row('active_investments','running');
    const pausedCopy = await row('copy_trades','copy');
    assert.ok(pausedInv.paused_at);
    assert.equal(+pausedInv.paused_at, +pausedCopy.paused_at, 'all positions pause at the same instant');
    assert.deepEqual(await money(), originalMoney);
    assert.deepEqual(await row('active_investments','paid'), paid);
    assert.deepEqual(await row('copy_trades','cancelled'), cancelled);

    for (const sql of [
      "select claim_investment_payout('matured')",
      "select claim_copy_trade_payout('matured-copy')",
      "select cancel_copy_trade('copy')",
      "select top_up_investment('running',10)",
      "update active_investments set progress=100, status='Completed' where id='running'",
      "update copy_trades set payout_completed=true where id='copy'",
      "update active_investments set paused_at=null where id='running'",
      "update copy_trades set paused_seconds=1000000 where id='copy'",
      "delete from active_investments where id='running'",
      "delete from copy_trades where id='copy'"
    ]) {
      await assert.rejects(db.exec(sql), /disabled|pause fields/, sql);
      assert.deepEqual(await money(), originalMoney, 'failed actions must roll back earlier credits');
      assert.deepEqual(await row('active_investments','running'), pausedInv);
      assert.deepEqual(await row('copy_trades','copy'), pausedCopy);
    }
    await db.exec(`grant usage on schema public to authenticated;
      grant select, insert, update, delete on all tables in schema public to authenticated;
      set role authenticated;
      select set_config('app.bypass_balance_protection','true',false);`);
    await assert.rejects(db.exec("select claim_investment_payout('matured')"), /disabled/);
    await assert.rejects(db.exec("select claim_copy_trade_payout('matured-copy')"), /disabled/);
    await assert.rejects(db.exec("update copy_trades set paused_at=null where id='copy'"), /pause fields/);
    await db.exec('reset role');
    assert.deepEqual(await money(), originalMoney);

    // Repeated suspension, migration reruns and switching to banned preserve the clock.
    await db.exec("update users set status='suspended' where id='user'");
    await db.exec(await readFile(new URL('../account_position_suspension.sql', import.meta.url), 'utf8'));
    await db.exec("update users set status='banned' where id='user'");
    assert.equal(+(await row('active_investments','running')).paused_at, +pausedInv.paused_at);
    await new Promise(resolve => setTimeout(resolve, 100));
    await db.exec("update users set status='active' where id='user'");
    const resumedInv = await row('active_investments','running');
    const resumedCopy = await row('copy_trades','copy');
    for (const [before, resumed, end, start] of [
      [originalInv, resumedInv, 'end_date', 'start_date'],
      [originalCopy, resumedCopy, 'end_timestamp', 'start_timestamp']
    ] as const) {
      assert.equal(resumed.paused_at, null);
      assert.ok(Number(resumed.paused_seconds) >= 0.1);
      assert.ok(Math.abs(+resumed[end] - +before[end] - Number(resumed.paused_seconds)*1000) < 2);
      assert.equal(+resumed[start], +before[start], 'purchase date is preserved');
    }
    assert.deepEqual(await money(), originalMoney, 'activation never credits or debits money');
    await assert.rejects(db.exec("select claim_investment_payout('running')"), /not matured/);
    await assert.rejects(db.exec("select claim_copy_trade_payout('copy')"), /not matured/);
    await db.exec("select claim_investment_payout('matured'); select claim_copy_trade_payout('matured-copy')");
    const claimed = await money();
    assert.equal(Number((claimed[0] as any).balance), Number((originalMoney[0] as any).balance)+220);
    await db.exec("select claim_investment_payout('matured'); select claim_copy_trade_payout('matured-copy')");
    assert.deepEqual(await money(), claimed, 'repeated claims do not pay twice');
    // Second cycle accumulates duration; a no-op activation must not extend it again.
    await db.exec("update users set status='suspended' where id='user'");
    await new Promise(resolve => setTimeout(resolve, 20));
    await db.exec("update users set status='active' where id='user'");
    const secondResume = await row('active_investments','running');
    assert.ok(Number(secondResume.paused_seconds) > Number(resumedInv.paused_seconds));
    await db.exec("update users set status='active' where id='user'");
    assert.deepEqual(await row('active_investments','running'), secondResume);
    await assert.rejects(db.exec("update active_investments set paused_seconds=0 where id='running'"), /pause fields/);
    await db.exec("select top_up_investment('running',10); select cancel_copy_trade('copy')");
  } finally { await db.close(); }
});

test("display earnings and countdown freeze across elapsed time and resume with the original earning duration", () => {
  const start = Date.parse('2026-01-01T00:00:00Z');
  const iso = (ms: number) => new Date(ms).toISOString();
  const inv: any = {id:'i', planId:'p', name:'Test', amount:100, roiPercent:30, expectedProfit:30,
    totalReturn:130, accumulatedProfit:0, status:'Running', progress:0,
    startDate:iso(start), endDate:iso(start+30*DAY), pausedAt:iso(start+10*DAY), pausedSeconds:0};
  const trade: any = {id:'c', traderId:'t', traderName:'Test', amountInvested:100, roiPercent:30,
    expectedProfit:30, totalReturn:130, status:'Running', progress:0, payoutCompleted:false,
    startTimestamp:inv.startDate, endTimestamp:inv.endDate, pausedAt:inv.pausedAt, pausedSeconds:0};
  const paused = normalizeActiveInvestment(inv, undefined, start+10*DAY);
  assert.equal(paused.accumulatedProfit,10);
  assert.equal(paused.remainingDays,20);
  assert.deepEqual(normalizeActiveInvestment(inv, undefined, start+90*DAY), paused);
  assert.deepEqual(normalizeCopyTrade(trade,start+90*DAY), normalizeCopyTrade(trade,start+10*DAY));
  assert.equal(settleMaturedInvestments([inv],[],null,start+90*DAY).payoutAmount,0);
  assert.equal(settleMaturedCopyTrades([trade],null,start+90*DAY).payoutAmount,0);
  const resumed = {...inv,pausedAt:null,pausedSeconds:5*86400,endDate:iso(start+35*DAY)};
  assert.equal(normalizeActiveInvestment(resumed,undefined,start+15*DAY).accumulatedProfit,10);
  assert.equal(normalizeActiveInvestment(resumed,undefined,start+20*DAY).accumulatedProfit,15);
  assert.equal(normalizeActiveInvestment(resumed,undefined,start+20*DAY).remainingDays,15);
  const resumedTrade = {...trade,pausedAt:null,pausedSeconds:5*86400,endTimestamp:iso(start+35*DAY)};
  assert.equal(normalizeCopyTrade(resumedTrade,start+20*DAY).progress,50);
  assert.equal(normalizeCopyTrade(resumedTrade,start+20*DAY).remainingDays,15);
  assert.equal(normalizeActiveInvestment(resumed,undefined,start+35*DAY).status,'Completed');
  assert.equal(normalizeCopyTrade(resumedTrade,start+35*DAY).status,'Completed');
});
