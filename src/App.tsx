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
import { MaintenancePage } from "./pages/MaintenancePage";

// Dashboard
import { DashboardOverview } from "./pages/DashboardOverview";
import { DashboardTrading } from "./pages/DashboardTrading";
import { DashboardPortfolio } from "./pages/DashboardPortfolio";
import { DashboardPlans } from "./pages/DashboardPlans";
import { DashboardWallet } from "./pages/DashboardWallet";
import { DashboardAdmin } from "./pages/DashboardAdmin";
import { DashboardTransactions } from "./pages/DashboardTransactions";
import { DashboardAirdrops } from "./pages/DashboardAirdrops";
import { DashboardKYC } from "./pages/DashboardKYC";
import { DashboardWalletConnect } from "./pages/DashboardWalletConnect";
import { DashboardNotifications } from "./pages/DashboardNotifications";

const AUTHENTICATED_PUBLIC_REDIRECT_VIEWS = new Set([
  "home",
  "markets",
  "plans",
  "copy-trading",
  "auth",
  "login",
  "register",
  "contact"
]);

const PUBLIC_PATH_TO_VIEW: Record<string, string> = {
  "/": "home",
  "/home": "home",
  "/markets": "markets",
  "/plans": "plans",
  "/copy-trading": "copy-trading",
  "/auth": "auth",
  "/login": "login",
  "/register": "register",
  "/contact": "contact"
};

const PUBLIC_HASH_TO_VIEW: Record<string, string> = {
  "#home": "home",
  "#/home": "home",
  "#markets": "markets",
  "#/markets": "markets",
  "#plans": "plans",
  "#/plans": "plans",
  "#copy-trading": "copy-trading",
  "#/copy-trading": "copy-trading",
  "#auth": "auth",
  "#/auth": "auth",
  "#login": "login",
  "#/login": "login",
  "#register": "register",
  "#/register": "register",
  "#contact": "contact",
  "#/contact": "contact"
};

const isAuthenticatedPublicRedirectView = (view: string) => {
  const baseView = view.split("#")[0];
  const hashView = view.includes("#") ? view.split("#")[1] : "";
  return AUTHENTICATED_PUBLIC_REDIRECT_VIEWS.has(baseView) || AUTHENTICATED_PUBLIC_REDIRECT_VIEWS.has(hashView);
};

const navigateToCleanRoot = () => {
  if (window.location.pathname !== "/" || window.location.hash) {
    window.history.pushState(null, "", "/");
  }
};

function MainAppContent() {
  const { user } = useOrbit();
  const [currentView, setCurrentView] = useState("home");
  const [targetTradeAsset, setTargetTradeAsset] = useState<string | null>(null);
  const [walletSubTab, setWalletSubTab] = useState<"deposit" | "withdraw" | "ledger" | "support">("deposit");
  const localDev = import.meta.env.VITE_LOCAL_DEV === "true";
  const maintenanceMode = !localDev && import.meta.env.VITE_MAINTENANCE_MODE === "true";

  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const isAdminUser = user.isLoggedIn && user.role === "admin";
  const isAuthenticatedUser = user.isLoggedIn && user.role !== "admin";
  const isAdminView = isAdminUser;
  const showUserNavigation = !maintenanceMode && !isAdminUser;
  const showUserMobileNav = !maintenanceMode && isAuthenticatedUser && currentView !== "auth";

  // Reset scroll coordinates on navigation/page view change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [currentView]);

  // Keep the shell aligned with auth role state.
  useEffect(() => {
    if (isAdminUser) {
      if (window.location.pathname !== "/admin") {
        window.history.pushState(null, "", "/admin");
      }
      if (currentView !== "dashboard-admin") {
        setCurrentView("dashboard-admin");
      }
      return;
    }

    if (isAuthenticatedUser && isAuthenticatedPublicRedirectView(currentView)) {
      navigateToCleanRoot();
      setCurrentView("dashboard");
      return;
    }

    if (!user.isLoggedIn && currentView.startsWith("dashboard")) {
      if (window.location.pathname === "/admin") {
        window.history.pushState(null, "", "/");
      }
      setCurrentView("home");
    }
  }, [user.isLoggedIn, user.role, isAdminUser, isAuthenticatedUser, currentView]);

  // Listen to path changes or initial page load for direct path routing (e.g. /admin, /login, #markets).
  useEffect(() => {
    const handleUrlRouting = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const isAdminRoute = path === "/admin" || hash === "#/admin" || hash === "#admin";
      const requestedPublicView = PUBLIC_PATH_TO_VIEW[path] || PUBLIC_HASH_TO_VIEW[hash];

      if (isAdminRoute) {
        if (isAdminUser) {
          setCurrentView("dashboard-admin");
        } else {
          setCurrentView(user.isLoggedIn ? "dashboard" : "auth");
        }
        return;
      }

      if (requestedPublicView) {
        if (isAuthenticatedUser && isAuthenticatedPublicRedirectView(requestedPublicView)) {
          navigateToCleanRoot();
          setCurrentView("dashboard");
          return;
        }

        if (!user.isLoggedIn) {
          setCurrentView(requestedPublicView);
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
  }, [user.isLoggedIn, isAdminUser, isAuthenticatedUser]);

  const handleNavigate = (view: string, assetSymbol?: string, subTab?: "deposit" | "withdraw" | "ledger" | "support") => {
    if (isAdminUser) {
      if (window.location.pathname !== "/admin") {
        window.history.pushState(null, "", "/admin");
      }
      setCurrentView("dashboard-admin");
      return;
    }

    if (isAuthenticatedUser && isAuthenticatedPublicRedirectView(view)) {
      navigateToCleanRoot();
      setCurrentView("dashboard");
      return;
    }

    if (view === "dashboard-referral") {
      setCurrentView("dashboard");
      return;
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
      setWalletSubTab(subTab || "deposit");
    }

    if (view === "dashboard-support") {
      setWalletSubTab("support");
      setCurrentView("dashboard-wallet");
      return;
    }

    if (view === "dashboard-settings") {
      setWalletSubTab("deposit");
      setCurrentView("dashboard-wallet");
      return;
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
    if (maintenanceMode) {
      return <MaintenancePage />;
    }

    if (isAdminUser) {
      return <DashboardAdmin />;
    }

    if (isAuthenticatedUser && isAuthenticatedPublicRedirectView(currentView)) {
      return (
        <DashboardOverview
          onNavigate={handleNavigate}
          onOpenDeposit={() => setDepositModalOpen(true)}
          onOpenWithdraw={() => setWithdrawModalOpen(true)}
        />
      );
    }

    switch (currentView) {
      case "home":
      case "contact":
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
      case "dashboard-notifications":
        return <DashboardNotifications onNavigate={handleNavigate} />;
      case "dashboard-referral":
        return (
          <DashboardOverview
            onNavigate={handleNavigate}
            onOpenDeposit={() => setDepositModalOpen(true)}
            onOpenWithdraw={() => setWithdrawModalOpen(true)}
          />
        );

      default:
        return <PublicHome onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className={`relative flex flex-col min-h-screen bg-orbit-bg text-[#F5F6F8] font-sans ${showUserNavigation ? "pt-16 sm:pt-20" : ""}`}>
      <ScrollAnimatedBackground />
      
      {/* Dynamic top bar links */}
      {showUserNavigation && <Navigation currentView={currentView} onNavigate={handleNavigate} />}

      {/* Primary content area container */}
      <main className={`relative z-10 w-full ${
        isAdminView
          ? ""
          : currentView === "home" || currentView === "contact"
            ? "pb-24 sm:pb-28"
            : "max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 mt-2 pb-20 sm:pb-24"
      }`}>
        {renderView()}
      </main>

      {/* Global Standard Footer - Hidden on mobile */}
      {!maintenanceMode && !isAdminView && currentView !== "auth" && (
        <div className="hidden sm:block">
          <Footer />
        </div>
      )}

      {/* Mobile Sticky Navigation (Logged in users only) */}
      {showUserMobileNav && (
        <div className="sm:hidden mt-auto z-40 relative">
          <MobileNav currentView={currentView} onNavigate={handleNavigate} />
        </div>
      )}

      {/* Tawk.to Live Chat integration overlay fixed */}
      {!maintenanceMode && <TawkChat />}

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



