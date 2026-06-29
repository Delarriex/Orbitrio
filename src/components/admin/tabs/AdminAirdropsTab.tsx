import React, { useState } from "react";
import { useOrbit } from "../../../context/OrbitContext";
import { motion } from "motion/react";
import { Gift, Plus, Trash2, Edit3, Save, X, Check, CheckCircle } from "lucide-react";
import type { Airdrop } from "../../../types";

export const AdminAirdropsTab: React.FC = () => {
  const { airdrops, adminAirdropClaims, adminCreateAirdrop, adminUpdateAirdrop, adminDeleteAirdrop, adminApproveAirdrop, adminRejectAirdrop } = useOrbit();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", token: "", rewardAmount: "" });

  const resetForm = () => { setForm({ title: "", token: "", rewardAmount: "" }); setIsCreating(false); setEditingId(null); };

  const handleCreate = async () => {
    if (!form.title || !form.token || !form.rewardAmount) return;
    await adminCreateAirdrop({ title: form.title, token: form.token, rewardAmount: form.rewardAmount, status: "Live" });
    setFeedback(`Created airdrop: ${form.title}`);
    resetForm();
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const existing = airdrops.find(a => a.id === editingId);
    if (!existing) return;
    await adminUpdateAirdrop({ ...existing, ...form });
    setFeedback(`Updated airdrop: ${form.title}`);
    resetForm();
    setTimeout(() => setFeedback(null), 3000);
  };

  const startEdit = (a: Airdrop) => {
    setEditingId(a.id);
    setIsCreating(false);
    setForm({ title: a.title, token: a.token, rewardAmount: a.rewardAmount });
  };

  const pendingClaims = adminAirdropClaims.filter(c => c.status === "Pending");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <div className="bg-orbit-card border border-orbit-border rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-orbit-white flex items-center gap-2">
            <Gift size={20} className="text-orbit-accent" /> Free Coin Claims (Airdrops)
          </h1>
          <p className="text-xs text-orbit-gray-text mt-1">Manage airdrops and approve user claims.</p>
        </div>
        <button onClick={() => { setIsCreating(true); setEditingId(null); setForm({ title: "", token: "", rewardAmount: "" }); }}
          className="flex items-center gap-2 px-4 py-2 bg-orbit-accent text-orbit-bg font-bold text-xs uppercase rounded-lg hover:opacity-90 cursor-pointer">
          <Plus size={14} /> New Airdrop
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <Check size={14} /> {feedback}
        </motion.div>
      )}

      {/* Create / Edit Form */}
      {(isCreating || editingId) && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-orbit-card border border-orbit-accent/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-orbit-white">{isCreating ? "Create Airdrop" : "Edit Airdrop"}</h3>
            <button onClick={resetForm} className="p-1.5 rounded-lg bg-orbit-border/50 text-orbit-gray-text hover:text-orbit-white cursor-pointer"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input placeholder="Airdrop Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent" />
            <input placeholder="Token (e.g. BTC)" value={form.token} onChange={e => setForm(f => ({ ...f, token: e.target.value }))}
              className="px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent" />
            <input placeholder="Reward Amount" value={form.rewardAmount} onChange={e => setForm(f => ({ ...f, rewardAmount: e.target.value }))}
              className="px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent" />
          </div>
          <button onClick={isCreating ? handleCreate : handleUpdate}
            className="flex items-center gap-2 px-6 py-2 bg-orbit-accent text-orbit-bg font-bold text-xs uppercase rounded-lg hover:opacity-90 cursor-pointer">
            <Save size={14} /> {isCreating ? "Create" : "Save"}
          </button>
        </motion.div>
      )}

      {/* Active Airdrops */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {airdrops.map(a => (
          <div key={a.id} className="bg-orbit-card border border-orbit-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-orbit-white">{a.title}</h3>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">LIVE</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div><span className="text-orbit-gray-text">Token:</span> <span className="text-orbit-accent font-bold ml-1">{a.token}</span></div>
              <div><span className="text-orbit-gray-text">Reward:</span> <span className="text-orbit-white font-bold ml-1">{a.rewardAmount}</span></div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-orbit-border/50">
              <button onClick={() => startEdit(a)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-orbit-accent/10 border border-orbit-accent/30 text-orbit-accent text-[10px] font-bold rounded-lg hover:bg-orbit-accent/20 cursor-pointer">
                <Edit3 size={10} /> Edit
              </button>
              <button onClick={() => { if (window.confirm(`Delete "${a.title}"?`)) adminDeleteAirdrop(a.id); }}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold rounded-lg hover:bg-red-500/20 cursor-pointer">
                <Trash2 size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Claims */}
      {pendingClaims.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-orbit-white flex items-center gap-2">
            <CheckCircle size={16} className="text-yellow-400" /> Pending Claims ({pendingClaims.length})
          </h3>
          {pendingClaims.map(claim => (
            <div key={claim.id} className="bg-orbit-card border border-yellow-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-orbit-white">{claim.userEmail}</p>
                <p className="text-[10px] text-orbit-gray-text">Token: {claim.token} • Reward: {claim.rewardAmount} • {claim.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { adminApproveAirdrop(claim.id); setFeedback(`Approved claim for ${claim.userEmail}`); setTimeout(() => setFeedback(null), 3000); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white font-bold text-xs uppercase rounded-lg hover:bg-emerald-600 cursor-pointer">
                  <Check size={14} /> Approve
                </button>
                <button onClick={() => { adminRejectAirdrop(claim.id); setFeedback(`Declined claim for ${claim.userEmail}`); setTimeout(() => setFeedback(null), 3000); }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white font-bold text-xs uppercase rounded-lg hover:bg-red-600 cursor-pointer">
                  <X size={14} /> Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All Claims */}
      {adminAirdropClaims.filter(c => c.status !== "Pending").length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-orbit-gray-text uppercase">Processed Claims</h3>
          {adminAirdropClaims.filter(c => c.status !== "Pending").map(claim => (
            <div key={claim.id} className="bg-orbit-card border border-orbit-border rounded-lg p-3 flex items-center justify-between text-[10px]">
              <span className="text-orbit-white">{claim.userEmail} — {claim.token} ({claim.rewardAmount})</span>
              <span className={`font-bold px-2 py-0.5 rounded-full border ${claim.status === "Approved" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : "text-red-400 bg-red-500/10 border-red-500/30"}`}>
                {claim.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
