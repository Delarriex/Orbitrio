import React from "react";
import { Gift, Sparkles } from "lucide-react";
import { useOrbit } from "../context/OrbitContext";

// Fallback airdrops shown when admin hasn't created any via Firestore
const FALLBACK_AIRDROPS: Array<{ id: string; title: string; token: string; rewardAmount: string; usdValue: string; progress: number }> = [
  { id: "airdrop-1", title: "Polymarket Airdrop", token: "POLY", rewardAmount: "250", usdValue: "250.00", progress: 78 },
  { id: "airdrop-2", title: "MegaETH Terminal", token: "MEGA", rewardAmount: "50", usdValue: "150.00", progress: 42 },
  { id: "airdrop-3", title: "Berachain Ecosystem", token: "BERA", rewardAmount: "120", usdValue: "85.50", progress: 91 },
  { id: "airdrop-4", title: "Monad Parallel EVM", token: "MONAD", rewardAmount: "100", usdValue: "300.00", progress: 64 },
  { id: "airdrop-5", title: "Movement Network Drop", token: "MOVE", rewardAmount: "400", usdValue: "200.00", progress: 89 },
  { id: "airdrop-6", title: "Linea zkEVM Rollup", token: "LINEA", rewardAmount: "120", usdValue: "180.00", progress: 37 },
];

export const DashboardAirdrops: React.FC = () => {
  const { airdrops, adminAirdropClaims, claimAirdrop } = useOrbit();

  // Merge admin-created airdrops from Firestore with fallback ones
  const displayAirdrops = airdrops.length > 0
    ? airdrops.map(a => ({
        id: a.id,
        title: a.title,
        token: a.token,
        rewardAmount: a.rewardAmount,
        usdValue: a.rewardAmount,
        progress: Math.floor(Math.random() * 60) + 30 // visual only
      }))
    : FALLBACK_AIRDROPS;

  const handleClaim = (airdrop: { id: string; token: string; rewardAmount: string }) => {
    claimAirdrop(airdrop.id, airdrop.token, airdrop.rewardAmount);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-heading text-orbit-white flex items-center gap-2">
          <Gift className="text-orbit-accent" size={24} />
          Airdrop Center
        </h2>
        <span className="text-[10px] font-bold text-orbit-accent bg-orbit-accent/10 border border-orbit-accent/30 px-3 py-1 rounded-full flex items-center gap-1.5">
          <Sparkles size={10} /> {displayAirdrops.length} Active
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayAirdrops.map((airdrop) => {
          const claim = adminAirdropClaims.find(c => c.airdropId === airdrop.id);
          
          return (
            <div key={airdrop.id} className="bg-orbit-card border border-orbit-border rounded-xl p-4 space-y-4 hover:border-orbit-accent/30 transition-colors">
              <div className="flex justify-between items-center">
                <div className="w-10 h-10 rounded-full bg-orbit-accent/10 border border-orbit-accent/20 flex items-center justify-center font-bold text-orbit-accent text-sm">
                  {airdrop.token[0]}
                </div>
                <span className="text-[10px] bg-orbit-green/10 text-orbit-green font-bold px-2 py-0.5 rounded border border-orbit-green/20">Live</span>
              </div>
              
              <div>
                <h3 className="text-base font-bold text-orbit-white">{airdrop.title}</h3>
                <div className="flex items-end justify-between mt-1">
                  <p className="text-sm text-orbit-gray-text">{airdrop.rewardAmount} {airdrop.token.toUpperCase()}</p>
                  <p className="text-base font-bold text-orbit-white font-data">≈ ${airdrop.usdValue}</p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-orbit-gray-text">
                  <span>Allocation</span>
                  <span>{airdrop.progress}% Claimed</span>
                </div>
                <div className="w-full bg-orbit-border/50 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-orbit-accent h-1.5 rounded-full transition-all duration-500" style={{ width: `${airdrop.progress}%` }}></div>
                </div>
              </div>

              <button 
                onClick={() => handleClaim(airdrop)}
                disabled={!!claim}
                className={`w-full text-xs font-bold py-2.5 rounded-lg transition-all cursor-pointer ${
                  claim 
                    ? "bg-orbit-border/50 text-orbit-gray-text cursor-not-allowed border border-orbit-border" 
                    : "bg-orbit-accent text-orbit-bg hover:opacity-90 shadow-sm shadow-orbit-accent/20"
                }`}
              >
                {claim ? `${claim.status} Approval` : "Claim Airdrop"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
