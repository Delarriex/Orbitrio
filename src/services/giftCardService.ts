import type { SupabaseClient } from "@supabase/supabase-js";
import type { GiftCardDetails } from "../types";

export const GIFT_CARD_BUCKET = "gift-card-proofs";
export const MAX_GIFT_CARD_IMAGES = 4;
export const MAX_GIFT_CARD_IMAGE_BYTES = 5 * 1024 * 1024;
export const GIFT_CARD_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateGiftCard(details: GiftCardDetails, amount: number, files: File[]): string | null {
  if (!details.brand.trim() || details.brand.trim().length > 80) return "Enter the gift card brand (up to 80 characters).";
  if (!Number.isFinite(details.faceValue) || details.faceValue <= 0) return "Enter a valid card face value.";
  if (!/^[A-Z]{3}$/.test(details.currency)) return "Enter the card's three-letter currency code, such as USD, GBP or EUR.";
  if (!Number.isFinite(amount) || amount <= 0) return "Enter a valid requested deposit amount in USD.";
  if (files.length < 1 || files.length > MAX_GIFT_CARD_IMAGES) return `Upload between 1 and ${MAX_GIFT_CARD_IMAGES} gift card images.`;
  if (files.some(file => !GIFT_CARD_IMAGE_TYPES.includes(file.type))) return "Use JPG, PNG or WebP images only.";
  if (files.some(file => file.size === 0 || file.size > MAX_GIFT_CARD_IMAGE_BYTES)) return "Each image must be non-empty and no larger than 5 MB.";
  return null;
}

export async function uploadGiftCardImage(supabase: SupabaseClient, userId: string, file: File): Promise<string> {
  if (!userId) throw new Error("Sign in before uploading images.");
  if (!GIFT_CARD_IMAGE_TYPES.includes(file.type) || !file.size || file.size > MAX_GIFT_CARD_IMAGE_BYTES) {
    throw new Error("Use JPG, PNG or WebP images no larger than 5 MB.");
  }
  const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(GIFT_CARD_BUCKET).upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return path;
}
