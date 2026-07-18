import { useState, useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AirdropClaim } from "../../types";
import { USE_MOCK_DATA } from "../../services";

function rowToClaim(row: any): AirdropClaim {
  return {
    id: row.id,
    userEmail: row.users?.email || "",
    userName: row.users?.name || undefined,
    airdropId: row.airdrop_id,
    campaignTitle: row.campaign_title || undefined,
    token: row.token,
    rewardAmount: row.reward_amount,
    status: row.status,
    date: (row.created_at || "").split("T")[0],
    reviewedAt: row.reviewed_at || undefined,
    adminNotes: row.admin_notes || undefined,
    payoutTransactionId: row.payout_transaction_id || undefined
  };
}

/**
 * Airdrop claims (as opposed to airdrop campaigns, see useAirdrops.ts).
 * Backed entirely by Supabase's `airdrop_claims` table. Submitting a claim
 * is a plain RLS-gated insert (no balance involved). Approve/reject go
 * through security-definer RPCs — approval atomically credits the
 * claimant's balance and records a payout transaction.
 *
 * RLS restricts a non-admin caller to only their own claims; an admin
 * caller sees all of them — so this single query works for both without
 * a client-side filter.
 */
export function useAirdropClaims(
  supabase: SupabaseClient,
  authReady: boolean,
  currentUserId: string | null,
  isAdmin: boolean
) {
  const [claims, setClaims] = useState<AirdropClaim[]>([]);

  const refreshClaims = async () => {
    if (!currentUserId) {
      setClaims([]);
      return;
    }
    const { data, error } = await supabase
      .from("airdrop_claims")
      .select("*, users(name, email)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load airdrop claims:", error);
      return;
    }
    setClaims((data || []).map(rowToClaim));
  };

  useEffect(() => {
    if (USE_MOCK_DATA || !authReady || !currentUserId) {
      setClaims([]);
      return;
    }
    refreshClaims();
  }, [authReady, currentUserId, isAdmin]);

  const submitClaim = async (
    id: string,
    userId: string,
    airdropId: string,
    token: string,
    rewardAmount: string,
    campaignTitle?: string
  ) => {
    const { error } = await supabase.from("airdrop_claims").insert({
      id,
      user_id: userId,
      airdrop_id: airdropId,
      campaign_title: campaignTitle || null,
      token,
      reward_amount: rewardAmount,
      status: "Pending"
    });
    if (error) throw error;
    await refreshClaims();
  };

  const approveClaim = async (claimId: string) => {
    const { error } = await supabase.rpc("approve_airdrop_claim", { p_claim_id: claimId });
    if (error) throw error;
    await refreshClaims();
  };

  const rejectClaim = async (claimId: string, adminNotes = "Rejected by admin.") => {
    const { error } = await supabase.rpc("reject_airdrop_claim", { p_claim_id: claimId, p_admin_notes: adminNotes });
    if (error) throw error;
    await refreshClaims();
  };

  return { claims, submitClaim, approveClaim, rejectClaim, refreshClaims };
}
