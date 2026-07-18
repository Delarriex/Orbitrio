import { useState, useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { KycSubmission, KycStatus } from "../../types";
import { USE_MOCK_DATA } from "../../services";

function rowToKyc(row: any): KycSubmission {
  return {
    idType: row.id_type,
    documentType: row.document_type,
    idNumber: row.id_number,
    dob: row.dob,
    address: row.address,
    city: row.city,
    country: row.country,
    frontImage: row.front_image,
    backImage: row.back_image,
    proofOfAddressImage: row.proof_of_address_image,
    submissionDate: row.submission_date,
    status: row.status,
    adminNotes: row.admin_notes,
    rejectionReason: row.rejection_reason,
    reviewedAt: row.reviewed_at
  };
}

function kycToRow(kyc: KycSubmission, userId: string): Record<string, any> {
  const documentType = kyc.documentType || kyc.idType || "Government ID";
  return {
    user_id: userId,
    id_type: kyc.idType || documentType,
    document_type: documentType,
    id_number: kyc.idNumber,
    dob: kyc.dob,
    address: kyc.address,
    city: kyc.city,
    country: kyc.country,
    front_image: kyc.frontImage,
    back_image: kyc.backImage,
    proof_of_address_image: kyc.proofOfAddressImage,
    submission_date: kyc.submissionDate || new Date().toISOString(),
    status: kyc.status || "pending",
    admin_notes: kyc.adminNotes || "",
    rejection_reason: kyc.rejectionReason || ""
  };
}

/**
 * KYC submissions — self-contained, no balance/transaction coupling.
 * Backed entirely by Supabase's `kyc_submissions` table. No Firebase.
 */
export function useKyc(supabase: SupabaseClient, authReady: boolean, currentUserId: string | null, isAdmin: boolean) {
  const [myKyc, setMyKyc] = useState<KycSubmission | null>(null);
  const [allKycSubmissions, setAllKycSubmissions] = useState<Record<string, KycSubmission>>({});

  useEffect(() => {
    if (USE_MOCK_DATA || !authReady || !currentUserId) {
      setMyKyc(null);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("kyc_submissions")
        .select("*")
        .eq("user_id", currentUserId)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        console.error("Failed to load KYC submission:", error);
        return;
      }
      setMyKyc(data ? rowToKyc(data) : null);
    })();

    return () => { cancelled = true; };
  }, [authReady, currentUserId]);

  useEffect(() => {
    if (USE_MOCK_DATA || !authReady || !isAdmin) {
      setAllKycSubmissions({});
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("kyc_submissions").select("*, users!inner(email)");
      if (cancelled) return;
      if (error) {
        console.error("Failed to load KYC submissions for admin:", error);
        return;
      }
      const map: Record<string, KycSubmission> = {};
      (data || []).forEach((row: any) => {
        const email = row.users?.email;
        if (email) map[email] = rowToKyc(row);
      });
      setAllKycSubmissions(map);
    })();

    return () => { cancelled = true; };
  }, [authReady, isAdmin]);

  const submitMyKyc = async (userId: string, kyc: KycSubmission): Promise<KycSubmission> => {
    const payload = { ...kyc, status: "pending" as KycStatus, submissionDate: new Date().toISOString(), adminNotes: "", rejectionReason: "" };
    const { error } = await supabase
      .from("kyc_submissions")
      .upsert(kycToRow(payload, userId), { onConflict: "user_id" });
    if (error) throw error;
    setMyKyc(payload);
    return payload;
  };

  const adminReviewKycByEmail = async (
    email: string,
    userId: string,
    status: Extract<KycStatus, "approved" | "rejected">,
    adminNotes = ""
  ): Promise<KycSubmission> => {
    const { data: current, error: fetchError } = await supabase
      .from("kyc_submissions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!current) throw new Error(`No KYC submission found for ${email}`);

    const reviewed: KycSubmission = {
      ...rowToKyc(current),
      status,
      adminNotes,
      rejectionReason: status === "rejected" ? adminNotes : "",
      reviewedAt: new Date().toISOString()
    };

    const { error } = await supabase
      .from("kyc_submissions")
      .update({
        status: reviewed.status,
        admin_notes: reviewed.adminNotes,
        rejection_reason: reviewed.rejectionReason,
        reviewed_at: reviewed.reviewedAt
      })
      .eq("user_id", userId);
    if (error) throw error;

    setAllKycSubmissions(prev => ({ ...prev, [email]: reviewed }));
    return reviewed;
  };

  return { myKyc, allKycSubmissions, submitMyKyc, adminReviewKycByEmail };
}