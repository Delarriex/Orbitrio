import React, { useMemo, useRef, useState } from "react";
import { useUser, useSession } from "@clerk/clerk-react";
import { useOrbit } from "../context/OrbitContext";
import { useSupabaseClient } from "../lib/supabase";
import { Shield, RefreshCw, Loader2 } from "lucide-react";
import { KycImageInput } from "../components/KycImageInput";
import { KYC_DOCUMENT_TYPES, KycUploadBatch, needsBackImage, validateKycSubmission, kycErrorMessage, type KycFiles } from "../services/kycService";
import type { KycSubmission } from "../types";

const emptyKyc: KycSubmission = { status: "unverified", idType: "Government ID", documentType: "Government ID", idNumber: "", dob: "", address: "", city: "", country: "", frontImage: "", backImage: "" };
const formatDate = (value?: string) => value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Not yet";

export const DashboardKYC: React.FC = () => {
  const { myKyc, kycLoading, kycError, refreshKyc } = useOrbit();
  const { user } = useUser();
  const { session } = useSession();
  const current = myKyc || emptyKyc;
  return <div className="space-y-5 pb-6">
    <div className="flex items-center justify-between gap-3 border-b border-orbit-border pb-5">
      <h1 className="flex items-center gap-3 text-2xl font-bold text-orbit-white"><Shield className="text-orbit-accent" />Identity Verification</h1>
      <button type="button" disabled={kycLoading} onClick={() => void refreshKyc()} className="flex min-h-11 items-center gap-2 text-xs text-orbit-accent disabled:opacity-50"><RefreshCw size={16} />Refresh status</button>
    </div>
    {kycError && <div role="alert" className="rounded-xl border border-orbit-red p-4 text-sm text-orbit-red">Unable to load verification: {kycError} Use Refresh status to retry.</div>}
    {kycLoading && <p role="status" className="flex items-center gap-2 text-sm text-orbit-gray-text"><Loader2 size={16} className="animate-spin" />Loading verification…</p>}
    {!kycLoading && !kycError && <>
      <div className="space-y-4 rounded-2xl border border-orbit-border bg-orbit-card p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-orbit-white">Current KYC status</h2>
          <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${current.status === "approved" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : current.status === "rejected" ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"}`}>{current.status.toUpperCase()}</span>
        </div>
        <dl className="grid gap-3 text-xs text-orbit-gray-text sm:grid-cols-3">
          <div><dt>Submitted</dt><dd className="mt-1 text-orbit-white">{formatDate(current.submissionDate)}</dd></div>
          <div><dt>Reviewed</dt><dd className="mt-1 text-orbit-white">{formatDate(current.reviewedAt)}</dd></div>
          <div><dt>Document</dt><dd className="mt-1 text-orbit-white">{myKyc ? current.documentType || current.idType : "Not submitted"}</dd></div>
        </dl>
        {current.status === "pending" && <p className="text-sm text-yellow-300">Your documents are awaiting review. Use Refresh status to check for a decision.</p>}
        {current.status === "approved" && <p className="text-sm text-emerald-400">Your identity verification has been approved.</p>}
        {(current.adminNotes || current.rejectionReason) && <p className="break-words text-sm text-orbit-white"><strong>{current.status === "rejected" ? "Rejection reason" : "Review notes"}:</strong> {current.rejectionReason || current.adminNotes}</p>}
      </div>
      {(current.status === "unverified" || current.status === "rejected") && user?.id && <KycForm key={`${session?.id}:${current.revision || 0}:${current.status}`} ownerId={user.id} current={current} />}
    </>}
  </div>;
};

function KycForm({ ownerId, current }: { ownerId: string; current: KycSubmission }) {
  const { submitKyc } = useOrbit();
  const client = useSupabaseClient();
  const uploads = useMemo(() => new KycUploadBatch(client, ownerId), [client, ownerId]);
  const [form, setForm] = useState({ ...current });
  const [files, setFiles] = useState<KycFiles>({ frontImage: null, backImage: null, proofOfAddressImage: null });
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const documentType = form.documentType || form.idType;
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting.current) return;
    setError("");
    const invalid = validateKycSubmission(form);
    if (invalid) { setError(invalid); return; }
    submitting.current = true; setBusy(true);
    try {
      const paths = await uploads.upload(files, documentType, setProgress);
      setProgress("Submitting documents for review…");
      await submitKyc({ ...form, idType: documentType, documentType, ...paths, status: "pending" });
    } catch (err) {
      setError(kycErrorMessage(err, "Unable to submit. Please retry.") + " If your connection was interrupted during submission, refresh your status before retrying.");
    } finally { submitting.current = false; setBusy(false); setProgress(""); }
  };
  const field = (name: "idNumber" | "dob" | "address" | "city" | "country", label: string, maxLength?: number) => <label className="space-y-2 text-xs text-orbit-gray-text">
    <span className="block">{label} *</span>
    <input required type={name === "dob" ? "date" : "text"} maxLength={maxLength} max={name === "dob" ? new Date().toISOString().slice(0,10) : undefined}
      value={form[name]} onChange={event => setForm(prev => ({ ...prev, [name]: event.target.value }))}
      className="w-full rounded-lg border border-orbit-border bg-orbit-bg p-3 text-sm text-orbit-white focus:border-orbit-accent focus:outline-none" />
  </label>;
  return <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-orbit-border bg-orbit-card p-4 sm:p-6">
    <h2 className="text-lg font-bold text-orbit-white">{current.status === "rejected" ? "Resubmit your documents" : "Verify your identity"}</h2>
    <p className="text-sm text-orbit-gray-text">Upload clear photos of your original documents. Your documents are stored privately for verification. Fields marked * are required.</p>
    {current.status === "rejected" && <p className="text-sm text-orbit-gray-text">Review the reason above and attach new images for this submission.</p>}
    <fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
      <legend className="sr-only">Identity information and document images</legend>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-xs text-orbit-gray-text"><span className="block">Document type *</span>
          <select value={documentType} onChange={event => { setForm(prev => ({ ...prev, documentType: event.target.value, idType: event.target.value })); setFiles({ frontImage: null, backImage: null, proofOfAddressImage: files.proofOfAddressImage }); }} className="w-full rounded-lg border border-orbit-border bg-orbit-bg p-3 text-sm text-orbit-white">{KYC_DOCUMENT_TYPES.map(type => <option key={type}>{type}</option>)}</select>
        </label>
        {field("idNumber", "Document number", 100)}{field("dob", "Date of birth")}{field("address", "Residential address", 500)}{field("city", "City", 120)}{field("country", "Country", 120)}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <KycImageInput title={documentType === "Passport" ? "Passport photo page" : "Front of identity document"} required file={files.frontImage} disabled={busy} onChange={file => setFiles(prev => ({ ...prev, frontImage: file }))} />
        {needsBackImage(documentType) && <KycImageInput title="Back of identity document" required file={files.backImage} disabled={busy} onChange={file => setFiles(prev => ({ ...prev, backImage: file }))} />}
        <KycImageInput title="Proof of address" file={files.proofOfAddressImage} disabled={busy} onChange={file => setFiles(prev => ({ ...prev, proofOfAddressImage: file }))} />
      </div>
    </fieldset>
    {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
    <button type="submit" disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-orbit-accent p-3 font-bold text-orbit-bg disabled:opacity-60">{busy && <Loader2 size={18} className="animate-spin" />}{busy ? progress || "Preparing documents…" : current.status === "rejected" ? "Resubmit verification" : "Submit verification"}</button>
    {busy && <p role="status" className="text-xs text-orbit-gray-text">Keep this page open until your submission is confirmed.</p>}
  </form>;
}
