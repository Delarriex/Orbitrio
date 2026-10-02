import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { PROOF_IMAGE_TYPES } from "../services/depositProofService";

export function DepositProofInput({ file, onChange, disabled }: {
  file: File | null; onChange: (file: File | null) => void; disabled: boolean;
}) {
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (!file || !PROOF_IMAGE_TYPES.includes(file.type)) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return <div className="min-w-0 space-y-2 [overflow-wrap:anywhere]">
    <label className="block cursor-pointer space-y-2 rounded-xl border-2 border-dashed border-orbit-border bg-orbit-bg p-4 text-sm text-orbit-gray-text focus-within:border-orbit-accent">
      <span className="block font-semibold text-orbit-white">Transaction Receipt</span>
      <span className="block">{file ? "Change attached proof" : "Upload transfer receipt or block explorer snapshot"}</span>
      <span className="block text-xs">JPG, PNG or WebP, up to 5 MB.</span>
      <input type="file" aria-label="Upload deposit proof" accept={PROOF_IMAGE_TYPES.join(",")} disabled={disabled}
        className="sr-only" onChange={event => {
          const next = event.target.files?.[0];
          if (next) onChange(next);
          event.target.value = "";
        }} />
    </label>
    {file && <div className="relative rounded-xl border border-orbit-border px-3 pb-3 pt-12">
      <button type="button" aria-label="Remove deposit proof" disabled={disabled} onClick={() => onChange(null)}
        className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full text-orbit-white hover:bg-orbit-border disabled:opacity-50"><X size={18} /></button>
      {preview && <img src={preview} alt="Selected deposit proof" className="h-36 w-full rounded-lg object-contain" />}
      <p className="mt-2 text-xs text-orbit-gray-text">{file.name}</p>
    </div>}
  </div>;
}
