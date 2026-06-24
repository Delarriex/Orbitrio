import React from "react";
import { useOrbit } from "../context/OrbitContext";
import { TrendingUp, Award, Layers, Sparkles, PieChart, Info, ShieldAlert, Briefcase, Target, Users, Wallet } from "lucide-react";

interface DashboardPortfolioProps {
  onNavigate: (view: string) => void;
}

export const DashboardPortfolio: React.FC<DashboardPortfolioProps> = ({ onNavigate }) => {
  const { user } = useOrbit();

  const totalHoldingValue = user.portfolioValue;

  // Let's compute individual asset percentages
  const preProcessedPortfolio = user.portfolio.map(asset => {
    const totalAssetMarketVal = asset.amount * asset.currentPrice;
    const totalCostValue = asset.amount * asset.avgBuyPrice;
    const profitLossVal = +(totalAssetMarketVal - totalCostValue).toFixed(2);
    const profitLossPercent = totalCostValue > 0 ? +((profitLossVal / totalCostValue) * 100).toFixed(2) : 0;
    const weightPercent = totalHoldingValue > 0 ? +((totalAssetMarketVal / totalHoldingValue) * 100).toFixed(1) : 0;

    return {
      ...asset,
      marketValue: totalAssetMarketVal,
      costBasis: totalCostValue,
      profitLoss: profitLossVal,
      profitLossPct: profitLossPercent,
      weight: weightPercent
    };
  });

  // Calculate cumulative stats
  const aggregateCost = preProcessedPortfolio.reduce((acc, cur) => acc + cur.costBasis, 0);
  const aggregatePnL = +(totalHoldingValue - aggregateCost).toFixed(2);
  const aggregatePnLPct = aggregateCost > 0 ? +((aggregatePnL / aggregateCost) * 100).toFixed(2) : 0;

  return (
    <div className="space-y-8 pb-20 font-sans">
      
      {/* Header Info */}
      <div className="border-b border-orbit-border/50 pb-6">
        <h1 className="text-2xl font-bold font-heading text-orbit-white flex items-center gap-2.5">
          <Briefcase size={24} className="text-orbit-accent shrink-0" />
          <span>Portfolio Overview</span>
        </h1>
        <p className="text-xs text-orbit-gray-text mt-1 font-sans">
          Real-time track and manage your balances, active positions, and copy trading performance.
        </p>
      </div>

      {/* Aggregate metrics box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
        <div className="bg-orbit-card border border-orbit-border rounded-xl p-6 space-y-2">
          <div className="flex justify-between items-center text-[10px] text-orbit-gray-text font-subheading">
            <span>Total Equity</span>
            <Wallet size={14} className="text-orbit-gray-text/70 shrink-0" />
          </div>
          <strong className="text-2xl font-black font-data text-orbit-white block">${aggregateCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
        </div>

        <div className="bg-orbit-card border border-orbit-border rounded-xl p-6 space-y-2">
          <div className="flex justify-between items-center text-[10px] text-orbit-gray-text font-subheading">
            <span>Asset Value</span>
            <Layers size={14} className="text-orbit-gray-text/70 shrink-0" />
          </div>
          <strong className="text-2xl font-black font-data text-orbit-accent block animate-pulse">${totalHoldingValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
        </div>

        <div className="bg-orbit-card border border-orbit-border rounded-xl p-6 space-y-2">
          <div className="flex justify-between items-center text-[10px] text-orbit-gray-text font-subheading">
            <span>Total PnL</span>
            <TrendingUp size={14} className="text-orbit-gray-text/70 shrink-0" />
          </div>
          <strong className={`text-2xl font-data font-black block ${aggregatePnL >= 0 ? "text-orbit-green" : "text-orbit-red"}`}>
            {aggregatePnL >= 0 ? "+" : ""}{aggregatePnL.toLocaleString()} ({aggregatePnLPct}%)
          </strong>
        </div>
      </div>

      {/* Main split grid: Radial wheel + list detailing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch font-sans">
        
        {/* Left column: Visual radial weights wheel (col-span-4) */}
        <div className="lg:col-span-5 bg-orbit-card border border-orbit-border rounded-xl p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-sm font-bold font-heading text-orbit-white flex items-center gap-2">
              <PieChart size={16} className="text-orbit-accent" />
              Allocation Weights
            </h3>

            {preProcessedPortfolio.length === 0 ? (
              <p className="text-xs text-center text-orbit-gray-text py-16 font-sans">No asset distribution data available. Fund your account or open a position to view metrics.</p>
            ) : (
              <div className="flex flex-col items-center justify-center p-4 relative space-y-6">
                
                {/* Simulated CSS Radial Stack Gauge */}
                <div className="relative w-40 h-40 rounded-full bg-orbit-darkcard border border-orbit-border flex items-center justify-center shadow-xl">
                  {/* Inside metrics */}
                  <div className="text-center font-sans">
                    <span className="text-[10px] text-orbit-gray-text uppercase tracking-normal font-subheading">Active Assets</span>
                    <strong className="block text-lg font-black font-data text-orbit-white">{preProcessedPortfolio.length} Pairs</strong>
                  </div>

                  {/* Gradient rings representing sizes */}
                  <div className="absolute inset-2 border-2 border-dashed border-orbit-accent/30 rounded-full animate-spin" style={{ animationDuration: "35s" }} />
                  <div className="absolute inset-4 border-2 border-dashed border-orbit-green/20 rounded-full animate-spin" style={{ animationDuration: "15s" }} />
                </div>

                {/* Legend checklist */}
                <div className="w-full space-y-2.5 font-sans">
                  {preProcessedPortfolio.map((item, idx) => {
                    const colors = ["#FFA500", "#0ECB81", "#3B82F6", "#8B5CF6", "#EC4899"];
                    const styleCol = colors[idx % colors.length];
                    return (
                      <div key={item.symbol} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: styleCol }} />
                          <span className="font-bold text-orbit-white uppercase font-data">{item.symbol}</span>
                          <span className="text-orbit-gray-text font-sans">{item.name}</span>
                        </div>
                        <span className="font-data text-orbit-white font-bold">{item.weight}%</span>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}
          </div>

          <div className="pt-4 border-t border-orbit-border/40 text-[10px] text-orbit-gray-text text-center font-sans">
            Prices update in real time.
          </div>
        </div>

        {/* Right column: Tabular details (col-span-8) */}
        <div className="lg:col-span-7 bg-orbit-card border border-orbit-border rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-orbit-border/50 pb-4">
            <h3 className="text-sm font-bold font-heading text-orbit-white flex items-center gap-2">
              <Target size={16} className="text-orbit-accent" />
              <span>Open Positions</span>
            </h3>
            <button 
              onClick={() => onNavigate("dashboard-trading")}
              className="text-xs text-orbit-accent font-subheading hover:underline cursor-pointer"
            >
              Trade Now
            </button>
          </div>

          {preProcessedPortfolio.length === 0 ? (
            <p className="text-xs text-center text-orbit-gray-text py-12 font-sans">No open positions. Start trading to view your portfolio here.</p>
          ) : (
            <div className="space-y-4 font-sans">
              {preProcessedPortfolio.map((holding) => (
                <div 
                  key={holding.symbol}
                  className="p-4 rounded-xl border border-orbit-border bg-orbit-bg/40 flex justify-between items-center text-xs"
                >
                  <div className="space-y-1">
                    <strong className="font-data text-sm text-orbit-white">{holding.symbol}</strong>
                    <span className="text-[10px] text-orbit-gray-text block">
                      Quantity: <strong className="font-data">{holding.amount}</strong> | Weight: <span className="font-data">{holding.weight}%</span>
                    </span>
                  </div>

                  <div className="space-y-1 font-data text-right">
                    <span className="text-orbit-white text-sm font-bold block">
                      ${holding.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`text-[10px] font-bold ${holding.profitLoss >= 0 ? "text-orbit-green" : "text-orbit-red"}`}>
                      {holding.profitLoss >= 0 ? "Profit: +" : "Loss: "}${holding.profitLoss.toLocaleString()} ({holding.profitLossPct}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Copy trading linkage feedback */}
      <section className="bg-orbit-card border border-orbit-border rounded-xl p-6 font-sans">
        <h3 className="text-sm font-bold font-heading text-orbit-white mb-4 flex items-center gap-2">
          <Users size={16} className="text-orbit-accent" />
          <span>Copy Trading Positions</span>
        </h3>
        <p className="text-xs text-orbit-gray-text leading-relaxed font-sans">
          Your copy trading positions will automatically appear here once the traders you follow make new trades.
        </p>
        <button 
          onClick={() => onNavigate("copy-trading")}
          className="mt-4 px-5 py-2 rounded-lg bg-orbit-bg border border-orbit-border hover:border-orbit-accent text-orbit-white text-xs font-semibold font-subheading transition-colors cursor-pointer"
        >
          Check Copy Trading
        </button>
      </section>

    </div>
  );
};
