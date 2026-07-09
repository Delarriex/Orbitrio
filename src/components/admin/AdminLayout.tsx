import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Compass, Menu, ShieldAlert, X } from "lucide-react";
import { useOrbit } from "../../context/OrbitContext";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";

type AdminNavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  alert?: number;
};

interface AdminLayoutProps {
  activeTab: string;
  navItems: AdminNavItem[];
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ activeTab, navItems, onTabChange, children }) => {
  const { logout } = useOrbit();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useBodyScrollLock(isMobileMenuOpen);

  const handleLockAdminTerminal = async () => {
    await logout();
    window.location.assign("/");
  };

  const renderNavItems = (closeOnSelect = false) => navItems.map(item => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        onClick={() => {
          onTabChange(item.id);
          if (closeOnSelect) setIsMobileMenuOpen(false);
        }}
        className={`w-full flex items-center justify-between text-left py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[38px] ${
          isActive ? "bg-orbit-accent text-orbit-bg shadow" : "text-orbit-gray-text hover:text-orbit-white hover:bg-orbit-border/30"
        }`}
      >
        <span className="flex items-center gap-2.5">
          <Icon size={14} className={isActive ? "text-orbit-bg" : "text-orbit-accent"} />
          {item.label}
        </span>
        {!!item.alert && (
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${isActive ? "bg-orbit-bg text-orbit-accent" : "bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse"}`}>
            {item.alert}
          </span>
        )}
      </button>
    );
  });

  return (
    <div className="min-h-screen bg-orbit-bg font-sans pb-20">
      <header className="lg:hidden flex items-center justify-between p-4 bg-orbit-card border-b border-orbit-border sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <ShieldAlert size={20} className="text-red-500" />
          <span className="text-sm font-bold text-orbit-white uppercase tracking-widest">Admin</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 bg-orbit-border/50 text-orbit-white rounded-lg hover:bg-orbit-border transition-colors cursor-pointer"
        >
          <Menu size={20} />
        </button>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="lg:hidden fixed inset-0 z-50 flex overscroll-contain"
          >
            <aside className="w-[85%] max-w-sm bg-orbit-card border-r border-orbit-border h-full flex flex-col p-5 shadow-2xl relative overflow-y-auto">
              <div className="flex justify-between items-center mb-6 border-b border-orbit-border pb-4">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-gradient-to-tr from-[#FF7F00] to-orbit-accent text-orbit-bg">
                    <Compass size={18} />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-orbit-white uppercase font-heading">
                      <span className="lowercase text-orbit-white font-bold">orbit<span className="text-orbit-accent">rio</span></span> Node
                    </h3>
                    <span className="text-[8px] bg-red-500/10 border border-red-500/30 text-red-500 py-0.5 px-2 font-bold rounded-full block w-fit mt-0.5">
                      MASTER ADMIN
                    </span>
                  </div>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg bg-orbit-card border border-orbit-border text-orbit-white hover:border-orbit-accent">
                  <X size={16} />
                </button>
              </div>

              <nav className="flex-grow space-y-1.5 overflow-y-auto pr-1">
                {renderNavItems(true)}
              </nav>

              <div className="pt-4 border-t border-orbit-border/50 text-center mt-4">
                <button
                  onClick={handleLockAdminTerminal}
                  className="w-full py-2.5 bg-orbit-border/80 text-orbit-red font-bold text-xs uppercase rounded-xl hover:bg-orbit-border transition-all cursor-pointer min-h-[44px]"
                >
                  Lock Admin Terminal
                </button>
              </div>
            </aside>
            <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative overflow-visible">
        <aside className="hidden lg:flex lg:col-span-3 bg-orbit-card border border-orbit-border rounded-2xl p-5 flex-col justify-between self-start sticky top-8">
          <div className="space-y-6">
            <div className="border-b border-orbit-border pb-4 flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-gradient-to-tr from-[#FF7F00] to-orbit-accent text-orbit-bg shrink-0">
                <Compass size={20} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-orbit-white uppercase font-heading"><span className="lowercase text-orbit-white font-bold">orbit<span className="text-orbit-accent">rio</span></span> Node</h3>
                <span className="text-[10px] bg-red-500/10 border border-red-500/30 text-red-500 py-0.5 px-2.5 font-bold rounded-full block w-fit mt-1">
                  MASTER ADMIN
                </span>
              </div>
            </div>

            <nav className="space-y-1.5">
              {renderNavItems()}
            </nav>
          </div>

          <div className="pt-6 border-t border-orbit-border/50 mt-6 text-center">
            <button onClick={handleLockAdminTerminal} className="text-[10px] uppercase font-bold text-center text-orbit-red hover:underline tracking-wider cursor-pointer">
              Lock Admin Terminal
            </button>
          </div>
        </aside>

        <section className="col-span-1 lg:col-span-9 space-y-6 w-full relative">
          <div className="hidden lg:flex items-center justify-between bg-orbit-card border border-orbit-border rounded-2xl px-5 py-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-orbit-gray-text font-bold">Secure Admin Terminal</p>
              <h1 className="text-lg font-bold text-orbit-white font-heading mt-1">Control Center</h1>
            </div>
            <span className="text-[10px] bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              Admin Only
            </span>
          </div>
          {children}
        </section>
      </div>
    </div>
  );
};
