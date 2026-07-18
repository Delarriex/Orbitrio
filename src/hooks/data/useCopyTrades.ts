import { useState, useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CopyTrade, TraderProfile } from "../../types";
import { USE_MOCK_DATA } from "../../services";

const DEFAULT_COPY_DURATION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const roundMoney = (n: number) => Math.round(n * 100) / 100;

export interface AdminCopyTrade extends CopyTrade {
  userId: string;
  userName: string;
  userEmail: string;
}

function rowToCopyTrade(row: any): CopyTrade {
  return {
    id: row.id,
    traderId: row.trader_id,
    traderName: row.trader_name,
    amountInvested: row.amount_invested,
    roiPercent: row.roi_percent,
    expectedProfit: row.expected_profit,
    totalReturn: row.total_return,
    startTimestamp: row.start_timestamp,
    endTimestamp: row.end_timestamp,
    remainingDays: row.remaining_days,
    status: row.status,
    payoutCompleted: row.payout_completed,
    progress: row.progress,
    completedAt: row.completed_at,
    payoutTransactionId: row.payout_transaction_id
  };
}

/**
 * Copy trading positions. Backed entirely by Supabase's `copy_trades`
 * table. Preserves exactly the behavior that existed before (create,
 * cancel-with-full-refund) — this app has no matured-payout-claim flow
 * for copy trades today (the old settleMaturedCopyTrades logic existed
 * but was never actually wired up anywhere, so it isn't reproduced here).
 */
export function useCopyTrades(supabase: SupabaseClient, authReady: boolean, currentUserId: string | null, isAdmin: boolean = false) {
  const [copyTrades, setCopyTrades] = useState<CopyTrade[]>([]);
  const [adminCopyTrades, setAdminCopyTrades] = useState<AdminCopyTrade[]>([]);

  const refreshCopyTrades = async () => {
    if (!currentUserId) {
      setCopyTrades([]);
      return;
    }
    const { data, error } = await supabase
      .from("copy_trades")
      .select("*")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load copy trades:", error);
      return;
    }
    setCopyTrades((data || []).map(rowToCopyTrade));
  };

  const refreshAdminCopyTrades = async () => {
    if (!isAdmin) {
      setAdminCopyTrades([]);
      return;
    }
    const { data, error } = await supabase
      .from("copy_trades")
      .select("*, users!inner(email, name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load copy trades for admin:", error);
      return;
    }
    setAdminCopyTrades((data || []).map((row: any) => ({
      ...rowToCopyTrade(row),
      userId: row.user_id,
      userName: row.users?.name || "",
      userEmail: row.users?.email || ""
    })));
  };

  useEffect(() => {
    if (USE_MOCK_DATA) return;
    if (!authReady || !currentUserId) {
      setCopyTrades([]);
      return;
    }
    refreshCopyTrades();
  }, [authReady, currentUserId]);

  useEffect(() => {
    if (USE_MOCK_DATA) return;
    if (!authReady || !isAdmin) {
      setAdminCopyTrades([]);
      return;
    }
    refreshAdminCopyTrades();
  }, [authReady, isAdmin]);

  const startCopyTrade = async (trader: TraderProfile, amount: number) => {
    if (!currentUserId) throw new Error("You must be signed in to copy a trader.");

    const durationDays = Math.max(1, Math.round(trader.profitDays || DEFAULT_COPY_DURATION_DAYS));
    const start = new Date();
    const end = new Date(start.getTime() + durationDays * DAY_MS);
    const amountInvested = roundMoney(amount);
    const roiPercent = roundMoney(trader.roi || 0);
    const expectedProfit = roundMoney(amountInvested * (roiPercent / 100));
    const totalReturn = roundMoney(amountInvested + expectedProfit);
    const id = `copy-${currentUserId}-${trader.id}-${Date.now()}`;

    const { error } = await supabase.rpc("create_copy_trade", {
      p_id: id,
      p_user_id: currentUserId,
      p_trader_id: trader.id,
      p_trader_name: trader.name,
      p_amount_invested: amountInvested,
      p_roi_percent: roiPercent,
      p_expected_profit: expectedProfit,
      p_total_return: totalReturn,
      p_start_timestamp: start.toISOString(),
      p_end_timestamp: end.toISOString(),
      p_remaining_days: durationDays
    });
    if (error) throw error;

    await refreshCopyTrades();
    return { id, traderId: trader.id, traderName: trader.name, amountInvested, roiPercent, expectedProfit, totalReturn, startTimestamp: start.toISOString(), endTimestamp: end.toISOString(), remainingDays: durationDays, status: "Running" as const, payoutCompleted: false, progress: 0 };
  };

  const cancelCopyTrade = async (copyTradeId: string) => {
    if (!currentUserId) throw new Error("You must be signed in.");
    const { error } = await supabase.rpc("cancel_copy_trade", { p_copy_trade_id: copyTradeId });
    if (error) throw error;
    await refreshCopyTrades();
  };

  // Claim a matured copy trade's payout. Atomic RPC (maturity guard + bug-#8
  // bypass flag) credits total_return and sets payout_transaction_id.
  const claimCopyTradePayout = async (copyTradeId: string) => {
    if (!currentUserId) throw new Error("You must be signed in.");
    const { error } = await supabase.rpc("claim_copy_trade_payout", { p_copy_trade_id: copyTradeId });
    if (error) throw error;
    await refreshCopyTrades();
  };

  return { copyTrades, adminCopyTrades, startCopyTrade, cancelCopyTrade, claimCopyTradePayout, refreshCopyTrades, refreshAdminCopyTrades };
}