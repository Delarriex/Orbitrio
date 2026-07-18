import { useState, useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActiveInvestment } from "../../types";

export interface AdminActiveInvestment extends ActiveInvestment {
  userId: string;
  userName: string;
  userEmail: string;
}

function rowToInvestment(row: any): ActiveInvestment {
  return {
    id: row.id,
    planId: row.plan_id,
    name: row.name,
    amount: row.amount,
    startDate: row.start_date,
    endDate: row.end_date,
    roiPercent: row.roi_percent,
    expectedProfit: row.expected_profit,
    totalReturn: row.total_return,
    remainingDays: row.remaining_days,
    accumulatedProfit: row.accumulated_profit ?? 0,
    status: row.status,
    progress: row.progress,
    dailyRoiPercent: row.daily_roi_percent,
    completedAt: row.completed_at,
    payoutTransactionId: row.payout_transaction_id
  };
}

/**
 * Active investments (plan purchases + maturity payouts). Backed entirely
 * by Supabase's `active_investments` table, with atomic RPC functions for
 * the two money-moving actions (purchase, claim payout). No Firebase.
 */
export function useActiveInvestments(supabase: SupabaseClient, authReady: boolean, userId: string | null, isAdmin: boolean = false) {
  const [activeInvestments, setActiveInvestments] = useState<ActiveInvestment[]>([]);
  const [adminActiveInvestments, setAdminActiveInvestments] = useState<AdminActiveInvestment[]>([]);

  const refreshActiveInvestments = async () => {
    if (!userId) {
      setActiveInvestments([]);
      return;
    }
    const { data, error } = await supabase
      .from("active_investments")
      .select("*")
      .eq("user_id", userId)
      .order("start_date", { ascending: false });

    if (error) {
      console.error("Failed to load active investments:", error);
      return;
    }
    setActiveInvestments((data || []).map(rowToInvestment));
  };

  const refreshAdminActiveInvestments = async () => {
    if (!isAdmin) {
      setAdminActiveInvestments([]);
      return;
    }
    const { data, error } = await supabase
      .from("active_investments")
      .select("*, users!inner(email, name)")
      .order("start_date", { ascending: false });

    if (error) {
      console.error("Failed to load active investments for admin:", error);
      return;
    }
    setAdminActiveInvestments((data || []).map((row: any) => ({
      ...rowToInvestment(row),
      userId: row.user_id,
      userName: row.users?.name || "",
      userEmail: row.users?.email || ""
    })));
  };

  useEffect(() => {
    if (!authReady || !userId) {
      setActiveInvestments([]);
      return;
    }
    refreshActiveInvestments();
  }, [authReady, userId]);

  useEffect(() => {
    if (!authReady || !isAdmin) {
      setAdminActiveInvestments([]);
      return;
    }
    refreshAdminActiveInvestments();
  }, [authReady, isAdmin]);

  const purchaseInvestment = async (input: {
    id: string; userId: string; planId: string; name: string; amount: number;
    roiPercent: number; expectedProfit: number; totalReturn: number;
    dailyRoiPercent: number; startDate: string; endDate: string; remainingDays: number;
  }) => {
    const { error } = await supabase.rpc("create_investment", {
      p_id: input.id,
      p_user_id: input.userId,
      p_plan_id: input.planId,
      p_name: input.name,
      p_amount: input.amount,
      p_roi_percent: input.roiPercent,
      p_expected_profit: input.expectedProfit,
      p_total_return: input.totalReturn,
      p_daily_roi_percent: input.dailyRoiPercent,
      p_start_date: input.startDate,
      p_end_date: input.endDate,
      p_remaining_days: input.remainingDays
    });
    if (error) throw error;
    await refreshActiveInvestments();
  };

  const claimInvestmentPayout = async (investmentId: string) => {
    const { error } = await supabase.rpc("claim_investment_payout", { p_investment_id: investmentId });
    if (error) throw error;
    await refreshActiveInvestments();
  };

  const topUpInvestmentRpc = async (investmentId: string, amount: number) => {
    const { error } = await supabase.rpc("top_up_investment", {
      p_investment_id: investmentId,
      p_amount: amount
    });
    if (error) throw error;
    await refreshActiveInvestments();
  };

  return {
    activeInvestments,
    adminActiveInvestments,
    purchaseInvestment,
    claimInvestmentPayout,
    topUpInvestmentRpc,
    refreshActiveInvestments,
    refreshAdminActiveInvestments
  };
}