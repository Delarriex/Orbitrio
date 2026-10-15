import React, { useEffect, useId, useState } from "react";
import { CheckCircle2, CloudUpload, X } from "lucide-react";
import { KYC_IMAGE_TYPES, validateKycFile } from "../services/kycService";

export function KycImageInput({ title, required = false, file, disabled, onChange }: {
  title: string; required?: boolean; file: File | null; disabled: boolean; onChange: (file: File | null) => void;
}) {
  const id = useId();
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <div className="min-w-0 space-y-2.5">
    <span id={`${id}-label`} className="block text-sm font-semibold text-orbit-white">{title} {required ? <span className="text-orbit-gray-text">*</span> : "(optional)"}</span>
    <div className="relative">
    <input id={id} type="file" accept={KYC_IMAGE_TYPES.join(",")} disabled={disabled} aria-required={required} aria-labelledby={`${id}-label`}
      aria-describedby={`${id}-help ${id}-error`} aria-invalid={!!error}
      className="peer sr-only"
      onChange={event => {
        const next = event.target.files?.[0];
        event.target.value = "";
        if (!next) return;
        const message = validateKycFile(next);
        setError(message || "");
        if (!message) onChange(next);
      }} />
    <label htmlFor={id} className={`flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-colors hover:border-emerald-400 hover:bg-emerald-500/10 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-emerald-400 peer-disabled:pointer-events-none peer-disabled:opacity-50 ${error ? "border-red-400/70 bg-red-500/5" : file ? "border-emerald-400/70 bg-emerald-500/10" : "border-emerald-500/40 bg-emerald-500/5"}`}>
      {preview ? <img src={preview} alt={`${title} preview`} className="h-36 w-full rounded-lg object-contain sm:h-44" /> : <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400"><CloudUpload size={28} aria-hidden="true" /></span>}
      <span className="text-sm font-semibold text-orbit-white">{file ? "Tap to replace image" : "Tap to upload image"}</span>
      <span id={`${id}-help`} className="text-xs leading-relaxed text-orbit-gray-text">JPG, PNG or WebP · Max 5 MB</span>
    </label>
    </div>
    {error && <p id={`${id}-error`} role="alert" className="text-xs text-orbit-red">{error}</p>}
    {file && <div className="flex min-w-0 items-center gap-2 rounded-lg bg-orbit-bg px-3 py-1">
      <CheckCircle2 size={16} className="shrink-0 text-emerald-400" aria-hidden="true" />
      <span className="min-w-0 flex-1 break-all text-xs leading-relaxed text-orbit-gray-text">{file.name} <span className="whitespace-nowrap">({(file.size / 1024 / 1024).toFixed(2)} MB)</span></span>
      <button type="button" disabled={disabled} onClick={() => { onChange(null); setError(""); }} aria-label={`Remove ${title}`} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-orbit-gray-text hover:bg-red-500/10 hover:text-red-400 focus-visible:outline-2 focus-visible:outline-emerald-400 disabled:opacity-50"><X size={18} /></button>
    </div>}
  </div>;
}
