import React, { useMemo, useState } from "react";
import { useOrbit } from "../../../context/OrbitContext";
import { motion } from "motion/react";
import { UserCheck, Check, X, Search, Eye } from "lucide-react";
import { KycImageViewer } from "../KycImageViewer";
import { kycErrorMessage, needsBackImage } from "../../../services/kycService";
import type { KycSubmission, KycStatus } from "../../../types";
import type { CoreUserProfile } from "../../../hooks/data/useUsersDirectory";

type KycRow = CoreUserProfile & { kyc?: KycSubmission; kycStatus: KycStatus };

const statusColors: Record<KycStatus, string> = {
  pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  approved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  rejected: "text-red-400 bg-red-500/10 border-red-500/30",
  unverified: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30"
};

const formatDate = (value?: string) => {
  if (!value) return "Not submitted";
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(parsed));
};

const getDocumentCount = (kyc?: KycSubmission) => [kyc?.frontImage, kyc?.backImage, kyc?.proofOfAddressImage].filter(Boolean).length;

export const AdminKycTab: React.FC = () => {
  const { usersDirectory, allKycSubmissions, adminKycReview, kycLoading, kycError, refreshKyc, refreshUsersDirectory, isLoadingUsersDirectory } = useOrbit();
  const [searchQuery, setSearchQuery] = useState("");
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | KycStatus>("all");
  const [reviewingEmail, setReviewingEmail] = useState<string | null>(null);

  const rows = useMemo<KycRow[]>(() => usersDirectory.map(user => {
    const kyc = allKycSubmissions[user.email];
    return { ...user, kyc, kycStatus: kyc?.status || "unverified" };
  }), [usersDirectory, allKycSubmissions]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return rows.filter(user => {
      const matchesStatus = filterStatus === "all" || user.kycStatus === filterStatus;
      if (!query) return matchesStatus;
      const searchable = [
        user.name,
        user.email,
        user.kyc?.documentType || user.kyc?.idType || "",
        user.kyc?.idNumber || "",
        user.kyc?.country || "",
        user.kyc?.adminNotes || user.kyc?.rejectionReason || ""
      ].join(" ").toLowerCase();
      return matchesStatus && searchable.includes(query);
    }).sort((a, b) => {
      if (a.kycStatus === "pending" && b.kycStatus !== "pending") return -1;
      if (b.kycStatus === "pending" && a.kycStatus !== "pending") return 1;
      return Date.parse(b.kyc?.submissionDate || "0") - Date.parse(a.kyc?.submissionDate || "0");
    });
  }, [rows, filterStatus, searchQuery]);

  const pendingCount = rows.filter(user => user.kycStatus === "pending").length;

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 3000);
  };

  const approve = async (user: KycRow) => {
    const note = adminNotes[user.email] || "Verified by admin.";
    setReviewingEmail(user.email);
    try {
      await adminKycReview(user.email, "approved", note, user.kyc?.revision);
      setAdminNotes(prev => ({ ...prev, [user.email]: "" }));
      showFeedback(`KYC approved for ${user.email}`);
    } catch (error) {
      showFeedback(kycErrorMessage(error, `Unable to approve KYC for ${user.email}`));
    } finally {
      setReviewingEmail(null);
    }
  };

  const reject = async (user: KycRow) => {
    const reason = (adminNotes[user.email] || "").trim();
    if (!reason) { showFeedback("Enter a rejection reason in the notes field first."); return; }
    setReviewingEmail(user.email);
    try {
      await adminKycReview(user.email, "rejected", reason, user.kyc?.revision);
      setAdminNotes(prev => ({ ...prev, [user.email]: "" }));
      showFeedback(`KYC rejected for ${user.email}`);
    } catch (error) {
      showFeedback(kycErrorMessage(error, `Unable to reject KYC for ${user.email}`));
    } finally {
      setReviewingEmail(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="bg-orbit-card border border-orbit-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-orbit-white flex items-center gap-2">
              <UserCheck size={20} className="text-orbit-accent" /> ID Verifications
            </h1>
            <p className="text-xs text-orbit-gray-text mt-1">Review identity documents, proof of address, notes, and verification outcomes.</p>
          </div>
          <span className="flex items-center gap-2 text-[10px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-full">
            {pendingCount} Pending Reviews
          </span>
        </div>
      </div>

      <button type="button" disabled={kycLoading || isLoadingUsersDirectory || !!reviewingEmail} onClick={() => void Promise.all([refreshKyc(), refreshUsersDirectory()])} className="min-h-11 text-sm text-orbit-accent disabled:opacity-50">{kycLoading || isLoadingUsersDirectory ? "Loading submissions…" : "Refresh submissions"}</button>
      {kycError && <p role="alert" className="text-sm text-orbit-red">Unable to load submissions: {kycError}</p>}

      {feedback && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="status" className="p-3 rounded-xl bg-orbit-bg border border-orbit-border text-orbit-white text-xs font-bold">
          {feedback}
        </motion.div>
      )}

      {!kycError && <div className="bg-orbit-card border border-orbit-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-orbit-border flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative lg:w-80">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-orbit-gray-text" />
            <input type="text" placeholder="Search verifications" value={searchQuery} onChange={event => setSearchQuery(event.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-orbit-bg border border-orbit-border rounded-xl text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["all", "pending", "approved", "rejected", "unverified"] as const).map(status => (
              <button key={status} onClick={() => setFilterStatus(status)}
                className={`px-3 py-2 text-[10px] font-bold uppercase rounded-lg border transition-colors cursor-pointer ${filterStatus === status ? "bg-orbit-accent text-orbit-bg border-orbit-accent" : "bg-orbit-bg text-orbit-gray-text border-orbit-border hover:border-orbit-accent"}`}>
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left">
            <thead className="bg-orbit-bg/60 border-b border-orbit-border">
              <tr className="text-[10px] uppercase tracking-wider text-orbit-gray-text">
                <th className="px-5 py-3 font-bold">User</th>
                <th className="px-4 py-3 font-bold">Submission Date</th>
                <th className="px-4 py-3 font-bold">Document Type</th>
                <th className="px-4 py-3 font-bold">Documents</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Admin Notes</th>
                <th className="px-5 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orbit-border/70">
              {filtered.map(user => {
                const kyc = user.kyc;
                const isExpanded = expandedUser === user.email;
                return (
                  <React.Fragment key={user.email}>
                    <tr className="hover:bg-orbit-bg/40 transition-colors align-top">
                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-orbit-white">{user.name}</p>
                        <p className="text-[10px] text-orbit-gray-text">{user.email}</p>
                      </td>
                      <td className="px-4 py-4 text-xs text-orbit-gray-text">{formatDate(kyc?.submissionDate)}</td>
                      <td className="px-4 py-4 text-xs font-bold text-orbit-white">{kyc?.documentType || kyc?.idType || "Not submitted"}</td>
                      <td className="px-4 py-4">
                        <button disabled={!kyc} onClick={() => setExpandedUser(isExpanded ? null : user.email)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-[10px] font-bold text-orbit-white disabled:opacity-50 cursor-pointer hover:border-orbit-accent">
                          <Eye size={12} /> View ({getDocumentCount(kyc)})
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold ${statusColors[user.kycStatus]}`}>
                          {user.kycStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <input
                          aria-label={`Review notes for ${user.email}`} maxLength={2000} disabled={!!reviewingEmail || kycLoading || isLoadingUsersDirectory}
                          value={adminNotes[user.email] ?? (kyc?.status === "pending" ? "" : kyc?.adminNotes ?? kyc?.rejectionReason ?? "")}
                          onChange={event => setAdminNotes(prev => ({ ...prev, [user.email]: event.target.value }))}
                          placeholder="Approval note or rejection reason"
                          className="w-[250px] px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-xs text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent"
                        />
                      </td>
                      <td className="px-5 py-4">
                        {kyc?.status === "pending" ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => approve(user)} title="Open the documents and review the images before approval" disabled={!!reviewingEmail || kycLoading || isLoadingUsersDirectory || !!kycError || !isExpanded || !kyc.frontImage || (needsBackImage(kyc.documentType || kyc.idType) && !kyc.backImage)} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500 text-white font-bold text-[10px] uppercase rounded-lg hover:bg-emerald-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                              <Check size={12} /> Approve
                            </button>
                            <button onClick={() => reject(user)} disabled={!!reviewingEmail || kycLoading || isLoadingUsersDirectory || !!kycError} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 text-white font-bold text-[10px] uppercase rounded-lg hover:bg-red-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                              <X size={12} /> Reject
                            </button>
                          </div>
                        ) : (
                          <p className="text-right text-[10px] font-bold uppercase text-orbit-gray-text">No action</p>
                        )}
                      </td>
                    </tr>
                    {isExpanded && kyc && (
                      <tr className="bg-orbit-bg/50">
                        <td colSpan={7} className="px-5 py-5">
                          <DocumentPanel kyc={kyc} ownerId={user.id} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && <div className="py-14 text-center text-sm text-orbit-gray-text">No verification records match this view.</div>}
      </div>}
    </motion.div>
  );
};

const DocumentPanel: React.FC<{ kyc: KycSubmission; ownerId: string }> = ({ kyc, ownerId }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
      <Info label="Document Number" value={kyc.idNumber || "Not captured"} />
      <Info label="Date of Birth" value={kyc.dob || "Not captured"} />
      <Info label="Country" value={kyc.country || "Not captured"} />
      <Info label="Address" value={[kyc.address, kyc.city].filter(Boolean).join(", ") || "Not captured"} />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <KycImageViewer ownerId={ownerId} title={kyc.documentType === "Passport" ? "Passport photo page" : "Front of identity document"} path={kyc.frontImage} />
      {needsBackImage(kyc.documentType || kyc.idType) && <KycImageViewer ownerId={ownerId} title="Back of identity document" path={kyc.backImage} />}
      <KycImageViewer ownerId={ownerId} title="Proof of address (optional)" path={kyc.proofOfAddressImage} />
    </div>
  </div>
);

const Info: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-orbit-card border border-orbit-border rounded-lg p-3">
    <p className="text-[9px] uppercase tracking-wider text-orbit-gray-text font-bold">{label}</p>
    <p className="mt-1 text-orbit-white font-bold break-words">{value}</p>
  </div>
);
