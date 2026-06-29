import React, { useState } from "react";
import { useOrbit } from "../context/OrbitContext";
import { 
  Users, Layers, ArrowDownLeft, ArrowUpRight, Bell, Volume2, ShieldAlert, 
  MessageSquare, Activity, UserCheck, Ban, PenTool, Check, X, Menu, CreditCard, 
  Key, Database, Search, Plus, Trash2, FileText, Lock, Compass, DollarSign, Award, Gift
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Import admin tabs
import { AdminUsersTab } from "../components/admin/tabs/AdminUsersTab";
import { AdminInvestmentsTab } from "../components/admin/tabs/AdminInvestmentsTab";
import { AdminDepositsTab } from "../components/admin/tabs/AdminDepositsTab";
import { AdminWithdrawalsTab } from "../components/admin/tabs/AdminWithdrawalsTab";
import { AdminBulletinsTab } from "../components/admin/tabs/AdminBulletinsTab";
import { AdminSupportTab } from "../components/admin/tabs/AdminSupportTab";
import { AdminSecurityTab } from "../components/admin/tabs/AdminSecurityTab";
import { AdminContentTab } from "../components/admin/tabs/AdminContentTab";
import { AdminTradersTab } from "../components/admin/tabs/AdminTradersTab";
import { AdminAirdropsTab } from "../components/admin/tabs/AdminAirdropsTab";
import { AdminWalletsTab } from "../components/admin/tabs/AdminWalletsTab";
import { AdminKycTab } from "../components/admin/tabs/AdminKycTab";

export const DashboardAdmin: React.FC = () => {
  const { user: currentUser, adminUsers } = useOrbit();

  // Role-based admin authentication
  const isAdminAuthenticated = currentUser.isLoggedIn && (currentUser.role === "admin" || (currentUser as any).isAdmin === true);

  const [activeTab, setActiveTab] = useState<
    "users" | "investments" | "deposits" | "withdrawals" | "bulletins" | "support" | "security" | "content" | "traders" | "airdrops" | "kyc" | "wallets"
  >("users");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Compute stats for sidebar badges
  const allDeposits: any[] = [];
  const allWithdrawals: any[] = [];
  const allTickets: any[] = [];

  currentUser.transactions.forEach(t => {
    if (t.type === "deposit") allDeposits.push(t);
    else if (t.type === "withdrawal") allWithdrawals.push(t);
  });
  currentUser.tickets.forEach(tk => allTickets.push(tk));

  adminUsers.forEach(sim => {
    sim.transactions.forEach(t => {
      if (t.type === "deposit") allDeposits.push(t);
      else if (t.type === "withdrawal") allWithdrawals.push(t);
    });
    sim.tickets.forEach(tk => allTickets.push(tk));
  });

  const pendingDeposits = allDeposits.filter(t => t.status === "pending").length;
  const pendingPayoutCount = allWithdrawals.filter(w => w.status === "pending").length;
  const openTickets = allTickets.filter(t => t.status === "open").length;

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-orbit-bg flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <ShieldAlert size={48} className="text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-orbit-white font-heading">Access Denied</h1>
          <p className="text-orbit-gray-text">You do not have administrative privileges.</p>
          <button onClick={() => window.location.assign("/")} className="text-orbit-accent hover:underline font-bold text-sm">
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case "users": return <AdminUsersTab />;
      case "investments": return <AdminInvestmentsTab />;
      case "content": return <AdminContentTab />;
      case "traders": return <AdminTradersTab />;
      case "airdrops": return <AdminAirdropsTab />;
      case "wallets": return <AdminWalletsTab />;
      case "kyc": return <AdminKycTab />;
      case "deposits": return <AdminDepositsTab />;
      case "withdrawals": return <AdminWithdrawalsTab />;
      case "bulletins": return <AdminBulletinsTab />;
      case "support": return <AdminSupportTab />;
      case "security": return <AdminSecurityTab />;
      default: return <AdminUsersTab />;
    }
  };

  const navItems = [
    { id: "users", label: "All Users & Balances", icon: Users },
    { id: "investments", label: "Investment Plans", icon: Layers },
    { id: "content", label: "Content Editor", icon: PenTool },
    { id: "traders", label: "Traders List", icon: Award },
    { id: "airdrops", label: "Free Coin Claims (Airdrops)", icon: Gift },
    { id: "wallets", label: "Wallet Gateways", icon: CreditCard },
    { id: "kyc", label: "ID Verifications", icon: UserCheck },
    { id: "deposits", label: "Incoming Payments (Deposits)", icon: ArrowDownLeft, alert: pendingDeposits },
    { id: "withdrawals", label: "Payout Requests (Withdrawals)", icon: ArrowUpRight, alert: pendingPayoutCount },
    { id: "bulletins", label: "Announcements Panel", icon: Volume2 },
    { id: "support", label: "Ticket Helpdesk", icon: MessageSquare, alert: openTickets },
    { id: "security", label: "Security & Audit Logs", icon: ShieldAlert }
  ];

  return (
    <div className="min-h-screen bg-orbit-bg font-sans pb-20">
      
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-orbit-card border-b border-orbit-border sticky top-0 z-40">
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
      </div>

      {/* Main Admin Grid */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
        
        {/* Mobile Slide-out Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-0 z-50 flex"
            >
              <div className="w-[85%] max-w-sm bg-orbit-card border-r border-orbit-border h-full flex flex-col p-5 shadow-2xl relative">
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
                  {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as any);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between text-left py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
                          isActive ? "bg-orbit-accent text-orbit-bg shadow" : "text-orbit-gray-text hover:text-orbit-white hover:bg-orbit-border/30 bg-orbit-bg/50 border border-orbit-border/30"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon size={14} className={isActive ? "text-orbit-bg" : "text-orbit-accent"} />
                          {item.label}
                        </span>
                        {!!item.alert && (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${isActive ? "bg-orbit-bg text-orbit-accent" : "bg-red-500/15 text-red-400 border border-red-500/30"}`}>
                            {item.alert}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>

                <div className="pt-4 border-t border-orbit-border/50 text-center mt-4">
                  <button
                    onClick={() => window.location.assign("/")}
                    className="w-full py-2.5 bg-orbit-border/80 text-orbit-red font-bold text-xs uppercase rounded-xl hover:bg-orbit-border transition-all cursor-pointer min-h-[44px]"
                  >
                    Lock Admin Terminal
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. SEPARATE SECURE ADMIN SIDEBAR (col-span-3) - Desktop */}
        <div className="hidden lg:flex lg:col-span-3 bg-orbit-card border border-orbit-border rounded-2xl p-5 flex-col justify-between self-start sticky top-8">
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
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center justify-between text-left py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
              })}
            </nav>
          </div>

          <div className="pt-6 border-t border-orbit-border/50 mt-6 text-center">
            <button onClick={() => window.location.assign("/")} className="text-[10px] uppercase font-bold text-center text-orbit-red hover:underline tracking-wider cursor-pointer">
              Lock Admin Terminal
            </button>
          </div>
        </div>

        {/* 2. MAIN ACTIVE WINDOW CANVAS (col-span-9) */}
        <div className="col-span-1 lg:col-span-9 space-y-6 w-full relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderActiveTab()}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};
