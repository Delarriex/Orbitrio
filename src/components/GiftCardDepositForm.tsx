import React, { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Gift, Loader2, Upload, X } from "lucide-react";
import { useOrbit } from "../context/OrbitContext";
import { useSupabaseClient } from "../lib/supabase";
import { GIFT_CARD_IMAGE_TYPES, MAX_GIFT_CARD_IMAGES, MAX_GIFT_CARD_IMAGE_BYTES, uploadGiftCardImage, validateGiftCard } from "../services/giftCardService";

const fieldClass = "w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent rounded-xl px-3 py-2.5 text-xs text-orbit-white";
const labelClass = "block space-y-1.5 text-xs text-orbit-gray-text";

export function GiftCardDepositForm({ onBusyChange }: { onBusyChange?: (busy: boolean) => void }) {
  const { deposit } = useOrbit();
  const { user } = useUser();
  const supabase = useSupabaseClient();
  const [brand, setBrand] = useState("");
  const [faceValue, setFaceValue] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [amount, setAmount] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null);
  const submitting = useRef(false);
  // Reuse completed uploads when a later upload or the database insert fails.
  const uploaded = useRef(new Map<File, string>());

  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [files]);

  const chooseFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = [...files, ...Array.from(event.target.files || [])];
    event.target.value = "";
    if (next.length > MAX_GIFT_CARD_IMAGES || next.some(file => !GIFT_CARD_IMAGE_TYPES.includes(file.type) || !file.size || file.size > MAX_GIFT_CARD_IMAGE_BYTES)) {
      setFeedback({ error: true, message: "Choose up to 4 JPG, PNG or WebP images, each no larger than 5 MB." });
      return;
    }
    setFiles(next);
    setFeedback(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting.current) return;
    const details = { brand: brand.trim(), faceValue: Number(faceValue), currency: currency.trim().toUpperCase() };
    const validation = validateGiftCard(details, Number(amount), files);
    if (validation || !user?.id) {
      setFeedback({ error: true, message: validation || "Please sign in before submitting a gift card." });
      return;
    }
    submitting.current = true;
    setBusy(true);
    onBusyChange?.(true);
    setFeedback(null);
    try {
      const imagePaths: string[] = [];
      for (const file of files) {
        let path = uploaded.current.get(file);
        if (!path) {
          path = await uploadGiftCardImage(supabase, user.id, file);
          uploaded.current.set(file, path);
        }
        imagePaths.push(path);
      }
      const success = await deposit(Number(amount), `Gift card — ${details.brand}`, undefined, undefined, { details, imagePaths });
      if (!success) throw new Error("Your request could not be saved. Your details are still here; please try again.");
      setFeedback({ error: false, message: "Gift card submitted. Your deposit is pending admin review; your balance will update only after approval." });
      setBrand(""); setFaceValue(""); setAmount(""); setFiles([]);
      uploaded.current.clear();
    } catch (error) {
      setFeedback({ error: true, message: error instanceof Error ? error.message : "Unable to upload or save your gift card. Please try again." });
    } finally {
      submitting.current = false;
      setBusy(false);
      onBusyChange?.(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-bold text-orbit-white"><Gift size={18} className="text-orbit-accent" /> Gift card deposit</h3>
        <p className="mt-1 text-xs text-orbit-gray-text">Enter your card details and upload clear photos. An admin will check the card and requested USD amount before approving your deposit.</p>
      </div>
      {feedback && <p role={feedback.error ? "alert" : "status"} className={`rounded-xl border p-3 text-xs ${feedback.error ? "border-orbit-red/30 bg-orbit-red/10 text-orbit-red" : "border-orbit-green/30 bg-orbit-green/10 text-orbit-green"}`}>{feedback.message}</p>}
      <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
        <label className={labelClass}><span>Gift card brand</span><input required maxLength={80} value={brand} onChange={event => setBrand(event.target.value)} placeholder="Enter the brand shown on the card" className={fieldClass} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}><span>Card face value</span><input required type="number" min="0.01" step="0.01" value={faceValue} onChange={event => setFaceValue(event.target.value)} placeholder="100.00" className={fieldClass} /></label>
          <label className={labelClass}><span>Card currency</span><input required maxLength={3} pattern="[A-Za-z]{3}" value={currency} onChange={event => setCurrency(event.target.value.toUpperCase())} placeholder="USD" className={fieldClass} /></label>
        </div>
        <label className={labelClass}><span>Requested deposit (USD)</span><input required type="number" min="0.01" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} placeholder="Enter the USD amount to request" className={fieldClass} /><span className="block text-[11px]">This amount is subject to verification. Card face value is not automatically converted or credited.</span></label>
        <div className="space-y-2">
          <p className="text-xs text-orbit-gray-text">Gift card images (required)</p>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-orbit-border bg-orbit-bg p-4 text-xs text-orbit-white hover:border-orbit-accent focus-within:border-orbit-accent">
            <Upload size={16} /> Add images ({files.length}/{MAX_GIFT_CARD_IMAGES})
            <input aria-label="Upload gift card images" type="file" multiple accept={GIFT_CARD_IMAGE_TYPES.join(",")} onChange={chooseFiles} className="sr-only" disabled={busy || files.length >= MAX_GIFT_CARD_IMAGES} />
          </label>
          <p className="text-[11px] text-orbit-gray-text">JPG, PNG or WebP, up to 5 MB each. Images are private to you and admins.</p>
          <div className="grid grid-cols-2 gap-3">
            {files.map((file, index) => <div key={`${file.name}-${index}`} className="relative rounded-xl border border-orbit-border p-2">
              {previews[index] && <img src={previews[index]} alt={`Selected gift card image ${index + 1}`} className="h-28 w-full rounded-lg object-contain" />}
              <p className="mt-1 truncate text-[10px] text-orbit-gray-text">{file.name}</p>
              <button type="button" aria-label={`Remove image ${index + 1}`} onClick={() => setFiles(current => current.filter((_, i) => i !== index))} className="absolute right-1 top-1 rounded-full bg-orbit-bg p-1 text-orbit-white"><X size={14} /></button>
            </div>)}
          </div>
        </div>
        <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-orbit-accent px-4 py-3 text-xs font-bold text-orbit-bg disabled:opacity-50" disabled={busy}>
          {busy && <Loader2 size={16} className="animate-spin" />}{busy ? "Submitting gift card…" : "Submit for review"}
        </button>
      </fieldset>
    </form>
  );
}
