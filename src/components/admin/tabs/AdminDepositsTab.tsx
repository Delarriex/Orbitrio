import React, { useState } from "react";
import { useOrbit } from "../../../context/OrbitContext";
import { motion } from "motion/react";
import { ArrowDownLeft, Check, X, Search, Eye, FileText } from "lucide-react";

export const AdminDepositsTab: React.FC = () => {
  const { adminUsers, adminApproveDeposit, adminRejectDeposit } = useOrbit();
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "completed" | "rejected">("all");

  const allDeposits: Array<any> = [];
  adminUsers.forEach(u => {
    u.transactions.forEach(t => {
      if (t.type === "deposit") {
        allDeposits.push({ ...t, userName: u.name, userEmail: u.email });
      }
    });
  });

  const sorted = [...allDeposits].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (b.status === "pending" && a.status !== "pending") return 1;
    return b.id.localeCompare(a.id);
  });

  const filtered = sorted.filter(t => {
    const matchesSearch = t.userName.toLowerCase().includes(searchQuery.toLowerCase()) || t.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || t.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const pendingCount = allDeposits.filter(d => d.status === "pending").length;

  const statusColors: Record<string, string> = {
    pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    completed: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    approved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    rejected: "text-red-400 bg-red-500/10 border-red-500/30",
    failed: "text-red-400 bg-red-500/10 border-red-500/30"
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <div className="bg-orbit-card border border-orbit-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-orbit-white flex items-center gap-2">
              <ArrowDownLeft size={20} className="text-emerald-400" /> Incoming Payments (Deposits)
            </h1>
            <p className="text-xs text-orbit-gray-text mt-1">Review, approve, or reject user deposit requests.</p>
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
          <input
            type="text" placeholder="Search by user..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-orbit-card border border-orbit-border rounded-xl text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "pending", "completed", "rejected"] as const).map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`px-3 py-2 text-[10px] font-bold uppercase rounded-lg border transition-colors cursor-pointer ${filterStatus === f ? "bg-orbit-accent text-orbit-bg border-orbit-accent" : "bg-orbit-card text-orbit-gray-text border-orbit-border hover:border-orbit-accent"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Deposits Table */}
      <div className="space-y-3">
        {filtered.map(dep => (
          <div key={dep.id} className={`bg-orbit-card border rounded-2xl p-4 space-y-3 ${dep.status === "pending" ? "border-yellow-500/30" : "border-orbit-border"}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-[10px] font-black">
                  {dep.userName?.charAt(0) || "?"}
                </div>
                <div>
                  <p className="text-sm font-bold text-orbit-white">{dep.userName}</p>
                  <p className="text-[10px] text-orbit-gray-text">{dep.userEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-orbit-white font-data">${dep.amount.toLocaleString()}</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusColors[dep.status] || "text-orbit-gray-text"}`}>
                  {dep.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
              <div><span className="text-orbit-gray-text">Asset:</span> <span className="text-orbit-white font-bold ml-1">{dep.asset}</span></div>
              <div><span className="text-orbit-gray-text">Date:</span> <span className="text-orbit-white font-bold ml-1">{dep.date}</span></div>
              {dep.txHash && <div className="truncate"><span className="text-orbit-gray-text">TxHash:</span> <span className="text-orbit-accent font-bold ml-1">{dep.txHash.substring(0, 16)}...</span></div>}
              {dep.proofFile && <div><span className="text-orbit-gray-text">Proof:</span> <span className="text-orbit-accent font-bold ml-1 flex items-center gap-1 inline-flex"><FileText size={10} /> Attached</span></div>}
            </div>

            {dep.notes && <p className="text-[10px] text-orbit-gray-text italic">Notes: {dep.notes}</p>}

            {dep.status === "pending" && (
              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-orbit-border/50">
                <button onClick={() => { adminApproveDeposit(dep.id); setFeedback(`Approved deposit ${dep.id}`); setTimeout(() => setFeedback(null), 3000); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500 text-white font-bold text-xs uppercase rounded-lg hover:bg-emerald-600 cursor-pointer">
                  <Check size={14} /> Approve
                </button>
                <input placeholder="Rejection reason..." value={rejectNotes[dep.id] || ""} onChange={e => setRejectNotes(prev => ({ ...prev, [dep.id]: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-xs text-orbit-white placeholder:text-orbit-gray-text focus:outline-none" />
                <button onClick={() => { adminRejectDeposit(dep.id, rejectNotes[dep.id] || undefined); setFeedback(`Rejected deposit ${dep.id}`); setTimeout(() => setFeedback(null), 3000); }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-500 text-white font-bold text-xs uppercase rounded-lg hover:bg-red-600 cursor-pointer">
                  <X size={14} /> Reject
                </button>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-orbit-gray-text text-sm">No deposits found.</div>
        )}
      </div>
    </motion.div>
  );
};
