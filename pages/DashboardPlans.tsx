import React, { useState } from "react";
import { useOrbit } from "../context/OrbitContext";
import { Check, Flame, Trophy, Layers, Target, Coins, ShieldAlert, Timer, TrendingUp, Activity, Sparkles, Crown, Gem, Award } from "lucide-react";

export const DashboardPlans: React.FC = () => {
  const { plans, user, investInPlan, claimPlanPayout, setInsufficientBalanceOpen } = useOrbit();
  const [selectedPlanId, setSelectedPlanId] = useState("plan-gold");
  const [investAmountText, setInvestAmountText] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "plan-bronze":
        return <Award size={18} className="text-[#a55a29] shrink-0" />;
      case "plan-silver":
        return <Layers size={18} className="text-[#94a3b8] shrink-0" />;
      case "plan-gold":
        return <Crown size={18} className="text-[#eab308] shrink-0" />;
      case "plan-platinum":
        return <Sparkles size={18} className="text-zinc-300 shrink-0" />;
      case "plan-diamond":
        return <Gem size={18} className="text-cyan-200 shrink-0" />;
      default:
        return <Coins size={18} className="text-orbit-accent shrink-0" />;
    }
  };

  const activePlanObj = plans.find(p => p.id === selectedPlanId) || plans[0];

  const handleInvestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const amount = parseFloat(investAmountText);
    if (!amount || amount <= 0) {
      setFeedback({ type: "error", message: "Please specify a valid numeric capital amount." });
      return;
    }

    const res = investInPlan(selectedPlanId, amount);
    if (res.success) {
      setFeedback({ type: "success", message: res.message });
      setInvestAmountText("");
    } else {
      if (res.message.toLowerCase().includes("insufficient") || res.message.toLowerCase().includes("not enough balance")) {
        setInsufficientBalanceOpen(true);
      } else {
        setFeedback({ type: "error", message: res.message });
      }
    }
  };

  // Calculates estimated returns for the input amount
  const getProjections = () => {
    const amt = parseFloat(investAmountText) || 0;
    const profit = amt * (activePlanObj.roiPercent / 100);
    return {
      profit: +profit.toFixed(2),
      total: +(amt + profit).toFixed(2),
      daily: +(profit / activePlanObj.durationDays).toFixed(2)
    };
  };

  const projections = getProjections();

  return (
    <div className="space-y-8 pb-20 font-sans">
      
      {/* Header title */}
      <div className="border-b border-orbit-border/50 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-orbit-white flex items-center gap-2.5">
            <TrendingUp size={24} className="text-orbit-accent shrink-0 animate-pulse" />
            <span>Investment Plans</span>
          </h1>
          <p className="text-xs text-orbit-gray-text mt-1 font-sans leading-relaxed">
            Choose your plan and target. Select a plan that fits your budget and timeline and start earning daily rewards. Track progress from your dashboard.
          </p>
        </div>
        <div className="bg-orbit-card border border-orbit-border rounded-xl py-2 px-4 shrink-0 font-subheading text-xs">
          Available Balance: <strong className="text-orbit-accent font-data">${user.balance.toLocaleString()}</strong>
        </div>
      </div>

      {/* Side-by-Side Plan Cards as requested by user */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 font-sans">
        {plans.map((p) => {
          const isSelected = p.id === selectedPlanId;
          const isPaused = p.status === "paused";
          return (
            <div 
              key={p.id}
              onClick={() => {
                if (!isPaused) {
                  setSelectedPlanId(p.id);
                  setFeedback(null);
                }
              }}
              className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-80 cursor-pointer ${
                isSelected 
                  ? "border-orbit-accent bg-orbit-accent/5 shadow-lg shadow-orbit-accent/10 scale-[1.01]" 
                  : "border-orbit-border bg-orbit-darkcard/40 hover:border-orbit-accent/40 hover:bg-orbit-darkcard/60"
              } ${isPaused ? "opacity-50 cursor-not-allowed border-red-500/10" : ""}`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 bg-orbit-accent text-orbit-bg font-black uppercase text-[8px] py-1 px-3 rounded-bl-xl tracking-widest font-subheading">
                  Selected
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <div className="inline-flex items-center justify-center bg-[#FF7F00]/10 border border-[#FF7F00]/20 p-1 rounded-md mb-2">
                    <Activity size={13} className="text-[#FF7F00] animate-pulse" />
                  </div>
                  <h3 className="text-base font-extrabold text-orbit-white tracking-tight font-sans mt-0.5 flex items-center gap-2">
                    {getPlanIcon(p.id)}
                    <span>{p.name}</span>
                  </h3>
                  <p className="text-[10px] text-zinc-400 mt-1.5 leading-normal font-sans line-clamp-2">{p.description}</p>
                </div>

                <div className="space-y-1.5 border-t border-orbit-border/50 pt-3">
                  <div className="flex justify-between text-[11px] font-sans">
                    <span className="text-orbit-gray-text">Duration:</span>
                    <strong className="text-orbit-white font-bold font-data flex items-center gap-1">
                      <Timer size={10} className="text-orbit-accent" />
                      {p.durationDays} Days
                    </strong>
                  </div>
                  <div className="flex justify-between text-[11px] font-sans">
                    <span className="text-orbit-gray-text">Deposit:</span>
                    <strong className="text-orbit-white font-bold font-data">
                      ${p.minDeposit.toLocaleString()} - {p.maxDeposit >= 10000000 ? "Unlimited" : `$${p.maxDeposit.toLocaleString()}`}
                    </strong>
                  </div>
                  <div className="flex justify-between text-[11px] font-sans">
                    <span className="text-orbit-gray-text">Returns:</span>
                    <strong className="text-orbit-green font-black font-data">
                      +{p.roiPercent}% ROI
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-orbit-border/30">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isPaused) {
                      setSelectedPlanId(p.id);
                      setFeedback(null);
                      // Scroll to amount input
                      document.getElementById("investAmountInput")?.focus();
                    }
                  }}
                  className={`w-full py-2 rounded-xl text-center text-[10px] font-black uppercase tracking-wider font-subheading transition-all ${
                    isPaused
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : isSelected
                        ? "bg-orbit-accent text-orbit-bg shadow hover:bg-opacity-95"
                        : "bg-orbit-border text-orbit-white hover:text-orbit-accent hover:border-orbit-accent border border-orbit-border"
                  }`}
                  disabled={isPaused}
                >
                  {isPaused ? "Suspended" : "Invest Now"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left column: Selector + Allocation inputs (col-span-7) */}
        <div className="lg:col-span-12 bg-orbit-card border border-orbit-border rounded-xl p-6 space-y-6">
          <h3 className="text-sm font-bold font-sans text-orbit-white border-b border-orbit-border/50 pb-3 flex flex-wrap items-center justify-between gap-y-2">
            <span className="flex items-center gap-2">
              <Coins size={16} className="text-orbit-accent animate-spin" style={{ animationDuration: "12s" }} />
              <span>Invest to Earn: <span className="text-orbit-accent font-sans font-extrabold">{activePlanObj.name}</span></span>
            </span>
            <span className="flex items-center gap-1.5 bg-[#121318]/50 border border-orbit-border/40 py-1 px-2.5 rounded-lg text-[11px] font-sans font-medium text-slate-400">
              {getPlanIcon(activePlanObj.id)}
              <span className="text-orbit-white font-semibold">{activePlanObj.name}</span>
            </span>
          </h3>

          <form onSubmit={handleInvestSubmit} className="space-y-6">
            
            {/* Display message logs */}
            {feedback && (
              <div className={`p-4 text-xs rounded-xl border font-sans ${
                feedback.type === "error" ? "bg-orbit-red/10 border-orbit-red/30 text-orbit-red" : "bg-orbit-green/10 border-orbit-green/30 text-orbit-green"
              }`}>
                {feedback.message}
              </div>
            )}

            {/* Selected Plan statistics parameters */}
            <div className="grid grid-cols-3 gap-4 border border-orbit-border/70 p-4 bg-orbit-darkcard/35 rounded-xl text-xs font-sans">
              <div className="space-y-1">
                <span className="text-orbit-gray-text text-[9px] uppercase tracking-wider block font-sans font-bold">Term</span>
                <strong className="text-orbit-white text-sm font-sans font-extrabold block">{activePlanObj.durationDays} Days</strong>
              </div>
              <div className="space-y-1">
                <span className="text-orbit-gray-text text-[9px] uppercase tracking-wider block font-sans font-bold">Min Deposit</span>
                <strong className="text-orbit-white text-sm font-sans font-extrabold block">${activePlanObj.minDeposit.toLocaleString()}</strong>
              </div>
              <div className="space-y-1">
                <span className="text-orbit-gray-text text-[9px] uppercase tracking-wider block font-sans font-bold">Max Deposit</span>
                <strong className="text-orbit-white text-sm font-sans font-extrabold block">
                  {activePlanObj.maxDeposit === 10000000 ? "No Limit" : `$${activePlanObj.maxDeposit.toLocaleString()}`}
                </strong>
              </div>
            </div>

            {/* Input Capital mount size */}
            <div className="space-y-2 font-sans">
              <div className="flex justify-between text-[10px] uppercase text-slate-400 font-bold font-sans">
                <span>Amount ($)</span>
                <span className="text-slate-400 font-sans font-semibold">Available: ${user.balance.toLocaleString()}</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-sans">
                  $
                </span>
                <input
                  type="number"
                  required
                  value={investAmountText}
                  onChange={(e) => setInvestAmountText(e.target.value)}
                  placeholder="Amount to invest"
                  className="w-full bg-[#121318] border border-orbit-border/80 focus:border-orbit-accent rounded-xl pl-8 pr-4 py-3 text-xs text-orbit-white font-sans font-semibold focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-orbit-accent to-amber-500 hover:from-orbit-accent-hover hover:to-amber-600 text-orbit-bg font-bold font-subheading text-xs uppercase shadow hover:shadow-orbit-accent/15 transition-all text-center cursor-pointer"
            >
              Invest
            </button>
          </form>
        </div>

        {/* Right column: Estimates + Active allocations status (col-span-5) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-6">
          
          {/* Projections card */}
          <div className="bg-orbit-card border border-orbit-border rounded-xl p-5 space-y-4 font-sans">
            <h4 className="text-xs font-subheading tracking-widest text-orbit-accent border-b border-orbit-border/50 pb-2 flex items-center justify-between">
              Earnings Projection
              <Target size={14} />
            </h4>

            <div className="space-y-3.5 text-xs text-orbit-gray-text font-sans">
              <div className="flex justify-between items-center bg-orbit-bg/40 p-2.5 border border-orbit-border/30 rounded-lg">
                <span className="font-subheading">ROI:</span>
                <strong className="text-orbit-green font-bold font-data text-sm">+{activePlanObj.roiPercent}%</strong>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Net Profit:</span>
                <strong className="text-orbit-green font-bold font-data">${projections.profit.toLocaleString()}</strong>
              </div>

              <div className="flex justify-between items-center">
                <span>Daily payout:</span>
                <strong className="text-orbit-white font-semibold font-data">${projections.daily}/day</strong>
              </div>

              <div className="flex justify-between items-center border-t border-orbit-border/40 pt-3">
                <span className="text-orbit-white font-subheading">Total return:</span>
                <strong className="text-base text-orbit-white font-bold font-data">${projections.total.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          {/* Active stats listings summary wrapper */}
          <div className="bg-gradient-to-br from-orbit-darkcard to-orbit-card border border-orbit-border rounded-xl p-5 space-y-4 flex-1">
            <h4 className="text-xs font-bold font-heading text-orbit-white border-b border-orbit-border/60 pb-2 flex items-center justify-between">
              My Active Plans
              <Timer className="text-orbit-accent animate-pulse" size={14} />
            </h4>

            {user.activeInvestments.length === 0 ? (
              <p className="text-xs text-center text-orbit-gray-text py-12 font-sans">No active plans. Select a plan to start earning.</p>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 font-sans">
                {user.activeInvestments.map((inv) => {
                  const isMaturedComplete = inv.status === "completed";
                  return (
                    <div 
                      key={inv.id}
                      className="p-3.5 border border-orbit-border bg-orbit-bg/50 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex justify-between font-bold text-orbit-white font-sans">
                        <span>{inv.name}</span>
                        <span className="text-orbit-green font-data">
                          +${inv.accumulatedProfit.toLocaleString(undefined, { minimumFractionDigits: 4 })}
                        </span>
                      </div>

                      <div className="w-full bg-orbit-border h-1 rounded-full overflow-hidden">
                        <div 
                          className="bg-orbit-accent h-full"
                          style={{ width: `${inv.progress}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[9px] text-orbit-gray-text font-data">
                        <span>Funded: ${inv.amount.toLocaleString()}</span>
                        <span className="font-subheading">{isMaturedComplete ? "Completed" : `loops: ${inv.progress}%`}</span>
                      </div>

                      {isMaturedComplete && (
                        <button
                          onClick={() => claimPlanPayout(inv.id)}
                          className="w-full bg-orbit-green hover:bg-orbit-green/80 text-orbit-bg font-bold font-subheading py-1.5 rounded transition-all uppercase text-[10px] mt-1 cursor-pointer"
                        >
                          Claim Earnings
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Safety regulations disclosures */}
      <section className="p-4 border border-orbit-border rounded-xl bg-orbit-card/45 flex gap-3 text-xs leading-relaxed text-orbit-gray-text font-sans">
        <ShieldAlert size={18} className="text-orbit-accent shrink-0 mt-0.5 animate-bounce" />
        <div>
          <strong className="text-orbit-white font-subheading block mb-0.5">Earn risk disclaimer:</strong>
          Earnings are distributed directly to your wallet upon plan maturity. Capital is secure but subject to standard period locks.
        </div>
      </section>

    </div>
  );
};
