import React, { useState } from "react";
import { useOrbit } from "../../../context/OrbitContext";
import { motion } from "motion/react";
import { UserCheck, Check, X, Search, Eye, Image } from "lucide-react";

export const AdminKycTab: React.FC = () => {
  const { adminUsers, adminKycReview } = useOrbit();
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected" | "unverified">("all");

  const usersWithKyc = adminUsers.filter(u => u.kyc);
  const allUsers = filterStatus === "all" ? adminUsers : usersWithKyc.filter(u => u.kyc?.status === filterStatus);
  const filtered = allUsers.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = usersWithKyc.filter(u => u.kyc?.status === "pending").length;

  const statusColors: Record<string, string> = {
    pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    approved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    rejected: "text-red-400 bg-red-500/10 border-red-500/30",
    unverified: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30"
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <div className="bg-orbit-card border border-orbit-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-orbit-white flex items-center gap-2">
              <UserCheck size={20} className="text-orbit-accent" /> ID Verifications (KYC)
            </h1>
            <p className="text-xs text-orbit-gray-text mt-1">Review and approve or reject user identity verification submissions.</p>
          </div>
          {pendingCount > 0 && (
            <span className="flex items-center gap-2 text-[10px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-full animate-pulse">
              {pendingCount} Pending Reviews
            </span>
          )}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          {feedback}
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-orbit-gray-text" />
          <input type="text" placeholder="Search users..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-orbit-card border border-orbit-border rounded-xl text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "pending", "approved", "rejected", "unverified"] as const).map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`px-3 py-2 text-[10px] font-bold uppercase rounded-lg border transition-colors cursor-pointer ${filterStatus === f ? "bg-orbit-accent text-orbit-bg border-orbit-accent" : "bg-orbit-card text-orbit-gray-text border-orbit-border hover:border-orbit-accent"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Users */}
      <div className="space-y-3">
        {filtered.map(u => {
          const kyc = u.kyc;
          const isExpanded = expandedUser === u.email;
          return (
            <div key={u.email} className={`bg-orbit-card border rounded-2xl overflow-hidden ${kyc?.status === "pending" ? "border-yellow-500/30" : "border-orbit-border"}`}>
              <button onClick={() => setExpandedUser(isExpanded ? null : u.email)}
                className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-orbit-border/20 transition-colors cursor-pointer text-left gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orbit-accent to-[#FF7F00] flex items-center justify-center text-orbit-bg text-[10px] font-black">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-orbit-white">{u.name}</p>
                    <p className="text-[10px] text-orbit-gray-text">{u.email}</p>
                  </div>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusColors[kyc?.status || "unverified"]}`}>
                  {(kyc?.status || "unverified").toUpperCase()}
                </span>
              </button>

              {isExpanded && kyc && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="border-t border-orbit-border p-4 space-y-4 bg-orbit-bg/50">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[10px]">
                    <div><span className="text-orbit-gray-text">ID Type:</span> <span className="text-orbit-white font-bold ml-1">{kyc.idType}</span></div>
                    <div><span className="text-orbit-gray-text">ID Number:</span> <span className="text-orbit-white font-bold ml-1">{kyc.idNumber}</span></div>
                    <div><span className="text-orbit-gray-text">DOB:</span> <span className="text-orbit-white font-bold ml-1">{kyc.dob}</span></div>
                    <div><span className="text-orbit-gray-text">Address:</span> <span className="text-orbit-white font-bold ml-1">{kyc.address}</span></div>
                    <div><span className="text-orbit-gray-text">City:</span> <span className="text-orbit-white font-bold ml-1">{kyc.city}</span></div>
                    <div><span className="text-orbit-gray-text">Country:</span> <span className="text-orbit-white font-bold ml-1">{kyc.country}</span></div>
                  </div>

                  {/* ID Images */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {kyc.frontImage && (
                      <div className="bg-orbit-card border border-orbit-border rounded-lg p-3">
                        <p className="text-[9px] text-orbit-gray-text uppercase font-bold mb-2 flex items-center gap-1"><Image size={10} /> Front ID</p>
                        <img src={kyc.frontImage} alt="Front ID" className="w-full h-auto rounded-lg border border-orbit-border" />
                      </div>
                    )}
                    {kyc.backImage && (
                      <div className="bg-orbit-card border border-orbit-border rounded-lg p-3">
                        <p className="text-[9px] text-orbit-gray-text uppercase font-bold mb-2 flex items-center gap-1"><Image size={10} /> Back ID</p>
                        <img src={kyc.backImage} alt="Back ID" className="w-full h-auto rounded-lg border border-orbit-border" />
                      </div>
                    )}
                  </div>

                  {kyc.rejectionReason && (
                    <p className="text-[10px] text-red-400 italic">Previous rejection: {kyc.rejectionReason}</p>
                  )}

                  {/* Actions */}
                  {kyc.status === "pending" && (
                    <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-orbit-border/50">
                      <button onClick={() => { adminKycReview(u.email, "approved"); setFeedback(`KYC approved for ${u.email}`); setTimeout(() => setFeedback(null), 3000); }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500 text-white font-bold text-xs uppercase rounded-lg hover:bg-emerald-600 cursor-pointer">
                        <Check size={14} /> Approve KYC
                      </button>
                      <input placeholder="Rejection reason..." value={rejectionReasons[u.email] || ""} onChange={e => setRejectionReasons(prev => ({ ...prev, [u.email]: e.target.value }))}
                        className="flex-1 px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-xs text-orbit-white placeholder:text-orbit-gray-text focus:outline-none" />
                      <button onClick={() => { adminKycReview(u.email, "rejected", rejectionReasons[u.email] || "Documents not sufficient."); setFeedback(`KYC rejected for ${u.email}`); setTimeout(() => setFeedback(null), 3000); }}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-500 text-white font-bold text-xs uppercase rounded-lg hover:bg-red-600 cursor-pointer">
                        <X size={14} /> Reject
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {isExpanded && !kyc && (
                <div className="border-t border-orbit-border p-4 bg-orbit-bg/50">
                  <p className="text-xs text-orbit-gray-text">This user has not submitted KYC documents yet.</p>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-orbit-gray-text text-sm">No users found.</div>
        )}
      </div>
    </motion.div>
  );
};
