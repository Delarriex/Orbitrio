import React from "react";
import { Gift } from "lucide-react";
import { useOrbit } from "../context/OrbitContext";
import { Airdrop } from "../types";

const INITIAL_AIRDROPS: any[] = [
  { id: "airdrop-1", title: "Polymarket Airdrop", token: "POLY", rewardAmount: "250", usdValue: "250.00", progress: 78 },
  { id: "airdrop-2", title: "MegaETH Terminal", token: "MEGA", rewardAmount: "50", usdValue: "150.00", progress: 42 },
  { id: "airdrop-3", title: "Berachain Ecosystem", token: "BERA", rewardAmount: "120", usdValue: "85.50", progress: 91 },
  { id: "airdrop-4", title: "Monad Parallel EVM", token: "MONAD", rewardAmount: "100", usdValue: "300.00", progress: 64 },
  { id: "airdrop-5", title: "Movement Network Drop", token: "MOVE", rewardAmount: "400", usdValue: "200.00", progress: 89 },
  { id: "airdrop-6", title: "Linea zkEVM Rollup", token: "LINEA", rewardAmount: "120", usdValue: "180.00", progress: 37 },
];

export const DashboardAirdrops: React.FC = () => {
  const { adminAirdropClaims, claimAirdrop } = useOrbit();

  const handleClaim = (airdrop: any) => {
    claimAirdrop(airdrop.id, airdrop.token, airdrop.rewardAmount);
  };

  return (
    <div className="space-y-6 font-sans">
      <h2 className="text-xl font-bold font-heading text-orbit-white flex items-center gap-2">
        <Gift className="text-orbit-accent" size={24} />
        Airdrop Center
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {INITIAL_AIRDROPS.map((airdrop) => {
          const claim = adminAirdropClaims.find(c => c.airdropId === airdrop.id);
          
          return (
            <div key={airdrop.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center">
                <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-orbit-accent text-sm">
                  {airdrop.token[0]}
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded">Live</span>
              </div>
              
              <div>
                <h3 className="text-base font-bold text-orbit-white">{airdrop.title}</h3>
                <div className="flex items-end justify-between mt-1">
                  <p className="text-sm text-neutral-400">{airdrop.rewardAmount} ${airdrop.token.toUpperCase()}</p>
                  <p className="text-base font-bold text-white">≈ ${airdrop.usdValue}</p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>Allocation</span>
                  <span>{airdrop.progress}% Claimed</span>
                </div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${airdrop.progress}%` }}></div>
                </div>
              </div>

              <button 
                onClick={() => handleClaim(airdrop)}
                disabled={!!claim}
                className={`w-full text-xs font-semibold py-2 rounded-lg transition-colors ${
                  claim ? "bg-neutral-800 text-neutral-400 cursor-not-allowed" : 
                  "bg-amber-500 text-black hover:bg-amber-600"
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
