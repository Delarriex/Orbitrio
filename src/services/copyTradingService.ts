import { DEFAULT_CURRENCY, FALLBACK_GUEST_EMAIL } from "../constants";
import { TRANSACTION_STATUSES } from "../constants/statuses";
import type { CopyTrade, TraderProfile, Transaction } from "../types";
import { enrichTransaction } from "./transactionsService";
import { roundMoney, timestampId, todayIsoDate } from "./utils";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_COPY_DURATION_DAYS = 30;

export const buildCopyTradeId = (email: string, traderId: string) =>
  `copy-${email.replace(/[@.]/g, "-")}-${traderId}-${Date.now()}`;

const parseTradeTimestamp = (value: string) => {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.parse(`${value}T00:00:00.000Z`);
};

const getCopyDurationMs = (trade: Pick<CopyTrade, "startTimestamp" | "endTimestamp">) => {
  const start = parseTradeTimestamp(trade.startTimestamp);
  const end = parseTradeTimestamp(trade.endTimestamp);
  return Math.max(end - start, DAY_MS);
};

export const getCopyTradeRemainingDays = (trade: Pick<CopyTrade, "endTimestamp">, now = Date.now()) => {
  const end = parseTradeTimestamp(trade.endTimestamp);
  return Math.max(0, Math.ceil((end - now) / DAY_MS));
};

export const getCopyTradeProgress = (trade: Pick<CopyTrade, "startTimestamp" | "endTimestamp">, now = Date.now()) => {
  const start = parseTradeTimestamp(trade.startTimestamp);
  const elapsed = Math.max(0, now - start);
  return Math.min(100, roundMoney((elapsed / getCopyDurationMs(trade)) * 100));
};

export const normalizeCopyTrade = (trade: CopyTrade, now = Date.now()): CopyTrade => {
  if (trade.status === "Cancelled") return trade;

  const amountInvested = Number.isFinite(trade.amountInvested) ? trade.amountInvested : 0;
  const roiPercent = Number.isFinite(trade.roiPercent) ? trade.roiPercent : 0;
  const expectedProfit = Number.isFinite(trade.expectedProfit)
    ? trade.expectedProfit
    : roundMoney(amountInvested * (roiPercent / 100));
  const totalReturn = Number.isFinite(trade.totalReturn)
    ? trade.totalReturn
    : roundMoney(amountInvested + expectedProfit);

  const progress = getCopyTradeProgress(trade, now);
  const matured = getCopyTradeRemainingDays(trade, now) === 0 || progress >= 100;
  const completed = trade.status === "Completed" || trade.payoutCompleted || matured;

  return {
    ...trade,
    amountInvested,
    roiPercent,
    expectedProfit,
    totalReturn,
    remainingDays: completed ? 0 : getCopyTradeRemainingDays(trade, now),
    progress: completed ? 100 : progress,
    status: completed ? "Completed" : "Running"
  };
};

export const syncCopyTradeCountdowns = (trades: CopyTrade[], now = Date.now()) =>
  trades.map(trade => normalizeCopyTrade(trade, now));

export const buildCopyTrade = (trader: TraderProfile, amount: number, userEmail: string): CopyTrade => {
  const durationDays = Math.max(1, Math.round(trader.profitDays || DEFAULT_COPY_DURATION_DAYS));
  const start = new Date();
  const end = new Date(start.getTime() + durationDays * DAY_MS);
  const amountInvested = roundMoney(amount);
  const roiPercent = roundMoney(trader.roi || 0);
  const expectedProfit = roundMoney(amountInvested * (roiPercent / 100));

  return {
    id: buildCopyTradeId(userEmail, trader.id),
    traderId: trader.id,
    traderName: trader.name,
    amountInvested,
    roiPercent,
    expectedProfit,
    totalReturn: roundMoney(amountInvested + expectedProfit),
    startTimestamp: start.toISOString(),
    endTimestamp: end.toISOString(),
    remainingDays: durationDays,
    status: "Running",
    payoutCompleted: false,
    progress: 0
  };
};

export const settleMaturedCopyTrades = (
  trades: CopyTrade[],
  userEmail?: string | null,
  now = Date.now()
) => {
  const payoutTransactions: Transaction[] = [];
  let payoutAmount = 0;

  const settledTrades = syncCopyTradeCountdowns(trades, now).map(trade => {
    if (trade.status !== "Completed" || trade.payoutCompleted) return trade;

    const payoutTx = buildCopyPayoutTransaction(trade.totalReturn, trade.traderName, userEmail, trade.id);
    payoutTransactions.push(payoutTx);
    payoutAmount = roundMoney(payoutAmount + trade.totalReturn);

    return {
      ...trade,
      payoutCompleted: true,
      payoutTransactionId: payoutTx.id,
      completedAt: new Date(now).toISOString(),
      remainingDays: 0,
      progress: 100,
      status: "Completed" as const
    };
  });

  return {
    trades: settledTrades,
    transactions: payoutTransactions,
    payoutAmount,
    settledCount: payoutTransactions.length
  };
};

export const buildCopyTransaction = (
  amount: number,
  traderName: string,
  userEmail: string,
  relatedReferenceId?: string
): Transaction => {
  const id = timestampId("tx-copy");

  return enrichTransaction({
    id,
    type: "investment",
    amount,
    status: TRANSACTION_STATUSES.COMPLETED,
    asset: DEFAULT_CURRENCY,
    date: todayIsoDate(),
    notes: `Mirror allocation activated for master trader ${traderName}`,
    userEmail
  }, { userEmail }, { relatedReferenceId: relatedReferenceId || id });
};

export const buildCopyPayoutTransaction = (
  amount: number,
  traderName: string,
  userEmail?: string | null,
  relatedReferenceId?: string
): Transaction => {
  const id = timestampId("tx-copy-pay");

  return enrichTransaction({
    id,
    type: "payout",
    amount,
    status: TRANSACTION_STATUSES.COMPLETED,
    asset: DEFAULT_CURRENCY,
    date: todayIsoDate(),
    notes: `Completed copy trade payout for ${traderName}`,
    userEmail: userEmail || FALLBACK_GUEST_EMAIL
  }, { userEmail }, { relatedReferenceId: relatedReferenceId || id });
};

export const buildUncopyTransaction = (
  amount: number,
  userEmail?: string | null,
  relatedReferenceId?: string
): Transaction => {
  const id = timestampId("tx-uncopy");

  return enrichTransaction({
    id,
    type: "payout",
    amount,
    status: TRANSACTION_STATUSES.COMPLETED,
    asset: DEFAULT_CURRENCY,
    date: todayIsoDate(),
    notes: "Liquidated copy allocation for master trader",
    userEmail: userEmail || FALLBACK_GUEST_EMAIL
  }, { userEmail }, { relatedReferenceId: relatedReferenceId || id });
};
