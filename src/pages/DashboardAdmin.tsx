import React, { useState } from "react";
import { useOrbit } from "../context/OrbitContext";
import { 
  Users, Layers, ArrowDownLeft, ArrowUpRight, Volume2, ShieldAlert,
  MessageSquare, UserCheck, PenTool, CreditCard, Award, Gift, ReceiptText, Settings
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { AdminLayout } from "../components/admin/AdminLayout";

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
import { AdminTransactionsTab } from "../components/admin/tabs/AdminTransactionsTab";
import { AdminSettingsTab } from "../components/admin/tabs/AdminSettingsTab";

export const DashboardAdmin: React.FC = () => {
  const { user: currentUser, adminUsers } = useOrbit();

  // Role-based admin authentication
  const isAdminAuthenticated = currentUser.isLoggedIn && (currentUser.role === "admin" || (currentUser as any).isAdmin === true);

  const [activeTab, setActiveTab] = useState<
    "users" | "investments" | "transactions" | "deposits" | "withdrawals" | "bulletins" | "support" | "security" | "content" | "settings" | "traders" | "airdrops" | "kyc" | "wallets"
  >("users");
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
      case "transactions": return <AdminTransactionsTab />;
      case "content": return <AdminContentTab />;
      case "settings": return <AdminSettingsTab />;
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
    { id: "transactions", label: "Financial Ledger", icon: ReceiptText },
    { id: "content", label: "Content Editor", icon: PenTool },
    { id: "settings", label: "Business Settings", icon: Settings },
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
    <AdminLayout activeTab={activeTab} navItems={navItems} onTabChange={(tabId) => setActiveTab(tabId as typeof activeTab)}>
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
    </AdminLayout>
  );
};




