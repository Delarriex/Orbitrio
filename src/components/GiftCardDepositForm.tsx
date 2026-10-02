import React, { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Gift, Loader2, CloudUpload, ChevronsUpDown, X } from "lucide-react";
import { useOrbit } from "../context/OrbitContext";
import { useSupabaseClient } from "../lib/supabase";
import { proofErrorMessage } from "../services/depositProofService";
import { GIFT_CARD_BRANDS, GIFT_CARD_IMAGE_TYPES, MAX_GIFT_CARD_IMAGES, MAX_GIFT_CARD_IMAGE_BYTES, uploadGiftCardImage, validateGiftCard } from "../services/giftCardService";

const fieldClass = "w-full min-w-0 bg-orbit-bg border border-orbit-border focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:outline-none rounded-xl px-4 py-3.5 text-base text-orbit-white transition-colors";
const labelClass = "block min-w-0 space-y-2 text-sm font-semibold text-orbit-white";
const sectionClass = "rounded-2xl border border-orbit-border bg-orbit-card p-4 sm:p-6 shadow-sm";
const headingClass = "mb-5 border-b border-orbit-border pb-4 text-base font-bold text-orbit-white";

export function GiftCardDepositForm({ onBusyChange, onSelectCrypto }: {
  onBusyChange?: (busy: boolean) => void;
  onSelectCrypto: () => void;
}) {
  const { deposit } = useOrbit();
  const { user } = useUser();
  const supabase = useSupabaseClient();
  const [brand, setBrand] = useState<string>(GIFT_CARD_BRANDS[0]);
  const [faceValue, setFaceValue] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [amount, setAmount] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null);
  const submitting = useRef(false);
  // Reuse completed uploads when a later upload or the database insert fails.
  const uploaded = useMemo(() => new Map<File, string>(), [supabase, user?.id]);

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
        let path = uploaded.get(file);
        if (!path) {
          path = await uploadGiftCardImage(supabase, user.id, file);
          uploaded.set(file, path);
        }
        imagePaths.push(path);
      }
      const success = await deposit(Number(amount), `Gift card — ${details.brand}`, undefined, undefined, { details, imagePaths });
      if (!success) throw new Error("Your request could not be saved. Your details are still here; please try again.");
      setFeedback({ error: false, message: "Gift card submitted. Your deposit is pending admin review; your balance will update only after approval." });
      setBrand(GIFT_CARD_BRANDS[0]); setFaceValue(""); setAmount(""); setFiles([]);
      uploaded.clear();
    } catch (error) {
      setFeedback({ error: true, message: proofErrorMessage(error, "Unable to upload or save your gift card. Please try again.") });
    } finally {
      submitting.current = false;
      setBusy(false);
      onBusyChange?.(false);
    }
  };

  return (
    <form onSubmit={submit} className="min-w-0 space-y-4 [overflow-wrap:anywhere]">
      {feedback && <p role={feedback.error ? "alert" : "status"} className={`rounded-xl border p-3 text-xs ${feedback.error ? "border-orbit-red/30 bg-orbit-red/10 text-orbit-red" : "border-orbit-green/30 bg-orbit-green/10 text-orbit-green"}`}>{feedback.message}</p>}
      <fieldset disabled={busy} className="min-w-0 space-y-5 disabled:opacity-60">
        <section className={sectionClass}>
          <h3 className={headingClass}>Deposit Details</h3>
          <div className="space-y-5">
            <label className={labelClass}>
              <span>Amount (USD)</span>
              <input required type="number" min="0.01" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} placeholder="Enter amount" className={fieldClass} />
            </label>
            <label className={labelClass}>
              <span>Payment Method</span>
              <div className="relative">
                <select aria-label="Payment Method" value="gift_card" onChange={event => { if (event.target.value === "crypto") onSelectCrypto(); }} className={`${fieldClass} appearance-none pr-10 cursor-pointer`}>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="gift_card">Gift Card</option>
                </select>
                <ChevronsUpDown size={16} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-orbit-gray-text" />
              </div>
            </label>
          </div>
        </section>

        <section className={sectionClass}>
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-sm"><Gift size={24} aria-hidden="true" /></div>
          <h3 className={headingClass}>Gift Card Details</h3>
          <label className={labelClass}>
            <span>Gift Card Type</span>
            <div className="relative">
              <select aria-label="Gift Card Type" required value={brand} onChange={event => setBrand(event.target.value)} className={`${fieldClass} appearance-none pr-10 cursor-pointer border-emerald-500/60`}>
                {GIFT_CARD_BRANDS.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
              <ChevronsUpDown size={16} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-orbit-gray-text" />
            </div>
          </label>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className={labelClass}><span>Card face value</span><input required type="number" min="0.01" step="0.01" value={faceValue} onChange={event => setFaceValue(event.target.value)} placeholder="100.00" className={fieldClass} /></label>
            <label className={labelClass}><span>Card currency</span><input required maxLength={3} pattern="[A-Za-z]{3}" value={currency} onChange={event => setCurrency(event.target.value.toUpperCase())} placeholder="USD" className={fieldClass} /></label>
          </div>
        </section>

        <section className={sectionClass}>
          <h3 className={headingClass}>Upload Proof</h3>
          <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-orbit-border bg-orbit-bg px-4 py-6 text-center text-sm text-orbit-gray-text transition-colors hover:border-emerald-500 focus-within:border-emerald-500">
            <CloudUpload size={36} aria-hidden="true" className="text-emerald-500" />
            <span>{files.length ? `Add more proof (${files.length}/${MAX_GIFT_CARD_IMAGES})` : "Click to upload proof (jpg, jpeg, png, webp)"}</span>
            <input aria-label="Upload gift card images" type="file" multiple accept={GIFT_CARD_IMAGE_TYPES.join(",")} onChange={chooseFiles} className="sr-only" disabled={busy || files.length >= MAX_GIFT_CARD_IMAGES} />
          </label>
          <p className="mt-3 text-xs leading-relaxed text-orbit-gray-text">Up to 4 images, 5 MB each. Only you and admins can view your uploads.</p>
          {files.length > 0 && <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {files.map((file, index) => <div key={`${file.name}-${index}`} className="relative min-w-0 rounded-xl border border-orbit-border px-2 pb-2 pt-12">
              {previews[index] && <img src={previews[index]} alt={`Selected gift card image ${index + 1}`} className="h-28 w-full rounded-lg object-contain" />}
              <p className="mt-2 break-words text-xs text-orbit-gray-text">{file.name}</p>
              <button type="button" aria-label={`Remove image ${index + 1}`} onClick={() => setFiles(current => current.filter((_, i) => i !== index))} className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full bg-orbit-bg p-2 text-orbit-white"><X size={14} /></button>
            </div>)}
          </div>}
          <button type="submit" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-orbit-accent px-4 py-4 text-sm font-bold text-orbit-bg transition-colors hover:bg-orbit-accent-hover disabled:opacity-50" disabled={busy}>
            {busy && <Loader2 size={16} className="animate-spin" />}{busy ? "Submitting gift card…" : "Confirm Deposit"}
          </button>
          <p className="mt-3 text-center text-xs leading-relaxed text-orbit-gray-text">Your card and USD amount will be verified before your deposit is approved.</p>
        </section>
      </fieldset>
    </form>
  );
}
