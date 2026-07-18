import { useState, useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { InvestmentPlan } from "../../types";
import { USE_MOCK_DATA, getMockInvestmentPlans, sortInvestmentPlans, normalizeInvestmentPlan } from "../../services";

function rowToPlan(row: any): InvestmentPlan {
  return normalizeInvestmentPlan(row.id, {
    name: row.name,
    minDeposit: row.min_deposit,
    maxDeposit: row.max_deposit,
    durationDays: row.duration_days,
    roiPercent: row.roi_percent,
    roiCapPercent: row.roi_cap_percent,
    description: row.description,
    status: row.status,
    enabled: row.enabled,
    displayOrder: row.display_order,
    badge: row.badge,
    accentColor: row.accent_color
  });
}

function planToRow(plan: InvestmentPlan): Record<string, any> {
  return {
    id: plan.id,
    name: plan.name,
    min_deposit: plan.minDeposit,
    max_deposit: plan.maxDeposit,
    duration_days: plan.durationDays,
    roi_percent: plan.roiPercent,
    roi_cap_percent: plan.roiCapPercent ?? null,
    description: plan.description,
    status: plan.status,
    enabled: plan.enabled,
    display_order: plan.displayOrder,
    badge: plan.badge || null,
    accent_color: plan.accentColor || null
  };
}

/**
 * Investment plan catalog (admin-configurable templates). Backed entirely
 * by Supabase's `investment_plans` table — public read, admin write. No
 * Firebase. Purchasing/claiming/topping-up an investment is a separate,
 * already-migrated concern (see useActiveInvestments.ts).
 */
export function useInvestmentPlans(supabase: SupabaseClient) {
  const [plans, setPlans] = useState<InvestmentPlan[]>(() => getMockInvestmentPlans());

  useEffect(() => {
    if (USE_MOCK_DATA) {
      setPlans(getMockInvestmentPlans());
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("investment_plans")
        .select("*")
        .order("display_order", { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error("Failed to load investment plans:", error);
        return;
      }
      setPlans(sortInvestmentPlans((data || []).map(rowToPlan)));
    })();

    return () => { cancelled = true; };
  }, []);

  const createPlan = async (planInput: Omit<InvestmentPlan, "id">) => {
    const planId = `plan-${Date.now()}`;
    const freshPlan = normalizeInvestmentPlan(planId, { ...planInput, id: planId });

    const { error } = await supabase.from("investment_plans").insert(planToRow(freshPlan));
    if (error) throw error;

    setPlans(prev => sortInvestmentPlans([...prev, freshPlan]));
    return freshPlan;
  };

  const savePlan = async (updated: InvestmentPlan) => {
    const normalized = normalizeInvestmentPlan(updated.id, updated);

    const { error } = await supabase
      .from("investment_plans")
      .update(planToRow(normalized))
      .eq("id", normalized.id);
    if (error) throw error;

    setPlans(prev => sortInvestmentPlans(prev.map(plan => plan.id === normalized.id ? normalized : plan)));
  };

  const deletePlan = async (planId: string) => {
    const { error } = await supabase.from("investment_plans").delete().eq("id", planId);
    if (error) throw error;

    setPlans(prev => prev.filter(plan => plan.id !== planId));
  };

  const setPlanEnabled = async (planId: string, enabled: boolean) => {
    const status = enabled ? "active" : "paused";
    const { error } = await supabase
      .from("investment_plans")
      .update({ enabled, status })
      .eq("id", planId);
    if (error) throw error;

    setPlans(prev => sortInvestmentPlans(prev.map(plan => plan.id === planId ? { ...plan, enabled, status } : plan)));
  };

  return { plans, createPlan, savePlan, deletePlan, setPlanEnabled };
}
