import React, { useState } from "react";
import { useOrbit } from "../../../context/OrbitContext";
import { motion } from "motion/react";
import { ArrowUpRight, Check, X, Search, FileText } from "lucide-react";

export const AdminWithdrawalsTab: React.FC = () => {
  const { adminUsers, adminApproveWithdrawal, adminRejectWithdrawal } = useOrbit();
  const [searchQuery, setSearchQuery] = useState("");
  const [approveNotes, setApproveNotes] = useState<Record<string, string>>({});
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed" | "failed">("all");

  const allWithdrawals: Array<any> = [];
  adminUsers.forEach(u => {
    u.transactions.forEach(t => {
      if (t.type === "withdrawal") {
        allWithdrawals.push({ ...t, userName: u.name, userEmail: u.email });
      }
    });
  });

  const sorted = [...allWithdrawals].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    return b.id.localeCompare(a.id);
  });

  const filtered = sorted.filter(t => {
    const matchesSearch = t.userName.toLowerCase().includes(searchQuery.toLowerCase()) || t.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || t.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const pendingCount = allWithdrawals.filter(w => w.status === "pending").length;

  const statusColors: Record<string, string> = {
    pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    completed: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    approved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    failed: "text-red-400 bg-red-500/10 border-red-500/30",
    rejected: "text-red-400 bg-red-500/10 border-red-500/30"
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <div className="bg-orbit-card border border-orbit-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-orbit-white flex items-center gap-2">
              <ArrowUpRight size={20} className="text-[#DFAD12]" /> Payout Requests (Withdrawals)
            </h1>
            <p className="text-xs text-orbit-gray-text mt-1">Approve or reject pending withdrawal requests.</p>
          </div>
          {pendingCount > 0 && (
            <span className="flex items-center gap-2 text-[10px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-full animate-pulse">
              {pendingCount} Pending
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
          <input type="text" placeholder="Search by user..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-orbit-card border border-orbit-border rounded-xl text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent" />
        </div>
        <div className="flex gap-2">
          {(["all", "pending", "completed", "failed"] as const).map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`px-3 py-2 text-[10px] font-bold uppercase rounded-lg border transition-colors cursor-pointer ${filterStatus === f ? "bg-orbit-accent text-orbit-bg border-orbit-accent" : "bg-orbit-card text-orbit-gray-text border-orbit-border hover:border-orbit-accent"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Withdrawals List */}
      <div className="space-y-3">
        {filtered.map(w => (
          <div key={w.id} className={`bg-orbit-card border rounded-2xl p-4 space-y-3 ${w.status === "pending" ? "border-yellow-500/30" : "border-orbit-border"}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#DFAD12] to-orange-600 flex items-center justify-center text-white text-[10px] font-black">
                  {w.userName?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-sm font-bold text-orbit-white">{w.userName}</p>
                  <p className="text-[10px] text-orbit-gray-text">{w.userEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-orbit-white font-data">${w.amount.toLocaleString()}</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusColors[w.status] || "text-orbit-gray-text"}`}>
                  {w.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
              <div><span className="text-orbit-gray-text">Asset:</span> <span className="text-orbit-white font-bold ml-1">{w.asset}</span></div>
              <div><span className="text-orbit-gray-text">Date:</span> <span className="text-orbit-white font-bold ml-1">{w.date}</span></div>
              {w.address && <div className="truncate col-span-2"><span className="text-orbit-gray-text">Destination:</span> <span className="text-orbit-accent font-bold ml-1">{w.address}</span></div>}
            </div>

            {w.bankDetails && (
              <div className="grid grid-cols-2 gap-2 text-[10px] bg-orbit-bg/50 rounded-lg p-2">
                <div><span className="text-orbit-gray-text">Bank:</span> <span className="text-orbit-white font-bold ml-1">{w.bankDetails.bankName}</span></div>
                <div><span className="text-orbit-gray-text">Account:</span> <span className="text-orbit-white font-bold ml-1">{w.bankDetails.accountNumber}</span></div>
                <div><span className="text-orbit-gray-text">Name:</span> <span className="text-orbit-white font-bold ml-1">{w.bankDetails.accountName}</span></div>
                <div><span className="text-orbit-gray-text">Routing:</span> <span className="text-orbit-white font-bold ml-1">{w.bankDetails.routingCode}</span></div>
              </div>
            )}

            {w.paypalEmail && <p className="text-[10px] text-orbit-gray-text">PayPal: <span className="text-orbit-accent font-bold">{w.paypalEmail}</span></p>}
            {w.notes && <p className="text-[10px] text-orbit-gray-text italic">Notes: {w.notes}</p>}

            {w.status === "pending" && (
              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-orbit-border/50">
                <input placeholder="Approval notes..." value={approveNotes[w.id] || ""} onChange={e => setApproveNotes(prev => ({ ...prev, [w.id]: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-xs text-orbit-white placeholder:text-orbit-gray-text focus:outline-none" />
                <button onClick={() => { adminApproveWithdrawal(w.id, approveNotes[w.id] || undefined); setFeedback(`Approved withdrawal ${w.id}`); setTimeout(() => setFeedback(null), 3000); }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500 text-white font-bold text-xs uppercase rounded-lg hover:bg-emerald-600 cursor-pointer">
                  <Check size={14} /> Approve
                </button>
                <input placeholder="Rejection reason..." value={rejectNotes[w.id] || ""} onChange={e => setRejectNotes(prev => ({ ...prev, [w.id]: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-xs text-orbit-white placeholder:text-orbit-gray-text focus:outline-none" />
                <button onClick={() => { adminRejectWithdrawal(w.id, rejectNotes[w.id] || undefined); setFeedback(`Rejected withdrawal ${w.id}`); setTimeout(() => setFeedback(null), 3000); }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-500 text-white font-bold text-xs uppercase rounded-lg hover:bg-red-600 cursor-pointer">
                  <X size={14} /> Reject
                </button>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-orbit-gray-text text-sm">No withdrawal requests found.</div>
        )}
      </div>
    </motion.div>
  );
};
