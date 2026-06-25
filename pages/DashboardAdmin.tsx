import React, { useState, useEffect } from "react";
import { useOrbit } from "../context/OrbitContext";
import { 
  Users, 
  Layers, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Bell, 
  Volume2, 
  ShieldAlert, 
  MessageSquare,
  Activity,
  UserCheck,
  Ban,
  PenTool,
  Check,
  X,
  CreditCard,
  Key,
  Database,
  Search,
  Plus,
  Trash2,
  FileText,
  Lock,
  Compass,
  DollarSign,
  Award,
  Gift
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line
} from "recharts";

export const DashboardAdmin: React.FC = () => {
  const {
    user: currentUser,
    plans,
    adminUsers,
    adminWallets,
    adminAnnouncements,
    adminAuditLogs,
    updateAdminWallets,
    adminUpdateUserBalance,
    adminChangeUserStatus,
    adminResetUserPassword,
    adminKycReview,
    adminCreatePlan,
    adminUpdatePlan,
    adminDeletePlan,
    adminSetPlanStatus,
    adminApproveDeposit,
    adminRejectDeposit,
    adminApproveWithdrawal,
    adminRejectWithdrawal,
    adminCreateAnnouncement,
    adminDeleteAnnouncement,
    adminReplyToTicket,
    adminCloseTicket,
    adminSetTicketPriority,
    addNotification,
    siteContent,
    updateSiteContent,
    traders,
    adminUpdateTrader,
    adminCreateTrader,
    adminDeleteTrader,
    adminAirdropClaims,
    adminApproveAirdrop,
    airdrops,
    adminCreateAirdrop,
    adminUpdateAirdrop,
    adminDeleteAirdrop
  } = useOrbit();

  // Authentication barrier for administrative workspace
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState("henrikaram1@gmail.com");
  const [adminPass, setAdminPass] = useState("");
  const [adminTwoFactor, setAdminTwoFactor] = useState("");
  const [tempAuthError, setTempAuthError] = useState("");

  // Simulated 2FA codes for demonstration
  const FIXED_2FA_TOKEN = "777";

  const handleAdminVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setTempAuthError("");
    
    // Allow entry for our premium user
    if (adminEmail !== "henrikaram1@gmail.com" || adminPass !== "orbitrio123") {
      setTempAuthError("Invalid administrator credentials. Access restricted.");
      return;
    }
    if (adminTwoFactor !== FIXED_2FA_TOKEN) {
      setTempAuthError("Mismatched 2FA verification token. Check authenticator loop.");
      return;
    }
    setIsAdminAuthenticated(true);
  };

  // Navigations Setup
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "investments" | "deposits" | "withdrawals" | "bulletins" | "support" | "security" | "content" | "traders" | "airdrops" | "kyc"
  >("overview");

  // Trader form states
  const [editingTraderId, setEditingTraderId] = useState<string | null>(null);
  const [traderForm, setTraderForm] = useState({
    name: "",
    avatar: "",
    roi: 0,
    winRate: 0,
    followers: 0,
    maxFollowers: 0,
    assetsUnderManagement: "",
    riskScore: 3,
    profitDays: 30,
    chartDataString: ""
  });

  // Filter and search keys
  const [usersSearch, setUsersSearch] = useState("");
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);
  const [balanceOverrideVal, setBalanceOverrideVal] = useState("");

  // Selected ticket chat admin states
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [adminReplyTxt, setAdminReplyTxt] = useState("");

  // Plan creation forms
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanMin, setNewPlanMin] = useState("");
  const [newPlanMax, setNewPlanMax] = useState("");
  const [newPlanDays, setNewPlanDays] = useState("");
  const [newPlanReturns, setNewPlanReturns] = useState("");
  const [newPlanDesc, setNewPlanDesc] = useState("");

  // Announcement forms
  const [newAnnTitle, setNewAnnTitle] = useState("");
  const [newAnnContent, setNewAnnContent] = useState("");
  const [newAnnPin, setNewAnnPin] = useState(false);

  // Wallets configs
  const [btcConf, setBtcConf] = useState(adminWallets.BTC || "");
  const [ethConf, setEthConf] = useState(adminWallets.ETH || "");
  const [usdtErcConf, setUsdtErcConf] = useState(adminWallets.USDT_ERC20 || "");
  const [usdtTrcConf, setUsdtTrcConf] = useState(adminWallets.USDT_TRC20 || "");
  const [bnbConf, setBnbConf] = useState(adminWallets.BNB || "");

  // Simulated system stats
  const aggregateUsers = adminUsers.length + 10; // plus some mock figures
  const activeUserCount = adminUsers.filter(u => u.status === "active").length + 8;
  const bannedCount = adminUsers.filter(u => u.status === "banned").length;
  
  // Aggregate transactions lists
  const allDeposits: any[] = [];
  const allWithdrawals: any[] = [];
  const allTickets: any[] = [];

  // Gather current user transactions
  currentUser.transactions.forEach(t => {
    const enriched = { ...t, userEmail: currentUser.email, userName: currentUser.name || "HENRIK" };
    if (t.type === "deposit") allDeposits.push(enriched);
    else if (t.type === "withdrawal") allWithdrawals.push(enriched);
  });

  currentUser.tickets.forEach(tk => {
    allTickets.push({ ...tk, userEmail: currentUser.email, userName: currentUser.name || "HENRIK" });
  });

  // Gather simulated user deposits, withdrawals
  adminUsers.forEach(sim => {
    sim.transactions.forEach(t => {
      const enriched = { ...t, userEmail: sim.email, userName: sim.name };
      if (t.type === "deposit") allDeposits.push(enriched);
      else if (t.type === "withdrawal") allWithdrawals.push(enriched);
    });
    sim.tickets.forEach(tk => {
      allTickets.push({ ...tk, userEmail: sim.email, userName: sim.name });
    });
  });

  // Sort them
  const sortedDeposits = [...allDeposits].sort((a,b) => b.id.localeCompare(a.id));
  const sortedWithdrawals = [...allWithdrawals].sort((a,b) => b.id.localeCompare(a.id));
  const sortedTickets = [...allTickets].sort((a,b) => b.status === "open" ? -1 : 1);

  // Financial aggregates
  const totalDepositVolume = allDeposits
    .filter(t => t.status === "completed" || t.status === "approved")
    .reduce((acc, current) => acc + current.amount, 0) + 1450000;

  const totalWithdrawalVolume = allWithdrawals
    .filter(t => t.status === "completed" || t.status === "approved")
    .reduce((acc, current) => acc + current.amount, 0) + 210000;

  const totalInvestmentsPlaced = plans.length * 48000 + 482900;
  const platformHedgedRevenue = totalDepositVolume * 0.08; // 8% fees/spread
  const pendingPayoutCount = sortedWithdrawals.filter(w => w.status === "pending").length;

  // Chart data
  const volumeChartData = [
    { name: "Mon", Deposits: 4500, Withdrawals: 1200 },
    { name: "Tue", Deposits: 8900, Withdrawals: 2400 },
    { name: "Wed", Deposits: 12000, Withdrawals: 4500 },
    { name: "Thu", Deposits: 34000, Withdrawals: 15000 },
    { name: "Fri", Deposits: 18000, Withdrawals: 8000 },
    { name: "Sat", Deposits: 15400, Withdrawals: 3100 },
    { name: "Sun", Deposits: 22000, Withdrawals: 9500 }
  ];

  const userGrowthData = [
    { name: "May 1", Users: 120 },
    { name: "May 10", Users: 280 },
    { name: "May 20", Users: 410 },
    { name: "Jun 1", Users: 590 },
    { name: "Jun 10", Users: 810 },
    { name: "Jun 19", Users: aggregateUsers }
  ];

  const investmentGrowthData = [
    { name: "Week 1", Starter: 12, Pro: 5, VIP: 1 },
    { name: "Week 2", Starter: 35, Pro: 18, VIP: 3 },
    { name: "Week 3", Starter: 78, Pro: 44, VIP: 9 },
    { name: "Week 4", Starter: 145, Pro: 98, VIP: 24 }
  ];

  // Action dispatches
  const postNewPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName || !newPlanMin || !newPlanMax || !newPlanDays || !newPlanReturns) return;
    
    adminCreatePlan({
      name: newPlanName,
      minDeposit: parseFloat(newPlanMin),
      maxDeposit: parseFloat(newPlanMax),
      durationDays: parseInt(newPlanDays),
      roiPercent: parseFloat(newPlanReturns),
      description: newPlanDesc || "Custom tailored high performance liquidity pool.",
      status: "active"
    });

    // Clear
    setNewPlanName("");
    setNewPlanMin("");
    setNewPlanMax("");
    setNewPlanDays("");
    setNewPlanReturns("");
    setNewPlanDesc("");
  };

  const postAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle || !newAnnContent) return;
    adminCreateAnnouncement(newAnnTitle, newAnnContent, newAnnPin);
    setNewAnnTitle("");
    setNewAnnContent("");
    setNewAnnPin(false);
  };

  // Content Editor local input bindings
  const [localHeroTitle, setLocalHeroTitle] = useState("");
  const [localHeroSubtitle, setLocalHeroSubtitle] = useState("");
  const [localHeroButton, setLocalHeroButton] = useState("");
  const [localDashTitle, setLocalDashTitle] = useState("");
  const [localDashDesc, setLocalDashDesc] = useState("");
  const [localInvestTitle, setLocalInvestTitle] = useState("");
  const [localInvestDesc, setLocalInvestDesc] = useState("");
  const [localFooterText, setLocalFooterText] = useState("");
  const [localAnnText, setLocalAnnText] = useState("");
  const [localFaqQ1, setLocalFaqQ1] = useState("");
  const [localFaqA1, setLocalFaqA1] = useState("");
  const [localFaqQ2, setLocalFaqQ2] = useState("");
  const [localFaqA2, setLocalFaqA2] = useState("");
  const [localFaqQ3, setLocalFaqQ3] = useState("");
  const [localFaqA3, setLocalFaqA3] = useState("");

  const [contentStatusMsg, setContentStatusMsg] = useState("");

  // Sync state values automatically on global loading
  useEffect(() => {
    if (siteContent) {
      setLocalHeroTitle(siteContent.hero_title || "");
      setLocalHeroSubtitle(siteContent.hero_subtitle || "");
      setLocalHeroButton(siteContent.hero_button || "");
      setLocalDashTitle(siteContent.dashboard_title || "");
      setLocalDashDesc(siteContent.dashboard_description || "");
      setLocalInvestTitle(siteContent.investment_title || "");
      setLocalInvestDesc(siteContent.investment_description || "");
      setLocalFooterText(siteContent.footer_text || "");
      setLocalAnnText(siteContent.announcement_text || "");
      setLocalFaqQ1(siteContent.faq_question_1 || "");
      setLocalFaqA1(siteContent.faq_answer_1 || "");
      setLocalFaqQ2(siteContent.faq_question_2 || "");
      setLocalFaqA2(siteContent.faq_answer_2 || "");
      setLocalFaqQ3(siteContent.faq_question_3 || "");
      setLocalFaqA3(siteContent.faq_answer_3 || "");
    }
  }, [siteContent]);

  const applyWalletsOverride = (e: React.FormEvent) => {
    e.preventDefault();
    updateAdminWallets({
      BTC: btcConf,
      ETH: ethConf,
      USDT_ERC20: usdtErcConf,
      USDT_TRC20: usdtTrcConf,
      BNB: bnbConf
    });
  };

  // Find detailed user info
  const targetAdminUser = adminUsers.find(u => u.email === selectedUserEmail) || 
    (currentUser.email === selectedUserEmail ? {
      email: currentUser.email,
      name: currentUser.name || "Default",
      balance: currentUser.balance,
      portfolioValue: currentUser.portfolioValue,
      status: currentUser.status || "active",
      activeInvestments: currentUser.activeInvestments,
      portfolio: currentUser.portfolio,
      transactions: currentUser.transactions,
      tickets: currentUser.tickets,
      loginHistory: [{ date: "Just now", ip: "Your IP", device: "Browser session" }]
    } : null);

  const activeTicketObj = sortedTickets.find(t => t.id === activeTicketId);

  // AUTH LAYER CHECKOUT
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-orbit-bg py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-md w-full space-y-8 bg-orbit-card border border-orbit-border p-8 rounded-2xl shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF7F00] via-orbit-accent to-yellow-500" />
          
          <div className="text-center">
            <div className="inline-flex p-3 rounded-full bg-orbit-accent/10 text-orbit-accent mb-3">
              <Lock size={32} className="animate-pulse" />
            </div>
            <h2 className="text-xl font-bold font-heading text-orbit-white tracking-tight">
              Administrative Gatekeeper
            </h2>
            <p className="mt-2 text-xs text-orbit-gray-text leading-relaxed">
              <span className="lowercase text-orbit-white font-medium">orbit<span className="text-orbit-accent">rio</span></span> secure trading node workspace. Complete credentials alongside the simulated authenticator keys to proceed.
            </p>
          </div>

          {tempAuthError && (
            <div className="p-3.5 bg-orbit-red/10 border border-orbit-red/35 text-orbit-red text-center text-xs font-semibold rounded-xl">
              {tempAuthError}
            </div>
          )}

          <form onSubmit={handleAdminVerify} className="mt-8 space-y-5">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-orbit-gray-text">Admin Email Address</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="henrikaram1@gmail.com"
                  className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent px-3 py-2 text-xs font-medium text-orbit-white rounded-lg focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-orbit-gray-text">Master Encryption Code</label>
                <input
                  type="password"
                  required
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent px-3 py-2 text-xs font-medium text-orbit-white rounded-lg focus:outline-none"
                />
                <span className="text-[9px] text-zinc-500 block italic leading-none mt-1">
                  Simulation Password hint: <strong className="text-orbit-accent">orbitrio123</strong>
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-orbit-gray-text">2FA Authenticator Pin (OTP)</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={adminTwoFactor}
                  onChange={(e) => setAdminTwoFactor(e.target.value)}
                  placeholder="e.g. 777"
                  className="w-full bg-orbit-bg border border-orbit-font text-center tracking-widest text-[#FF7F00] font-black border-orbit-border focus:border-orbit-accent px-3 py-2 text-sm rounded-lg focus:outline-none"
                />
                <span className="text-[9px] text-zinc-500 block text-center leading-none mt-1">
                  Simulation 2FA Pin: <strong className="text-orbit-accent">777</strong>
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-orbit-accent text-orbit-bg font-black font-subheading text-xs uppercase rounded-xl shadow-lg shadow-orbit-accent/15 hover:opacity-95 transition-all text-center cursor-pointer"
            >
              Verify Secure Session
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20 font-sans">
      
      {/* 1. SEPARATE SECURE ADMIN SIDEBAR (col-span-3) */}
      <div className="lg:col-span-3 bg-orbit-card border border-orbit-border rounded-2xl p-5 flex flex-col justify-between self-start">
        <div className="space-y-6">
          
          {/* Admin Tag */}
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

          {/* Sidebar Menu elements */}
          <nav className="space-y-1.5">
            {[
              { id: "overview", label: "All Users", icon: Activity },
              { id: "users", label: "Add or Take Money", icon: Users },
              { id: "investments", label: "Investment Plans", icon: Layers },
              { id: "content", label: "Content Editor", icon: PenTool },
              { id: "traders", label: "Traders List", icon: Award },
              { id: "airdrops", label: "Free Coin Claims (Airdrops)", icon: Gift },
              { id: "kyc", label: "ID Verifications", icon: UserCheck },
              { id: "deposits", label: "Incoming Payments (Deposits)", icon: ArrowDownLeft, alert: sortedDeposits.filter(t=>t.status==='pending').length },
              { id: "withdrawals", label: "Payout Requests (Withdrawals)", icon: ArrowUpRight, alert: pendingPayoutCount },
              { id: "bulletins", label: "Announcements Panel", icon: Volume2 },
              { id: "support", label: "Ticket Helpdesk", icon: MessageSquare, alert: sortedTickets.filter(t=>t.status==='open').length },
              { id: "security", label: "Security & Audit Logs", icon: ShieldAlert }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center justify-between text-left py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? "bg-orbit-accent text-orbit-bg shadow" 
                      : "text-orbit-gray-text hover:text-orbit-white hover:bg-orbit-border/30"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon size={14} className={isActive ? "text-orbit-bg" : "text-orbit-accent"} />
                    {item.label}
                  </span>
                  
                  {!!item.alert && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                      isActive ? "bg-orbit-bg text-orbit-accent" : "bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse"
                    }`}>
                      {item.alert}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

        </div>

        {/* Exit link */}
        <div className="pt-6 border-t border-orbit-border/50 mt-6 text-center">
          <button
            onClick={() => setIsAdminAuthenticated(false)}
            className="text-[10px] uppercase font-bold text-center text-orbit-red hover:underline tracking-wider cursor-pointer"
          >
            Lock Admin Terminal
          </button>
        </div>

      </div>

      {/* 2. MAIN ACTIVE WINDOW CANVAS (col-span-9) */}
      <div className="lg:col-span-9 space-y-6">
        
        {/* TAB A: OVERVIEW PERFORMANCE CHARTS */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            
            {/* Real Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Asset Users", val: aggregateUsers, change: `+${activeUserCount} Active Node` },
                { label: "Aggregate Deposits", val: `$${totalDepositVolume.toLocaleString()}`, change: "System Net 1:1" },
                { label: "Aggregate Withdrawals", val: `$${totalWithdrawalVolume.toLocaleString()}`, change: `${sortedWithdrawals.length} Settled Invoices` },
                { label: "Hedged Yield Revenue", val: `$${platformHedgedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, change: "Stable Treasury" }
              ].map((card, idx) => (
                <div key={idx} className="bg-orbit-card border border-orbit-border p-4 rounded-2xl">
                  <span className="text-[10px] uppercase font-medium tracking-wider text-orbit-gray-text">{card.label}</span>
                  <p className="text-xl font-black font-data text-orbit-white mt-2 mb-1">{card.val}</p>
                  <span className="text-[10px] text-orbit-green font-bold block">{card.change}</span>
                </div>
              ))}
            </div>

            {/* Recharts Graphical Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Daily Deposits vs Withdrawals Volume */}
              <div className="bg-orbit-card border border-orbit-border p-5 rounded-2xl space-y-4">
                <div className="border-b border-orbit-border pb-2">
                  <h4 className="text-xs font-bold text-orbit-white uppercase">Daily Flows (USD)</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Rolling deposits & withdrawals activity indicator</p>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={volumeChartData}>
                      <defs>
                        <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#DFAD12" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#DFAD12" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorWithdr" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#252422" vertical={false} />
                      <XAxis dataKey="name" stroke="#5d6065" fontSize={9} />
                      <YAxis stroke="#5d6065" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: "#1e1e1d", borderColor: "#2e2d2b", fontSize: 10 }} />
                      <Area type="monotone" dataKey="Deposits" stroke="#DFAD12" fillOpacity={1} fill="url(#colorDeposits)" strokeWidth={2} />
                      <Area type="monotone" dataKey="Withdrawals" stroke="#ef4444" fillOpacity={1} fill="url(#colorWithdr)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Secure Registered User Growth */}
              <div className="bg-orbit-card border border-orbit-border p-5 rounded-2xl space-y-4">
                <div className="border-b border-orbit-border pb-2">
                  <h4 className="text-xs font-bold text-orbit-white uppercase">Secured Profiles Growth</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Aggregate verified member indexes registered</p>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#252422" vertical={false} />
                      <XAxis dataKey="name" stroke="#5d6065" fontSize={9} />
                      <YAxis stroke="#5d6065" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: "#1e1e1d", borderColor: "#2e2d2b", fontSize: 10 }} />
                      <Line type="monotone" dataKey="Users" stroke="#DFAD12" strokeWidth={3} dot={{ fill: "#DFAD12" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Bottom active trends inside Recharts */}
            <div className="bg-orbit-card border border-orbit-border p-5 rounded-2xl space-y-4">
              <div className="border-b border-orbit-border pb-2">
                <h4 className="text-xs font-bold text-orbit-white uppercase">Investment Tier Subscriptions Tracker</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Enrolled Starter, Pro, and VIP indices</p>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={investmentGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252422" vertical={false} />
                    <XAxis dataKey="name" stroke="#5d6065" fontSize={9} />
                    <YAxis stroke="#5d6065" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e1e1d", borderColor: "#2e2d2b", fontSize: 10 }} />
                    <Bar dataKey="Starter" fill="#b45309" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Pro" fill="#DFAD12" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="VIP" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* TAB B: ID VERIFICATION MANAGEMENT */}
        {activeTab === "kyc" && (
          <div className="bg-orbit-card border border-orbit-border p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-orbit-white">People Waiting for Approval</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr className="border-b border-orbit-border text-[9px] uppercase tracking-wider text-orbit-gray-text">
                            <th className="p-3">User</th>
                            <th className="p-3">ID Type</th>
                            <th className="p-3">Images</th>
                            <th className="p-3">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-orbit-border/30">
                        {(adminUsers || []).filter(u => u.kyc?.status === "pending").map(u => {
                          const [rejectionReason, setRejectionReason] = useState("");
                          return (
                            <tr key={u.email}>
                                <td className="p-3 text-orbit-white">{u.email}</td>
                                <td className="p-3 text-orbit-white">{u.kyc?.idType}</td>
                                <td className="p-3 flex gap-2">
                                    <img src={u.kyc?.frontImage} alt="Front" className="w-10 h-10 rounded border border-orbit-border" />
                                    <img src={u.kyc?.backImage} alt="Back" className="w-10 h-10 rounded border border-orbit-border" />
                                </td>
                                <td className="p-3">
                                    <button onClick={() => adminKycReview(u.email, "approved")} className="bg-orbit-green text-orbit-bg px-2 py-1 rounded text-[10px] font-bold mr-2 cursor-pointer">Pass ID</button>
                                    <div className="flex gap-1 mt-1">
                                        <input 
                                          type="text" 
                                          placeholder="Why fail?" 
                                          value={rejectionReason} 
                                          onChange={(e) => setRejectionReason(e.target.value)}
                                          className="bg-orbit-bg text-orbit-white text-[9px] p-1 rounded border border-orbit-border w-20"
                                        />
                                        <button onClick={() => adminKycReview(u.email, "rejected", rejectionReason)} className="bg-orbit-red text-orbit-white px-2 py-1 rounded text-[10px] font-bold cursor-pointer">Fail ID</button>
                                    </div>
                                </td>
                            </tr>
                        );
                        })}
                    </tbody>
                </table>
            </div>
          </div>
        )}

        {/* TAB B: USER ENGINE MANAGEMENT */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr className="border-b border-orbit-border text-[9px] uppercase tracking-wider text-orbit-gray-text">
                            <th className="p-3">User</th>
                            <th className="p-3">Recovery Phrase</th>
                            <th className="p-3">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-orbit-border/30">
                        {(adminUsers || []).map(u => (
                            <tr key={u.email}>
                                <td className="p-3 text-orbit-white">{u.email}</td>
                                <td className="p-3 text-orbit-white font-mono text-[10px]">{u.recoveryPhrase || "N/A"}</td>
                                <td className="p-3">
                                    <button onClick={() => {}} className="bg-orbit-accent text-orbit-bg px-2 py-1 rounded text-[10px] font-bold">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        )}
            
            <div className="bg-orbit-card border border-orbit-border p-5 rounded-2xl space-y-4">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-orbit-white">Verified Users Database</h3>
                  <p className="text-xs text-orbit-gray-text mt-0.5">Perform manual balances credit overrides or override statuses.</p>
                </div>
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                  <input
                    type="text"
                    value={usersSearch}
                    onChange={(e) => setUsersSearch(e.target.value)}
                    placeholder="Search name, status, or email..."
                    className="w-full bg-orbit-bg border border-orbit-border/80 focus:border-orbit-accent pl-9 pr-3 py-1.5 text-xs text-orbit-white rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Users scroll Grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-orbit-border text-[9px] uppercase tracking-wider text-orbit-gray-text bg-orbit-bg/40">
                      <th className="p-3 pl-4">Account Name</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">Cash Balance</th>
                      <th className="p-3">Assets Equivalent</th>
                      <th className="p-3">Security Access</th>
                      <th className="p-3 pr-4 text-center">Operation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orbit-border/30 font-sans">
                    {/* Combine Current user in list as well for seamless feedback! */}
                    {[{
                      email: currentUser.email || "henrikaram1@gmail.com",
                      name: currentUser.name || "HENRIK",
                      balance: currentUser.balance,
                      portfolioValue: currentUser.portfolioValue,
                      status: currentUser.status || "active"
                    }, ...(adminUsers || [])]
                    .filter(u => {
                      if (!usersSearch) return true;
                      const s = usersSearch.toLowerCase();
                      return u.email.toLowerCase().includes(s) || u.name.toLowerCase().includes(s) || u.status.toLowerCase().includes(s);
                    })
                    .map((item, idx) => {
                      return (
                        <tr key={idx} className="hover:bg-orbit-darkcard/50 transition-colors">
                          <td className="p-3 pl-4 font-bold text-orbit-white">{item.name}</td>
                          <td className="p-3 font-data text-orbit-gray-text">{item.email}</td>
                          <td className="p-3 font-bold font-data text-orbit-accent">${item.balance.toLocaleString()}</td>
                          <td className="p-3 font-medium font-data text-orbit-white">${item.portfolioValue.toLocaleString()}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                              item.status === "active" ? "bg-orbit-green/10 text-orbit-green" :
                              item.status === "suspended" ? "bg-orbit-red/10 text-orange-400" :
                              "bg-red-500/10 text-red-400"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3 pr-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedUserEmail(item.email);
                                setBalanceOverrideVal(item.balance.toString());
                              }}
                              className="px-3 py-1 bg-orbit-border hover:bg-orbit-accent hover:text-orbit-bg font-bold font-subheading text-[10px] rounded transition-colors cursor-pointer"
                            >
                              Edit Profile
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Profile Modification Console */}
            {selectedUserEmail && targetAdminUser && (
              <div className="bg-orbit-card border border-orbit-accent/40 p-5 rounded-2xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orbit-accent to-yellow-500 animate-pulse" />
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-orbit-white uppercase tracking-wider">
                      Overwriting Account Profile: <strong className="text-orbit-accent">{targetAdminUser.name}</strong>
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-data block">{targetAdminUser.email}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedUserEmail(null)}
                    className="p-1.5 rounded-lg border border-orbit-border hover:border-red-400 hover:text-red-400 transition-all cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                  
                  {/* Override balance */}
                  <div className="space-y-3 bg-orbit-bg p-4 rounded-xl border border-orbit-border">
                    <span className="text-[10px] text-orbit-gray-text font-bold uppercase block">Add or Take Money</span>
                    
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-data">$</span>
                      <input
                        type="number"
                        value={balanceOverrideVal}
                        onChange={(e) => setBalanceOverrideVal(e.target.value)}
                        className="w-full bg-orbit-card border border-orbit-border focus:border-orbit-accent py-1.5 pl-7 pr-3 text-xs text-orbit-white font-bold font-data rounded-lg"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                        <button
                          onClick={() => adminUpdateUserBalance(targetAdminUser.email, targetAdminUser.balance + parseFloat(balanceOverrideVal || "0"))}
                          className="w-full py-1.5 bg-orbit-green text-orbit-bg text-[10px] uppercase font-black rounded-lg cursor-pointer"
                        >
                          Add Money
                        </button>
                        <button
                          onClick={() => adminUpdateUserBalance(targetAdminUser.email, targetAdminUser.balance - parseFloat(balanceOverrideVal || "0"))}
                          className="w-full py-1.5 bg-orbit-red text-orbit-white text-[10px] uppercase font-black rounded-lg cursor-pointer"
                        >
                          Take Money
                        </button>
                    </div>
                  </div>

                  {/* Account lock controls */}
                  <div className="space-y-3 bg-orbit-bg p-4 rounded-xl border border-orbit-border">
                    <span className="text-[10px] text-orbit-gray-text font-bold uppercase block">Safety Security Toggles</span>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => adminChangeUserStatus(targetAdminUser.email, "active")}
                        className="py-1.5 bg-orbit-green/10 border border-orbit-green/30 text-orbit-green hover:bg-orbit-green hover:text-orbit-bg text-[10px] font-bold uppercase rounded-lg cursor-pointer transition-colors"
                      >
                        Activate Account
                      </button>
                      <button
                        onClick={() => adminChangeUserStatus(targetAdminUser.email, "suspended")}
                        className="py-1.5 bg-orbit-border text-orange-400 hover:bg-orange-400 hover:text-orbit-bg text-[10px] font-bold uppercase rounded-lg cursor-pointer transition-colors"
                      >
                        Suspend Access
                      </button>
                      <button
                        onClick={() => adminChangeUserStatus(targetAdminUser.email, "banned")}
                        className="py-1.5 bg-red-950 border border-red-700 text-red-400 hover:bg-red-500 hover:text-orbit-bg text-[10px] font-bold uppercase rounded-lg cursor-pointer transition-colors"
                      >
                        Ban Identity
                      </button>
                    </div>
                  </div>

                  {/* Reset codes */}
                  <div className="space-y-3 bg-orbit-bg p-4 rounded-xl border border-orbit-border flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-orbit-gray-text font-bold uppercase block">Simulation Credentials</span>
                      <p className="text-[10px] text-zinc-500 mt-2">Simulate automated verification email password reset token dispatch.</p>
                    </div>
                    
                    <button
                      onClick={() => adminResetUserPassword(targetAdminUser.email)}
                      className="w-full py-1.5 bg-orbit-border border border-orbit-border/80 text-orbit-white text-[10px] uppercase font-bold rounded-lg cursor-pointer"
                    >
                      Reset Password Key
                    </button>
                  </div>

                </div>

                {/* Account Details and history views */}
                <div className="border-t border-orbit-border pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div>
                    <h5 className="font-bold text-orbit-white uppercase tracking-wider text-[10px] border-b border-orbit-border pb-1.5 mb-2">
                      Active Subscribed Plans
                    </h5>
                    {targetAdminUser.activeInvestments.length === 0 ? (
                      <span className="text-zinc-500 italic block">No active plans subscribed.</span>
                    ) : (
                      <div className="space-y-2">
                        {targetAdminUser.activeInvestments.map(inv => (
                          <div key={inv.id} className="p-2 border border-orbit-border bg-orbit-darkcard/50 rounded-lg flex justify-between">
                            <div>
                              <strong className="text-orbit-white block">{inv.name}</strong>
                              <span className="text-[8px] text-orbit-gray-text font-mono">MATURES: {inv.endDate}</span>
                            </div>
                            <span className="text-orbit-green font-bold font-data">${inv.amount} ({inv.progress}%)</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h5 className="font-bold text-orbit-white uppercase tracking-wider text-[10px] border-b border-orbit-border pb-1.5 mb-2">
                      Recent Access IP Logs
                    </h5>
                    {targetAdminUser.loginHistory?.map((l, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 border-b border-orbit-border/40 text-[9px]">
                        <span className="text-orbit-gray-text font-data">{l.date}</span>
                        <strong className="text-orbit-white font-mono">{l.ip}</strong>
                        <span className="text-[#FF7F00]">{l.device.slice(0, 16)}...</span>
                      </div>
                    )) || <span className="text-zinc-500">127.0.0.1 (Internal session checkout)</span>}
                  </div>
                </div>

              </div>
            )}

        {/* TAB C: YIELD PROTOCOL PLANS MANAGEMENT */}
        {activeTab === "investments" && (
          <div className="space-y-6">
            
            {/* Active Plans List */}
            <div className="bg-orbit-card border border-orbit-border p-5 rounded-2xl space-y-4 font-sans">
              <div>
                <h3 className="text-sm font-bold text-orbit-white">Investment Plans</h3>
                <p className="text-xs text-orbit-gray-text mt-0.5">Pause or adjust return formulas on Starter, Pro, or VIP tiers.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((p) => {
                  const isPaused = p.status === "paused";
                  return (
                    <div 
                      key={p.id}
                      className={`p-4 rounded-xl border bg-orbit-darkcard/40 flex flex-col justify-between h-56 transition-all ${
                        isPaused ? "border-red-500/20 opacity-70" : "border-orbit-border hover:border-orbit-accent/60"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <strong className="text-xs font-black text-orbit-white uppercase tracking-wider">{p.name}</strong>
                          <span className={`text-[9px] uppercase font-bold py-0.5 px-1.5 rounded ${
                            isPaused ? "bg-red-500/15 text-red-400" : "bg-orbit-green/10 text-orbit-green"
                          }`}>
                            {p.status}
                          </span>
                        </div>
                        <p className="text-[9px] text-orbit-gray-text leading-snug">{p.description}</p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-data">
                          <span className="text-zinc-500">ROI Cap:</span>
                          <span className="text-orbit-accent font-bold">+{p.roiPercent}% / {p.durationDays} Days</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => adminSetPlanStatus(p.id, isPaused ? "active" : "paused")}
                            className={`flex-1 py-1.5 font-bold uppercase rounded text-[10px] cursor-pointer text-center ${
                              isPaused 
                                ? "bg-orbit-green text-orbit-bg" 
                                : "bg-orbit-border text-orbit-white hover:bg-orbit-red/10 hover:text-orbit-red"
                            }`}
                          >
                            {isPaused ? "Activate" : "Pause"}
                          </button>
                          <button
                            onClick={() => adminDeletePlan(p.id)}
                            className="p-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-orbit-white rounded transition-colors cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Create new plan profile */}
            <form onSubmit={postNewPlan} className="bg-orbit-card border border-orbit-border p-5 rounded-2xl space-y-4 font-sans max-w-xl">
              <h4 className="text-xs font-bold text-orbit-accent uppercase tracking-widest border-b border-orbit-border pb-2 flex items-center gap-1.5">
                <PenTool size={14} /> Provision New Investment Plan
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-orbit-gray-text uppercase">Plan Title</label>
                  <input
                    type="text"
                    required
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    placeholder="e.g. Bronze Shield"
                    className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent py-1.5 px-3 text-xs text-orbit-white rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-orbit-gray-text uppercase">Compounding returns (%)</label>
                  <input
                    type="number"
                    required
                    value={newPlanReturns}
                    onChange={(e) => setNewPlanReturns(e.target.value)}
                    placeholder="e.g. 15"
                    className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent py-1.5 px-3 text-xs text-orbit-white rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-orbit-gray-text uppercase">Min Limit (USD)</label>
                  <input
                    type="number"
                    required
                    value={newPlanMin}
                    onChange={(e) => setNewPlanMin(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent py-1.5 px-3 text-xs text-orbit-white rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-orbit-gray-text uppercase">Max Limit (USD)</label>
                  <input
                    type="number"
                    required
                    value={newPlanMax}
                    onChange={(e) => setNewPlanMax(e.target.value)}
                    placeholder="e.g. 999"
                    className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent py-1.5 px-3 text-xs text-orbit-white rounded-lg"
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] text-orbit-gray-text uppercase">Lock Duration (Days)</label>
                  <input
                    type="number"
                    required
                    value={newPlanDays}
                    onChange={(e) => setNewPlanDays(e.target.value)}
                    placeholder="e.g. 14"
                    className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent py-1.5 px-3 text-xs text-orbit-white rounded-lg"
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] text-orbit-gray-text uppercase">Promotional Description</label>
                  <textarea
                    rows={2}
                    value={newPlanDesc}
                    onChange={(e) => setNewPlanDesc(e.target.value)}
                    placeholder="Detail the custodial or hedging mechanism..."
                    className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent py-1.5 px-3 text-xs text-orbit-white rounded-lg"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-orbit-accent text-orbit-bg font-black uppercase text-xs rounded-xl"
              >
                Provision Protocol Node
              </button>
            </form>

          </div>
        )}

        {/* TAB D: INCOMING DEPOSITS AUDITING */}
        {activeTab === "deposits" && (
          <div className="space-y-6">
            
            {/* Receiving Addresses config */}
            <form onSubmit={applyWalletsOverride} className="bg-orbit-card border border-orbit-border p-5 rounded-2xl space-y-4 font-sans">
              <div>
                <h3 className="text-sm font-bold text-orbit-white">Administrative Payment Gateways</h3>
                <p className="text-xs text-orbit-gray-text mt-0.5">Configure address pointers for instant deposit instructions views.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "USDT (ERC-20)", val: usdtErcConf, set: setUsdtErcConf },
                  { label: "USDT (TRC-20)", val: usdtTrcConf, set: setUsdtTrcConf },
                  { label: "BTC network key", val: btcConf, set: setBtcConf },
                  { label: "ETH standard locator", val: ethConf, set: setEthConf },
                  { label: "BNB smart custody address", val: bnbConf, set: setBnbConf }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <label className="text-[10px] text-orbit-gray-text font-bold uppercase">{item.label}</label>
                    <input
                      type="text"
                      value={item.val}
                      onChange={(e) => item.set(e.target.value)}
                      className="w-full bg-orbit-bg border border-orbit-border/80 focus:border-orbit-accent py-2 px-3 text-[10px] font-mono text-orbit-white rounded-lg focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="px-6 py-2 bg-orbit-border hover:bg-orbit-accent hover:text-orbit-bg border border-orbit-border hover:border-orbit-accent font-bold uppercase text-xs rounded-xl transition-colors cursor-pointer"
              >
                Save Payment Rails Addresses
              </button>
            </form>

            <div className="bg-orbit-card border border-orbit-border p-5 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-[#FF7F00] flex items-center gap-1.5">
                <CreditCard size={14} /> Deposit Verification Invoices
              </h3>

              {sortedDeposits.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-8 text-center">No deposit receipts mapped to this container cluster.</p>
              ) : (
                <div className="overflow-x-auto text-[11px] font-sans">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-orbit-border text-[9px] uppercase tracking-wider text-orbit-gray-text">
                        <th className="p-3 pl-4">Account Member</th>
                        <th className="p-3">Invoiced Asset</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">TxHash / Proof document</th>
                        <th className="p-3 pr-4 text-center">Status & Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orbit-border/30">
                      {sortedDeposits.map((tx) => {
                        const isPending = tx.status === "pending";
                        return (
                          <tr key={tx.id} className="hover:bg-orbit-darkcard/50">
                            <td className="p-3 pl-4">
                              <span className="font-bold text-orbit-white block">{tx.userName}</span>
                              <span className="text-[9px] text-zinc-500 font-data">{tx.userEmail}</span>
                            </td>
                            <td className="p-3 font-semibold text-orbit-accent uppercase">{tx.asset}</td>
                            <td className="p-3 font-bold text-orbit-white font-data">${tx.amount.toLocaleString()}</td>
                            <td className="p-3 text-orbit-gray-text font-data">{tx.date}</td>
                            <td className="p-3">
                              {tx.proofFile ? (
                                <div className="space-y-1">
                                  <span className="text-orbit-white font-mono text-[9px] block bg-orbit-bg px-2 py-0.5 border border-orbit-border/80 w-fit rounded select-all">
                                    {tx.txHash || "N/A"}
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-[8px] bg-[#DFAD12]/15 text-[#DFAD12] border border-[#DFAD12]/30 px-1 py-0.5 rounded uppercase font-bold">
                                    <FileText size={8} /> {tx.proofFile}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-zinc-500 italic">Auto fiat checkout (Stripe/Card)</span>
                              )}
                            </td>
                            <td className="p-3 pr-4 text-center">
                              {isPending ? (
                                <div className="flex items-center justify-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => adminApproveDeposit(tx.id)}
                                    className="p-1 px-2.5 bg-orbit-green text-orbit-bg font-bold font-subheading text-[10px] rounded hover:opacity-90 cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => {
                                      const res = prompt("Specify reason for invoice rejection:", "Proof of payment unreadable.");
                                      if (res !== null) adminRejectDeposit(tx.id, res);
                                    }}
                                    className="p-1 px-2.5 bg-zinc-800 text-orbit-red border border-orbit-border hover:bg-red-500 hover:text-orbit-white font-bold font-subheading text-[10px] rounded transition-colors cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                                  tx.status === "completed" || tx.status === "approved" ? "bg-orbit-green/15 text-orbit-green" : "bg-red-500/15 text-red-400"
                                }`}>
                                  {tx.status}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB E: WITHDRAWALS QUEUE */}
        {activeTab === "withdrawals" && (
          <div className="bg-orbit-card border border-orbit-border p-5 rounded-2xl space-y-4 font-sans">
            <div>
              <h3 className="text-sm font-bold text-orbit-white">Administrative Withdrawal Settlements</h3>
              <p className="text-xs text-orbit-gray-text mt-0.5">Approve, deny, or tag audit codes to outgoing bank and crypto payout invoices.</p>
            </div>

            {sortedWithdrawals.length === 0 ? (
              <p className="text-xs text-zinc-500 py-8 text-center italic">No pending payout requests on index.</p>
            ) : (
              <div className="overflow-x-auto text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-orbit-border text-[9px] uppercase tracking-wider text-orbit-gray-text">
                      <th className="p-3 pl-4">Account Member</th>
                      <th className="p-3">Asset</th>
                      <th className="p-3">Volume Value</th>
                      <th className="p-3">Dispatch Address</th>
                      <th className="p-3">Ref Code</th>
                      <th className="p-3 pr-4 text-center">Settlement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orbit-border/30">
                    {sortedWithdrawals.map((w) => {
                      const isPending = w.status === "pending";
                      return (
                        <tr key={w.id} className="hover:bg-orbit-darkcard/50">
                          <td className="p-3 pl-4">
                            <span className="font-bold text-orbit-white block">{w.userName}</span>
                            <span className="text-[9px] text-zinc-500 block font-data">{w.userEmail}</span>
                          </td>
                          <td className="p-3 font-semibold text-orbit-accent uppercase">{w.asset}</td>
                          <td className="p-3 font-bold text-orbit-white font-data">${w.amount.toLocaleString()}</td>
                          <td className="p-3">
                            <span className="font-mono text-[9px] text-orbit-gray-text block select-all break-all max-w-[180px]">
                              {w.address}
                            </span>
                          </td>
                          <td className="p-3 text-zinc-500 font-data font-semibold">{w.id}</td>
                          <td className="p-1.5 pr-4 text-center">
                            {isPending ? (
                              <div className="flex items-center justify-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => adminApproveWithdrawal(w.id)}
                                  className="p-1 px-2.5 bg-orbit-green text-orbit-bg font-bold text-[10px] rounded hover:opacity-95 cursor-pointer"
                                >
                                  Release
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt("Specify refusal details for refund:", "Security audit failed.");
                                    if (reason !== null) adminRejectWithdrawal(w.id, reason);
                                  }}
                                  className="p-1 px-2.5 bg-zinc-800 text-orbit-red border border-orbit-border hover:bg-red-500 hover:text-orbit-white font-bold text-[10px] rounded transition-colors cursor-pointer"
                                >
                                  Refuse
                                </button>
                              </div>
                            ) : (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                                w.status === "completed" || w.status === "approved" ? "bg-orbit-green/15 text-orbit-green" : "bg-red-500/15 text-red-500"
                              }`}>
                                {w.status === "completed" ? "RELEASED" : "BLOCKED"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB F: ANNOUNCEMENTS MANAGEMENT */}
        {activeTab === "bulletins" && (
          <div className="space-y-6">
            
            {/* Create Announcement */}
            <form onSubmit={postAnnouncement} className="bg-orbit-card border border-orbit-border p-5 rounded-2xl space-y-4 max-w-xl font-sans">
              <h4 className="text-xs font-bold text-orbit-white uppercase tracking-wider border-b border-orbit-border pb-1.5">
                Dispatch System Announcements Bulletin
              </h4>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-orbit-gray-text uppercase block">Display Banner Title</label>
                  <input
                    type="text"
                    required
                    value={newAnnTitle}
                    onChange={(e) => setNewAnnTitle(e.target.value)}
                    placeholder="e.g. Wallet system upgraded"
                    className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent px-3 py-1.5 text-xs text-orbit-white rounded-lg focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-orbit-gray-text uppercase block">Content Article</label>
                  <textarea
                    required
                    rows={3}
                    value={newAnnContent}
                    onChange={(e) => setNewAnnContent(e.target.value)}
                    placeholder="Provide deep descriptions on standard policies..."
                    className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent px-3 py-1.5 text-xs text-orbit-white rounded-lg focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 py-1.5">
                  <input
                    type="checkbox"
                    id="newAnnPin"
                    checked={newAnnPin}
                    onChange={(e) => setNewAnnPin(e.target.checked)}
                    className="accent-orbit-accent rounded"
                  />
                  <label htmlFor="newAnnPin" className="text-[10px] text-orbit-white font-bold uppercase cursor-pointer select-none">
                    Pin to user dashboard home marquee
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-orbit-accent text-orbit-bg font-bold uppercase text-xs rounded-xl"
              >
                Broadcast to Bulletin
              </button>
            </form>

            {/* Active Bulletin list */}
            <div className="bg-orbit-card border border-orbit-border p-5 rounded-2xl space-y-4 font-sans">
              <h4 className="text-xs font-bold text-orbit-white uppercase tracking-wider">
                Active System Bulletins ({adminAnnouncements.length})
              </h4>

              {adminAnnouncements.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-4">No published news items on index.</p>
              ) : (
                <div className="divide-y divide-orbit-border/30">
                  {adminAnnouncements.map((ann) => (
                    <div key={ann.id} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-orbit-white">{ann.title}</strong>
                          {ann.pinned && (
                            <span className="text-[9px] bg-orbit-accent/15 text-orbit-accent px-1.5 rounded uppercase font-black">
                              PINNED
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-orbit-gray-text mt-1 max-w-xl">{ann.content}</p>
                        <span className="text-[8px] text-zinc-500 font-mono block mt-1">Dispatched on {ann.date}</span>
                      </div>
                      <button
                        onClick={() => adminDeleteAnnouncement(ann.id)}
                        className="p-1 px-2.5 bg-red-500/10 hover:bg-red-500 hover:text-orbit-white border border-red-500/20 text-red-400 rounded transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB G: EXPERT TICKET HELPDESK */}
        {activeTab === "support" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch font-sans">
            
            {/* Inbox sidebar (col-span-5) */}
            <div className="lg:col-span-4 bg-orbit-card border border-orbit-border rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-orbit-accent border-b border-orbit-border/50 pb-2">
                Open Support Invoices
              </h4>

              <div className="space-y-2 overflow-y-auto max-h-[480px]">
                {sortedTickets.map((tk) => {
                  const isClosed = tk.status === "resolved";
                  return (
                    <button
                      key={tk.id}
                      onClick={() => setActiveTicketId(tk.id)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                        activeTicketId === tk.id 
                          ? "border-orbit-accent bg-orbit-accent/10" 
                          : "border-orbit-border/40 hover:border-orbit-border"
                      }`}
                    >
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="font-bold uppercase tracking-wider text-orbit-white">{tk.category}</span>
                        <span className={`font-mono ${isClosed ? "text-zinc-500" : "text-orbit-green font-bold animate-pulse"}`}>
                          {tk.status.toUpperCase()}
                        </span>
                      </div>
                      <strong className="text-xs text-orbit-white block truncate leading-tight uppercase font-heading">{tk.subject}</strong>
                      <span className="text-[9px] text-zinc-500 font-data block mt-1">{tk.userEmail}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chat screen module (col-span-7) */}
            <div className="lg:col-span-8 bg-orbit-card border border-orbit-border rounded-2xl p-5 flex flex-col justify-between h-[520px]">
              {activeTicketObj ? (
                <div className="h-full flex flex-col justify-between">
                  
                  {/* Subject and tags header */}
                  <div className="border-b border-orbit-border/60 pb-3 flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-orbit-white block font-heading text-sm uppercase">{activeTicketObj.subject}</strong>
                      <span className="text-[10px] text-zinc-500 font-data">Client Identifier: {activeTicketObj.userEmail}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <select
                        value={activeTicketObj.priority}
                        onChange={(e) => adminSetTicketPriority(activeTicketObj.id, e.target.value as any)}
                        className="bg-orbit-bg border border-orbit-border text-xs px-2 py-0.5 rounded text-orbit-white focus:outline-none"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium</option>
                        <option value="high">High Priority</option>
                      </select>

                      <button
                        onClick={() => adminCloseTicket(activeTicketObj.id)}
                        className="px-2.5 py-1 bg-orbit-green text-orbit-bg font-bold rounded hover:opacity-90 text-[10px] uppercase cursor-pointer"
                      >
                        Solve
                      </button>
                    </div>
                  </div>

                  {/* Message stack logs */}
                  <div className="flex-1 overflow-y-auto my-4 p-3 bg-orbit-bg rounded-xl space-y-4">
                    {activeTicketObj.messages.map((m, idx) => {
                      const isSupport = m.sender === "support";
                      return (
                        <div key={idx} className={`flex flex-col ${isSupport ? "items-end" : "items-start"}`}>
                          <div className={`max-w-[85%] rounded-xl p-3 text-xs leading-normal ${
                            isSupport 
                              ? "bg-orbit-accent text-orbit-bg font-medium rounded-tr-none" 
                              : "bg-orbit-darkcard border border-orbit-border text-orbit-white rounded-tl-none"
                          }`}>
                            <p>{m.text}</p>
                            <span className="block text-[8px] text-right mt-1 opacity-70">
                              {m.time}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dispatch panel reply form */}
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if(!adminReplyTxt.trim()) return;
                    adminReplyToTicket(activeTicketObj.id, adminReplyTxt);
                    setAdminReplyTxt("");
                  }} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={adminReplyTxt}
                      onChange={(e) => setAdminReplyTxt(e.target.value)}
                      placeholder="Type administrative reply..."
                      className="flex-1 bg-orbit-bg border border-orbit-border focus:border-orbit-accent px-3 py-2 text-xs text-orbit-white rounded-xl focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 bg-orbit-accent text-orbit-bg font-black text-xs uppercase rounded-xl"
                    >
                      Reply
                    </button>
                  </form>

                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 space-y-2">
                  <MessageSquare size={32} className="text-orbit-border animate-bounce" />
                  <p className="text-xs">Select any user ticket from the leftmost helpdesk pane to review and compose replies.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB H: SECURITY MANAGEMENT AND IP COMPLIANCE LOGS */}
        {activeTab === "security" && (
          <div className="space-y-6">
            
            {/* System config controls */}
            <div className="bg-orbit-card border border-orbit-border p-5 rounded-2xl space-y-4 font-sans max-w-xl">
              <h4 className="text-xs font-mono uppercase tracking-widest text-[#FF7F00] flex items-center gap-1.5 border-b border-orbit-border pb-2">
                <ShieldAlert size={14} /> Global Risk Protocols Toggles
              </h4>

              <div className="space-y-3.5 text-xs text-orbit-white">
                <div className="flex justify-between items-center py-1">
                  <div>
                    <strong className="block">DDoS Rate Limiting Filters</strong>
                    <span className="text-[10px] text-zinc-500">Enable smart request throttling inside frame sandbox.</span>
                  </div>
                  <span className="p-1 px-3 bg-orbit-green/10 text-orbit-green border border-orbit-green/20 rounded font-bold uppercase text-[9px]">
                    ACTIVE ENABLED
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <div>
                    <strong className="block">Automatic Yield Accruals Node</strong>
                    <span className="text-[10px] text-zinc-500">Compounding intervals are calculated sequentially in background loops.</span>
                  </div>
                  <span className="p-1 px-3 bg-orbit-green/10 text-orbit-green border border-orbit-green/20 rounded font-bold uppercase text-[9px]">
                    RUNNING
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <div>
                    <strong className="block">Google Auth Validation Proxy</strong>
                    <span className="text-[10px] text-zinc-500">Encrypt JWT sessions with SHA256 secure verification tokens.</span>
                  </div>
                  <span className="p-1 px-3 bg-orbit-green/10 text-orbit-green border border-orbit-green/20 rounded font-bold uppercase text-[9px]">
                    ACTIVE
                  </span>
                </div>
              </div>

            </div>

            {/* Audit Logs */}
            <div className="bg-orbit-card border border-orbit-border p-5 rounded-2xl space-y-4 font-sans">
              <div className="flex items-center gap-2 border-b border-orbit-border pb-2.5">
                <Database className="text-orbit-accent animate-pulse" size={16} />
                <h4 className="text-xs font-bold text-orbit-white uppercase">System Audit logs list ({adminAuditLogs.length})</h4>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[360px]">
                {adminAuditLogs.map((log) => (
                  <div key={log.id} className="p-3 border border-orbit-border/40 bg-orbit-darkcard/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-orbit-white select-all font-mono text-[10px]">{log.action}</strong>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold ${
                          log.status === "success" ? "bg-orbit-green/15 text-orbit-green" :
                          log.status === "warning" ? "bg-orbit-accent/15 text-orbit-accent" :
                          "bg-red-500/15 text-red-400"
                        }`}>
                          {log.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[10px] text-orbit-gray-text leading-tight">{log.details}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="block text-[8px] text-zinc-500 font-mono">{log.timestamp}</span>
                      <strong className="block text-[9px] text-orbit-accent font-data mt-0.5">{log.email}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB I: CONTENT MANAGEMENT SECTION */}
        {activeTab === "content" && (
          <div className="space-y-6">
            <div className="bg-orbit-card border border-orbit-border p-6 rounded-2xl space-y-4">
              <div>
                <h2 className="text-lg font-bold text-orbit-white uppercase font-heading flex items-center gap-2">
                  <PenTool className="text-orbit-accent" size={18} />
                  Content Management System (CMS)
                </h2>
                <p className="text-xs text-orbit-gray-text mt-1.5 leading-relaxed">
                  Update raw values stored inside Firebase Firestore. Your changes publish in real-time across home banners, calculator FAQs, headers, and footer blocks.
                </p>
              </div>

              {contentStatusMsg && (
                <div className="p-3 bg-orbit-green/10 border border-orbit-green/25 text-orbit-green text-xs font-semibold rounded-xl text-center">
                  {contentStatusMsg}
                 </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Left Column: Homepage Hero and General Titles */}
                <div className="space-y-6">
                   
                  {/* Homepage Hero */}
                  <div className="p-4 bg-orbit-bg/40 border border-orbit-border rounded-xl space-y-4 font-sans">
                    <span className="text-[10px] uppercase font-bold text-orbit-accent bg-orbit-accent/10 px-2.5 py-1 rounded">Homepage Header Hero</span>
                     
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-semibold text-orbit-gray-text">Hero Heading Title</label>
                      <textarea
                        value={localHeroTitle}
                        onChange={(e) => setLocalHeroTitle(e.target.value)}
                        rows={2}
                        className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent px-3 py-2 text-xs text-orbit-white rounded-lg focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-semibold text-orbit-gray-text">Hero Subheading Description</label>
                      <textarea
                        value={localHeroSubtitle}
                        onChange={(e) => setLocalHeroSubtitle(e.target.value)}
                        rows={3}
                        className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent px-3 py-2 text-xs text-orbit-white rounded-lg focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-semibold text-orbit-gray-text">Hero CTA Button Text</label>
                      <input
                        type="text"
                        value={localHeroButton}
                        onChange={(e) => setLocalHeroButton(e.target.value)}
                        className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent px-3 py-2 text-xs text-orbit-white rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Dashboard Header Settings */}
                  <div className="p-4 bg-orbit-bg/40 border border-orbit-border rounded-xl space-y-4 font-sans">
                    <span className="text-[10px] uppercase font-bold text-orbit-accent bg-orbit-accent/10 px-2.5 py-1 rounded">Dashboard & Bulletins</span>
                     
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-semibold text-orbit-gray-text">Dashboard Heading Title</label>
                      <input
                        type="text"
                        value={localDashTitle}
                        onChange={(e) => setLocalDashTitle(e.target.value)}
                        className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent px-3 py-2 text-xs text-orbit-white rounded-lg focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-semibold text-orbit-gray-text">Dashboard Welcome Subheading</label>
                      <textarea
                        value={localDashDesc}
                        onChange={(e) => setLocalDashDesc(e.target.value)}
                        rows={2}
                        className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent px-3 py-2 text-xs text-orbit-white rounded-lg focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-semibold text-orbit-gray-text">System Announcement Bulletin</label>
                      <textarea
                        value={localAnnText}
                        onChange={(e) => setLocalAnnText(e.target.value)}
                        rows={2}
                        className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent px-3 py-2 text-xs text-orbit-white rounded-lg focus:outline-none text-orbit-accent font-semibold"
                      />
                    </div>
                  </div>

                  {/* Footer Text */}
                  <div className="p-4 bg-orbit-bg/40 border border-orbit-border rounded-xl space-y-4 font-sans">
                    <span className="text-[10px] uppercase font-bold text-orbit-accent bg-orbit-accent/10 px-2.5 py-1 rounded">Footer settings</span>
                     
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-semibold text-orbit-gray-text">Copyright & Safety Disclaimer Text</label>
                      <textarea
                        value={localFooterText}
                        onChange={(e) => setLocalFooterText(e.target.value)}
                        rows={3}
                        className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent px-3 py-2 text-xs text-orbit-white rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                </div>

                {/* Right Column: Investment Plans Header and FAQs */}
                <div className="space-y-6">
                   
                  {/* Investment Tiers Header */}
                  <div className="p-4 bg-orbit-bg/40 border border-orbit-border rounded-xl space-y-4 font-sans">
                    <span className="text-[10px] uppercase font-bold text-orbit-accent bg-orbit-accent/10 px-2.5 py-1 rounded">Investment Compounding Title</span>
                     
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-semibold text-orbit-gray-text">Investment View Heading</label>
                      <input
                        type="text"
                        value={localInvestTitle}
                        onChange={(e) => setLocalInvestTitle(e.target.value)}
                        className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent px-3 py-2 text-xs text-orbit-white rounded-lg focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-semibold text-orbit-gray-text">Investment View Subtitle</label>
                      <textarea
                        value={localInvestDesc}
                        onChange={(e) => setLocalInvestDesc(e.target.value)}
                        rows={3}
                        className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent px-3 py-2 text-xs text-orbit-white rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Safety & Settlement FAQs */}
                  <div className="p-4 bg-orbit-bg/40 border border-orbit-border rounded-xl space-y-4 font-sans">
                    <span className="text-[10px] uppercase font-bold text-orbit-accent bg-orbit-accent/10 px-2.5 py-1 rounded">Safety and Settlement FAQs</span>
                     
                    {/* FAQ 1 */}
                    <div className="space-y-2 border-b border-orbit-border/30 pb-3">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-semibold text-zinc-500">FAQ Question #1</label>
                        <input
                          type="text"
                          value={localFaqQ1}
                          onChange={(e) => setLocalFaqQ1(e.target.value)}
                          className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent px-3 py-1.5 text-xs text-orbit-white rounded-lg focus:outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-semibold text-zinc-500">FAQ Answer #1</label>
                        <textarea
                          value={localFaqA1}
                          onChange={(e) => setLocalFaqA1(e.target.value)}
                          rows={2}
                          className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent px-3 py-1.5 text-xs text-orbit-white rounded-lg focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* FAQ 2 */}
                    <div className="space-y-2 border-b border-orbit-border/30 pb-3">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-semibold text-zinc-500">FAQ Question #2</label>
                        <input
                          type="text"
                          value={localFaqQ2}
                          onChange={(e) => setLocalFaqQ2(e.target.value)}
                          className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent px-3 py-1.5 text-xs text-orbit-white rounded-lg focus:outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-semibold text-zinc-500">FAQ Answer #2</label>
                        <textarea
                          value={localFaqA2}
                          onChange={(e) => setLocalFaqA2(e.target.value)}
                          rows={2}
                          className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent px-3 py-1.5 text-xs text-orbit-white rounded-lg focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* FAQ 3 */}
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-semibold text-zinc-500">FAQ Question #3</label>
                        <input
                          type="text"
                          value={localFaqQ3}
                          onChange={(e) => setLocalFaqQ3(e.target.value)}
                          className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent px-3 py-1.5 text-xs text-orbit-white rounded-lg focus:outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-semibold text-zinc-500">FAQ Answer #3</label>
                        <textarea
                          value={localFaqA3}
                          onChange={(e) => setLocalFaqA3(e.target.value)}
                          rows={2}
                          className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent px-3 py-1.5 text-xs text-orbit-white rounded-lg focus:outline-none"
                        />
                      </div>
                    </div>

                  </div>

                </div>
              </div>

              {/* Submit CTA button */}
              <div className="flex justify-end pt-4 border-t border-orbit-border/50">
                <button
                  onClick={async () => {
                    setContentStatusMsg("");
                    try {
                      await updateSiteContent({
                        hero_title: localHeroTitle,
                        hero_subtitle: localHeroSubtitle,
                        hero_button: localHeroButton,
                        dashboard_title: localDashTitle,
                        dashboard_description: localDashDesc,
                        investment_title: localInvestTitle,
                        investment_description: localInvestDesc,
                        footer_text: localFooterText,
                        announcement_text: localAnnText,
                        faq_question_1: localFaqQ1,
                        faq_answer_1: localFaqA1,
                        faq_question_2: localFaqQ2,
                        faq_answer_2: localFaqA2,
                        faq_question_3: localFaqQ3,
                        faq_answer_3: localFaqA3,
                      });
                      setContentStatusMsg("Success: Platform site content updated dynamically inside Firestore!");
                      addNotification("Dynamic site texts republished successfully.");
                      setTimeout(() => setContentStatusMsg(""), 4000);
                    } catch (err) {
                      console.error("Failed to republish texts to Firestore:", err);
                      setContentStatusMsg("Error: Failed to save changes in Firebase database.");
                    }
                  }}
                  className="px-6 py-3 bg-orbit-accent border-none rounded-xl text-orbit-bg hover:opacity-95 font-black font-subheading text-[11px] uppercase tracking-wide shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check size={14} className="stroke-[3]" />
                  Republish All Texts
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB J: TRADER MANAGEMENT SECTION */}
        {activeTab === "traders" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-orbit-border/30 pb-4">
              <div>
                <h2 className="text-xl font-bold font-heading text-orbit-white flex items-center gap-2">
                  <Award size={20} className="text-orbit-accent" />
                  Traders List
                </h2>
                <p className="text-xs text-orbit-gray-text mt-1 font-sans">Manage real-time copy trading portfolios, risk levels, and charts securely on the Node.</p>
              </div>
              <button
                onClick={() => {
                  setEditingTraderId("new");
                  setTraderForm({
                    name: "",
                    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
                    roi: 50,
                    winRate: 85,
                    followers: 0,
                    maxFollowers: 250,
                    assetsUnderManagement: "$10,000",
                    riskScore: 2,
                    profitDays: 30,
                    chartDataString: "10,20,15,30,25,45"
                  });
                }}
                className="bg-orbit-accent text-orbit-bg px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all hover:opacity-90 cursor-pointer select-none"
              >
                <Plus size={14} /> Add New Trader
              </button>
            </div>

            {editingTraderId && (
              <div className="bg-orbit-card border border-orbit-border/40 p-6 rounded-2xl space-y-4 shadow-none">
                <div className="flex items-center justify-between border-b border-orbit-border/20 pb-3 font-sans">
                  <h3 className="text-sm font-bold font-subheading text-orbit-white">
                    {editingTraderId === "new" ? "Add New Trader" : `Edit Trader: ${traderForm.name}`}
                  </h3>
                  <button 
                    onClick={() => setEditingTraderId(null)}
                    className="p-1 hover:bg-orbit-border/30 rounded text-orbit-gray-text hover:text-orbit-white"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                  <div>
                    <label className="block text-orbit-gray-text mb-1 uppercase tracking-wider text-[10px]">Name</label>
                    <input 
                      type="text" 
                      className="w-full bg-orbit-bg border border-orbit-border/50 text-orbit-white rounded p-2 focus:border-orbit-accent focus:outline-none"
                      value={traderForm.name}
                      onChange={e => setTraderForm({...traderForm, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-orbit-gray-text mb-1 uppercase tracking-wider text-[10px]">Profile Picture</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="w-full bg-orbit-bg border border-orbit-border/50 text-orbit-white rounded p-1.5 focus:border-orbit-accent focus:outline-none text-[10px]"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setTraderForm({...traderForm, avatar: reader.result as string});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-orbit-gray-text mb-1 uppercase tracking-wider text-[10px]">Assets Under Management (AUM)</label>
                    <input 
                      type="text" 
                      className="w-full bg-orbit-bg border border-orbit-border/50 text-orbit-white rounded p-2 focus:border-orbit-accent focus:outline-none"
                      value={traderForm.assetsUnderManagement}
                      onChange={e => setTraderForm({...traderForm, assetsUnderManagement: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-orbit-gray-text mb-1 uppercase tracking-wider text-[10px]">Days Active (profitDays)</label>
                    <input 
                      type="number" 
                      className="w-full bg-orbit-bg border border-orbit-border/50 text-orbit-white rounded p-2 focus:border-orbit-accent focus:outline-none"
                      value={traderForm.profitDays}
                      onChange={e => setTraderForm({...traderForm, profitDays: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label className="block text-orbit-gray-text mb-1 uppercase tracking-wider text-[10px]">Total ROI percentage (%)</label>
                    <input 
                      type="number" 
                      className="w-full bg-orbit-bg border border-orbit-border/50 text-orbit-white rounded p-2 focus:border-orbit-accent focus:outline-none"
                      value={traderForm.roi}
                      onChange={e => setTraderForm({...traderForm, roi: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label className="block text-orbit-gray-text mb-1 uppercase tracking-wider text-[10px]">Win Rate (%)</label>
                    <input 
                      type="number" 
                      className="w-full bg-orbit-bg border border-orbit-border/50 text-orbit-white rounded p-2 focus:border-orbit-accent focus:outline-none"
                      value={traderForm.winRate}
                      onChange={e => setTraderForm({...traderForm, winRate: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label className="block text-orbit-gray-text mb-1 uppercase tracking-wider text-[10px]">Risk Score (1 to 5)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="5"
                      className="w-full bg-orbit-bg border border-orbit-border/50 text-orbit-white rounded p-2 focus:border-orbit-accent focus:outline-none"
                      value={traderForm.riskScore}
                      onChange={e => setTraderForm({...traderForm, riskScore: parseInt(e.target.value) || 1})}
                    />
                  </div>
                  <div>
                    <label className="block text-orbit-gray-text mb-1 uppercase tracking-wider text-[10px]">Active Followers</label>
                    <input 
                      type="number" 
                      className="w-full bg-orbit-bg border border-orbit-border/50 text-orbit-white rounded p-2 focus:border-orbit-accent focus:outline-none"
                      value={traderForm.followers}
                      onChange={e => setTraderForm({...traderForm, followers: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label className="block text-orbit-gray-text mb-1 uppercase tracking-wider text-[10px]">Max Followers Allowed</label>
                    <input 
                      type="number" 
                      className="w-full bg-orbit-bg border border-orbit-border/50 text-orbit-white rounded p-2 focus:border-orbit-accent focus:outline-none"
                      value={traderForm.maxFollowers}
                      onChange={e => setTraderForm({...traderForm, maxFollowers: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="md:col-span-3 font-sans text-xs">
                    <label className="block text-orbit-gray-text mb-1 uppercase tracking-wider text-[10px]">7D Trend Coordinates (Comma Separated Numbers)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 10, 20, 15, 30, 25, 45"
                      className="w-full bg-orbit-bg border border-orbit-border/50 text-orbit-white rounded p-2 focus:border-orbit-accent focus:outline-none font-mono"
                      value={traderForm.chartDataString}
                      onChange={e => setTraderForm({...traderForm, chartDataString: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-end pt-2 border-t border-orbit-border/20 font-sans">
                  <button
                    onClick={() => setEditingTraderId(null)}
                    className="border border-orbit-border text-orbit-gray-text hover:text-orbit-white px-4 py-1.5 rounded text-xs cursor-pointer select-none animate-none"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      const trendArray = traderForm.chartDataString
                        .split(",")
                        .map(n => parseFloat(n.trim()))
                        .filter(n => !isNaN(n));
                      
                      const fields = {
                        name: traderForm.name,
                        avatar: traderForm.avatar,
                        roi: traderForm.roi,
                        winRate: traderForm.winRate,
                        followers: traderForm.followers,
                        maxFollowers: traderForm.maxFollowers,
                        assetsUnderManagement: traderForm.assetsUnderManagement,
                        riskScore: traderForm.riskScore,
                        profitDays: traderForm.profitDays,
                        chartData: trendArray.length > 0 ? trendArray : [10, 20, 15, 30, 25, 45]
                      };

                      if (editingTraderId === "new") {
                        await adminCreateTrader(fields);
                      } else {
                        await adminUpdateTrader(editingTraderId, fields);
                      }
                      setEditingTraderId(null);
                    }}
                    className="bg-orbit-accent text-orbit-bg px-4 py-1.5 rounded font-bold text-xs cursor-pointer select-none animate-none"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            <div className="bg-orbit-card border border-orbit-border/40 rounded-2xl overflow-hidden shadow-none">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="border-b border-orbit-border/30 bg-orbit-bg/50 text-orbit-gray-text font-subheading uppercase text-[10px] tracking-wider">
                      <th className="py-4 px-6">Trader Name</th>
                      <th className="py-4 px-6 text-center">Total ROI</th>
                      <th className="py-4 px-6 text-center">Win Rate</th>
                      <th className="py-4 px-6 text-center">Risk</th>
                      <th className="py-4 px-6 text-center">AUM</th>
                      <th className="py-4 px-6 text-center">Followers</th>
                      <th className="py-4 px-4 text-right">Node Security Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orbit-border/20 font-sans">
                    {traders.map((trader) => (
                      <tr key={trader.id} className="hover:bg-orbit-border/5 transition-colors">
                        <td className="py-4 px-6 flex items-center gap-3">
                          <img src={trader.avatar} alt={trader.name} className="w-8 h-8 rounded-full object-cover border border-orbit-border" />
                          <div>
                            <div className="font-bold text-orbit-white flex items-center gap-1.5">
                              {trader.name}
                              {(trader.winRate >= 90 || trader.roi >= 150) && (
                                <span className="text-[8px] bg-orbit-green/10 text-orbit-green px-1.5 py-0.5 rounded-full select-none font-bold">ELITE</span>
                              )}
                            </div>
                            <div className="text-[10px] text-orbit-gray-text font-mono">ID: {trader.id} | {trader.profitDays}d Active</div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center font-semibold font-mono text-orbit-green">+{trader.roi}%</td>
                        <td className="py-4 px-6 text-center font-semibold font-mono text-orbit-white">{trader.winRate}%</td>
                        <td className="py-4 px-6 text-center font-sans">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                            trader.riskScore <= 2 
                              ? "bg-green-500/10 border-green-500/20 text-green-400" 
                              : trader.riskScore === 3 
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-400" 
                                : "bg-red-500/10 border-red-500/20 text-red-500"
                          }`}>
                            Risk {trader.riskScore}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center font-mono text-orbit-accent">{trader.assetsUnderManagement}</td>
                        <td className="py-4 px-6 text-center font-mono text-orbit-white">{trader.followers} / {trader.maxFollowers}</td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingTraderId(trader.id);
                                setTraderForm({
                                  name: trader.name,
                                  avatar: trader.avatar,
                                  roi: trader.roi,
                                  winRate: trader.winRate,
                                  followers: trader.followers,
                                  maxFollowers: trader.maxFollowers,
                                  assetsUnderManagement: trader.assetsUnderManagement,
                                  riskScore: trader.riskScore,
                                  profitDays: trader.profitDays,
                                  chartDataString: (trader.chartData || []).join(",")
                                });
                              }}
                              className="p-1 px-3 bg-orbit-border/20 border border-orbit-border/40 text-orbit-white font-semibold rounded text-[11px] hover:bg-orbit-accent hover:text-orbit-bg transition-colors cursor-pointer select-none"
                            >
                              Edit
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Are you sure you want to decommission copy trader portfolio node ${trader.name}?`)) {
                                  await adminDeleteTrader(trader.id);
                                }
                              }}
                              className="p-1 px-3 bg-orbit-red/10 border border-orbit-red/30 text-orbit-red rounded text-[11px] hover:bg-orbit-red hover:text-orbit-white transition-colors cursor-pointer select-none"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "airdrops" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold font-heading text-orbit-white flex items-center gap-2">
              <Gift size={20} className="text-orbit-accent" />
              Airdrop Management
            </h2>
            
            {/* Create/Edit Airdrop Form */}
            <div className="bg-orbit-card border border-orbit-border rounded-xl p-6">
              <h3 className="text-sm font-bold text-orbit-white mb-4">Create New Airdrop</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input type="text" placeholder="Title" id="airdrop-title" className="bg-orbit-bg border border-orbit-border rounded p-2 text-xs text-orbit-white" />
                  <input type="text" placeholder="Token" id="airdrop-token" className="bg-orbit-bg border border-orbit-border rounded p-2 text-xs text-orbit-white" />
                  <input type="text" placeholder="Reward Amount" id="airdrop-amount" className="bg-orbit-bg border border-orbit-border rounded p-2 text-xs text-orbit-white" />
                  <button onClick={() => {
                      const title = (document.getElementById("airdrop-title") as HTMLInputElement).value;
                      const token = (document.getElementById("airdrop-token") as HTMLInputElement).value;
                      const rewardAmount = (document.getElementById("airdrop-amount") as HTMLInputElement).value;
                      if (title && token && rewardAmount) {
                          adminCreateAirdrop({ title, token, rewardAmount, status: "Live" });
                          (document.getElementById("airdrop-title") as HTMLInputElement).value = "";
                          (document.getElementById("airdrop-token") as HTMLInputElement).value = "";
                          (document.getElementById("airdrop-amount") as HTMLInputElement).value = "";
                      }
                  }} className="bg-orbit-accent text-orbit-bg px-4 py-2 rounded text-xs font-bold cursor-pointer">Create</button>
              </div>
            </div>

            <div className="bg-orbit-card border border-orbit-border rounded-xl p-4">
              <h3 className="text-sm font-bold text-orbit-white mb-4">Active Airdrops</h3>
              {airdrops.length === 0 && <p className="text-xs text-zinc-500">No active airdrops.</p>}
              {airdrops.map((airdrop) => (
                <div key={airdrop.id} className="flex justify-between items-center py-3 border-b border-neutral-800">
                  <div>
                    <p className="text-sm font-medium text-white">{airdrop.title}</p>
                    <p className="text-xs text-neutral-500">{airdrop.token} - {airdrop.rewardAmount}</p>
                  </div>
                  <button onClick={() => adminDeleteAirdrop(airdrop.id)} className="text-xs text-orbit-red cursor-pointer">Delete</button>
                </div>
              ))}
            </div>

            <div className="bg-orbit-card border border-orbit-border rounded-xl p-4">
              <h3 className="text-sm font-bold text-orbit-white mb-4">Pending Claims</h3>
              {adminAirdropClaims.length === 0 && <p className="text-xs text-zinc-500">No pending claims.</p>}
              {adminAirdropClaims.map((claim) => (
                <div key={claim.id} className="flex justify-between items-center py-3 border-b border-neutral-800">
                  <div>
                    <p className="text-sm font-medium text-white">{claim.token}</p>
                    <p className="text-xs text-neutral-500">{claim.userEmail} - {claim.rewardAmount}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {claim.status === "Pending" ? (
                      <div className="flex gap-2">
                          <button 
                            onClick={() => adminApproveAirdrop(claim.id)}
                            className="bg-orbit-green text-orbit-bg text-xs font-semibold py-1 px-3 rounded-lg cursor-pointer"
                          >
                            Give Coins
                          </button>
                      </div>
                    ) : (
                      <span className="text-xs text-emerald-500">{claim.status}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
