import React, { useState, useEffect, useRef } from "react";
import { OrbitProvider, useOrbit } from "./context/OrbitContext";
import { Navigation } from "./components/Navigation";
import { MobileNav } from "./components/MobileNav";
import { Footer } from "./components/Footer";
import { ScrollAnimatedBackground } from "./components/ScrollAnimatedBackground";
import { TawkChat } from "./components/TawkChat";

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

// Icons
import { X, Plus, CheckCircle2, Copy, Check, ChevronDown, Info, Loader2, ArrowUpRight, ArrowDownRight, Download, AlertTriangle } from "lucide-react";

function MainAppContent() {
  const { user, deposit, withdraw, adminWallets, insufficientBalanceOpen, setInsufficientBalanceOpen } = useOrbit();
  const [currentView, setCurrentView] = useState("home");
  const [targetTradeAsset, setTargetTradeAsset] = useState<string | null>(null);
  const [walletSubTab, setWalletSubTab] = useState<"deposit" | "withdraw" | "ledger" | "support">("deposit");

  // Modals state
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  // Form states inside Quick Modals
  const quickFileRef = useRef<HTMLInputElement>(null);
  const [depAmt, setDepAmt] = useState("");
  const [depCoin, setDepCoin] = useState("USDT");
  const [depNetwork, setDepNetwork] = useState("TRC20");
  const [copied, setCopied] = useState(false);
  const [depTxHash, setDepTxHash] = useState("");
  const [depProofName, setDepProofName] = useState("");
  const [wdrAmt, setWdrAmt] = useState("");
  const [wdrCoin, setWdrCoin] = useState("USDT");
  const [wdrNetwork, setWdrNetwork] = useState("TRC20");
  const [wdrAddr, setWdrAddr] = useState("");

  const [modalFeedback, setModalFeedback] = useState<string | { title: string; description: string; type?: string } | null>(null);

  useEffect(() => {
    if (depCoin === "USDT") {
      setDepNetwork("TRC20");
    } else if (depCoin === "BTC") {
      setDepNetwork("BTC");
    } else if (depCoin === "ETH") {
      setDepNetwork("ERC20");
    }
  }, [depCoin]);

  // Reset scroll coordinates on navigation/page view change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [currentView]);

  useEffect(() => {
    if (wdrCoin === "USDT") {
      setWdrNetwork("TRC20");
    } else if (wdrCoin === "BTC") {
      setWdrNetwork("BTC");
    } else if (wdrCoin === "ETH") {
      setWdrNetwork("ERC20");
    } else if (wdrCoin === "USD") {
      setWdrNetwork("ACH");
    }
  }, [wdrCoin]);

  const getNetworksForCoin = (coin: string) => {
    switch (coin) {
      case "USDT":
        return [
          { id: "TRC20", label: "TRC20 (Tron Network)", address: adminWallets?.USDT_TRC20 || "TYc8Dq6pB1A8C8xbeGf4mDqsD84Kda67vE" },
          { id: "ERC20", label: "ERC20 (Ethereum Network)", address: adminWallets?.USDT_ERC20 || "0x981A7bFDE6D211a76B97A1f6DAe82b7814a60156" },
          { id: "BEP20", label: "BEP20 (BNB Smart Chain)", address: adminWallets?.BNB || "0x3fC91A3afd20b00230230233ea86976828a923" }
        ];
      case "BTC":
        return [
          { id: "BTC", label: "Bitcoin Native Network (BTC)", address: adminWallets?.BTC || "bc1qxy2kg3ut7ytu6e8f4t9rga2dfws368ff66e5g8" }
        ];
      case "ETH":
        return [
          { id: "ERC20", label: "ERC20 (Ethereum Network)", address: adminWallets?.ETH || "0x7Fba9fB5994A1F62aB016a2E9D843D0B6A780E2e" }
        ];
      default:
        return [
          { id: "TRC20", label: "TRC20 Network", address: "TYc8Dq6pB1A8C8xbeGf4mDqsD84Kda67vE" }
        ];
    }
  };

  const getNetworksForWdrCoin = (coin: string) => {
    switch (coin) {
      case "USDT":
        return [
          { id: "TRC20", label: "TRC20 (Tron Network)" },
          { id: "ERC20", label: "ERC20 (Ethereum Network)" },
          { id: "BEP20", label: "BEP20 (BNB Smart Chain)" }
        ];
      case "BTC":
        return [
          { id: "BTC", label: "Bitcoin Native Network (BTC)" }
        ];
      case "ETH":
        return [
          { id: "ERC20", label: "ERC20 (Ethereum Network)" }
        ];
      case "USD":
        return [
          { id: "ACH", label: "Bank ACH (Transit / Checking)" },
          { id: "WIRE", label: "International Wire Transfer" }
        ];
      default:
        return [
          { id: "TRC20", label: "TRC20 Network" }
        ];
    }
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Scroll to top on view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentView]);

  // Auto-redirect logged-in users to dashboard if they are on the auth page
  useEffect(() => {
    if (user.isLoggedIn && currentView === "auth") {
      setCurrentView("dashboard");
    }
  }, [user.isLoggedIn, currentView]);

  const handleNavigate = (view: string, assetSymbol?: string) => {
    if (view.startsWith("dashboard") && !user.isLoggedIn) {
      setCurrentView("auth");
      return;
    }

    if (view === "dashboard-trading" && assetSymbol) {
      setTargetTradeAsset(assetSymbol);
    }

    if (view === "dashboard-wallet") {
      setWalletSubTab("deposit");
    }

    setCurrentView(view);
  };

  const handleQuickDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depAmt);
    if (!amount || amount <= 0) return;

    const fullAssetLabel = depCoin === "USDT" ? `${depCoin} (${depNetwork})` : depCoin;
    deposit(amount, fullAssetLabel, depTxHash.trim() || "N/A", depProofName || "payment_proof_receipt.jpg");
    setDepAmt("");
    setDepTxHash("");
    setDepProofName("");
    triggerModalFeedback({
      title: "Deposit Processing",
      description: `Your deposit of $${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD equivalent of ${fullAssetLabel} is being processed. The funds will be credited to your account after network confirmation.`,
      type: "success"
    });
    setTimeout(() => {
      setDepositModalOpen(false);
      setModalFeedback(null);
    }, 5000);
  };

  const handleQuickWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(wdrAmt);
    if (!amount || amount <= 0 || !wdrAddr.trim()) return;

    if (!user.isLoggedIn) {
      setWithdrawModalOpen(false);
      setCurrentView("auth");
      return;
    }

    const currencyLabel = wdrCoin === "USD" ? "USD" : `${wdrCoin} (${wdrNetwork})`;
    const res = withdraw(amount, currencyLabel, wdrAddr);
    if (res.success) {
      setWdrAmt("");
      setWdrAddr("");
      triggerModalFeedback({
        title: "Withdrawal Submitted",
        description: `Your request to withdraw $${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD equivalent in ${currencyLabel} to ${wdrAddr} has been safely queued. Settlement is currently processing.`,
        type: "success"
      });
      setTimeout(() => {
        setWithdrawModalOpen(false);
        setModalFeedback(null);
      }, 5000);
    } else {
      if (res.message.toLowerCase().includes("insufficient") || res.message.toLowerCase().includes("not enough")) {
        setWithdrawModalOpen(false);
        setInsufficientBalanceOpen(true);
      } else {
        triggerModalFeedback(`Error: ${res.message}`);
      }
    }
  };

  const triggerModalFeedback = (msg: string | { title: string; description: string; type?: string }) => {
    setModalFeedback(msg);
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
        : "pt-16 sm:pt-20"
    }`}>
      <ScrollAnimatedBackground />
      
      {/* Dynamic top bar links */}
      <Navigation currentView={currentView} onNavigate={handleNavigate} />

      {/* Primary content area container */}
      <main className={`relative z-10 flex-grow ${
        currentView === "home"
          ? "w-full pb-32"
          : "max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-4 pb-32"
      }`}>
        {renderView()}
      </main>

      {/* Global Standard Footer - Hidden on mobile */}
      <div className="hidden md:block">
        <Footer onNavigate={handleNavigate} />
      </div>

      <MobileNav currentView={currentView} onNavigate={handleNavigate} />

      <TawkChat />

      {/* QUICK DEPOSIT MODAL OUTLAY */}
      {depositModalOpen && (() => {
        const networks = getNetworksForCoin(depCoin);
        const activeNetwork = networks.find(n => n.id === depNetwork) || networks[0];
        
        return (
          <div className="fixed inset-0 bg-[#000000]/85 backdrop-blur-sm overflow-y-auto p-4 z-50 flex items-center justify-center">
            <div className="bg-[#121318] border border-orbit-border/80 rounded-2xl w-full max-w-md p-6 relative shadow-2xl space-y-5 max-h-[calc(100vh-2rem)] overflow-y-auto my-auto">
              <button 
                onClick={() => { setDepositModalOpen(false); setModalFeedback(null); }}
                className="absolute top-4.5 right-4.5 text-orbit-gray-text hover:text-orbit-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-orbit-white font-heading tracking-tight flex items-center gap-2">
                  <ArrowDownRight size={18} className="text-orbit-accent shrink-0" />
                  Deposit Crypto
                </h3>
                <p className="text-xs text-orbit-gray-text leading-relaxed font-sans">
                  Select a coin and its corresponding network to fund your account securely.
                </p>
              </div>

              {modalFeedback && (() => {
                if (typeof modalFeedback === "object") {
                  return (
                    <div className="p-4 rounded-xl bg-[#141b1a] border border-emerald-500/20 flex items-start gap-3 text-emerald-400">
                      <div className="shrink-0 mt-0.5">
                        <Loader2 size={16} className="animate-spin text-emerald-400" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-[13px] font-bold text-orbit-white leading-tight">
                          {modalFeedback.title}
                        </h4>
                        <p className="text-xs text-emerald-450/85 leading-relaxed font-sans">
                          {modalFeedback.description}
                        </p>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className="p-3 text-xs rounded-lg bg-orbit-green/10 border border-orbit-green/30 text-orbit-green font-semibold">
                    {modalFeedback}
                  </div>
                );
              })()}

              <form onSubmit={handleQuickDeposit} className="space-y-5 font-sans">
                {/* Step 1: Select Crypto Asset */}
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-sans uppercase block font-bold tracking-wider">
                    1. SELECT CRYPTO ASSET
                  </label>
                  <div className="grid grid-cols-3 gap-2.5 font-bold select-none text-xs">
                    {["USDT", "BTC", "ETH"].map(coin => (
                      <button
                        key={coin}
                        type="button"
                        onClick={() => setDepCoin(coin)}
                        className={`py-2.5 rounded-xl border text-center cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                          depCoin === coin 
                            ? "border-orbit-accent bg-orbit-accent/5 text-orbit-white ring-1 ring-orbit-accent" 
                            : "border-orbit-border bg-orbit-bg text-orbit-gray-text hover:text-orbit-white hover:border-orbit-gray-text/50"
                        }`}
                      >
                        {coin === "USDT" && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                        {coin === "BTC" && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                        {coin === "ETH" && <span className="w-2 h-2 rounded-full bg-indigo-400"></span>}
                        {coin}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Select Deposit Network / Method */}
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-sans uppercase block font-bold tracking-wider">
                    2. SELECT DEPOSIT NETWORK / METHOD
                  </label>
                  {depCoin === "USDT" ? (
                    <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                      {networks.map(n => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => setDepNetwork(n.id)}
                          className={`py-2 px-1.5 rounded-lg border text-center cursor-pointer transition-all ${
                            depNetwork === n.id 
                              ? "border-orbit-accent bg-orbit-accent/5 text-orbit-accent font-bold" 
                              : "border-orbit-border bg-orbit-bg text-orbit-gray-text hover:text-orbit-white"
                          }`}
                        >
                          {n.id}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-orbit-bg/50 rounded-lg border border-orbit-border/80 flex items-center justify-between text-xs text-orbit-white font-mono">
                      <span>{activeNetwork.label}</span>
                      <span className="text-[9px] uppercase font-bold tracking-wider font-sans bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/15">
                        Native
                      </span>
                    </div>
                  )}
                </div>

                {/* Step 3: Actionable Deposit Details (QR + Address Instructions inside Grey Card) */}
                <div className="bg-[#121318]/90 border border-orbit-border rounded-xl p-4.5 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-orbit-accent uppercase tracking-wider font-heading">
                    <Info size={14} className="text-orbit-accent shrink-0" />
                    <span>DEPOSIT INSTRUCTIONS</span>
                  </div>

                  <p className="text-xs text-orbit-gray-text leading-relaxed font-sans text-left">
                    Send only the selected coin to this address. Credits after 1 network confirmation.
                  </p>

                  <div className="flex items-center gap-4">
                    {/* QR Code */}
                    <div className="bg-white p-2 rounded-xl shrink-0 inline-block shadow-lg border border-slate-200">
                      <svg className="w-20 h-20 text-slate-900" viewBox="0 0 29 29" fill="currentColor">
                        <path d="M0,0 h7 v7 h-7 z M1,1 h5 v5 h-5 z M2,2 h3 v3 h-3 z" />
                        <path d="M22,0 h7 v7 h-7 z M23,1 h5 v5 h-5 z M24,2 h3 v3 h-3 z" />
                        <path d="M0,22 h7 v7 h-7 z M1,23 h5 v5 h-5 z M2,24 h3 v3 h-3 z" />
                        <path d="M20,20 h5 v5 h-5 z M21,21 h3 v3 h-3 z M22,22 h1 v1 h-1 z" />
                        <path d="M9,1 h1 v1 h-1 z M12,0 h1 v2 h-1 z M15,1 h2 v1 h-2 z M19,0 h2 v1 h-2 z M9,3 h2 v1 h-2 z M13,2 h2 v1 h-2 z M16,3 h1 v2 h-1 z" />
                        <path d="M9,5 h3 v1 h-3 z M14,5 h1 v1 h-1 z M17,5 h2 v1 h-2 z M20,4 h1 v1 h-1 z M10,7 h2 v1 h-2 z M14,7 h1 v1 h-1 z M16,7 h3 v1 h-3 z" />
                        <path d="M0,9 h2 v1 h-2 z M4,9 h2 v1 h-2 z M8,9 h1 v2 h-1 z M11,10 h3 v1 h-3 z M16,9 h2 v1 h-2 z M20,10 h2 v1 h-2 z h2 v1 h-2 z M24,9 h1 v2 h-1 z M27,9 h2 v1 h-2 z" />
                        <path d="M1,11 h1 v1 h-1 z M5,11 h1 v1 h-1 z M9,12 h2 v1 h-2 z M13,12 h1 v2 h-1 z M17,11 h1 v3 h-1 z M20,12 h3 v1 h-3 z M25,11 h2 v1 h-2 z" />
                        <path d="M3,14 h3 v1 h-3 z M8,14 h1 v1 h-1 z M11,15 h2 v1 h-2 z M15,14 h1 v1 h-1 z M18,15 h3 v1 h-3 z M23,14 h2 v1 h-2 z M26,14 h2 v1 h-2 z" />
                        <path d="M0,17 h2 v1 h-2 z M4,17 h1 v2 h-1 z M8,17 h3 v1 h-3 z M13,18 h2 v1 h-2 z M16,17 h1 v1 h-1 z M19,17 h2 v2 h-2 z M23,17 h2 v1 h-2 z" />
                        <path d="M9,19 h2 v1 h-2 z M12,20 h3 v1 h-3 z M17,19 h1 v2 h-1 z M21,20 h1 v1 h-1 z M25,19 h3 v1 h-3 z" />
                        <path d="M9,22 h1 v1 h-1 z M11,23 h2 v1 h-2 z M15,22 h2 v1 h-2 z M18,23 h2 v1 h-2 z M22,23 h1 v2 h-1 z M25,22 h2 v1 h-2 z" />
                        <path d="M8,25 h3 v1 h-3 z M13,25 h1 v1 h-1 z M16,25 h2 v1 h-2 z M20,26 h2 v1 h-2 z M24,25 h2 v1 h-2 z" />
                        <path d="M9,27 h2 v2 h-2 z M12,28 h3 v1 h-3 z M17,27 h1 v2 h-1 z M21,27 h3 v1 h-3 z M26,28 h2 v1 h-2 z" />
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5 text-left">
                      <span className="text-[9px] text-slate-400 font-sans uppercase block font-bold tracking-wider">
                        YOUR {depCoin} DEPOSIT ADDRESS
                      </span>
                      <div className="bg-[#121318] border border-orbit-border/50 rounded-xl p-2 flex items-center justify-between gap-1.5">
                        <span className="font-mono text-[10px] break-all select-all text-orbit-white pr-1">
                          {activeNetwork.address}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyAddress(activeNetwork.address)}
                          className="p-1 px-1.5 rounded-lg bg-orbit-border/50 hover:bg-orbit-accent/10 text-orbit-gray-text hover:text-orbit-accent transition-all cursor-pointer select-none shrink-0"
                          title="Copy Address"
                        >
                          {copied ? (
                            <span className="text-[9px] text-orbit-green font-bold flex items-center gap-1">
                              <Check size={10} /> COPIED
                            </span>
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 italic space-y-0.5 text-left font-sans">
                    <span>• Ensure you send only {depCoin} to this address.</span>
                    <span className="block">• Assets are safely held 1:1.</span>
                  </div>
                </div>

                {/* Deposit Amount input */}
                <div className="space-y-1 text-left">
                  <label className="text-[10px] text-slate-400 font-sans uppercase block font-bold tracking-wider">
                    AMOUNT OF DEPOSIT (USD VALUE)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="100"
                      value={depAmt}
                      onChange={(e) => setDepAmt(e.target.value)}
                      placeholder="Min. Deposit: 100 USD"
                      className="w-full bg-[#121318] border border-orbit-border/80 focus:border-orbit-accent focus:ring-1 focus:ring-orbit-accent rounded-xl py-2.5 px-3 text-[11px] text-orbit-white font-mono font-semibold transition-all focus:outline-none placeholder:text-[10px] placeholder-slate-500"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono font-bold">
                      USD
                    </span>
                  </div>
                </div>

                <div className="pt-1 select-none">
                  <p className="text-[10px] text-slate-400 flex items-start gap-1.5 leading-relaxed text-left">
                    <Info size={11} className="text-amber-500 shrink-0 mt-0.5" />
                    <span>Minimum deposit: 100 USD. Deposits below this amount cannot be recovered.</span>
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-orbit-accent hover:opacity-95 text-orbit-bg font-extrabold font-heading text-xs uppercase rounded-xl transition-all shadow-md shadow-orbit-accent/10 cursor-pointer tracking-wider text-center"
                  >
                    CONFIRM DEPOSIT
                  </button>
                  <p className="text-xs text-neutral-400 text-center mt-2 font-sans">
                    Please only click the Confirm Deposit button if you have already transferred the funds.
                  </p>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* QUICK WITHDRAWAL MODAL OUTLAY */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm overflow-y-auto p-4 z-50 flex items-center justify-center">
          <div className="bg-orbit-card border border-orbit-border rounded-2xl w-full max-w-md p-6 relative shadow-2xl space-y-5 max-h-[calc(100vh-2rem)] overflow-y-auto my-auto">
            <button 
              onClick={() => { setWithdrawModalOpen(false); setModalFeedback(null); }}
              className="absolute top-4 right-4 text-orbit-gray-text hover:text-orbit-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-base font-bold text-orbit-white flex items-center gap-2">
                <ArrowUpRight size={18} className="text-orbit-accent shrink-0" />
                Withdraw
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Please ensure the withdrawal address and selected network match exactly to avoid loss of funds.
              </p>
            </div>

            {modalFeedback && (() => {
              if (typeof modalFeedback === "object") {
                return (
                  <div className="p-4 rounded-xl bg-[#141b1a] border border-emerald-500/20 flex items-start gap-3 text-emerald-400">
                    <div className="shrink-0 mt-0.5">
                      <Loader2 size={16} className="animate-spin text-emerald-400" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[13px] font-bold text-orbit-white leading-tight">
                        {modalFeedback.title}
                      </h4>
                      <p className="text-xs text-emerald-450/85 leading-relaxed font-sans">
                        {modalFeedback.description}
                      </p>
                    </div>
                  </div>
                );
              }
              return (
                <div className={`p-3 text-xs rounded-lg text-center ${
                  modalFeedback.startsWith("Error") 
                    ? "bg-orbit-red/10 border-orbit-red/30 text-orbit-red" 
                    : "bg-orbit-green/10 border-orbit-green/30 text-orbit-green font-semibold"
                }`}>
                  {modalFeedback}
                </div>
              );
            })()}

            <form onSubmit={handleQuickWithdraw} className="space-y-5">
              {/* Step 1: Coin Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-sans uppercase font-bold tracking-wider block">Coin</label>
                <div className="grid grid-cols-3 gap-2 text-xs font-bold font-sans">
                  {["USDT", "BTC", "ETH"].map(coin => (
                    <button
                      key={coin}
                      type="button"
                      onClick={() => setWdrCoin(coin)}
                      className={`py-2 rounded-xl border text-center cursor-pointer transition-all ${
                        wdrCoin === coin 
                          ? "border-orbit-accent bg-orbit-accent/10 text-orbit-accent" 
                          : "border-orbit-border/50 bg-[#121318] text-slate-400"
                      }`}
                    >
                      {coin}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Blockchain Network Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-sans uppercase font-bold tracking-wider block">Blockchain Network</label>
                <div className="flex flex-wrap gap-2 text-[11px] font-bold font-sans">
                  {getNetworksForWdrCoin(wdrCoin).map((net) => (
                    <button
                      key={net.id}
                      type="button"
                      onClick={() => setWdrNetwork(net.id)}
                      className={`px-3 py-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                        wdrNetwork === net.id 
                          ? "border-orbit-accent bg-orbit-accent/10 text-orbit-accent font-extrabold" 
                          : "border-orbit-border/50 bg-[#121318] text-slate-400"
                      }`}
                    >
                      {net.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Wallet Address & Amount Inputs */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-sans uppercase font-bold tracking-wider block">Wallet Address</label>
                <input
                  type="text"
                  required
                  value={wdrAddr}
                  onChange={(e) => setWdrAddr(e.target.value)}
                  placeholder="Fill in the withdrawal address"
                  className="w-full bg-[#121318] border border-orbit-border/80 focus:border-orbit-accent focus:ring-1 focus:ring-orbit-accent rounded-xl py-2.5 px-3 text-[11px] text-orbit-white font-mono font-semibold transition-all focus:outline-none placeholder:text-[10px] placeholder-slate-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-slate-400 font-sans uppercase font-bold tracking-wider">Amount</label>
                  <span className="text-[10px] text-slate-400 font-sans font-semibold">
                    Available Balance: {user.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} {wdrCoin}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    value={wdrAmt}
                    onChange={(e) => setWdrAmt(e.target.value)}
                    placeholder="Fill in the withdrawal amount"
                    className="w-full bg-[#121318] border border-orbit-border/80 focus:border-orbit-accent focus:ring-1 focus:ring-orbit-accent rounded-xl py-2.5 px-3 pr-20 text-[11px] text-orbit-white font-mono font-semibold transition-all focus:outline-none placeholder:text-[10px] placeholder-slate-500"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setWdrAmt(user.balance.toString())}
                      className="text-[10px] text-orbit-accent hover:opacity-80 font-sans font-extrabold cursor-pointer uppercase"
                    >
                      All
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono font-bold border-l border-slate-700 pl-2">
                      {wdrCoin}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 4: Fee Breakdown & Button Update */}
              <div className="flex justify-between items-center text-[11px] font-sans text-slate-400 pt-1">
                <span>Gas fee:</span>
                <span className="text-orbit-white font-mono font-bold">
                  {wdrCoin === "USDT" ? "1.00 USDT" : wdrCoin === "BTC" ? "0.0002 BTC" : "0.003 ETH"}
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-orbit-accent hover:opacity-95 text-orbit-bg font-extrabold font-heading text-xs uppercase rounded-xl transition-all shadow-md shadow-orbit-accent/10 cursor-pointer tracking-wider"
              >
                Withdraw
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Insufficient Balance Modal Overlay */}
      {insufficientBalanceOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-orbit-card border border-orbit-border rounded-2xl w-full max-w-sm p-6 relative shadow-2xl space-y-5">
            <button 
              onClick={() => setInsufficientBalanceOpen(false)}
              className="absolute top-4 right-4 text-orbit-gray-text hover:text-orbit-white cursor-pointer bg-transparent border-none outline-none"
            >
              <X size={18} />
            </button>
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-orbit-accent">
                <AlertTriangle size={24} className="animate-bounce" />
              </div>
              <h3 className="text-base font-bold text-orbit-white uppercase tracking-wider font-heading">
                Insufficient Balance
              </h3>
              <p className="text-xs text-orbit-gray-text leading-relaxed font-sans">
                Your wallet balance is insufficient to complete this action. Please fund your wallet to continue.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setInsufficientBalanceOpen(false)}
                className="py-2.5 rounded-xl border border-orbit-border/50 hover:border-orbit-white bg-transparent text-orbit-white font-bold font-subheading text-[11px] uppercase transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setInsufficientBalanceOpen(false);
                  setDepositModalOpen(true);
                }}
                className="py-2.5 rounded-xl bg-orbit-accent hover:opacity-95 text-orbit-bg font-extrabold font-subheading text-[11px] uppercase transition-all shadow-md shadow-orbit-accent/15 cursor-pointer leading-relaxed"
              >
                Fund Wallet
              </button>
            </div>
          </div>
        </div>
      )}

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
