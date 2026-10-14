import React, { useEffect, useId, useState } from "react";
import { Upload, X } from "lucide-react";
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
  return <div className="min-w-0 space-y-3 rounded-xl border border-orbit-border bg-orbit-bg p-4">
    <label htmlFor={id} className="flex items-center gap-2 text-sm font-bold text-orbit-white"><Upload size={16} />{title} {required ? "*" : "(optional)"}</label>
    <p id={`${id}-help`} className="text-xs text-orbit-gray-text">JPG, PNG or WebP · Up to 5 MB. Keep all text and corners visible.</p>
    <input id={id} type="file" accept={KYC_IMAGE_TYPES.join(",")} disabled={disabled} aria-required={required}
      aria-describedby={`${id}-help ${id}-error`} aria-invalid={!!error}
      className="block w-full text-xs text-orbit-gray-text file:mr-3 file:rounded-lg file:border-0 file:bg-orbit-accent file:px-3 file:py-2 file:font-bold file:text-orbit-bg disabled:opacity-50"
      onChange={event => {
        const next = event.target.files?.[0];
        event.target.value = "";
        if (!next) return;
        const message = validateKycFile(next);
        setError(message || "");
        if (!message) onChange(next);
      }} />
    {error && <p id={`${id}-error`} role="alert" className="text-xs text-orbit-red">{error}</p>}
    {file && <div className="space-y-2">
      {preview && <img src={preview} alt={`${title} preview`} className="h-40 w-full rounded-lg object-contain" />}
      <div className="flex items-start justify-between gap-2">
        <span className="break-all text-xs text-orbit-gray-text">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
        <button type="button" disabled={disabled} onClick={() => { onChange(null); setError(""); }} aria-label={`Remove ${title}`} className="p-2 text-orbit-red disabled:opacity-50"><X size={16} /></button>
      </div>
    </div>}
  </div>;
}
