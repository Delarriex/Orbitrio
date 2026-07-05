import React from "react";
import { Home, LineChart, Gift, Repeat, TrendingUp } from "lucide-react";
import { useOrbit } from "../context/OrbitContext";

interface MobileNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, onNavigate }) => {
  const { user } = useOrbit();
  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "markets", label: "Markets", icon: LineChart },
    { id: "dashboard-airdrops", label: "Airdrop", icon: Gift, isSpecial: true },
    { id: "dashboard-trading", label: "Trade", icon: Repeat },
    { id: "dashboard-plans", label: "Earn", icon: TrendingUp },
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === "home") {
      onNavigate(user.isLoggedIn ? "dashboard" : "home");
    } else {
      onNavigate(tabId);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 bg-[#06080D]/95 backdrop-blur-xl border-t border-orbit-border/60 shadow-[0_-8px_30px_rgba(0,0,0,0.35)] md:hidden pb-safe">
      <div className="grid grid-cols-5 items-center justify-items-center py-2 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = (tab.id === 'home' && (currentView === 'home' || currentView === 'dashboard')) || currentView === tab.id;
          
          return (
            <button
              key={tab.id}
              type="button"
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center gap-1 cursor-pointer rounded-2xl px-2 py-2 transition-all duration-200 ${
                isActive ? "text-amber-500 bg-amber-500/10 shadow-sm" : "text-neutral-400 hover:text-white"
              }`}
            >
              <div className={`p-1.5 rounded-full ${tab.isSpecial ? "bg-amber-500/20 text-amber-500" : isActive ? "bg-white/10" : "bg-transparent"}`}>
                <Icon size={18} />
              </div>
              <span className="text-[11px] font-medium tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
