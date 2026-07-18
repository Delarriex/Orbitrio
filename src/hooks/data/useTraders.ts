import { useState, useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TraderProfile } from "../../types";
import {
  USE_MOCK_DATA,
  getMockTraders,
  saveMockTrader,
  deleteMockTrader
} from "../../services";

export const INITIAL_TRADERS: TraderProfile[] = [
  {
    id: "trader-1",
    name: "Aurelius Orbit",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
    roi: 189.45,
    winRate: 92.1,
    followers: 845,
    maxFollowers: 1000,
    assetsUnderManagement: "$3.5M",
    riskScore: 2,
    profitDays: 142,
    chartData: [20, 31, 28, 45, 62, 55, 75, 92, 110, 105, 124, 142, 189]
  },
  {
    id: "trader-2",
    name: "Luna Capital",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop",
    roi: 142.20,
    winRate: 88.5,
    followers: 612,
    maxFollowers: 800,
    assetsUnderManagement: "$2.1M",
    riskScore: 1,
    profitDays: 98,
    chartData: [40, 48, 45, 59, 68, 80, 78, 92, 104, 115, 122, 142]
  },
  {
    id: "trader-3",
    name: "Vantage Bull",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format&fit=crop",
    roi: 247.90,
    winRate: 84.8,
    followers: 495,
    maxFollowers: 500,
    assetsUnderManagement: "$4.8M",
    riskScore: 4,
    profitDays: 204,
    chartData: [100, 120, 110, 145, 160, 150, 190, 210, 195, 230, 247]
  },
  {
    id: "trader-4",
    name: "Phoenix Hedged",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop",
    roi: 96.40,
    winRate: 94.6,
    followers: 284,
    maxFollowers: 300,
    assetsUnderManagement: "$1.2M",
    riskScore: 1,
    profitDays: 74,
    chartData: [30, 40, 48, 52, 60, 68, 74, 80, 85, 90, 96]
  }
];

// Maps between Supabase's snake_case `traders` rows and the app's TraderProfile shape.
function traderRowToProfile(row: any): TraderProfile {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    active: row.active,
    featured: row.featured,
    country: row.country,
    tradingStyle: row.trading_style,
    markets: row.markets,
    minimumCopyAmount: row.min_copy_amount,
    maximumCopyAmount: row.max_copy_amount,
    biography: row.biography,
    displayOrder: row.display_order,
    roi: row.roi,
    winRate: row.win_rate,
    followers: row.followers,
    maxFollowers: row.max_followers,
    assetsUnderManagement: row.assets_under_management,
    riskScore: row.risk_score,
    profitDays: row.profit_days,
    chartData: row.chart_data || []
  };
}

function traderProfileToRow(trader: Partial<TraderProfile>): Record<string, any> {
  const row: Record<string, any> = {};
  if (trader.name !== undefined) row.name = trader.name;
  if (trader.avatar !== undefined) row.avatar = trader.avatar;
  if (trader.active !== undefined) row.active = trader.active;
  if (trader.featured !== undefined) row.featured = trader.featured;
  if (trader.country !== undefined) row.country = trader.country;
  if (trader.tradingStyle !== undefined) row.trading_style = trader.tradingStyle;
  if (trader.markets !== undefined) row.markets = trader.markets;
  if (trader.minimumCopyAmount !== undefined) row.min_copy_amount = trader.minimumCopyAmount;
  if (trader.maximumCopyAmount !== undefined) row.max_copy_amount = trader.maximumCopyAmount;
  if (trader.biography !== undefined) row.biography = trader.biography;
  if (trader.displayOrder !== undefined) row.display_order = trader.displayOrder;
  if (trader.roi !== undefined) row.roi = trader.roi;
  if (trader.winRate !== undefined) row.win_rate = trader.winRate;
  if (trader.followers !== undefined) row.followers = trader.followers;
  if (trader.maxFollowers !== undefined) row.max_followers = trader.maxFollowers;
  if (trader.assetsUnderManagement !== undefined) row.assets_under_management = trader.assetsUnderManagement;
  if (trader.riskScore !== undefined) row.risk_score = trader.riskScore;
  if (trader.profitDays !== undefined) row.profit_days = trader.profitDays;
  if (trader.chartData !== undefined) row.chart_data = trader.chartData;
  return row;
}

/**
 * Trader catalog for copy trading — admin-managed, publicly readable.
 * Backed entirely by Supabase's `traders` table. No Firebase.
 */
export function useTraders(
  supabase: SupabaseClient,
  authReady: boolean,
  isAdmin: boolean,
  addNotification: (message: string) => void
) {
  const [traders, setTraders] = useState<TraderProfile[]>(() => getMockTraders(INITIAL_TRADERS));

  useEffect(() => {
    if (USE_MOCK_DATA) {
      setTraders(getMockTraders(INITIAL_TRADERS));
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("traders")
        .select("*")
        .order("id", { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error("Failed to load traders:", error);
        return;
      }

      if (!data || data.length === 0) {
        if (isAdmin) {
          const { error: seedError } = await supabase
            .from("traders")
            .insert(INITIAL_TRADERS.map(t => ({ id: t.id, ...traderProfileToRow(t) })));
          if (seedError) console.error("Error seeding traders:", seedError);
          setTraders(INITIAL_TRADERS);
        }
      } else {
        setTraders(data.map(traderRowToProfile));
      }
    })();

    return () => { cancelled = true; };
  }, [authReady, isAdmin]);

  const adminUpdateTrader = async (traderId: string, updatedData: Partial<TraderProfile>) => {
    const existingTrader = traders.find(trader => trader.id === traderId);
    if (!existingTrader) throw new Error("Trader not found.");
    const updatedTrader = { ...existingTrader, ...updatedData };

    if (USE_MOCK_DATA) {
      saveMockTrader(updatedTrader);
      setTraders(getMockTraders(INITIAL_TRADERS));
      addNotification(`Trader ${updatedData.name || traderId} updated on mock node successfully.`);
      return;
    }

    try {
      const { error } = await supabase
        .from("traders")
        .update(traderProfileToRow(updatedData))
        .eq("id", traderId);
      if (error) throw error;
      setTraders(prev => prev.map(trader => trader.id === traderId ? updatedTrader : trader));
      addNotification(`Trader ${updatedData.name || traderId} updated successfully.`);
    } catch (error) {
      console.error(`Failed to update trader ${traderId}:`, error);
      throw error;
    }
  };

  const adminCreateTrader = async (trader: Omit<TraderProfile, "id">) => {
    const freshTrader = { ...trader, id: `trader-${Date.now()}` };

    if (USE_MOCK_DATA) {
      saveMockTrader(freshTrader);
      setTraders(getMockTraders(INITIAL_TRADERS));
      addNotification(`Trader ${trader.name} registered on mock node successfully.`);
      return;
    }

    try {
      const { error } = await supabase
        .from("traders")
        .insert({ id: freshTrader.id, ...traderProfileToRow(freshTrader) });
      if (error) throw error;
      setTraders(prev => [...prev, freshTrader]);
      addNotification(`Trader ${trader.name} registered successfully.`);
    } catch (error) {
      console.error("Failed to create trader:", error);
      throw error;
    }
  };

  const adminDeleteTrader = async (traderId: string) => {
    if (USE_MOCK_DATA) {
      deleteMockTrader(traderId);
      setTraders(getMockTraders(INITIAL_TRADERS));
      addNotification(`Trader decommissioned on mock node successfully.`);
      return;
    }

    try {
      const { error } = await supabase.from("traders").delete().eq("id", traderId);
      if (error) throw error;
      setTraders(prev => prev.filter(trader => trader.id !== traderId));
      addNotification(`Trader decommissioned successfully.`);
    } catch (error) {
      console.error(`Failed to delete trader ${traderId}:`, error);
      throw error;
    }
  };

  return { traders, adminCreateTrader, adminUpdateTrader, adminDeleteTrader };
}