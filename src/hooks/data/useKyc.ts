import { useState, useEffect, useCallback, useRef } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { KycSubmission, KycStatus } from "../../types";
import { USE_MOCK_DATA } from "../../services";
import { rowToKyc, saveKycSubmission, reviewKycSubmission, kycErrorMessage } from "../../services/kycService";

export function useKyc(supabase: SupabaseClient, authReady: boolean, currentUserId: string | null, isAdmin: boolean) {
  const [state, setState] = useState<{ scope: string; myKyc: KycSubmission | null; all: Record<string, KycSubmission>; loading: boolean; error: string | null }>({ scope: "", myKyc: null, all: {}, loading: true, error: null });
  const scope = `${currentUserId || ""}:${isAdmin}`;
  const generation = useRef(0);
  const scopeRef = useRef(scope);
  scopeRef.current = scope;
  const refreshKyc = useCallback(async () => {
    const request = ++generation.current;
    if (!authReady || !currentUserId || USE_MOCK_DATA) {
      setState({ scope, myKyc: null, all: {}, loading: false, error: USE_MOCK_DATA ? "KYC testing requires mock data to be disabled." : null });
      return;
    }
    setState(prev => ({ ...(prev.scope === scope ? prev : { scope, myKyc: null, all: {} }), loading: true, error: null }));
    try {
      const { data, error } = isAdmin
        ? await supabase.from("kyc_submissions").select("*, users!inner(email)")
        : await supabase.from("kyc_submissions").select("*").eq("user_id", currentUserId);
      if (error) throw error;
      if (request !== generation.current || scopeRef.current !== scope) return;
      const all: Record<string, KycSubmission> = {};
      for (const row of data || []) if (row.users?.email) all[row.users.email] = rowToKyc(row);
      const own = data?.find(row => row.user_id === currentUserId);
      setState({ scope, myKyc: own ? rowToKyc(own) : null, all, loading: false, error: null });
    } catch (error) {
      if (request === generation.current && scopeRef.current === scope) setState(prev => ({ ...prev, loading: false, error: kycErrorMessage(error, "Unable to load KYC. Please retry.") }));
    }
  }, [supabase, authReady, currentUserId, isAdmin, scope]);
  useEffect(() => { void refreshKyc(); return () => { generation.current++; }; }, [refreshKyc]);

  const submitMyKyc = async (userId: string, kyc: KycSubmission) => {
    if (!authReady || !currentUserId || currentUserId !== userId) throw new Error("Please sign in before submitting.");
    const payload = await saveKycSubmission(supabase, userId, kyc);
    if (scopeRef.current === scope) {
      generation.current++;
      setState(prev => ({ ...prev, scope, myKyc: payload, loading: false, error: null }));
    }
    return payload;
  };
  const adminReviewKycByEmail = async (email: string, userId: string, status: Extract<KycStatus, "approved" | "rejected">, notes = "", revision: number) => {
    if (!authReady || !isAdmin) throw new Error("Admin access is required.");
    const reviewed = await reviewKycSubmission(supabase, userId, status, notes, revision);
    if (scopeRef.current === scope) {
      generation.current++;
      setState(prev => ({ ...prev, all: { ...prev.all, [email]: reviewed }, loading: false, error: null }));
    }
    return reviewed;
  };
  const matches = state.scope === scope;
  return { myKyc: matches ? state.myKyc : null, allKycSubmissions: matches ? state.all : {}, kycLoading: !matches || state.loading, kycError: matches ? state.error : null, refreshKyc, submitMyKyc, adminReviewKycByEmail };
}
