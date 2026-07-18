import { useState, useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Airdrop } from "../../types";
import {
  USE_MOCK_DATA,
  getMockAirdrops,
  saveMockAirdrop,
  deleteMockAirdrop,
  buildAirdrop,
  normalizeAirdrop
} from "../../services";

function airdropRowToItem(row: any): Airdrop {
  return {
    id: row.id,
    title: row.title,
    token: row.token,
    rewardAmount: row.reward_amount,
    status: row.status,
    enabled: row.enabled,
    claimLimit: row.claim_limit,
    startDate: row.start_date ? String(row.start_date).slice(0, 10) : undefined,
    endDate: row.end_date ? String(row.end_date).slice(0, 10) : undefined,
    eligibility: row.eligibility,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function airdropToRow(airdrop: Airdrop): Record<string, any> {
  return {
    id: airdrop.id,
    title: airdrop.title,
    token: airdrop.token,
    reward_amount: airdrop.rewardAmount,
    status: airdrop.status,
    enabled: airdrop.enabled ?? true,
    claim_limit: airdrop.claimLimit ?? null,
    start_date: airdrop.startDate || null,
    end_date: airdrop.endDate || null,
    eligibility: airdrop.eligibility ?? null,
    description: airdrop.description ?? null,
    updated_at: new Date().toISOString()
  };
}

/**
 * Airdrop CAMPAIGNS only (the admin-managed catalog) — backed by
 * Supabase's `airdrops` table. Claims and approval (which credit user
 * balances) are NOT here — they stay on Firebase until the shared
 * transactions/balance system is migrated, since that logic belongs
 * together rather than being split and redone twice.
 */
export function useAirdrops(supabase: SupabaseClient, authReady: boolean, isLoggedIn: boolean) {
  const [airdrops, setAirdrops] = useState<Airdrop[]>(() => USE_MOCK_DATA ? getMockAirdrops() : []);

  useEffect(() => {
    if (USE_MOCK_DATA) {
      setAirdrops(getMockAirdrops());
      return;
    }

    if (!authReady || !isLoggedIn) {
      setAirdrops([]);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("airdrops").select("*");
      if (cancelled) return;

      if (error) {
        console.error("Failed to load airdrops:", error);
        return;
      }
      setAirdrops((data || []).map(airdropRowToItem));
    })();

    return () => { cancelled = true; };
  }, [authReady, isLoggedIn]);

  const createAirdropCampaign = async (airdrop: Omit<Airdrop, "id">) => {
    const newAirdrop = buildAirdrop(airdrop);

    if (USE_MOCK_DATA) {
      saveMockAirdrop(newAirdrop);
      setAirdrops(getMockAirdrops());
      return newAirdrop;
    }

    const { error } = await supabase.from("airdrops").insert(airdropToRow(newAirdrop));
    if (error) throw error;
    setAirdrops(prev => [newAirdrop, ...prev]);
    return newAirdrop;
  };

  const updateAirdropCampaign = async (airdrop: Airdrop) => {
    const updated = normalizeAirdrop(airdrop, airdrop.id);

    if (USE_MOCK_DATA) {
      saveMockAirdrop(updated);
      setAirdrops(getMockAirdrops());
      return updated;
    }

    const { error } = await supabase.from("airdrops").update(airdropToRow(updated)).eq("id", updated.id);
    if (error) throw error;
    setAirdrops(prev => prev.map(item => item.id === updated.id ? updated : item));
    return updated;
  };

  const deleteAirdropCampaign = async (airdropId: string) => {
    if (USE_MOCK_DATA) {
      deleteMockAirdrop(airdropId);
      setAirdrops(getMockAirdrops());
      return;
    }

    const { error } = await supabase.from("airdrops").delete().eq("id", airdropId);
    if (error) throw error;
    setAirdrops(prev => prev.filter(item => item.id !== airdropId));
  };

  return { airdrops, createAirdropCampaign, updateAirdropCampaign, deleteAirdropCampaign };
}