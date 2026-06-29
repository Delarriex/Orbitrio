import React, { useState } from "react";
import { useOrbit } from "../../../context/OrbitContext";
import { motion } from "motion/react";
import {
  Users, Search, DollarSign, Plus, Minus, Ban, UserCheck, Key, Eye, EyeOff,
  ChevronDown, ChevronUp, AlertTriangle, Check, X, Shield
} from "lucide-react";

export const AdminUsersTab: React.FC = () => {
  const orbit = useOrbit();
  const { adminUsers, adminUpdateUserBalance, adminChangeUserStatus, adminResetUserPassword } = orbit;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [debitAmount, setDebitAmount] = useState("");
  const [creditNotes, setCreditNotes] = useState("");
  const [debitNotes, setDebitNotes] = useState("");
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const filteredUsers = adminUsers.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showFeedback = (type: "success" | "error", message: string) => {
    setActionFeedback({ type, message });
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleCredit = async (email: string, currentBalance: number) => {
    const amt = parseFloat(creditAmount);
    if (isNaN(amt) || amt <= 0) { showFeedback("error", "Enter a valid amount."); return; }
    try {
      await adminUpdateUserBalance(email, currentBalance + amt, {
        type: "credit",
        amount: amt,
        label: "Deposit Successful",
        notes: creditNotes || `Admin credited $${amt}`
      });
      showFeedback("success", `Credited $${amt.toLocaleString()} to ${email}`);
      setCreditAmount("");
      setCreditNotes("");
    } catch { showFeedback("error", "Failed to credit balance."); }
  };

  const handleDebit = async (email: string, currentBalance: number) => {
    const amt = parseFloat(debitAmount);
    if (isNaN(amt) || amt <= 0) { showFeedback("error", "Enter a valid amount."); return; }
    if (amt > currentBalance) { showFeedback("error", "Debit exceeds user balance."); return; }
    try {
      await adminUpdateUserBalance(email, currentBalance - amt, {
        type: "debit",
        amount: amt,
        label: "Admin Debit",
        notes: debitNotes || `Admin deducted $${amt}`
      });
      showFeedback("success", `Deducted $${amt.toLocaleString()} from ${email}`);
      setDebitAmount("");
      setDebitNotes("");
    } catch { showFeedback("error", "Failed to debit balance."); }
  };

  const statusColors: Record<string, string> = {
    active: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    suspended: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    banned: "text-red-400 bg-red-500/10 border-red-500/30"
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <div className="bg-orbit-card border border-orbit-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-orbit-white flex items-center gap-2">
              <DollarSign size={20} className="text-orbit-accent" /> Add or Take Money
            </h1>
            <p className="text-xs text-orbit-gray-text mt-1">Credit or debit any user's balance directly from this panel.</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-orbit-accent bg-orbit-accent/10 border border-orbit-accent/30 px-3 py-1.5 rounded-full">
            <Users size={12} /> {adminUsers.length} Total Users
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {actionFeedback && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${actionFeedback.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
          {actionFeedback.type === "success" ? <Check size={14} /> : <X size={14} />}
          {actionFeedback.message}
        </motion.div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-orbit-gray-text" />
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-orbit-card border border-orbit-border rounded-xl text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent transition-colors"
        />
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.map(u => {
          const isExpanded = expandedUser === u.email;
          return (
            <div key={u.email} className="bg-orbit-card border border-orbit-border rounded-2xl overflow-hidden transition-all">
              {/* User Row */}
              <button
                onClick={() => setExpandedUser(isExpanded ? null : u.email)}
                className="w-full flex items-center justify-between p-4 hover:bg-orbit-border/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orbit-accent to-[#FF7F00] flex items-center justify-center text-orbit-bg text-xs font-black">
                    {u.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-orbit-white">{u.name}</p>
                    <p className="text-[10px] text-orbit-gray-text">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-orbit-white font-data">${u.balance.toLocaleString()}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusColors[u.status]}`}>
                    {u.status.toUpperCase()}
                  </span>
                  {isExpanded ? <ChevronUp size={14} className="text-orbit-gray-text" /> : <ChevronDown size={14} className="text-orbit-gray-text" />}
                </div>
              </button>

              {/* Expanded Panel */}
              {isExpanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="border-t border-orbit-border p-4 space-y-4 bg-orbit-bg/50">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-orbit-card border border-orbit-border/50 rounded-lg p-3">
                      <p className="text-[9px] text-orbit-gray-text uppercase font-bold">Balance</p>
                      <p className="text-sm font-bold text-orbit-white font-data">${u.balance.toLocaleString()}</p>
                    </div>
                    <div className="bg-orbit-card border border-orbit-border/50 rounded-lg p-3">
                      <p className="text-[9px] text-orbit-gray-text uppercase font-bold">Portfolio</p>
                      <p className="text-sm font-bold text-orbit-white font-data">${u.portfolioValue.toLocaleString()}</p>
                    </div>
                    <div className="bg-orbit-card border border-orbit-border/50 rounded-lg p-3">
                      <p className="text-[9px] text-orbit-gray-text uppercase font-bold">Investments</p>
                      <p className="text-sm font-bold text-orbit-white font-data">{u.activeInvestments.length}</p>
                    </div>
                    <div className="bg-orbit-card border border-orbit-border/50 rounded-lg p-3">
                      <p className="text-[9px] text-orbit-gray-text uppercase font-bold">KYC</p>
                      <p className="text-sm font-bold text-orbit-white font-data">{u.kyc?.status || "Unverified"}</p>
                    </div>
                  </div>

                  {/* Credit / Debit Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Credit */}
                    <div className="bg-orbit-card border border-emerald-500/20 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2"><Plus size={14} /> Credit Balance</h4>
                      <input type="number" placeholder="Amount ($)" value={creditAmount} onChange={e => setCreditAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-emerald-500"
                      />
                      <input type="text" placeholder="Notes (optional)" value={creditNotes} onChange={e => setCreditNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-xs text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-emerald-500"
                      />
                      <button onClick={() => handleCredit(u.email, u.balance)}
                        className="w-full py-2 bg-emerald-500 text-white font-bold text-xs uppercase rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer">
                        Add Funds
                      </button>
                    </div>
                    {/* Debit */}
                    <div className="bg-orbit-card border border-red-500/20 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-red-400 flex items-center gap-2"><Minus size={14} /> Debit Balance</h4>
                      <input type="number" placeholder="Amount ($)" value={debitAmount} onChange={e => setDebitAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-red-500"
                      />
                      <input type="text" placeholder="Notes (optional)" value={debitNotes} onChange={e => setDebitNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-xs text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-red-500"
                      />
                      <button onClick={() => handleDebit(u.email, u.balance)}
                        className="w-full py-2 bg-red-500 text-white font-bold text-xs uppercase rounded-lg hover:bg-red-600 transition-colors cursor-pointer">
                        Deduct Funds
                      </button>
                    </div>
                  </div>

                  {/* Account Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-orbit-border/50">
                    <button onClick={() => { adminChangeUserStatus(u.email, "active"); showFeedback("success", `${u.name} set to active.`); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-lg hover:bg-emerald-500/20 transition-colors cursor-pointer">
                      <UserCheck size={12} /> Activate
                    </button>
                    <button onClick={() => { adminChangeUserStatus(u.email, "suspended"); showFeedback("success", `${u.name} suspended.`); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] font-bold rounded-lg hover:bg-yellow-500/20 transition-colors cursor-pointer">
                      <AlertTriangle size={12} /> Suspend
                    </button>
                    <button onClick={() => { adminChangeUserStatus(u.email, "banned"); showFeedback("success", `${u.name} banned.`); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold rounded-lg hover:bg-red-500/20 transition-colors cursor-pointer">
                      <Ban size={12} /> Ban
                    </button>
                    <button onClick={() => { adminResetUserPassword(u.email); showFeedback("success", `Password reset sent to ${u.email}.`); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-orbit-accent/10 border border-orbit-accent/30 text-orbit-accent text-[10px] font-bold rounded-lg hover:bg-orbit-accent/20 transition-colors cursor-pointer">
                      <Key size={12} /> Reset Password
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-orbit-gray-text text-sm">No users found matching "{searchQuery}"</div>
        )}
      </div>
    </motion.div>
  );
};
