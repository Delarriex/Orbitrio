import React, { useState, useMemo } from "react";
import { History, ChevronDown, CheckCircle2, Clock, XCircle, AlertTriangle, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useOrbit } from "../context/OrbitContext";

export const DashboardTransactions: React.FC = () => {
  const { user } = useOrbit();

  const [filterType, setFilterType] = useState<"" | "deposit" | "withdrawal">(""); 
  const [filterStatus, setFilterStatus] = useState<"" | "completed" | "pending" | "failed" | "rejected">(""); 
  const [filterTime, setFilterTime] = useState<"" | "7" | "30" | "90">(""); 

  const filtered = useMemo(() => {
    let items = [...user.transactions];

    if (filterType) {
      items = items.filter(t => t.type === filterType);
    }
    if (filterStatus) {
      items = items.filter(t => t.status === filterStatus);
    }
    if (filterTime) {
      const days = parseInt(filterTime);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      items = items.filter(t => new Date(t.date) >= cutoff);
    }

    return items;
  }, [user.transactions, filterType, filterStatus, filterTime]);

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-orbit-green">
            <CheckCircle2 size={12} /> Completed
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-400">
            <Clock size={12} /> Pending
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-orbit-red">
            <XCircle size={12} /> Failed
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-orbit-red">
            <AlertTriangle size={12} /> Rejected
          </span>
        );
      default:
        return <span className="text-[10px] text-orbit-gray-text">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans overflow-x-hidden">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold font-heading text-orbit-white flex items-center gap-2">
          <History className="text-orbit-accent" size={24} />
          Transaction History
        </h2>
        
        {/* Filter Pills — Now functional */}
        <div className="flex flex-row overflow-x-auto whitespace-nowrap gap-2 justify-start w-full pb-1">
          <div className="relative">
            <select 
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
              className="appearance-none bg-orbit-card border border-orbit-border text-[11px] py-1.5 px-3 pr-7 rounded-full hover:border-orbit-accent/50 transition-colors text-orbit-white cursor-pointer outline-none focus:border-orbit-accent"
            >
              <option value="">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
            </select>
            <ChevronDown size={10} className="absolute top-1/2 right-2.5 -translate-y-1/2 text-orbit-gray-text pointer-events-none" />
          </div>
          <div className="relative">
            <select 
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="appearance-none bg-orbit-card border border-orbit-border text-[11px] py-1.5 px-3 pr-7 rounded-full hover:border-orbit-accent/50 transition-colors text-orbit-white cursor-pointer outline-none focus:border-orbit-accent"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronDown size={10} className="absolute top-1/2 right-2.5 -translate-y-1/2 text-orbit-gray-text pointer-events-none" />
          </div>
          <div className="relative">
            <select 
              value={filterTime}
              onChange={e => setFilterTime(e.target.value as any)}
              className="appearance-none bg-orbit-card border border-orbit-border text-[11px] py-1.5 px-3 pr-7 rounded-full hover:border-orbit-accent/50 transition-colors text-orbit-white cursor-pointer outline-none focus:border-orbit-accent"
            >
              <option value="">All Time</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
            <ChevronDown size={10} className="absolute top-1/2 right-2.5 -translate-y-1/2 text-orbit-gray-text pointer-events-none" />
          </div>

          {(filterType || filterStatus || filterTime) && (
            <button
              onClick={() => { setFilterType(""); setFilterStatus(""); setFilterTime(""); }}
              className="text-[10px] text-orbit-accent hover:text-orbit-white px-3 py-1.5 rounded-full border border-orbit-accent/30 bg-orbit-accent/5 font-bold cursor-pointer transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="bg-orbit-card border border-orbit-border rounded-xl">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-orbit-gray-text text-sm">
            {user.transactions.length === 0 
              ? "No transactions yet. Deposit funds to get started." 
              : "No transactions match your filters."}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-orbit-border/30">
            {filtered.map((tx) => {
              const isDeposit = tx.type === "deposit";
              const amountDisplay = isDeposit ? `+$${tx.amount.toLocaleString()}` : `-$${tx.amount.toLocaleString()}`;

              return (
                <div key={tx.id} className="flex justify-between items-center py-4 px-4 hover:bg-orbit-darkcard/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDeposit ? "bg-orbit-green/10 text-orbit-green" : "bg-orbit-accent/10 text-orbit-accent"}`}>
                      {isDeposit ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-orbit-white">{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</span>
                      <span className="text-[10px] text-orbit-gray-text font-mono">{tx.date} • {tx.asset}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className={`text-sm font-bold font-data ${isDeposit ? "text-orbit-green" : "text-orbit-white"}`}>
                      {amountDisplay}
                    </span>
                    {statusBadge(tx.status)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
