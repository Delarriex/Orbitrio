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
    <div className="fixed bottom-0 left-0 w-full z-50 bg-black md:hidden pb-safe">
      <div className="grid grid-cols-5 items-center justify-items-center py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = (tab.id === 'home' && (currentView === 'home' || currentView === 'dashboard')) || currentView === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                isActive ? "text-amber-500" : "text-neutral-400"
              }`}
            >
              <div className={`p-1 rounded-full ${tab.isSpecial ? "bg-amber-500/20 text-amber-500" : ""}`}>
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
