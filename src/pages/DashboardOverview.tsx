import React, { useState } from "react";
import { useOrbit } from "../context/OrbitContext";
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Briefcase, 
  Layers, 
  Activity, 
  PlusCircle, 
  MinusCircle, 
  History,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Wallet,
  Shield,
  Copy,
  Check,
  Plus
} from "lucide-react";
import { motion } from "motion/react";
import { DashboardEquityChart } from "../components/charts/DashboardEquityChart";

interface DashboardOverviewProps {
  onNavigate: (view: string) => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ 
  onNavigate, 
  onOpenDeposit, 
  onOpenWithdraw 
}) => {
  const { user, plans, claimPlanPayout, topUpInvestment, addNotification, siteContent, setInsufficientBalanceOpen } = useOrbit();
  const [copiedUid, setCopiedUid] = useState(false);
  const [topUpTarget, setTopUpTarget] = useState<string | null>(null);
  const [topUpAmount, setTopUpAmount] = useState<string>("");

  const handleTopUp = (invId: string) => {
    const val = parseFloat(topUpAmount);
    if (isNaN(val) || val <= 0) {
      addNotification("Please enter a valid amount to top up.");
      return;
    }
    const res = topUpInvestment(invId, val);
    if (res.success) {
      setTopUpTarget(null);
      setTopUpAmount("");
    } else {
      if (res.message === "INSUFFICIENT_BALANCE") {
        setInsufficientBalanceOpen(true);
      } else {
        addNotification(res.message);
      }
    }
  };

  // Compute stats
  const availableCash = user.balance;
  const portfolioAssetsValue = user.portfolioValue; // Auto-updates via context market loops
  const activePlanCapital = user.activeInvestments.reduce((acc, current) => acc + current.amount, 0);
  const activePlanProfits = user.activeInvestments.reduce((acc, current) => acc + current.accumulatedProfit, 0);
  
  const aggregateNetWorth = +(availableCash + portfolioAssetsValue + activePlanCapital + activePlanProfits).toFixed(2);
  
  // Calculate P/L matching average purchase prices
  const totalCostBasis = user.portfolio.reduce((acc, cur) => acc + (cur.amount * cur.avgBuyPrice), 0);
  const netPnL = totalCostBasis > 0 ? +(portfolioAssetsValue - totalCostBasis).toFixed(2) : 0;
  const netPnLPercent = totalCostBasis > 0 ? +((netPnL / totalCostBasis) * 100).toFixed(2) : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-20"
    >
      
      {/* 1. Header welcome */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-orbit-border/50 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <Wallet size={24} className="text-orbit-accent shrink-0" />
            <h1 className="text-2xl font-bold font-sans tracking-tight text-orbit-white">
              Asset Overview
            </h1>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-sans">
            <span className="text-slate-400">
              Welcome back, <span className="text-orbit-white font-medium">{(user.name || user.email || "").toLowerCase()}</span>
            </span>
            
            <span className="hidden sm:inline text-slate-700 select-none font-normal">•</span>

            {/* UID Badge with Copy Action */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-[#121318]/50 hover:bg-[#121318] border border-orbit-border/40 py-0.5 px-2 rounded-md transition-all">
              <span className="text-[9px] uppercase tracking-wider text-slate-600 font-bold font-mono">UID</span>
              <span className="font-mono text-slate-400 font-medium select-all">87349102</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText("87349102");
                  setCopiedUid(true);
                  setTimeout(() => setCopiedUid(false), 2000);
                }}
                className="text-slate-500 hover:text-orbit-accent transition-colors p-0.5"
                title="Copy UID"
              >
                {copiedUid ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              </button>
            </div>

            {/* Security Badge */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-[#121318]/50 border border-orbit-border/40 py-0.5 px-2 rounded-md">
              <Shield size={11} className="text-slate-500 shrink-0" />
              <span className="text-slate-400">Security:</span>
              <span className="text-emerald-500 font-bold tracking-wide">High</span>
            </div>

            {/* Verification Badge */}
            {user.kyc?.status === "approved" ? (
              <div className="flex items-center gap-1 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-0.5 px-2.5 rounded-full font-medium shadow-sm">
                <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
                <span>Identity Verified</span>
              </div>
            ) : user.kyc?.status === "pending" ? (
              <div className="flex items-center gap-1 text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20 py-0.5 px-2.5 rounded-full font-medium shadow-sm">
                <AlertTriangle size={11} className="text-amber-400 shrink-0" />
                <span>Verification Pending</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[11px] bg-rose-500/10 text-rose-400 border border-rose-500/20 py-0.5 px-2.5 rounded-full font-medium shadow-sm">
                <AlertTriangle size={11} className="text-rose-400 shrink-0" />
                <span>Unverified Identity</span>
              </div>
            )}
          </div>
        </div>
 
        {/* Quick Deposit/Withdraw Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenDeposit}
            className="flex items-center gap-1.5 px-4 py-2 bg-orbit-accent text-orbit-bg font-bold font-subheading text-xs rounded-xl hover:opacity-95 shadow shadow-orbit-accent/20 hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <PlusCircle size={14} /> Deposit
          </button>
          <button
            onClick={onOpenWithdraw}
            className="flex items-center gap-1.5 px-4 py-2 bg-orbit-card border border-orbit-border hover:bg-orbit-card/80 text-orbit-white font-semibold font-subheading text-xs rounded-xl hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <MinusCircle size={14} /> Withdraw
          </button>
        </div>
      </motion.div>
 
      {/* 2. Core balances cards row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">
        
        {/* Net Worth */}
        <div className="bg-gradient-to-br from-orbit-card to-orbit-card/50 border border-orbit-border rounded-xl p-5 hover:border-orbit-accent/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-orbit-accent/5 transition-all duration-300 group">
          <div className="flex justify-between items-start text-orbit-gray-text">
            <span className="text-[10px] uppercase font-sans font-medium tracking-wider text-slate-400 group-hover:text-orbit-white transition-colors">Total Equity</span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <Briefcase size={16} />
            </span>
          </div>
          <div className="mt-4 space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-data text-orbit-white select-all">
                ${aggregateNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-slate-500 font-data font-medium">
                ≈ {((aggregateNetWorth) / 68500).toFixed(4)} BTC
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span className={`flex items-center font-data font-bold ${netPnL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {netPnL >= 0 ? "+" : ""}{netPnL.toLocaleString()} ({netPnLPercent}%)
              </span>
              <span className="text-slate-400 font-medium font-sans">Today's P&L</span>
            </div>
          </div>
        </div>
 
        {/* Available Cash balance */}
        <div className="bg-gradient-to-br from-orbit-card to-orbit-card/50 border border-orbit-border rounded-xl p-5 hover:border-orbit-accent/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-orbit-accent/5 transition-all duration-300 group">
          <div className="flex justify-between items-start text-orbit-gray-text">
            <span className="text-[10px] uppercase font-sans font-medium tracking-wider text-slate-400 group-hover:text-orbit-white transition-colors">Available Balance</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <DollarSign size={16} />
            </span>
          </div>
          <div className="mt-4 space-y-1">
            <span className="text-2xl font-black font-data text-orbit-white select-all">
              ${availableCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] text-slate-400 tracking-normal font-sans font-medium">
              In Orders: <span className="font-data">${activePlanCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> USD
            </p>
          </div>
        </div>
 
        {/* Portfolio Assets value */}
        <div className="bg-gradient-to-br from-orbit-card to-orbit-card/50 border border-orbit-border rounded-xl p-5 hover:border-orbit-accent/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-orbit-accent/5 transition-all duration-300 group">
          <div className="flex justify-between items-start text-orbit-gray-text">
            <span className="text-[10px] uppercase font-sans font-medium tracking-wider text-slate-400 group-hover:text-orbit-white transition-colors">Derivatives Account</span>
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
              <Activity size={16} />
            </span>
          </div>
          <div className="mt-4 space-y-1">
            <span className="text-2xl font-black font-data text-orbit-white animate-pulse">
              ${portfolioAssetsValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] text-slate-400 font-sans font-medium">
              Fluctuating with global indexes
            </p>
          </div>
        </div>
 
        {/* Dynamic active plan totals */}
        <div className="bg-gradient-to-br from-orbit-card to-orbit-card/50 border border-orbit-border rounded-xl p-5 hover:border-orbit-accent/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-orbit-accent/5 transition-all duration-300 group relative overflow-hidden">
          {/* Subtle gold flare for yield */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full" />
          <div className="flex justify-between items-start text-orbit-gray-text relative z-10">
            <span className="text-[10px] uppercase font-sans font-medium tracking-wider text-slate-400 group-hover:text-orbit-white transition-colors">Plan Yield Capital</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Layers size={16} />
            </span>
          </div>
          <div className="mt-4 space-y-1 relative z-10">
            <span className="text-2xl font-black font-data text-orbit-accent">
              ${(activePlanCapital + activePlanProfits).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <p className="text-[11px] text-emerald-400 font-data">
              +{activePlanProfits > 0 ? `$${activePlanProfits.toFixed(2)} accrued` : "0.00 accruals"}
            </p>
          </div>
        </div>
 
      </motion.div>

      {/* 2.5 Portfolio Performance Chart */}
      <motion.div variants={itemVariants} className="bg-orbit-card border border-orbit-border rounded-xl p-6 hover:shadow-lg hover:shadow-orbit-accent/5 transition-all duration-300">
        <div className="flex justify-between items-center border-b border-orbit-border/60 pb-4">
          <div className="flex items-center gap-2">
            <Activity className="text-orbit-accent" size={18} />
            <h3 className="text-sm font-bold font-heading text-orbit-white">30-Day Equity Trend</h3>
          </div>
          <span className="text-xs text-orbit-gray-text font-data">Live Updates</span>
        </div>
        <DashboardEquityChart currentEquity={aggregateNetWorth} />
      </motion.div>

      {/* 3. Middle split grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
        
        {/* Left column: Active Investment plans */}
        <div className="lg:col-span-7 bg-orbit-card border border-orbit-border rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-orbit-border/60 pb-4">
            <h3 className="text-sm font-bold font-heading text-orbit-white">Active Investments</h3>
            <button 
              onClick={() => onNavigate("dashboard-plans")}
              className="text-xs text-orbit-accent font-subheading hover:underline cursor-pointer"
            >
              View Plans
            </button>
          </div>

          {user.activeInvestments.length === 0 ? (
            <div className="py-12 text-center text-orbit-gray-text space-y-3 font-sans">
              <FileText className="mx-auto text-orbit-border" size={32} />
              <p className="text-xs">No active investments found.</p>
              <button
                onClick={() => onNavigate("dashboard-plans")}
                className="px-4 py-1.5 bg-orbit-border hover:bg-orbit-accent hover:text-orbit-bg text-[10px] font-bold font-subheading text-orbit-white rounded transition-colors cursor-pointer"
              >
                Explore Investment Plans
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {user.activeInvestments.map((inv) => {
                const isCompleted = inv.status === "completed";
                return (
                  <div 
                    key={inv.id}
                    className="p-4 border border-orbit-border bg-orbit-darkcard/50 rounded-xl space-y-3"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-orbit-white font-subheading">{inv.name}</span>
                        <span className="block text-[9px] text-orbit-gray-text font-data">
                          Matures: {inv.endDate}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-orbit-gray-text uppercase font-subheading">Compounded profit</span>
                        <strong className="font-data text-orbit-green font-bold">
                          +${inv.accumulatedProfit.toLocaleString(undefined, { minimumFractionDigits: 4 })}
                        </strong>
                      </div>
                    </div>

                    {/* Progress & Actions */}
                    <div className="flex items-center justify-between text-[10px] mt-2">
                      <span className="text-orbit-gray-text">Allocated: ${inv.amount.toLocaleString()}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-orbit-gray-text">Syncing loops: {inv.progress}%</span>
                        <button 
                          onClick={() => setTopUpTarget(topUpTarget === inv.id ? null : inv.id)}
                          className="text-[9px] text-orbit-accent border border-orbit-accent/30 bg-orbit-accent/10 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-orbit-accent/20 transition-colors"
                        >
                          <Plus size={10} /> Top Up
                        </button>
                      </div>
                    </div>

                    {/* Top Up Inline Form */}
                    {topUpTarget === inv.id && (
                      <div className="pt-2 mt-2 border-t border-orbit-border/50 flex gap-2 animate-in slide-in-from-top-2">
                        <input 
                          type="number"
                          placeholder="Amount to add ($)"
                          value={topUpAmount}
                          onChange={(e) => setTopUpAmount(e.target.value)}
                          className="w-full bg-orbit-bg border border-orbit-border rounded px-3 py-1 text-xs text-orbit-white outline-none focus:border-orbit-accent"
                        />
                        <button 
                          onClick={() => handleTopUp(inv.id)}
                          className="bg-orbit-accent text-orbit-bg px-3 py-1 rounded text-xs font-bold hover:opacity-90"
                        >
                          Confirm
                        </button>
                      </div>
                    )}
                    
                    <div className="w-full bg-orbit-bg rounded-full h-1.5 mt-2">
                      <div 
                        className="bg-orbit-accent h-1.5 rounded-full" 
                        style={{ width: `${inv.progress}%` }}
                      />
                    </div>

                    {/* Completion claim action */}
                    {isCompleted && (
                      <button
                        onClick={() => {
                          claimPlanPayout(inv.id);
                        }}
                        className="w-full py-2 bg-orbit-green/90 hover:bg-orbit-green text-orbit-bg font-bold font-subheading text-[11px] rounded transition-colors uppercase cursor-pointer"
                      >
                        Settle & Claim Maturity Yield
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Quick overview portfolio holdings */}
        <div className="lg:col-span-5 bg-orbit-card border border-orbit-border rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-orbit-border/60 pb-4">
            <h3 className="text-sm font-bold font-heading text-orbit-white">Open Positions</h3>
            <button 
              onClick={() => onNavigate("dashboard-portfolio")}
              className="text-xs font-subheading text-orbit-accent hover:underline cursor-pointer"
            >
              View Details
            </button>
          </div>

          {user.portfolio.length === 0 ? (
            <div className="py-12 text-center text-orbit-gray-text font-sans">
              <p className="text-xs">No open positions. Go to Trade to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {user.portfolio.map((asset) => {
                const totalCost = asset.amount * asset.avgBuyPrice;
                const totalMarket = asset.amount * asset.currentPrice;
                const profitLoss = +(totalMarket - totalCost).toFixed(2);
                
                return (
                  <div 
                    key={asset.symbol}
                    className="flex justify-between items-center p-3 border border-orbit-border/40 bg-orbit-bg/40 rounded-lg text-xs"
                  >
                    <div>
                      <strong className="font-data text-orbit-white block">{asset.symbol}</strong>
                      <span className="text-[10px] text-orbit-gray-text font-sans">{asset.amount} holdings</span>
                    </div>

                    <div className="text-right font-data">
                      <span className="text-orbit-white block font-semibold">${totalMarket.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <span className={`text-[10px] font-bold ${profitLoss >= 0 ? "text-orbit-green" : "text-orbit-red"}`}>
                        {profitLoss >= 0 ? "+" : ""}{profitLoss.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </motion.div>

      {/* 4. Bottom Paginated Ledger Transactions */}
      <motion.section variants={itemVariants} className="bg-orbit-card border border-orbit-border rounded-xl p-6 space-y-6 font-sans hover:shadow-lg hover:shadow-orbit-accent/5 transition-all duration-300">
        <div className="flex items-center justify-between border-b border-orbit-border/60 pb-4">
          <div className="flex items-center gap-2">
            <History className="text-orbit-accent animate-pulse" size={16} />
            <h3 className="text-sm font-bold font-heading text-orbit-white">Recent Transactions</h3>
          </div>
          <button 
            onClick={() => onNavigate("dashboard-transactions")}
            className="text-xs text-neutral-400 hover:text-amber-500 transition-colors"
          >
            View All
          </button>
        </div>

        {user.transactions.length === 0 ? (
          <p className="text-xs text-center text-orbit-gray-text py-6 font-sans">No past transactions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="border-b border-orbit-border text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text">
                  <th className="p-3">TxID</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Asset</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3 pr-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orbit-border/30 font-data">
                {user.transactions.slice(0, 4).map((tx) => (
                  <tr key={tx.id} className="hover:bg-orbit-darkcard/40 transition-colors">
                    <td className="p-3 font-semibold text-orbit-white">{tx.id}</td>
                    <td className="p-3 text-orbit-gray-text font-sans">{tx.date}</td>
                    <td className="p-3 uppercase">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold font-subheading ${
                        tx.type === "deposit" ? "bg-orbit-green/10 text-orbit-green" : 
                        tx.type === "withdrawal" ? "bg-orbit-red/10 text-orbit-red" : 
                        tx.type === "investment" ? "bg-orbit-accent/15 text-orbit-accent" : 
                        "bg-white/10 text-orbit-white"
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-orbit-white">{tx.asset}</td>
                    <td className="p-3 font-bold text-orbit-white">${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 pr-4 text-right">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold font-subheading ${
                        tx.status === "completed" || tx.status === "approved" ? "text-orbit-green" :
                        tx.status === "pending" ? "text-yellow-400" :
                        tx.status === "rejected" || tx.status === "failed" ? "text-orbit-red" :
                        "text-orbit-gray-text"
                      }`}>
                        {tx.status === "pending" ? <AlertTriangle size={12} /> : tx.status === "rejected" || tx.status === "failed" ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                        {tx.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>

    </motion.div>
  );
};
