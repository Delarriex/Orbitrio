import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Ban,
  Check,
  ClipboardList,
  DollarSign,
  Edit3,
  Key,
  Loader2,
  Search,
  Shield,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  X
} from "lucide-react";
import { useOrbit } from "../../../context/OrbitContext";
import type { SimulatedUser, Transaction } from "../../../types";

type Feedback = { type: "success" | "error"; message: string };
type KycViewStatus = "pending" | "approved" | "rejected" | "unverified";

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(amount);

const formatDate = (value?: string) => {
  if (!value) return "Not captured";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join("") || "U";

const shortValue = (value: string, left = 12, right = 5) =>
  value.length > left + right + 3 ? `${value.slice(0, left)}...${value.slice(-right)}` : value;

const statusStyles: Record<SimulatedUser["status"], string> = {
  active: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  suspended: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  banned: "text-red-400 bg-red-500/10 border-red-500/30"
};

const kycStyles: Record<KycViewStatus, string> = {
  pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  approved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  rejected: "text-red-400 bg-red-500/10 border-red-500/30",
  unverified: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30"
};

const recentTransactions = (user: SimulatedUser, type: Transaction["type"]) =>
  user.transactions
    .filter(transaction => transaction.type === type)
    .sort((a, b) => {
      const dateA = Date.parse(a.date);
      const dateB = Date.parse(b.date);
      if (!Number.isNaN(dateA) && !Number.isNaN(dateB) && dateA !== dateB) return dateB - dateA;
      return b.id.localeCompare(a.id);
    })
    .slice(0, 5);

const activeCopyTrades = (user: SimulatedUser) =>
  user.transactions
    .filter(transaction =>
      transaction.type === "investment" &&
      transaction.status === "completed" &&
      (transaction.id.startsWith("tx-copy") || transaction.notes?.toLowerCase().includes("mirror allocation"))
    )
    .slice(0, 5);

export const AdminUsersTab: React.FC = () => {
  const {
    adminUsers,
    adminUpdateUserBalance,
    adminChangeUserStatus,
    adminResetUserPassword,
    adminKycReview
  } = useOrbit();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [balanceDrafts, setBalanceDrafts] = useState<Record<string, string>>({});
  const [kycReasons, setKycReasons] = useState<Record<string, string>>({});
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const isLoading = !Array.isArray(adminUsers);

  const userResult = useMemo(() => {
    try {
      const rows = [...adminUsers].sort((a, b) => {
        const dateA = Date.parse(a.registrationDate || "");
        const dateB = Date.parse(b.registrationDate || "");
        if (!Number.isNaN(dateA) && !Number.isNaN(dateB) && dateA !== dateB) return dateB - dateA;
        return a.name.localeCompare(b.name);
      });

      return { rows, error: null as string | null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to prepare user records.";
      return { rows: [] as SimulatedUser[], error: message };
    }
  }, [adminUsers]);

  const users = userResult.rows;
  const selectedUser = users.find(user => user.email === selectedEmail) || null;

  useEffect(() => {
    if (selectedEmail && !selectedUser) setSelectedEmail(null);
  }, [selectedEmail, selectedUser]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;

    return users.filter(user =>
      [
        user.name,
        user.email,
        user.username || "",
        user.phone || "",
        user.country || "",
        user.status,
        user.kyc?.status || "unverified"
      ].join(" ").toLowerCase().includes(query)
    );
  }, [searchQuery, users]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(user => user.status === "active").length,
    suspended: users.filter(user => user.status === "suspended" || user.status === "banned").length,
    pendingKyc: users.filter(user => user.kyc?.status === "pending").length
  }), [users]);

  const showFeedback = (type: Feedback["type"], message: string) => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback(null), 3500);
  };

  const runAction = async (key: string, action: () => void | Promise<void>, successMessage: string) => {
    try {
      setBusyAction(key);
      await action();
      showFeedback("success", successMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Admin action failed.";
      showFeedback("error", message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleBalanceSave = (user: SimulatedUser) => {
    const nextBalance = parseFloat(balanceDrafts[user.email] ?? user.balance.toString());
    if (Number.isNaN(nextBalance) || nextBalance < 0) {
      showFeedback("error", "Enter a valid non-negative balance.");
      return;
    }

    runAction(
      `balance-${user.email}`,
      async () => {
        await adminUpdateUserBalance(user.email, Number(nextBalance.toFixed(2)), {
          type: nextBalance >= user.balance ? "credit" : "debit",
          amount: Math.abs(nextBalance - user.balance),
          label: "Admin Balance Edit",
          notes: adminNotes[user.email] || `Admin set balance to ${formatMoney(nextBalance)}`
        });
        setBalanceDrafts(prev => ({ ...prev, [user.email]: nextBalance.toString() }));
      },
      `Balance updated for ${user.email}.`
    );
  };

  const handleKycReview = (user: SimulatedUser, status: "approved" | "rejected") => {
    const reason = kycReasons[user.email] || "Documents not sufficient.";
    runAction(
      `kyc-${status}-${user.email}`,
      () => adminKycReview(user.email, status, status === "rejected" ? reason : undefined),
      `KYC ${status} for ${user.email}.`
    );
  };

  const openDrawer = (user: SimulatedUser) => {
    setSelectedEmail(user.email);
    setBalanceDrafts(prev => ({ ...prev, [user.email]: prev[user.email] ?? user.balance.toString() }));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="bg-orbit-card border border-orbit-border rounded-2xl p-6 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5">
        <div>
          <h1 className="text-xl font-bold text-orbit-white flex items-center gap-2">
            <Users size={20} className="text-orbit-accent" /> User Management
          </h1>
          <p className="text-xs text-orbit-gray-text mt-1">Monitor accounts, balances, verification, wallet activity, and administrative controls.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <StatBadge label="Total Users" value={stats.total} />
          <StatBadge label="Active Users" value={stats.active} tone="green" />
          <StatBadge label="Suspended" value={stats.suspended} tone="yellow" />
          <StatBadge label="Pending KYC" value={stats.pendingKyc} tone="red" />
        </div>
      </div>

      {feedback && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${feedback.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
          {feedback.type === "success" ? <Check size={14} /> : <X size={14} />}
          {feedback.message}
        </motion.div>
      )}

      <div className="bg-orbit-card border border-orbit-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-orbit-border flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-orbit-white flex items-center gap-2">
              <ClipboardList size={16} className="text-orbit-accent" /> Accounts
            </h2>
            <p className="text-[11px] text-orbit-gray-text mt-1">Use Manage to open a full account operations panel.</p>
          </div>
          <div className="relative w-full lg:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-orbit-gray-text" />
            <input
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Search users"
              className="w-full pl-9 pr-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-xs text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent"
            />
          </div>
        </div>

        {isLoading && (
          <StateMessage icon={<Loader2 size={18} className="animate-spin" />} title="Loading users" message="Preparing account records for review." />
        )}

        {!isLoading && userResult.error && (
          <StateMessage icon={<AlertCircle size={18} />} title="Unable to load users" message={userResult.error} tone="error" />
        )}

        {!isLoading && !userResult.error && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left">
                <thead className="bg-orbit-bg/60 border-b border-orbit-border">
                  <tr className="text-[10px] uppercase tracking-wider text-orbit-gray-text">
                    <th className="px-5 py-3 font-bold">Avatar</th>
                    <th className="px-4 py-3 font-bold">Name</th>
                    <th className="px-4 py-3 font-bold">Email</th>
                    <th className="px-4 py-3 font-bold">Balance</th>
                    <th className="px-4 py-3 font-bold">KYC Status</th>
                    <th className="px-4 py-3 font-bold">Account Status</th>
                    <th className="px-4 py-3 font-bold">Registration Date</th>
                    <th className="px-5 py-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orbit-border/70">
                  {filteredUsers.map(user => {
                    const kycStatus = user.kyc?.status || "unverified";
                    return (
                      <tr key={user.email} className="hover:bg-orbit-bg/40 transition-colors">
                        <td className="px-5 py-4">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orbit-accent to-[#FF7F00] flex items-center justify-center text-orbit-bg text-xs font-black">
                            {getInitials(user.name)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-orbit-white">{user.name}</p>
                          <p className="text-[10px] text-orbit-gray-text">{user.accountType || user.username || "Standard account"}</p>
                        </td>
                        <td className="px-4 py-4 text-xs text-orbit-gray-text">{user.email}</td>
                        <td className="px-4 py-4 text-xs font-bold text-orbit-white font-data">{formatMoney(user.balance)}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold ${kycStyles[kycStatus]}`}>
                            {kycStatus.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold ${statusStyles[user.status]}`}>
                            {user.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs text-orbit-gray-text">{formatDate(user.registrationDate)}</td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end">
                            <button onClick={() => openDrawer(user)} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-orbit-accent text-orbit-bg font-bold text-[10px] uppercase rounded-lg hover:bg-[#DFAD12] transition-colors cursor-pointer">
                              <Edit3 size={12} /> Manage
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <StateMessage title="No users found" message={searchQuery ? "No accounts match your current search." : "No user accounts have been registered yet."} />
            )}
          </>
        )}
      </div>

      {selectedUser && (
        <UserDrawer
          user={selectedUser}
          balanceDraft={balanceDrafts[selectedUser.email] ?? selectedUser.balance.toString()}
          kycReason={kycReasons[selectedUser.email] || ""}
          adminNote={adminNotes[selectedUser.email] || ""}
          busyAction={busyAction}
          onClose={() => setSelectedEmail(null)}
          onBalanceChange={value => setBalanceDrafts(prev => ({ ...prev, [selectedUser.email]: value }))}
          onKycReasonChange={value => setKycReasons(prev => ({ ...prev, [selectedUser.email]: value }))}
          onAdminNoteChange={value => setAdminNotes(prev => ({ ...prev, [selectedUser.email]: value }))}
          onSaveBalance={() => handleBalanceSave(selectedUser)}
          onActivate={() => runAction(`status-active-${selectedUser.email}`, () => adminChangeUserStatus(selectedUser.email, "active"), `${selectedUser.name} activated.`)}
          onSuspend={() => runAction(`status-suspended-${selectedUser.email}`, () => adminChangeUserStatus(selectedUser.email, "suspended"), `${selectedUser.name} suspended.`)}
          onResetPassword={() => runAction(`reset-${selectedUser.email}`, () => adminResetUserPassword(selectedUser.email), `Password reset sent to ${selectedUser.email}.`)}
          onApproveKyc={() => handleKycReview(selectedUser, "approved")}
          onRejectKyc={() => handleKycReview(selectedUser, "rejected")}
        />
      )}
    </motion.div>
  );
};

const UserDrawer: React.FC<{
  user: SimulatedUser;
  balanceDraft: string;
  kycReason: string;
  adminNote: string;
  busyAction: string | null;
  onClose: () => void;
  onBalanceChange: (value: string) => void;
  onKycReasonChange: (value: string) => void;
  onAdminNoteChange: (value: string) => void;
  onSaveBalance: () => void;
  onActivate: () => void;
  onSuspend: () => void;
  onResetPassword: () => void;
  onApproveKyc: () => void;
  onRejectKyc: () => void;
}> = ({
  user,
  balanceDraft,
  kycReason,
  adminNote,
  busyAction,
  onClose,
  onBalanceChange,
  onKycReasonChange,
  onAdminNoteChange,
  onSaveBalance,
  onActivate,
  onSuspend,
  onResetPassword,
  onApproveKyc,
  onRejectKyc
}) => {
  const deposits = recentTransactions(user, "deposit");
  const withdrawals = recentTransactions(user, "withdrawal");
  const copyTrades = activeCopyTrades(user);
  const kycStatus = user.kyc?.status || "unverified";
  const balanceBusy = busyAction === `balance-${user.email}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <motion.aside initial={{ x: 480 }} animate={{ x: 0 }} transition={{ type: "spring", damping: 28, stiffness: 260 }} onClick={event => event.stopPropagation()} className="h-full w-full max-w-2xl bg-orbit-bg border-l border-orbit-border shadow-2xl overflow-y-auto">
        <div className="sticky top-0 z-10 bg-orbit-bg/95 backdrop-blur border-b border-orbit-border px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orbit-accent to-[#FF7F00] flex items-center justify-center text-orbit-bg text-sm font-black shrink-0">
              {getInitials(user.name)}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-orbit-white truncate">{user.name}</h3>
              <p className="text-[11px] text-orbit-gray-text truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-orbit-card border border-orbit-border text-orbit-gray-text hover:text-orbit-white hover:border-orbit-accent cursor-pointer" title="Close panel">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <Section title="User Profile" icon={<Users size={15} className="text-orbit-accent" />}>
            <div className="grid grid-cols-2 gap-3">
              <InfoItem label="Name" value={user.name} />
              <InfoItem label="Username" value={user.username || "Not set"} />
              <InfoItem label="Phone" value={user.phone || "Not captured"} />
              <InfoItem label="Country" value={user.country || "Not captured"} />
              <InfoItem label="Currency" value={user.currency || "USD"} />
              <InfoItem label="Registered" value={formatDate(user.registrationDate)} />
            </div>
          </Section>

          <Section title="Wallet Balances" icon={<Wallet size={15} className="text-orbit-accent" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Metric label="Available Balance" value={formatMoney(user.balance)} />
              <Metric label="Portfolio Value" value={formatMoney(user.portfolioValue)} />
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
              <input
                type="number"
                min="0"
                value={balanceDraft}
                onChange={event => onBalanceChange(event.target.value)}
                className="w-full px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent"
                placeholder="Set wallet balance"
              />
              <button onClick={onSaveBalance} disabled={balanceBusy} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-orbit-accent text-orbit-bg font-bold text-[10px] uppercase rounded-lg hover:bg-[#DFAD12] disabled:opacity-60 cursor-pointer">
                {balanceBusy ? <Loader2 size={12} className="animate-spin" /> : <DollarSign size={12} />} Save Balance
              </button>
            </div>
          </Section>

          <Section title="KYC Information" icon={<Shield size={15} className="text-orbit-accent" />}>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold ${kycStyles[kycStatus]}`}>{kycStatus.toUpperCase()}</span>
              {user.kyc?.rejectionReason && <span className="text-[11px] text-red-400">Previous rejection: {user.kyc.rejectionReason}</span>}
            </div>
            {user.kyc ? (
              <div className="grid grid-cols-2 gap-3">
                <InfoItem label="ID Type" value={user.kyc.idType || "Not captured"} />
                <InfoItem label="ID Number" value={user.kyc.idNumber || "Not captured"} />
                <InfoItem label="Date of Birth" value={user.kyc.dob || "Not captured"} />
                <InfoItem label="Country" value={user.kyc.country || "Not captured"} />
                <InfoItem label="City" value={user.kyc.city || "Not captured"} />
                <InfoItem label="Address" value={user.kyc.address || "Not captured"} />
              </div>
            ) : (
              <p className="text-xs text-orbit-gray-text">This user has not submitted identity documents.</p>
            )}
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <button onClick={onApproveKyc} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-500 text-white font-bold text-xs uppercase rounded-lg hover:bg-emerald-600 cursor-pointer">
                <Check size={14} /> Approve KYC
              </button>
              <input
                value={kycReason}
                onChange={event => onKycReasonChange(event.target.value)}
                placeholder="Rejection reason"
                className="flex-1 px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-xs text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent"
              />
              <button onClick={onRejectKyc} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-500 text-white font-bold text-xs uppercase rounded-lg hover:bg-red-600 cursor-pointer">
                <X size={14} /> Reject
              </button>
            </div>
          </Section>

          <Section title="Active Investments" icon={<TrendingUp size={15} className="text-orbit-accent" />}>
            <RecordList
              empty="No active investments."
              rows={user.activeInvestments.filter(investment => investment.status === "Running" || investment.status === "active").map(investment => ({
                id: investment.id,
                title: investment.name,
                meta: `${formatDate(investment.startDate)} - ${formatDate(investment.endDate)}`,
                value: formatMoney(investment.amount),
                status: `${investment.progress}%`
              }))}
            />
          </Section>

          <Section title="Active Copy Trades" icon={<UserCheck size={15} className="text-orbit-accent" />}>
            <RecordList
              empty="No active copy trade allocations found."
              rows={copyTrades.map(transaction => ({
                id: transaction.id,
                title: transaction.notes?.replace("Mirror allocation activated for master trader ", "") || "Copy trade",
                meta: formatDate(transaction.date),
                value: formatMoney(transaction.amount),
                status: transaction.status
              }))}
            />
          </Section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Section title="Recent Deposits" icon={<ArrowDownLeft size={15} className="text-emerald-400" />}>
              <TransactionList rows={deposits} empty="No recent deposits." />
            </Section>
            <Section title="Recent Withdrawals" icon={<ArrowUpRight size={15} className="text-[#DFAD12]" />}>
              <TransactionList rows={withdrawals} empty="No recent withdrawals." />
            </Section>
          </div>

          <Section title="Admin Notes" icon={<Edit3 size={15} className="text-orbit-accent" />}>
            <textarea
              rows={4}
              value={adminNote}
              onChange={event => onAdminNoteChange(event.target.value)}
              placeholder="Private admin notes for this review session"
              className="w-full px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-xs text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent resize-none"
            />
          </Section>

          <Section title="Account Actions" icon={<AlertTriangle size={15} className="text-yellow-400" />}>
            <div className="flex flex-wrap gap-2">
              <button onClick={onActivate} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-lg hover:bg-emerald-500/20 cursor-pointer">
                <UserCheck size={12} /> Activate
              </button>
              <button onClick={onSuspend} className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] font-bold rounded-lg hover:bg-yellow-500/20 cursor-pointer">
                <Ban size={12} /> Suspend
              </button>
              <button onClick={onResetPassword} className="flex items-center gap-1.5 px-3 py-2 bg-orbit-accent/10 border border-orbit-accent/30 text-orbit-accent text-[10px] font-bold rounded-lg hover:bg-orbit-accent/20 cursor-pointer">
                <Key size={12} /> Reset Password
              </button>
            </div>
          </Section>
        </div>
      </motion.aside>
    </motion.div>
  );
};

const StatBadge: React.FC<{ label: string; value: number; tone?: "default" | "yellow" | "green" | "red" }> = ({ label, value, tone = "default" }) => {
  const toneClass = tone === "yellow"
    ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
    : tone === "green"
      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
      : tone === "red"
        ? "bg-red-500/10 border-red-500/20 text-red-400"
        : "bg-orbit-bg border-orbit-border text-orbit-white";

  return (
    <div className={`px-3 py-2 border rounded-lg min-w-[92px] ${toneClass}`}>
      <p className="text-[9px] uppercase text-orbit-gray-text tracking-wider">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
};

const StateMessage: React.FC<{ icon?: React.ReactNode; title: string; message: string; tone?: "default" | "error" }> = ({ icon, title, message, tone = "default" }) => {
  const toneClass = tone === "error" ? "text-red-400" : "text-orbit-gray-text";

  return (
    <div className={`py-14 px-6 text-center ${toneClass}`}>
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-orbit-bg border border-orbit-border">
        {icon || <ClipboardList size={18} />}
      </div>
      <p className="text-sm font-bold text-orbit-white">{title}</p>
      <p className="mt-1 text-xs text-orbit-gray-text">{message}</p>
    </div>
  );
};

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <section className="bg-orbit-card border border-orbit-border rounded-xl p-4">
    <h4 className="text-xs font-bold text-orbit-white flex items-center gap-2 mb-3">
      {icon} {title}
    </h4>
    {children}
  </section>
);

const InfoItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="min-w-0">
    <p className="text-[9px] uppercase text-orbit-gray-text tracking-wider">{label}</p>
    <p className="mt-1 text-xs font-bold text-orbit-white break-words">{value}</p>
  </div>
);

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-orbit-bg border border-orbit-border rounded-lg p-3">
    <p className="text-[9px] uppercase text-orbit-gray-text tracking-wider">{label}</p>
    <p className="mt-1 text-sm font-bold text-orbit-white font-data">{value}</p>
  </div>
);

const RecordList: React.FC<{ rows: Array<{ id: string; title: string; meta: string; value: string; status: string }>; empty: string }> = ({ rows, empty }) => {
  if (rows.length === 0) return <p className="text-xs text-orbit-gray-text">{empty}</p>;

  return (
    <div className="space-y-2">
      {rows.map(row => (
        <div key={row.id} className="flex items-start justify-between gap-3 bg-orbit-bg border border-orbit-border rounded-lg p-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-orbit-white truncate">{row.title}</p>
            <p className="text-[10px] text-orbit-gray-text mt-1">{row.meta}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-bold text-orbit-white font-data">{row.value}</p>
            <p className="text-[10px] text-orbit-accent uppercase font-bold mt-1">{row.status}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const TransactionList: React.FC<{ rows: Transaction[]; empty: string }> = ({ rows, empty }) => {
  if (rows.length === 0) return <p className="text-xs text-orbit-gray-text">{empty}</p>;

  return (
    <div className="space-y-2">
      {rows.map(row => (
        <div key={row.id} className="bg-orbit-bg border border-orbit-border rounded-lg p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-orbit-white" title={row.id}>{shortValue(row.id)}</p>
              <p className="text-[10px] text-orbit-gray-text mt-1">{row.asset} / {formatDate(row.date)}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-orbit-white font-data">{formatMoney(row.amount)}</p>
              <p className="text-[10px] text-orbit-accent uppercase font-bold mt-1">{row.status}</p>
            </div>
          </div>
          {row.notes && <p className="mt-2 text-[10px] text-orbit-gray-text">{row.notes}</p>}
        </div>
      ))}
    </div>
  );
};

