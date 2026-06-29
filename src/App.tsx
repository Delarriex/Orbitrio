import React, { useState, useEffect } from "react";
import { OrbitProvider, useOrbit } from "./context/OrbitContext";
import { Navigation } from "./components/Navigation";
import { MobileNav } from "./components/MobileNav";
import { Footer } from "./components/Footer";
import { ScrollAnimatedBackground } from "./components/ScrollAnimatedBackground";
import { TawkChat } from "./components/TawkChat";
import { GlobalModals } from "./components/GlobalModals";

// Pages
import { PublicHome } from "./pages/PublicHome";
import { PublicMarkets } from "./pages/PublicMarkets";
import { PublicCopyTrading } from "./pages/PublicCopyTrading";
import { PublicPlans } from "./pages/PublicPlans";
import { AuthPage } from "./pages/AuthPage";
import { TermsPage } from "./pages/TermsPage";
import { PrivacyPage } from "./pages/PrivacyPage";

// Dashboard
import { DashboardOverview } from "./pages/DashboardOverview";
import { DashboardTrading } from "./pages/DashboardTrading";
import { DashboardPortfolio } from "./pages/DashboardPortfolio";
import { DashboardPlans } from "./pages/DashboardPlans";
import { DashboardWallet } from "./pages/DashboardWallet";
import { DashboardAdmin } from "./pages/DashboardAdmin";
import { DashboardTransactions } from "./pages/DashboardTransactions";
import { DashboardReferral } from "./pages/DashboardReferral";
import { DashboardAirdrops } from "./pages/DashboardAirdrops";
import { DashboardKYC } from "./pages/DashboardKYC";
import { DashboardWalletConnect } from "./pages/DashboardWalletConnect";

function MainAppContent() {
  const { user } = useOrbit();
  const [currentView, setCurrentView] = useState("home");
  const [targetTradeAsset, setTargetTradeAsset] = useState<string | null>(null);
  const [walletSubTab, setWalletSubTab] = useState<"deposit" | "withdraw" | "ledger" | "support">("deposit");

  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  // Reset scroll coordinates on navigation/page view change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [currentView]);

  // Auto-redirect logged-in users to dashboard if they are on auth or home pages
  useEffect(() => {
    if (user.isLoggedIn && (currentView === "auth" || currentView === "home")) {
      setCurrentView("dashboard");
    }
  }, [user.isLoggedIn, currentView]);

  // Auto-redirect logged-out users to home if they are on a dashboard page
  useEffect(() => {
    if (!user.isLoggedIn && currentView.startsWith("dashboard")) {
      setCurrentView("home");
    }
  }, [user.isLoggedIn, currentView]);

  // Listen to path changes or initial page load for direct path routing (e.g. /admin)
  useEffect(() => {
    const handleUrlRouting = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const isAdminRoute = path === "/admin" || hash === "#/admin" || hash === "#admin";

      if (isAdminRoute) {
        if (user.isLoggedIn && user.role === "admin") {
          setCurrentView("dashboard-admin");
        } else {
          setCurrentView(user.isLoggedIn ? "dashboard" : "auth");
        }
      }
    };

    handleUrlRouting();
    window.addEventListener("popstate", handleUrlRouting);
    window.addEventListener("hashchange", handleUrlRouting);
    return () => {
      window.removeEventListener("popstate", handleUrlRouting);
      window.removeEventListener("hashchange", handleUrlRouting);
    };
  }, [user.isLoggedIn, user.role]);

  const handleNavigate = (view: string, assetSymbol?: string) => {
    // If the user tries to go home but they are logged in, send them to dashboard
    if (view === "home" && user.isLoggedIn) {
      view = "dashboard";
    }

    if (view.startsWith("dashboard") && !user.isLoggedIn) {
      setCurrentView("auth");
      return;
    }

    if (view === "dashboard-admin" && user.role !== "admin") {
      setCurrentView(user.isLoggedIn ? "dashboard" : "auth");
      return;
    }

    if (view === "dashboard-trading" && assetSymbol) {
      setTargetTradeAsset(assetSymbol);
    }

    if (view === "dashboard-wallet") {
      setWalletSubTab("deposit");
    }

    // Dynamic URL update for professional custom domain routing
    if (view === "dashboard-admin") {
      if (window.location.pathname !== "/admin") {
        window.history.pushState(null, "", "/admin");
      }
    } else {
      if (window.location.pathname === "/admin") {
        window.history.pushState(null, "", "/");
      }
    }

    setCurrentView(view);
  };

  const renderView = () => {
    switch (currentView) {
      case "home":
        return <PublicHome onNavigate={handleNavigate} />;
      case "markets":
        return <PublicMarkets onNavigate={handleNavigate} />;
      case "copy-trading":
        return <PublicCopyTrading onNavigate={handleNavigate} />;
      case "plans":
        return <PublicPlans onNavigate={handleNavigate} />;
      case "auth":
        return <AuthPage onNavigate={handleNavigate} />;
      case "login":
        return <AuthPage onNavigate={handleNavigate} initialTab="login" />;
      case "register":
        return <AuthPage onNavigate={handleNavigate} initialTab="register" />;
      case "terms":
        return <TermsPage onNavigate={handleNavigate} />;
      case "privacy":
        return <PrivacyPage onNavigate={handleNavigate} />;

      // Auth views
      case "dashboard":
        return (
          <DashboardOverview 
            onNavigate={handleNavigate} 
            onOpenDeposit={() => setDepositModalOpen(true)}
            onOpenWithdraw={() => setWithdrawModalOpen(true)}
          />
        );
      case "dashboard-trading":
        return <DashboardTrading initialAsset={targetTradeAsset || undefined} onNavigate={handleNavigate} />;
      case "dashboard-portfolio":
        return <DashboardPortfolio onNavigate={handleNavigate} />;
      case "dashboard-plans":
        return <DashboardPlans />;
      case "dashboard-wallet":
        return <DashboardWallet initialOpenTab={walletSubTab} />;
      case "dashboard-admin":
        return <DashboardAdmin />;
      case "dashboard-transactions":
        return <DashboardTransactions />;
      case "dashboard-airdrops":
        return <DashboardAirdrops />;
      case "dashboard-wallet-connect":
        return <DashboardWalletConnect />;
      case "dashboard-kyc":
        return <DashboardKYC />;
      case "dashboard-referral":
        return <DashboardReferral />;

      default:
        return <PublicHome onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className={`relative flex flex-col min-h-screen bg-orbit-bg text-[#F5F6F8] font-sans overflow-hidden ${
      currentView === "home"
        ? "pt-0"
        : currentView === "dashboard-admin"
        ? "pt-0"
        : "pt-16 sm:pt-20"
    }`}>
      {currentView !== "dashboard-admin" && <ScrollAnimatedBackground />}
      
      {/* Dynamic top bar links */}
      {currentView !== "dashboard-admin" && (
        <Navigation currentView={currentView} onNavigate={handleNavigate} />
      )}

      {/* Primary content area container */}
      <main className={`relative z-10 flex-grow ${
        currentView === "home"
          ? "w-full pb-32"
          : currentView === "dashboard-admin"
          ? "w-full pb-32"
          : "max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-4 pb-32"
      }`}>
        {renderView()}
      </main>

      {/* Global Standard Footer - Hidden on mobile */}
      {currentView !== "dashboard-admin" && currentView !== "auth" && (
        <div className="hidden sm:block">
          <Footer />
        </div>
      )}

      {/* Mobile Sticky Navigation (Logged in users only) */}
      {user.isLoggedIn && currentView !== "dashboard-admin" && currentView !== "auth" && (
        <div className="sm:hidden mt-auto z-40 relative">
          <MobileNav currentView={currentView} onNavigate={handleNavigate} />
        </div>
      )}

      {/* Tawk.to Live Chat integration overlay fixed */}
      <TawkChat />

      <GlobalModals 
        depositModalOpen={depositModalOpen}
        setDepositModalOpen={setDepositModalOpen}
        withdrawModalOpen={withdrawModalOpen}
        setWithdrawModalOpen={setWithdrawModalOpen}
        setCurrentView={setCurrentView}
      />
    </div>
  );
}

export default function App() {
  return (
    <OrbitProvider>
      <MainAppContent />
    </OrbitProvider>
  );
}
