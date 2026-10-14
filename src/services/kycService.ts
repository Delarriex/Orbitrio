import type { SupabaseClient } from "@supabase/supabase-js";
import type { KycSubmission } from "../types";

export const KYC_DOCUMENT_TYPES = ["Government ID", "Passport", "Driver's License"] as const;
export const KYC_BUCKET = "kyc-documents";
export const KYC_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_KYC_IMAGE_BYTES = 5 * 1024 * 1024;
export const KYC_LINK_SECONDS = 300;
export type KycImageSlot = "frontImage" | "backImage" | "proofOfAddressImage";
export type KycFiles = Record<KycImageSlot, File | null>;
export const needsBackImage = (documentType: string) => documentType !== "Passport";
export const kycErrorMessage = (error: unknown, fallback: string) =>
  error && typeof error === "object" && "message" in error && typeof error.message === "string" ? error.message : fallback;

export function validateKycFile(file: File): string | null {
  return !KYC_IMAGE_TYPES.includes(file.type) || !file.size || file.size > MAX_KYC_IMAGE_BYTES
    ? "Choose a non-empty JPG, PNG or WebP image no larger than 5 MB." : null;
}

export function validateKycSubmission(kyc: KycSubmission): string | null {
  const type = kyc.documentType || kyc.idType;
  if (!(KYC_DOCUMENT_TYPES as readonly string[]).includes(type)) return "Choose a valid document type.";
  for (const [label, value, max] of [["Document number", kyc.idNumber, 100], ["Address", kyc.address, 500], ["City", kyc.city, 120], ["Country", kyc.country, 120]] as const) {
    if (!value?.trim() || value.trim().length > max) return `${label} is required and must be at most ${max} characters.`;
  }
  const dob = new Date(`${kyc.dob}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(kyc.dob) || !Number.isFinite(dob.getTime()) || dob.toISOString().slice(0, 10) !== kyc.dob || kyc.dob > new Date().toISOString().slice(0, 10)) return "Enter a valid date of birth that is not in the future.";
  return null;
}

export function isKycPath(path: string, ownerId: string): boolean {
  return !!ownerId && /^[A-Za-z0-9_-]+$/.test(ownerId) && path.startsWith(`${ownerId}/`)
    && /^[A-Za-z0-9_-]+\/[0-9a-f-]+\.(jpg|png|webp)$/.test(path);
}

export async function uploadKycImage(client: SupabaseClient, ownerId: string, file: File): Promise<string> {
  if (!/^[A-Za-z0-9_-]+$/.test(ownerId)) throw new Error("Please sign in before uploading documents.");
  const invalid = validateKycFile(file);
  if (invalid) throw new Error(invalid);
  // Catch renamed documents before storage; bucket limits enforce type/size too.
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const validSignature = file.type === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : file.type === "image/png" ? [137,80,78,71,13,10,26,10].every((b, i) => bytes[i] === b)
    : String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!validSignature) throw new Error("This file does not match its image format. Export it as JPG, PNG or WebP and retry.");
  const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const path = `${ownerId}/${crypto.randomUUID()}.${extension}`;
  const { data, error } = await client.storage.from(KYC_BUCKET).upload(path, file, { upsert: false, contentType: file.type, cacheControl: "60" });
  if (error) throw new Error(`Image upload failed: ${kycErrorMessage(error, "Please retry.")}`);
  if (data?.path !== path) throw new Error("Storage did not confirm the uploaded image. Please retry.");
  return path;
}

// Per-form cache retains successful uploads after a partial upload or save failure.
// Never delete on a network error: the database may have committed the submission.
export class KycUploadBatch {
  private uploaded = new Map<File, string>();
  constructor(private client: SupabaseClient, private ownerId: string) {}
  async upload(files: KycFiles, documentType: string, progress: (message: string) => void = () => {}): Promise<Record<KycImageSlot, string>> {
    if (!files.frontImage || (needsBackImage(documentType) && !files.backImage)) throw new Error("Attach all required identity images before submitting.");
    const selected = { ...files, backImage: needsBackImage(documentType) ? files.backImage : null };
    for (const file of Object.values(selected)) if (file) {
      const error = validateKycFile(file);
      if (error) throw new Error(error);
    }
    const result = { frontImage: "", backImage: "", proofOfAddressImage: "" };
    const labels = { frontImage: "identity image", backImage: "back of identity document", proofOfAddressImage: "proof of address" };
    for (const slot of Object.keys(selected) as KycImageSlot[]) {
      const file = selected[slot];
      if (!file) continue;
      progress(`Uploading ${labels[slot]}…`);
      let path = this.uploaded.get(file);
      if (!path) {
        path = await uploadKycImage(this.client, this.ownerId, file);
        this.uploaded.set(file, path);
      }
      result[slot] = path;
    }
    return result;
  }
}

export async function signKycImage(client: SupabaseClient, ownerId: string, path: string) {
  if (!isKycPath(path, ownerId)) throw new Error("This record has no valid private image path. Request a new submission.");
  const expiresAt = Date.now() + (KYC_LINK_SECONDS - 5) * 1000;
  const { data, error } = await client.storage.from(KYC_BUCKET).createSignedUrl(path, KYC_LINK_SECONDS);
  if (error) throw new Error(kycErrorMessage(error, "Unable to load this image."));
  if (!data?.signedUrl || Date.now() >= expiresAt) throw new Error("The image link could not be loaded. Please retry.");
  return { url: data.signedUrl, expiresAt };
}

export function rowToKyc(row: any): KycSubmission {
  return {
    idType: row.id_type, documentType: row.document_type, idNumber: row.id_number,
    dob: row.dob, address: row.address, city: row.city, country: row.country,
    frontImage: row.front_image || "", backImage: row.back_image || "",
    proofOfAddressImage: row.proof_of_address_image || "", submissionDate: row.submission_date,
    status: row.status, adminNotes: row.admin_notes, rejectionReason: row.rejection_reason,
    reviewedAt: row.reviewed_at, revision: row.revision ?? 0
  };
}

export async function saveKycSubmission(client: SupabaseClient, userId: string, kyc: KycSubmission): Promise<KycSubmission> {
  const invalid = validateKycSubmission(kyc);
  if (invalid) throw new Error(invalid);
  const type = kyc.documentType || kyc.idType;
  if (!isKycPath(kyc.frontImage, userId) || (needsBackImage(type) && !isKycPath(kyc.backImage, userId)) || (kyc.proofOfAddressImage && !isKycPath(kyc.proofOfAddressImage, userId))) throw new Error("Upload the required images before submitting verification.");
  const { data, error } = await client.from("kyc_submissions").upsert({
    user_id: userId, id_type: type, document_type: type, id_number: kyc.idNumber.trim(), dob: kyc.dob,
    address: kyc.address.trim(), city: kyc.city.trim(), country: kyc.country.trim(),
    front_image: kyc.frontImage, back_image: needsBackImage(type) ? kyc.backImage : "",
    proof_of_address_image: kyc.proofOfAddressImage || "", status: "pending",
    admin_notes: "", rejection_reason: "", reviewed_at: null, reviewed_by: null
  }, { onConflict: "user_id" }).select("*").single();
  if (error) throw error;
  if (!data) throw new Error("Submission could not be confirmed. Refresh your status before retrying.");
  return rowToKyc(data);
}

export async function reviewKycSubmission(client: SupabaseClient, userId: string, status: "approved" | "rejected", notes: string, revision: number): Promise<KycSubmission> {
  if (!Number.isInteger(revision) || revision < 0) throw new Error("Refresh the submission before reviewing.");
  if (status === "rejected" && !notes.trim()) throw new Error("Enter a reason for rejection.");
  const { data, error } = await client.rpc("review_kyc_submission", {
    p_user_id: userId, p_status: status, p_notes: notes.trim(), p_expected_revision: revision
  });
  if (error) throw error;
  if (!data) throw new Error("Review could not be confirmed. Refresh the list.");
  return rowToKyc(data);
}
