import { useState, useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PortfolioAsset } from "../../types";
import { USE_MOCK_DATA } from "../../services";

function rowToAsset(row: any): PortfolioAsset {
  return {
    symbol: row.symbol,
    name: row.name,
    amount: row.amount,
    avgBuyPrice: row.avg_buy_price,
    currentPrice: row.current_price,
    type: row.type
  };
}

/**
 * Portfolio holdings (the buy/sell trading feature). Backed entirely by
 * Supabase's `portfolio_assets` table via atomic buy_asset/sell_asset RPCs
 * — balance debit/credit, holding update, and transaction record all
 * happen together or not at all.
 */
export function usePortfolio(supabase: SupabaseClient, authReady: boolean, currentUserId: string | null) {
  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([]);

  const refreshPortfolio = async () => {
    if (!currentUserId) {
      setPortfolio([]);
      return;
    }
    const { data, error } = await supabase
      .from("portfolio_assets")
      .select("*")
      .eq("user_id", currentUserId);

    if (error) {
      console.error("Failed to load portfolio:", error);
      return;
    }
    setPortfolio((data || []).map(rowToAsset));
  };

  useEffect(() => {
    if (USE_MOCK_DATA) return;
    if (!authReady || !currentUserId) {
      setPortfolio([]);
      return;
    }
    refreshPortfolio();
  }, [authReady, currentUserId]);

  const buyAsset = async (
    symbol: string, name: string, amount: number, price: number, quantity: number, assetType: "crypto" | "stock"
  ) => {
    if (!currentUserId) throw new Error("You must be signed in to trade.");
    const { error } = await supabase.rpc("buy_asset", {
      p_user_id: currentUserId,
      p_symbol: symbol,
      p_name: name,
      p_amount: amount,
      p_price: price,
      p_quantity: quantity,
      p_asset_type: assetType
    });
    if (error) throw error;
    await refreshPortfolio();
  };

  const sellAsset = async (symbol: string, amount: number, price: number, quantity: number) => {
    if (!currentUserId) throw new Error("You must be signed in to trade.");
    const { error } = await supabase.rpc("sell_asset", {
      p_user_id: currentUserId,
      p_symbol: symbol,
      p_amount: amount,
      p_price: price,
      p_quantity: quantity
    });
    if (error) throw error;
    await refreshPortfolio();
  };

  return { portfolio, buyAsset, sellAsset, refreshPortfolio };
}