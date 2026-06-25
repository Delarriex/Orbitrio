import React, { useState } from "react";
import { Share2, Users, Trophy, DollarSign, Copy, Check } from "lucide-react";
import { useOrbit } from "../context/OrbitContext";

export const DashboardReferral: React.FC = () => {
  const { user, withdrawEarnings, addNotification } = useOrbit();
  const [copied, setCopied] = useState(false);

  const referralLink = `https://orbitriotrades.com/register?ref=${user.email?.split('@')[0] || 'user'}`;
  
  const referralCount = user.referralCount || 0;
  const points = user.points || 0;
  const earnedBalance = points * 1;
  const progressPercent = Math.min((points / 100) * 100, 100);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    addNotification("Referral link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 font-sans p-4">
      <h2 className="text-xl font-bold font-heading text-orbit-white flex items-center gap-2">
        <Share2 className="text-orbit-accent" size={24} />
        Refer & Earn
      </h2>

      {/* Hero Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex flex-col items-center">
            <Users className="text-neutral-500 mb-1" size={20} />
            <p className="text-sm font-bold text-white">{referralCount}</p>
            <p className="text-[10px] text-neutral-400">Referrals</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex flex-col items-center">
            <Trophy className="text-amber-500 mb-1" size={20} />
            <p className="text-sm font-bold text-white">{points}</p>
            <p className="text-[10px] text-neutral-400">Points</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex flex-col items-center">
            <DollarSign className="text-emerald-500 mb-1" size={20} />
            <p className="text-sm font-bold text-white">${earnedBalance.toFixed(2)}</p>
            <p className="text-[10px] text-neutral-400">Balance</p>
        </div>
      </div>

      {/* Referral Link Container */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
        <p className="text-xs text-neutral-400">Your Referral Link:</p>
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 flex justify-between items-center text-sm text-neutral-300">
            <span className="truncate mr-2">{referralLink}</span>
            <button onClick={handleCopy} className="bg-amber-500 text-black px-3 py-1 rounded font-bold flex items-center gap-1 text-xs">
                {copied ? <Check size={14}/> : <Copy size={14}/>}
                {copied ? "Copied" : "Copy"}
            </button>
        </div>
      </div>

      {/* Milestone Progress */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
        <div className="flex justify-between text-[11px] text-neutral-400">
            <span>Payout Threshold</span>
            <span>{points} / 100 Points</span>
        </div>
        <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${progressPercent}%` }}></div>
        </div>
        
        <button 
            onClick={withdrawEarnings}
            disabled={points < 100}
            className={`w-full text-xs font-semibold py-3 rounded-lg transition-colors ${
                points < 100 
                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed" 
                : "bg-amber-500 text-black hover:bg-amber-600"
            }`}
        >
            {points < 100 ? "Withdraw to Wallet ($100 Min)" : `Withdraw $${earnedBalance.toFixed(2)} to Wallet`}
        </button>
      </div>
    </div>
  );
};
