import React, { useState } from "react";
import { FileImage, Loader2 } from "lucide-react";
import type { Transaction } from "../../types";
import { useSupabaseClient } from "../../lib/supabase";
import { GIFT_CARD_BUCKET } from "../../services/giftCardService";

export function DepositProofViewer({ transaction }: { transaction: Transaction }) {
  const supabase = useSupabaseClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);
  const [error, setError] = useState("");
  const giftCard = transaction.paymentMethod === "gift_card";
  const paths = giftCard ? transaction.giftCardImagePaths || [] : transaction.proofFile ? [transaction.proofFile] : [];
  if (!paths.length) return <span className="text-[10px] text-orbit-gray-text">No images attached</span>;

  const load = async () => {
    setOpen(true); setBusy(true); setError(""); setUrls([]);
    try {
      // Only sign object paths in this user's folder. Never fetch arbitrary
      // external URLs from legacy or untrusted transaction fields.
      if (!transaction.userId || paths.some(path => !path.startsWith(`${transaction.userId}/`) || path.includes(".."))) {
        throw new Error("This older record has no accessible uploaded image.");
      }
      const { data, error: storageError } = await supabase.storage
        .from(giftCard ? GIFT_CARD_BUCKET : "deposit-proofs")
        .createSignedUrls(paths, 300);
      if (storageError) throw storageError;
      if (!data?.length || data.some(item => item.error || !item.signedUrl)) throw new Error("Some images could not be loaded. Please retry.");
      setUrls(data.map(item => item.signedUrl));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load images. Please retry.");
    } finally {
      setBusy(false);
    }
  };

  return <div className="mt-2 space-y-2">
    <button type="button" disabled={busy} onClick={() => open ? (setOpen(false), setUrls([])) : void load()} className="flex items-center gap-1 text-[11px] font-bold text-orbit-accent disabled:opacity-50">
      {busy ? <Loader2 size={12} className="animate-spin" /> : <FileImage size={12} />}
      {open ? "Hide images" : `View ${paths.length} image${paths.length === 1 ? "" : "s"}`}
    </button>
    {open && <div className="w-60 space-y-2 rounded-lg border border-orbit-border bg-orbit-bg p-2">
      {busy && <p role="status" className="text-xs text-orbit-gray-text">Loading images…</p>}
      {error && <p role="alert" className="text-xs text-orbit-red">{error}</p>}
      {urls.map((url, index) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block text-[10px] text-orbit-accent">
        <img src={url} alt={`${giftCard ? "Gift card" : "Deposit proof"} image ${index + 1}`} referrerPolicy="no-referrer" onError={() => setError("An image failed to load or its link expired. Refresh images to retry.")} className="mb-1 h-32 w-full rounded object-contain" />
        Open image {index + 1} full size
      </a>)}
      {!busy && <button type="button" onClick={load} className="text-[10px] text-orbit-accent underline">Refresh images</button>}
    </div>}
  </div>;
}
