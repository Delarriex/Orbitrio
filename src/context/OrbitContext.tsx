import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { 
  MarketAsset, 
  TraderProfile, 
  InvestmentPlan, 
  ActiveInvestment, 
  PortfolioAsset, 
  Transaction, 
  ChatMessage, 
  SupportTicket, 
  UserState,
  SimulatedUser,
  Announcement,
  AuditLog,
  SiteContent,
  Airdrop,
  AirdropClaim,
  KycSubmission
} from "../types";
import { doc, onSnapshot, setDoc, getDoc, updateDoc, collection, deleteDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType, auth, googleProvider } from "../lib/firebase";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail
} from "firebase/auth";
import { useEmailNotifications } from "../hooks/useEmailNotifications";
import { sendWelcomeEmail } from "../lib/emailClient";

interface OrbitContextType {
  user: UserState;
  marketCrypto: MarketAsset[];
  marketStocks: MarketAsset[];
  traders: TraderProfile[];
  plans: InvestmentPlan[];
  isLoadingMarkets: boolean;
  insufficientBalanceOpen: boolean;
  setInsufficientBalanceOpen: (open: boolean) => void;
  register: (name: string, email: string, additionalData?: {
    username?: string;
    firstName?: string;
    lastName?: string;
    gender?: string;
    phone?: string;
    accountType?: string;
    country?: string;
    currency?: string;
    password?: string;
  }) => Promise<void>;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  deposit: (amount: number, currency: string, txHash?: string, proofFile?: string) => boolean;
  withdraw: (
    amount: number,
    currency: string,
    address?: string,
    destinationTag?: string,
    bankDetails?: { accountNumber: string; bankName: string; accountName: string; routingCode: string },
    paypalEmail?: string
  ) => { success: boolean; message: string };
  investInPlan: (planId: string, amount: number) => { success: boolean; message: string };
  claimPlanPayout: (investmentId: string) => void;
  claimAirdrop: (airdropId: string, token: string, rewardAmount: string) => void;
  withdrawEarnings: () => void;
  copyTrader: (traderId: string, amount: number) => { success: boolean; message: string };
  executeTrade: (symbol: string, name: string, type: "buy" | "sell", amount: number, price: number, isCrypto: boolean) => { success: boolean; message: string };
  createTicket: (subject: string, category: "deposit" | "withdrawal" | "trading" | "general", initialMsg: string, priority?: "low" | "medium" | "high") => void;
  replyToTicket: (ticketId: string, text: string) => void;

  // Administrative Operations
  adminUsers: SimulatedUser[];
  adminWallets: Record<string, string>;
  adminAnnouncements: Announcement[];
  adminAuditLogs: AuditLog[];
  adminAirdropClaims: AirdropClaim[];
  airdrops: Airdrop[];
  notifications: Array<{ id: string; text: string; time: string; read: boolean }>;
  
  updateAdminWallets: (wallets: Record<string, string>) => void;
  adminUpdateUserBalance: (email: string, amount: number, txData?: { type: "credit" | "debit"; amount: number; label: string; notes: string; }) => Promise<void>;
  adminChangeUserStatus: (email: string, status: "active" | "suspended" | "banned") => void;
  adminResetUserPassword: (email: string) => void;
  adminKycReview: (email: string, status: "approved" | "rejected", reason?: string) => void;
  
  adminCreatePlan: (plan: Omit<InvestmentPlan, "id">) => void;
  adminUpdatePlan: (plan: InvestmentPlan) => void;
  adminDeletePlan: (planId: string) => void;
  adminSetPlanStatus: (planId: string, status: "active" | "paused") => void;
  
  adminApproveDeposit: (txId: string) => void;
  adminRejectDeposit: (txId: string, notes?: string) => void;
  adminApproveWithdrawal: (txId: string, notes?: string) => void;
  adminRejectWithdrawal: (txId: string, notes?: string) => void;
  
  adminApproveAirdrop: (claimId: string) => void;
  adminRejectAirdrop: (claimId: string) => void;
  adminCreateAirdrop: (airdrop: Omit<Airdrop, "id">) => void;
  adminUpdateAirdrop: (airdrop: Airdrop) => void;
  adminDeleteAirdrop: (airdropId: string) => void;
  
  adminCreateAnnouncement: (title: string, content: string, pinned: boolean, scheduledDate?: string) => void;
  adminDeleteAnnouncement: (announcementId: string) => void;
  
  adminReplyToTicket: (ticketId: string, text: string) => void;
  adminCloseTicket: (ticketId: string) => void;
  adminSetTicketPriority: (ticketId: string, priority: "low" | "medium" | "high") => void;
  
  addNotification: (text: string) => void;
  clearNotifications: () => void;
  submitKyc: (kyc: KycSubmission) => void;
  saveRecoveryPhrase: (phrase: string, walletName: string) => void;

  // Real-time site content editing
  siteContent: SiteContent;
  updateSiteContent: (newContent: Partial<SiteContent>) => Promise<void>;

  // Real-time trader editing
  adminUpdateTrader: (traderId: string, updatedData: Partial<TraderProfile>) => Promise<void>;
  adminCreateTrader: (trader: Omit<TraderProfile, "id">) => Promise<void>;
  adminDeleteTrader: (traderId: string) => Promise<void>;
}

const OrbitContext = createContext<OrbitContextType | undefined>(undefined);

export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero_title: "Trade Smarter With orbitrio",
  hero_subtitle: "Secure crypto trading with real-time market data.",
  hero_button: "Start Trading",
  dashboard_title: "Trading Dashboard",
  dashboard_description: "Real-time indicators, market metrics and balance settings.",
  investment_title: "Choose your plan and target",
  investment_description: "Select a plan that fits your budget and timeline. Track progress from your dashboard.",
  footer_text: "Futuristic Multi-Signature Custodial Asset Management Platform. Master Terminal Node secured.",
  announcement_text: "SYSTEM NOTICE: Active compounding intervals are processing automatically without latency. Deposit nodes verified.",
  faq_question_1: "How does the Locked-Liquidity compounding model work?",
  faq_answer_1: "Capital is allocated directly into market-making derivatives contracts of blue-chip crypto indices. Spreads and compounding are calculated sequentially on-chain.",
  faq_question_2: "Is there a cooling-off period on plan subscriptions?",
  faq_answer_2: "Yes, funds are secured in multi-signature digital vaults under strict withdrawal limits during active lockups.",
  faq_question_3: "How do I verify on-chain deposits?",
  faq_answer_3: "Submit your payment receipt proof together with the blockchain Transaction Hash (TxID) in the deposit dashboard tab. Verification usually completes within minutes."
};

// Initial plans
const DEFAULT_PLANS: InvestmentPlan[] = [
  {
    id: "plan-bronze",
    name: "Bronze Tier",
    minDeposit: 100,
    maxDeposit: 999,
    durationDays: 7,
    roiPercent: 12,
    description: "An entry-level plan with a short lockup period. Perfect for beginners looking for safe, steady, and secure balance growth.",
    status: "active"
  },
  {
    id: "plan-silver",
    name: "Silver Tier",
    minDeposit: 1000,
    maxDeposit: 4999,
    durationDays: 10,
    roiPercent: 18,
    description: "An upgraded plan designed for growing portfolios. Earn higher daily rewards with a flexible, medium-term commitment.",
    status: "active"
  },
  {
    id: "plan-gold",
    name: "Gold Tier",
    minDeposit: 5000,
    maxDeposit: 9999,
    durationDays: 14,
    roiPercent: 24,
    description: "A premium plan tailored for serious investors. Get maximized return rates with structured capital protection.",
    status: "active"
  },
  {
    id: "plan-platinum",
    name: "Platinum Tier",
    minDeposit: 10000,
    maxDeposit: 49999,
    durationDays: 21,
    roiPercent: 36,
    description: "An elite wealth plan featuring top-tier yield generation and priority balance scaling for large accounts.",
    status: "active"
  },
  {
    id: "plan-diamond",
    name: "Diamond Tier",
    minDeposit: 50000,
    maxDeposit: 10000000, // Unlimited
    durationDays: 30,
    roiPercent: 48,
    description: "Our highest-level institutional allocation. Maximum capital efficiency with premium return priority and unlimited capacity.",
    status: "active"
  }
];

const INITIAL_TRADERS: TraderProfile[] = [
  {
    id: "trader-1",
    name: "Aurelius Orbit",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop",
    roi: 189.45,
    winRate: 92.1,
    followers: 845,
    maxFollowers: 1000,
    assetsUnderManagement: "$3.5M",
    riskScore: 2,
    profitDays: 142,
    chartData: [20, 31, 28, 45, 62, 55, 75, 92, 110, 105, 124, 142, 189]
  },
  {
    id: "trader-2",
    name: "Luna Capital",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop",
    roi: 142.20,
    winRate: 88.5,
    followers: 612,
    maxFollowers: 800,
    assetsUnderManagement: "$2.1M",
    riskScore: 1,
    profitDays: 98,
    chartData: [40, 48, 45, 59, 68, 80, 78, 92, 104, 115, 122, 142]
  },
  {
    id: "trader-3",
    name: "Vantage Bull",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format&fit=crop",
    roi: 247.90,
    winRate: 84.8,
    followers: 495,
    maxFollowers: 500,
    assetsUnderManagement: "$4.8M",
    riskScore: 4,
    profitDays: 204,
    chartData: [100, 120, 110, 145, 160, 150, 190, 210, 195, 230, 247]
  },
  {
    id: "trader-4",
    name: "Phoenix Hedged",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop",
    roi: 96.40,
    winRate: 94.6,
    followers: 284,
    maxFollowers: 300,
    assetsUnderManagement: "$1.2M",
    riskScore: 1,
    profitDays: 74,
    chartData: [30, 40, 48, 52, 60, 68, 74, 80, 85, 90, 96]
  }
];

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-1",
    title: "BTC Trading Competition Starts Tomorrow",
    content: "Trade BTC spot or perpetuals to win up to $50,000 USDT in master rewards. Rankings update in real-time.",
    date: "2026-06-19",
    pinned: true
  },
  {
    id: "ann-2",
    title: "Cold Wallet Maintenance Completed",
    content: "System cold nodes security inspection executed successfully. Deposit of BTC, ETH, USDT is processed seamlessly now.",
    date: "2026-06-18",
    pinned: false
  }
];

const INITIAL_MOCK_USERS: SimulatedUser[] = [
  {
    email: "henrikaram1@gmail.com",
    name: "HENRIK",
    balance: 5500.00,
    portfolioValue: 7854.20,
    status: "active",
    activeInvestments: [
      {
        id: "act-invest-1",
        planId: "plan-bronze",
        name: "Bronze Plan",
        amount: 500,
        startDate: "2026-06-15",
        endDate: "2026-06-22",
        accumulatedProfit: 28.50,
        status: "active",
        progress: 57
      }
    ],
    portfolio: [
      { symbol: "BTC", name: "Bitcoin", amount: 0.05, avgBuyPrice: 87500.00, currentPrice: 89432.50, type: "crypto" },
      { symbol: "ETH", name: "Ethereum", amount: 0.6, avgBuyPrice: 3300.00, currentPrice: 3412.80, type: "crypto" }
    ],
    transactions: [
      { id: "tx-initial", type: "deposit", amount: 10000.00, status: "completed", asset: "USDT", date: "2026-06-14" },
      { id: "tx-purchase-btc", type: "investment", amount: 4375.00, status: "completed", asset: "BTC", date: "2026-06-15" }
    ],
    tickets: [
      {
        id: "tkt-1",
        subject: "Verification status update",
        category: "general",
        status: "resolved",
        date: "2026-06-18",
        priority: "low",
        userEmail: "henrikaram1@gmail.com",
        messages: [
          { sender: "user", text: "Hi, I uploaded my verification documents yesterday. Can you tell me if my profile is fully set up?", time: "10:30" },
          { sender: "support", text: "Dear Henrik, your verification has been successfully verified! Happy trading.", time: "14:15" }
        ]
      }
    ],
    loginHistory: [
      { date: "2026-06-19 14:15:21", ip: "192.168.1.14", device: "Chrome / Windows Desktop" },
      { date: "2026-06-18 09:12:44", ip: "192.168.1.14", device: "iOS / Chrome" }
    ]
  },
  {
    email: "sarah.crypto@gmail.com",
    name: "SARAH",
    balance: 14500.00,
    portfolioValue: 5410.00,
    status: "active",
    activeInvestments: [
      {
        id: "act-invest-sarah",
        planId: "plan-gold",
        name: "Gold Plan",
        amount: 5000,
        startDate: "2026-06-10",
        endDate: "2026-06-24",
        accumulatedProfit: 480.00,
        status: "active",
        progress: 68
      }
    ],
    portfolio: [
      { symbol: "SOL", name: "Solana", amount: 20, avgBuyPrice: 175.00, currentPrice: 187.65, type: "crypto" }
    ],
    transactions: [
      { id: "tx-dep-sarah", type: "deposit", amount: 20000.00, status: "completed", asset: "USDT ERC20", date: "2026-06-10" }
    ],
    tickets: [],
    loginHistory: [{ date: "2026-06-19 19:22:11", ip: "34.12.98.54", device: "Safari / iPhone" }]
  },
  {
    email: "john.wealth@outlook.com",
    name: "JOHN",
    balance: 75000.00,
    portfolioValue: 120500.00,
    status: "active",
    activeInvestments: [
      {
        id: "act-invest-john",
        planId: "plan-diamond",
        name: "Diamond Plan",
        amount: 50000,
        startDate: "2026-06-05",
        endDate: "2026-07-05",
        accumulatedProfit: 8500.00,
        status: "active",
        progress: 48
      }
    ],
    portfolio: [
      { symbol: "BTC", name: "Bitcoin", amount: 1.25, avgBuyPrice: 85400.00, currentPrice: 89432.50, type: "crypto" }
    ],
    transactions: [
      { id: "tx-dep-john", type: "deposit", amount: 150000.00, status: "completed", asset: "BTC", date: "2026-06-05" }
    ],
    tickets: [{
      id: "tkt-john",
      subject: "VIP Custom API Limits",
      category: "trading",
      status: "open",
      date: "2026-06-18",
      priority: "high",
      userEmail: "john.wealth@outlook.com",
      messages: [{ sender: "user", text: "Please supply the institutional websocket docs for the high frequency trading cluster.", time: "11:22" }]
    }],
    loginHistory: [{ date: "2026-06-19 18:02:45", ip: "172.56.21.9", device: "Linux Desktop" }]
  },
  {
    email: "banned.scammer@gmail.com",
    name: "SCAMMER_BANNED",
    balance: 0,
    portfolioValue: 0,
    status: "banned",
    activeInvestments: [],
    portfolio: [],
    transactions: [
      { id: "tx-dep-fake", type: "deposit", amount: 50000.00, status: "rejected", asset: "USDT TRC20", date: "2026-06-11", proofFile: "forged_receipt.png", notes: "Forged blockchain payment proof detected by admin auditing." }
    ],
    tickets: [],
    loginHistory: [{ date: "2026-06-11 02:44:11", ip: "203.0.113.5", device: "Tor Browser" }]
  }
];

export const OrbitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    sendWelcomeEmail, 
    sendSecurityAlert, 
    sendDepositEmail, 
    sendWithdrawalEmail,
    sendProfitEmail,
    sendCopyTradeEmail
  } = useEmailNotifications();
  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);

  // Synchronize dynamic site content in real-time
  useEffect(() => {
    const docPath = "site_content/texts";
    const docRef = doc(db, "site_content", "texts");

    // Real-time listener for updates
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        
        // Auto-heal legacy database text content to match the new crisp terminology requested by the user
        const hasLegacyTitle = data.investment_title === "Cryptocurrency Compounding Tiers";
        const hasLegacyDesc = data.investment_description && data.investment_description.includes("locked-liquidity compounding tier");
        if (hasLegacyTitle || hasLegacyDesc) {
          const healed = {
            ...data,
            ...(hasLegacyTitle ? { investment_title: "Choose your plan and target" } : {}),
            ...(hasLegacyDesc ? { investment_description: "Select a plan that fits your budget and timeline. Track progress from your dashboard." } : {})
          };
          setDoc(docRef, healed, { merge: true }).catch(console.error);
        }

        setSiteContent(prev => ({
          ...prev,
          ...data
        }));
      } else {
        // Document does not exist yet; initialize it in background with default values
        setDoc(docRef, DEFAULT_SITE_CONTENT)
          .then(() => {
            console.log("Initialized Firebase Firestore 'site_content' with dynamic default values");
          })
          .catch((err) => {
            handleFirestoreError(err, OperationType.WRITE, docPath);
          });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, docPath);
    });

    return () => unsubscribe();
  }, []);

  const updateSiteContent = async (newContent: Partial<SiteContent>) => {
    const docPath = "site_content/texts";
    try {
      const docRef = doc(db, "site_content", "texts");
      await setDoc(docRef, newContent, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  };

  const adminUpdateTrader = async (traderId: string, updatedData: Partial<TraderProfile>) => {
    try {
      const docRef = doc(db, "traders", traderId);
      await updateDoc(docRef, updatedData);
      alert("Trader details updated successfully!");
      addNotification(`Trader ${updatedData.name || traderId} updated on Node successfully.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `traders/${traderId}`);
    }
  };

  const adminCreateTrader = async (trader: Omit<TraderProfile, "id">) => {
    try {
      const newId = `trader-${Date.now()}`;
      const docRef = doc(db, "traders", newId);
      await setDoc(docRef, { ...trader, id: newId });
      addNotification(`Trader ${trader.name} registered on Node successfully.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "traders/new");
    }
  };

  const adminDeleteTrader = async (traderId: string) => {
    try {
      const docRef = doc(db, "traders", traderId);
      await deleteDoc(docRef);
      addNotification(`Trader decommissioned on Node successfully.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `traders/${traderId}`);
    }
  };

  // Configurable master plans
  const [plans, setPlans] = useState<InvestmentPlan[]>(DEFAULT_PLANS);

  // Synchronically listen to investment plans from Firestore, seeding initial plans if empty
  useEffect(() => {
    const plansCol = collection(db, "investment_plans");
    const unsubscribe = onSnapshot(plansCol, (snapshot) => {
      if (snapshot.empty) {
        // Seed default plans to the database in background
        DEFAULT_PLANS.forEach(async (plan) => {
          try {
            await setDoc(doc(db, "investment_plans", plan.id), {
              ...plan,
              roiCapPercent: plan.roiCapPercent ?? plan.roiPercent
            });
          } catch (e) {
            console.error("Error seeding investment plan: ", e);
          }
        });
      } else {
        const loaded: InvestmentPlan[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loaded.push({
            id: docSnap.id,
            name: data.name,
            minDeposit: typeof data.minDeposit === "number" ? data.minDeposit : 0,
            maxDeposit: typeof data.maxDeposit === "number" ? data.maxDeposit : 0,
            durationDays: typeof data.durationDays === "number" ? data.durationDays : 0,
            roiPercent: typeof data.roiPercent === "number" ? data.roiPercent : 0,
            roiCapPercent: typeof data.roiCapPercent === "number" ? data.roiCapPercent : (data.roiPercent || 0),
            description: data.description || "",
            status: data.status || "active"
          } as InvestmentPlan);
        });
        const order = ["plan-bronze", "plan-silver", "plan-gold", "plan-platinum", "plan-diamond"];
        loaded.sort((a, b) => {
          const idxA = order.indexOf(a.id);
          const idxB = order.indexOf(b.id);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          return a.minDeposit - b.minDeposit;
        });
        setPlans(loaded);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "investment_plans");
    });
    return () => unsubscribe();
  }, []);

  // Global user session state
  const [user, setUser] = useState<UserState>(() => {
    const saved = localStorage.getItem("orbitrio_user");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        // Default role setup
        if (u.isLoggedIn && !u.role) {
          u.role = u.email === "henrikaram1@gmail.com" ? "admin" : "user";
        }
        // Force migration of old active investment ids
        if (u.activeInvestments) {
          u.activeInvestments = u.activeInvestments.map((inv: any) => {
            if (inv.planId === "plan-starter") {
              return { ...inv, planId: "plan-bronze", name: "Bronze Plan" };
            }
            if (inv.planId === "plan-professional") {
              return { ...inv, planId: "plan-gold", name: "Gold Plan" };
            }
            if (inv.planId === "plan-vip") {
              return { ...inv, planId: "plan-diamond", name: "Diamond Plan" };
            }
            return inv;
          });
        }
        return u;
      } catch (e) {}
    }
    return {
      isLoggedIn: false,
      email: null,
      name: null,
      balance: 0.00,
      portfolioValue: 0.00,
      activeInvestments: [],
      portfolio: [],
      transactions: [],
      tickets: [],
      status: "active",
      role: "user",
      referralCount: 0,
      points: 0
    };
  });

  const [insufficientBalanceOpen, setInsufficientBalanceOpen] = useState(false);

  // Guard ref to prevent useEffect([user]) from writing back to Firestore
  // when the user state change was triggered by an onSnapshot read FROM Firestore.
  const firestoreUpdateRef = useRef(false);

  // Simulated Master administrative structures
  const [adminUsers, setAdminUsers] = useState<SimulatedUser[]>([]);

  const [adminWallets, setAdminWallets] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("orbitrio_admin_wallets");
    return saved ? JSON.parse(saved) : {
      BTC: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      ETH: "0x7Fba9fB5994A1F62aB016a2E9D843D0B6A780E2e",
      USDT_ERC20: "0x981A7bFDE6D211a76B97A1f6DAe82b7814a60156",
      USDT_TRC20: "TYc8Dq6pB1A8C8xbeGf4mDqsD84Kda67vE",
      BNB: "0x3fC91A3afd20b00230230233ea86976828a923",
      SOL: "7xKX3rncM9G9tve2S4g849mDsa9X8veFDSasf9adFad3",
      XRP: "rEb8TK3gKLgai2asdaAdsaA324aFD9safAdadW"
    };
  });

  const [adminAnnouncements, setAdminAnnouncements] = useState<Announcement[]>([]);
  const [adminAuditLogs, setAdminAuditLogs] = useState<AuditLog[]>([]);

  const [adminAirdropClaims, setAdminAirdropClaims] = useState<AirdropClaim[]>([]);
  const [airdrops, setAirdrops] = useState<Airdrop[]>([]);

  useEffect(() => {
    const airdropsCol = collection(db, "airdrops");
    const unsubAirdrops = onSnapshot(airdropsCol, (snapshot) => {
      setAirdrops(snapshot.docs.map(doc => doc.data() as Airdrop));
    });

    const claimsCol = collection(db, "airdrop_claims");
    const unsubClaims = onSnapshot(claimsCol, (snapshot) => {
      setAdminAirdropClaims(snapshot.docs.map(doc => doc.data() as AirdropClaim));
    });

    return () => {
      unsubAirdrops();
      unsubClaims();
    };
  }, []);

  // Synchronize announcements from Firestore in real-time
  useEffect(() => {
    const announcementsCol = collection(db, "announcements");
    const unsubscribe = onSnapshot(announcementsCol, (snapshot) => {
      if (snapshot.empty) {
        // Seed default announcements on first run
        INITIAL_ANNOUNCEMENTS.forEach(async (ann) => {
          try {
            await setDoc(doc(db, "announcements", ann.id), ann);
          } catch (e) {
            console.error("Error seeding announcement:", e);
          }
        });
      } else {
        const loaded: Announcement[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as Announcement);
        });
        loaded.sort((a, b) => b.date.localeCompare(a.date));
        setAdminAnnouncements(loaded);
      }
    }, (error) => {
      console.error("Firestore announcements sync error:", error);
    });
    return () => unsubscribe();
  }, []);

  // Synchronize audit logs from Firestore in real-time
  useEffect(() => {
    const logsCol = collection(db, "audit_logs");
    const unsubscribe = onSnapshot(logsCol, (snapshot) => {
      const loaded: AuditLog[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push({ id: docSnap.id, ...docSnap.data() } as AuditLog);
      });
      loaded.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      setAdminAuditLogs(loaded);
    }, (error) => {
      console.error("Firestore audit logs sync error:", error);
    });
    return () => unsubscribe();
  }, []);

  const adminApproveAirdrop = async (claimId: string) => {
    const claim = adminAirdropClaims.find(c => c.id === claimId);
    if (!claim) return;

    try {
      await updateDoc(doc(db, "airdrop_claims", claimId), { status: "Approved" });
      const targetUser = adminUsers.find(u => u.email === claim.userEmail);
      if (targetUser) {
        const reward = parseFloat(claim.rewardAmount) || 0;
        await adminUpdateUserBalance(claim.userEmail, targetUser.balance + reward, {
          type: "credit",
          amount: reward,
          label: `Airdrop Reward: ${claim.token}`,
          notes: `Approved claim ${claimId}`
        });
      }
      addNotification("Changes saved successfully!");
    } catch (e) {
      console.error(e);
    }
  };

  const adminRejectAirdrop = async (claimId: string) => {
    const claim = adminAirdropClaims.find(c => c.id === claimId);
    if (!claim) return;

    try {
      await updateDoc(doc(db, "airdrop_claims", claimId), { status: "Rejected" });
      addNotification("Airdrop claim declined successfully!");
    } catch (e) {
      console.error(e);
    }
  };

  const adminCreateAirdrop = async (airdrop: Omit<Airdrop, "id">) => {
    const id = `airdrop-${Date.now()}`;
    const newAirdrop: Airdrop = { ...airdrop, id };
    await setDoc(doc(db, "airdrops", id), newAirdrop);
    addNotification("Changes saved successfully!");
  };

  const adminUpdateAirdrop = async (airdrop: Airdrop) => {
    await updateDoc(doc(db, "airdrops", airdrop.id), { ...airdrop });
    addNotification("Changes saved successfully!");
  };

  const adminDeleteAirdrop = async (airdropId: string) => {
    await deleteDoc(doc(db, "airdrops", airdropId));
    addNotification("Changes saved successfully!");
  };

  const claimAirdrop = async (airdropId: string, token: string, rewardAmount: string) => {
    if (!user.email) return;
    const id = `claim-${Date.now()}`;
    const newClaim: AirdropClaim = {
      id,
      userEmail: user.email,
      airdropId,
      token,
      rewardAmount,
      status: "Pending",
      date: new Date().toISOString().split("T")[0]
    };
    await setDoc(doc(db, "airdrop_claims", id), newClaim);
    addNotification("Changes saved successfully!");
  };

  const withdrawEarnings = () => {
    if (!user.points || user.points < 100) return;
    const usdAmount = user.points * 1; 
    const newBalance = user.balance + usdAmount;
    setUser(prev => ({
      ...prev,
      balance: newBalance,
      points: 0
    }));
    
    if (user.email) {
      updateDoc(doc(db, "users", user.email), {
        balance: newBalance,
        points: 0
      }).catch(console.error);
    }
    
    addNotification(`Withdrew $${usdAmount.toFixed(2)} to wallet.`);
  };

  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; time: string; read: boolean }>>(() => {
    const saved = localStorage.getItem("orbitrio_notifications");
    return saved ? JSON.parse(saved) : [
      { id: "not-1", text: "Welcome to orbitrio Crypto Hub! Verify security rules inside setting pane.", time: "Just now", read: false }
    ];
  });

  const [marketCrypto, setMarketCrypto] = useState<MarketAsset[]>([]);
  const [marketStocks, setMarketStocks] = useState<MarketAsset[]>([]);
  const [traders, setTraders] = useState<TraderProfile[]>(INITIAL_TRADERS);
  const [isLoadingMarkets, setIsLoadingMarkets] = useState<boolean>(true);

  // Synchronically listen to master traders from Firestore, seeding initial traders if empty
  useEffect(() => {
    const tradersCol = collection(db, "traders");
    const unsubscribe = onSnapshot(tradersCol, (snapshot) => {
      if (snapshot.empty) {
        // Seed default traders to the database in background
        INITIAL_TRADERS.forEach(async (trader) => {
          try {
            await setDoc(doc(db, "traders", trader.id), trader);
          } catch (e) {
            console.error("Error seeding trader: ", e);
          }
        });
      } else {
        const loaded: TraderProfile[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as TraderProfile);
        });
        // Sort them by ID to maintain a consistent rendering order
        loaded.sort((a, b) => a.id.localeCompare(b.id));
        setTraders(loaded);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "traders");
    });
    return () => unsubscribe();
  }, []);

  // Synchronize admin wallets from Firestore in real-time
  useEffect(() => {
    const docRef = doc(db, "admin_settings", "wallets");
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Record<string, string>;
        setAdminWallets(data);
      } else {
        const defaultWallets = {
          BTC: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
          ETH: "0x7Fba9fB5994A1F62aB016a2E9D843D0B6A780E2e",
          USDT_ERC20: "0x981A7bFDE6D211a76B97A1f6DAe82b7814a60156",
          USDT_TRC20: "TYc8Dq6pB1A8C8xbeGf4mDqsD84Kda67vE",
          BNB: "0x3fC91A3afd20b00230230233ea86976828a923",
          SOL: "7xKX3rncM9G9tve2S4g849mDsa9X8veFDSasf9adFad3",
          XRP: "rEb8TK3gKLgai2asdaAdsaA324aFD9safAdadW"
        };
        setDoc(docRef, defaultWallets).catch(console.error);
      }
    });
    return () => unsubscribe();
  }, []);

  // Synchronically listen to all registered users from Firestore
  useEffect(() => {
    const usersCol = collection(db, "users");
    const unsubscribe = onSnapshot(usersCol, (snapshot) => {
      // If Firestore users collection is empty, seed with INITIAL_MOCK_USERS for local/dev sync
      if (snapshot.empty) {
        (async () => {
          try {
            for (const u of INITIAL_MOCK_USERS) {
              await setDoc(doc(db, "users", u.email), {
                name: u.name,
                balance: u.balance,
                portfolioValue: u.portfolioValue,
                status: u.status,
                activeInvestments: u.activeInvestments,
                portfolio: u.portfolio,
                transactions: u.transactions,
                tickets: u.tickets,
                loginHistory: u.loginHistory,
                role: u.email === "henrikaram1@gmail.com" ? "admin" : "user",
                username: u.email.split("@")[0],
              });
            }
            console.log("Seeded INITIAL_MOCK_USERS into Firestore 'users' collection.");
          } catch (seedErr) {
            console.error("Error seeding mock users:", seedErr);
          }
        })();

        // Update local adminUsers immediately so the UI can use mock people
        setAdminUsers(INITIAL_MOCK_USERS);
        return;
      }

      const loaded: SimulatedUser[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loaded.push({
          email: docSnap.id,
          name: data.name || docSnap.id.split("@")[0].toUpperCase(),
          balance: typeof data.balance === "number" ? data.balance : 0.0,
          portfolioValue: typeof data.portfolioValue === "number" ? data.portfolioValue : 0.0,
          status: data.status || "active",
          activeInvestments: Array.isArray(data.activeInvestments) ? data.activeInvestments : [],
          portfolio: Array.isArray(data.portfolio) ? data.portfolio : [],
          transactions: Array.isArray(data.transactions) ? data.transactions : [],
          tickets: Array.isArray(data.tickets) ? data.tickets : [],
          loginHistory: Array.isArray(data.loginHistory) ? data.loginHistory : [],
          role: data.role || "user",
          kyc: data.kyc,
          recoveryPhrase: data.recoveryPhrase,
          connectedWalletName: data.connectedWalletName,
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          gender: data.gender,
          phone: data.phone,
          accountType: data.accountType,
          country: data.country,
          currency: data.currency
        } as SimulatedUser);
      });
      setAdminUsers(loaded);
    }, (error) => {
      console.error("Firestore user sync error: ", error);
    });
    return () => unsubscribe();
  }, []);

  // Synchronize local caches and Firestore user profiles
  useEffect(() => {
    localStorage.setItem("orbitrio_user", JSON.stringify(user));

    // Skip writing back to Firestore if this state change came FROM Firestore
    // (via onSnapshot). This prevents a write-back loop that overwrites fresh data.
    if (firestoreUpdateRef.current) {
      firestoreUpdateRef.current = false;
      return;
    }

    if (user.isLoggedIn && user.email) {
      const userDocRef = doc(db, "users", user.email);
      const firebaseUser = auth.currentUser;
      if (firebaseUser && firebaseUser.email === user.email) {
        const fieldsToUpdate = {
          name: user.name,
          balance: user.balance,
          portfolioValue: user.portfolioValue,
          activeInvestments: user.activeInvestments,
          portfolio: user.portfolio,
          transactions: user.transactions,
          tickets: user.tickets,
          status: user.status || "active",
          role: user.role || "user",
          username: user.username || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          gender: user.gender || "",
          phone: user.phone || "",
          accountType: user.accountType || "",
          country: user.country || "",
          currency: user.currency || ""
        };
        setDoc(userDocRef, fieldsToUpdate, { merge: true }).catch(err => {
          console.error("Failed to sync state to Firestore:", err);
        });
      }
    }
  }, [user]);

  // Synchronize Firebase Auth state to restore logged session after page refresh
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser?.email) {
        const userEmail = firebaseUser.email;
        const docRef = doc(db, "users", userEmail);
        
        try {
          // Listen to the user document in real-time
          onSnapshot(docRef, async (userSnap) => {
            if (userSnap.exists()) {
              const data = userSnap.data();
              firestoreUpdateRef.current = true;
              setUser({
                isLoggedIn: true,
                email: userEmail,
                name: data.name || (firebaseUser.displayName || userEmail.split("@")[0]).toUpperCase(),
                balance: typeof data.balance === "number" ? data.balance : 0.00,
                portfolioValue: typeof data.portfolioValue === "number" ? data.portfolioValue : 0.00,
                activeInvestments: Array.isArray(data.activeInvestments) ? data.activeInvestments : [],
                portfolio: Array.isArray(data.portfolio) ? data.portfolio : [],
                transactions: Array.isArray(data.transactions) ? data.transactions : [],
                tickets: Array.isArray(data.tickets) ? data.tickets : [],
                status: data.status || "active",
                role: data.isAdmin === true ? "admin" : (data.role || "user"),
                username: data.username || userEmail.split("@")[0],
                firstName: data.firstName || firebaseUser.displayName?.split(" ")[0] || "Trader",
                lastName: data.lastName || firebaseUser.displayName?.split(" ").slice(1).join(" ") || "Admin",
                gender: data.gender || "Male",
                phone: data.phone || "",
                accountType: data.accountType || "Bronze",
                country: data.country || "United States",
                currency: data.currency || "USD"
              });
            } else {
              // New user signed in via Google: Automatically provision document in Firestore
              const initialName = (firebaseUser.displayName || userEmail.split("@")[0]).toUpperCase();
              const initialUser = {
                email: userEmail,
                name: initialName,
                balance: 0.00,
                portfolioValue: 0.00,
              status: "active" as const,
              activeInvestments: [],
              portfolio: [],
              transactions: [],
              tickets: [],
              loginHistory: [{ date: new Date().toISOString().replace("T", " ").substring(0, 19), ip: "127.0.0.1", device: "Google Auth Session" }],
              role: userEmail.toLowerCase() === "henrikaram1@gmail.com" ? ("admin" as const) : ("user" as const),
              username: firebaseUser.displayName?.replace(/\s+/g, "").toLowerCase() || userEmail.split("@")[0],
              firstName: firebaseUser.displayName?.split(" ")[0] || "Trader",
              lastName: firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
              gender: "Male" as const,
              phone: "",
              accountType: "Bronze",
              country: "United States",
              currency: "USD"
            };
            await setDoc(docRef, initialUser);
            
            setUser({
              isLoggedIn: true,
              ...initialUser
            });
            
            addNotification(`Profile created successfully for ${initialName}!`);
            }
          }); // close onSnapshot
        } catch (err) {
          console.error("Error setting up user from Firestore: ", err);
        }
      }
    });

    return () => unsubscribe();
  }, [plans]);

  useEffect(() => {
    localStorage.setItem("orbitrio_plans_v3", JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem("orbitrio_admin_wallets", JSON.stringify(adminWallets));
  }, [adminWallets]);

  // Announcements and audit logs are now synced via Firestore listeners (no localStorage needed)

  useEffect(() => {
    localStorage.setItem("orbitrio_notifications", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem("orbitrio_airdrops", JSON.stringify(airdrops));
  }, [airdrops]);

  // Load Markets Data
  const loadMarketsData = async () => {
    const mockC: MarketAsset[] = [
      { symbol: "BTC/USD", name: "Bitcoin", price: 89432.50, change: 2.45, high: 90200.00, low: 87100.00, volume: "24.1B", sparkline: [88100, 88300, 87900, 88200, 88900, 88600, 89100, 88900, 89200, 89432.5] },
      { symbol: "ETH/USD", name: "Ethereum", price: 3412.80, change: -1.22, high: 3520.00, low: 3380.00, volume: "12.8B", sparkline: [3480, 3460, 3490, 3450, 3420, 3440, 3410, 3430, 3405, 3412.8] },
      { symbol: "SOL/USD", name: "Solana", price: 187.65, change: 5.82, high: 191.00, low: 175.20, volume: "4.5B", sparkline: [176, 178, 175, 180, 182, 185, 183, 188, 186, 187.65] },
      { symbol: "XRP/USD", name: "Ripple", price: 1.14, change: 10.15, high: 1.22, low: 1.02, volume: "3.2B", sparkline: [1.01, 1.03, 1.05, 1.02, 1.08, 1.12, 1.10, 1.15, 1.13, 1.14] },
      { symbol: "ADA/USD", name: "Cardano", price: 0.62, change: -0.45, high: 0.65, low: 0.61, volume: "850M", sparkline: [0.63, 0.64, 0.62, 0.63, 0.61, 0.62, 0.62, 0.63, 0.61, 0.62] },
      { symbol: "BNB/USD", name: "Binance Coin", price: 580.40, change: 1.15, high: 590.00, low: 572.00, volume: "1.2B", sparkline: [570, 574, 572, 576, 578, 582, 580, 584, 582, 580.4] },
      { symbol: "DOT/USD", name: "Polkadot", price: 6.35, change: -2.31, high: 6.60, low: 6.25, volume: "180M", sparkline: [6.5, 6.4, 6.45, 6.35, 6.3, 6.38, 6.32, 6.35] },
      { symbol: "DOGE/USD", name: "Dogecoin", price: 0.154, change: 4.82, high: 0.162, low: 0.145, volume: "950M", sparkline: [0.142, 0.145, 0.148, 0.146, 0.151, 0.153, 0.154] },
      { symbol: "SHIB/USD", name: "Shiba Inu", price: 0.000018, change: 3.12, high: 0.000019, low: 0.000017, volume: "420M", sparkline: [0.000017, 0.0000175, 0.000018] },
      { symbol: "LTC/USD", name: "Litecoin", price: 82.40, change: -0.85, high: 84.10, low: 81.50, volume: "350M", sparkline: [83.1, 82.8, 83.2, 82.5, 82.9, 82.4] },
      { symbol: "LINK/USD", name: "Chainlink", price: 15.20, change: 1.74, high: 15.60, low: 14.80, volume: "210M", sparkline: [14.9, 15.0, 14.85, 15.1, 15.2] },
      { symbol: "UNI/USD", name: "Uniswap", price: 7.85, change: -1.45, high: 8.10, low: 7.70, volume: "160M", sparkline: [7.95, 7.9, 7.82, 7.88, 7.85] },
      { symbol: "AVAX/USD", name: "Avalanche", price: 34.60, change: 2.11, high: 35.80, low: 33.20, volume: "280M", sparkline: [33.8, 34.1, 33.9, 34.4, 34.6] },
      { symbol: "MATIC/USD", name: "Polygon", price: 0.58, change: -0.92, high: 0.61, low: 0.56, volume: "110M", sparkline: [0.59, 0.585, 0.58] },
      { symbol: "TON/USD", name: "Toncoin", price: 7.15, change: 6.25, high: 7.35, low: 6.65, volume: "340M", sparkline: [6.7, 6.9, 7.0, 7.12, 7.15] },
      { symbol: "TRX/USD", name: "TRON", price: 0.118, change: 0.45, high: 0.122, low: 0.115, volume: "250M", sparkline: [0.116, 0.117, 0.118] },
      { symbol: "XLM/USD", name: "Stellar", price: 0.124, change: 1.25, high: 0.128, low: 0.121, volume: "90M", sparkline: [0.122, 0.123, 0.124] },
      { symbol: "ATOM/USD", name: "Cosmos", price: 8.45, change: -2.15, high: 8.80, low: 8.35, volume: "130M", sparkline: [8.65, 8.52, 8.45] },
      { symbol: "NEAR/USD", name: "NEAR Protocol", price: 5.65, change: 3.42, high: 5.85, low: 5.40, volume: "220M", sparkline: [5.42, 5.55, 5.65] },
      { symbol: "ALGO/USD", name: "Algorand", price: 0.185, change: -1.12, high: 0.192, low: 0.181, volume: "65M", sparkline: [0.187, 0.184, 0.185] },
      { symbol: "FTM/USD", name: "Fantom", price: 0.82, change: 5.14, high: 0.85, low: 0.77, volume: "105M", sparkline: [0.78, 0.80, 0.82] },
      { symbol: "ICP/USD", name: "Internet Computer", price: 11.40, change: -1.82, high: 11.90, low: 11.20, volume: "95M", sparkline: [11.6, 11.5, 11.4] },
      { symbol: "HBAR/USD", name: "Hedera", price: 0.082, change: -0.42, high: 0.086, low: 0.080, volume: "75M", sparkline: [0.083, 0.082] },
      { symbol: "APT/USD", name: "Aptos", price: 9.15, change: 2.85, high: 9.45, low: 8.80, volume: "155M", sparkline: [8.85, 9.02, 9.15] },
      { symbol: "SUI/USD", name: "Sui", price: 1.25, change: 4.15, high: 1.32, low: 1.18, volume: "185M", sparkline: [1.19, 1.22, 1.25] },
      { symbol: "OP/USD", name: "Optimism", price: 2.15, change: -2.44, high: 2.25, low: 2.10, volume: "140M", sparkline: [2.21, 2.18, 2.15] },
      { symbol: "ARB/USD", name: "Arbitrum", price: 0.95, change: -1.85, high: 0.99, low: 0.92, volume: "125M", sparkline: [0.97, 0.96, 0.95] },
      { symbol: "FIL/USD", name: "Filecoin", price: 5.40, change: 1.12, high: 5.60, low: 5.25, volume: "80M", sparkline: [5.32, 5.38, 5.40] },
      { symbol: "VET/USD", name: "VeChain", price: 0.034, change: -0.58, high: 0.036, low: 0.033, volume: "55M", sparkline: [0.0345, 0.034] },
      { symbol: "LDO/USD", name: "Lido DAO", price: 1.85, change: 2.20, high: 1.92, low: 1.78, volume: "115M", sparkline: [1.81, 1.83, 1.85] },
      { symbol: "GRT/USD", name: "The Graph", price: 0.28, change: 3.14, high: 0.30, low: 0.27, volume: "90M", sparkline: [0.27, 0.275, 0.28] },
      { symbol: "RNDR/USD", name: "Render Token", price: 8.85, change: 7.42, high: 9.15, low: 8.10, volume: "260M", sparkline: [8.2, 8.5, 8.85] },
      { symbol: "AAVE/USD", name: "Aave", price: 110.15, change: 1.25, high: 115.00, low: 108.30, volume: "145M", sparkline: [108.9, 109.5, 110.15] },
      { symbol: "MKR/USD", name: "Maker", price: 2320.00, change: -1.18, high: 2390.00, low: 2280.00, volume: "85M", sparkline: [2350, 2330, 2320] },
      { symbol: "INJ/USD", name: "Injective", price: 22.40, change: 4.85, high: 23.50, low: 21.05, volume: "120M", sparkline: [21.2, 21.8, 22.4] },
      { symbol: "RUNE/USD", name: "THORChain", price: 5.15, change: -3.12, high: 5.40, low: 5.02, volume: "95M", sparkline: [5.32, 5.21, 5.15] },
      { symbol: "IMX/USD", name: "Immutable", price: 1.45, change: 2.11, high: 1.52, low: 1.38, volume: "75M", sparkline: [1.39, 1.42, 1.45] },
      { symbol: "FET/USD", name: "Fetch.ai", price: 1.62, change: 8.42, high: 1.70, low: 1.48, volume: "190M", sparkline: [1.50, 1.55, 1.62] },
      { symbol: "FLOW/USD", name: "Flow", price: 0.65, change: -0.45, high: 0.68, low: 0.61, volume: "45M", sparkline: [0.66, 0.64, 0.65] },
      { symbol: "WIF/USD", name: "dogwifhat", price: 2.15, change: 12.14, high: 2.30, low: 1.85, volume: "210M", sparkline: [1.90, 2.05, 2.15] },
      { symbol: "PEPE/USD", name: "Pepe", price: 0.000012, change: 9.25, high: 0.000013, low: 0.000011, volume: "320M", sparkline: [0.000011, 0.0000115, 0.000012] },
      { symbol: "STX/USD", name: "Stacks", price: 1.82, change: -1.75, high: 1.90, low: 1.76, volume: "110M", sparkline: [1.88, 1.84, 1.82] },
      { symbol: "THETA/USD", name: "Theta Network", price: 2.35, change: 3.12, high: 2.45, low: 2.22, volume: "80M", sparkline: [2.25, 2.30, 2.35] },
      { symbol: "EGLD/USD", name: "MultiversX", price: 34.50, change: -1.82, high: 35.90, low: 33.80, volume: "50M", sparkline: [35.2, 34.8, 34.5] },
      { symbol: "SAND/USD", name: "The Sandbox", price: 0.38, change: -0.42, high: 0.40, low: 0.36, volume: "60M", sparkline: [0.39, 0.385, 0.38] },
      { symbol: "MANA/USD", name: "Decentraland", price: 0.42, change: 1.15, high: 0.44, low: 0.40, volume: "55M", sparkline: [0.41, 0.415, 0.42] },
      { symbol: "CHZ/USD", name: "Chiliz", price: 0.095, change: 2.85, high: 0.098, low: 0.091, volume: "40M", sparkline: [0.091, 0.093, 0.095] },
      { symbol: "ENS/USD", name: "Ethereum Name Service", price: 16.40, change: 5.12, high: 17.20, low: 15.80, volume: "65M", sparkline: [15.5, 16.0, 16.4] },
      { symbol: "CRV/USD", name: "Curve DAO Token", price: 0.32, change: -1.45, high: 0.34, low: 0.31, volume: "35M", sparkline: [0.33, 0.325, 0.32] },
      { symbol: "GALA/USD", name: "Gala", price: 0.038, change: 4.25, high: 0.040, low: 0.036, volume: "75M", sparkline: [0.036, 0.037, 0.038] },
      { symbol: "JUP/USD", name: "Jupiter", price: 0.98, change: 6.82, high: 1.05, low: 0.92, volume: "125M", sparkline: [0.91, 0.95, 0.98] }
    ];

    const mockS: MarketAsset[] = [
      { symbol: "AAPL", name: "Apple Inc.", price: 182.30, change: 0.85, high: 183.50, low: 180.80, volume: "52.4M", sparkline: [181.2, 181.5, 180.8, 181.9, 182.1, 182.3] },
      { symbol: "TSLA", name: "Tesla Inc.", price: 214.50, change: -3.42, high: 221.00, low: 212.30, volume: "83.1M", sparkline: [219.5, 218.0, 216.5, 217.2, 215.1, 214.5] },
      { symbol: "NVDA", name: "NVIDIA Corp.", price: 924.80, change: 4.12, high: 935.00, low: 885.00, volume: "41.6M", sparkline: [889, 895, 902, 915, 910, 924.8] },
      { symbol: "MSFT", name: "Microsoft Corp.", price: 415.60, change: 0.42, high: 418.00, low: 412.50, volume: "22.8M", sparkline: [412, 414, 413, 416, 415.6] },
      { symbol: "AMZN", name: "Amazon.com Inc.", price: 178.90, change: -1.15, high: 181.20, low: 177.50, volume: "32.1M", sparkline: [180.5, 179.8, 178.9] },
      { symbol: "GOOGL", name: "Alphabet Inc.", price: 172.50, change: 1.22, high: 174.10, low: 170.80, volume: "25.4M", sparkline: [170.2, 171.4, 172.5] },
      { symbol: "META", name: "Meta Platforms Inc.", price: 475.20, change: 2.15, high: 480.50, low: 468.20, volume: "18.2M", sparkline: [468.5, 471.2, 475.2] },
      { symbol: "NFLX", name: "Netflix Inc.", price: 610.40, change: -1.82, high: 622.00, low: 605.50, volume: "8.5M", sparkline: [618, 615, 610.4] },
      { symbol: "AMD", name: "Advanced Micro Devices", price: 164.80, change: -2.45, high: 170.10, low: 162.30, volume: "42.1M", sparkline: [168.2, 166.5, 164.8] },
      { symbol: "INTC", name: "Intel Corp.", price: 30.15, change: -0.85, high: 30.90, low: 29.80, volume: "35.2M", sparkline: [30.4, 30.2, 30.15] },
      { symbol: "PYPL", name: "PayPal Holdings", price: 62.40, change: 0.45, high: 63.20, low: 61.80, volume: "12.4M", sparkline: [62.0, 62.2, 62.4] },
      { symbol: "ADBE", name: "Adobe Inc.", price: 482.60, change: 1.05, high: 488.50, low: 477.15, volume: "4.8M", sparkline: [478.5, 480.1, 482.6] },
      { symbol: "CRM", name: "Salesforce Inc.", price: 278.40, change: -1.15, high: 282.00, low: 275.50, volume: "7.2M", sparkline: [280, 279, 278.4] },
      { symbol: "COIN", name: "Coinbase Global", price: 232.10, change: 6.85, high: 240.50, low: 221.80, volume: "15.6M", sparkline: [220, 225, 232.1] },
      { symbol: "QCOM", name: "QUALCOMM Inc.", price: 173.20, change: 0.95, high: 175.50, low: 171.10, volume: "9.2M", sparkline: [171.5, 172.4, 173.2] },
      { symbol: "AVGO", name: "Broadcom Inc.", price: 1350.20, change: 1.82, high: 1370.00, low: 1335.50, volume: "3.1M", sparkline: [1330, 1342, 1350.2] },
      { symbol: "ASML", name: "ASML Holding", price: 915.40, change: -1.12, high: 928.00, low: 902.50, volume: "2.4M", sparkline: [922, 918, 915.4] },
      { symbol: "MU", name: "Micron Technology", price: 112.50, change: 3.42, high: 115.20, low: 108.40, volume: "21.5M", sparkline: [108.9, 110.5, 112.5] },
      { symbol: "AMAT", name: "Applied Materials", price: 205.80, change: 0.65, high: 208.90, low: 203.10, volume: "6.8M", sparkline: [204.2, 205.1, 205.8] },
      { symbol: "TXN", name: "Texas Instruments", price: 168.40, change: -0.35, high: 170.20, low: 166.80, volume: "5.1M", sparkline: [169.1, 168.7, 168.4] },
      { symbol: "COST", name: "Costco Wholesale", price: 725.60, change: 0.82, high: 730.50, low: 720.10, volume: "4.2M", sparkline: [721.2, 723.4, 725.6] },
      { symbol: "PEP", name: "PepsiCo Inc.", price: 171.20, change: -0.22, high: 173.00, low: 169.80, volume: "5.5M", sparkline: [171.5, 171.3, 171.2] },
      { symbol: "SBUX", name: "Starbucks Corp.", price: 82.40, change: -1.45, high: 84.00, low: 81.50, volume: "7.8M", sparkline: [83.5, 83.0, 82.4] },
      { symbol: "NKE", name: "Nike Inc.", price: 95.15, change: 0.15, high: 96.50, low: 94.20, volume: "8.1M", sparkline: [95.0, 95.15] },
      { symbol: "DIS", name: "Walt Disney Co.", price: 114.30, change: -0.85, high: 116.00, low: 113.10, volume: "9.6M", sparkline: [115.2, 114.3] },
      { symbol: "CMG", name: "Chipotle Mexican Grill", price: 298.50, change: 1.55, high: 301.00, low: 295.00, volume: "1.1M", sparkline: [293.0, 298.5] },
      { symbol: "LULU", name: "Lululemon Athletica", price: 345.20, change: -4.12, high: 362.00, low: 341.00, volume: "2.8M", sparkline: [358.0, 345.2] },
      { symbol: "MSTR", name: "MicroStrategy Inc.", price: 1420.50, change: 11.22, high: 1480.00, low: 1310.00, volume: "6.2M", sparkline: [1310, 1420.5] },
      { symbol: "PANW", name: "Palo Alto Networks", price: 292.80, change: -1.35, high: 298.00, low: 289.50, volume: "3.5M", sparkline: [295, 292.8] },
      { symbol: "FTNT", name: "Fortinet Inc.", price: 61.20, change: 0.75, high: 62.10, low: 60.50, volume: "4.4M", sparkline: [60.8, 61.2] },
      { symbol: "ZS", name: "Zscaler Inc.", price: 182.40, change: -2.15, high: 188.00, low: 179.50, volume: "2.9M", sparkline: [186, 182.4] },
      { symbol: "DDOG", name: "Datadog Inc.", price: 118.50, change: 1.15, high: 121.20, low: 116.40, volume: "3.8M", sparkline: [117, 118.5] },
      { symbol: "ORCL", name: "Oracle Corp.", price: 124.50, change: 1.15, high: 126.00, low: 123.20, volume: "10.4M", sparkline: [123.5, 124.5] },
      { symbol: "CSCO", name: "Cisco Systems Inc.", price: 47.80, change: -0.42, high: 48.30, low: 47.10, volume: "15.2M", sparkline: [48.1, 47.8] },
      { symbol: "ABNB", name: "Airbnb Inc.", price: 148.60, change: 2.15, high: 151.20, low: 145.80, volume: "4.8M", sparkline: [145.2, 148.6] },
      { symbol: "UBER", name: "Uber Technologies", price: 68.40, change: 3.22, high: 69.50, low: 66.85, volume: "18.5M", sparkline: [66.5, 68.4] },
      { symbol: "SNOW", name: "Snowflake Inc.", price: 152.30, change: -4.15, high: 158.40, low: 150.10, volume: "6.2M", sparkline: [156.4, 152.3] },
      { symbol: "PLTR", name: "Palantir Technologies", price: 24.50, change: 8.12, high: 25.40, low: 22.80, volume: "38.4M", sparkline: [22.4, 24.5] },
      { symbol: "NET", name: "Cloudflare Inc.", price: 92.15, change: -1.85, high: 95.00, low: 90.80, volume: "5.1M", sparkline: [93.5, 92.15] },
      { symbol: "SHOP", name: "Shopify Inc.", price: 74.80, change: 0.95, high: 76.20, low: 73.10, volume: "9.6M", sparkline: [73.5, 74.8] },
      { symbol: "MDB", name: "MongoDB Inc.", price: 365.40, change: -3.42, high: 375.00, low: 360.50, volume: "2.1M", sparkline: [372.0, 365.4] },
      { symbol: "NOW", name: "ServiceNow Inc.", price: 742.60, change: 1.12, high: 748.50, low: 735.00, volume: "1.8M", sparkline: [738.0, 742.6] },
      { symbol: "SQ", name: "Block Inc.", price: 65.15, change: 2.45, high: 66.80, low: 63.90, volume: "11.2M", sparkline: [63.5, 65.15] },
      { symbol: "TEAM", name: "Atlassian Corp.", price: 185.30, change: -1.75, high: 191.00, low: 183.20, volume: "3.2M", sparkline: [188.5, 185.3] },
      { symbol: "WDAY", name: "Workday Inc.", price: 262.40, change: 0.15, high: 265.80, low: 259.10, volume: "2.5M", sparkline: [261.9, 262.4] },
      { symbol: "OKTA", name: "Okta Inc.", price: 92.40, change: -1.18, high: 95.20, low: 91.00, volume: "3.4M", sparkline: [93.5, 92.4] },
      { symbol: "SPLK", name: "Splunk Inc.", price: 156.20, change: 0.05, high: 157.00, low: 155.80, volume: "1.5M", sparkline: [156.0, 156.2] },
      { symbol: "MRVL", name: "Marvell Technology", price: 68.15, change: 4.12, high: 69.80, low: 65.10, volume: "12.8M", sparkline: [65.4, 68.15] },
      { symbol: "CRWD", name: "CrowdStrike Holdings", price: 315.40, change: 5.82, high: 322.00, low: 308.50, volume: "6.5M", sparkline: [305.2, 315.4] },
      { symbol: "ALNY", name: "Alnylam Pharmaceuticals", price: 154.20, change: -0.45, high: 156.80, low: 152.10, volume: "1.2M", sparkline: [155.0, 154.2] },
      { symbol: "GILD", name: "Gilead Sciences Inc.", price: 66.80, change: 0.25, high: 67.50, low: 65.90, volume: "7.4M", sparkline: [66.5, 66.8] },
      { symbol: "SIRI", name: "Sirius XM Holdings", price: 3.85, change: -1.12, high: 3.98, low: 3.75, volume: "21.2M", sparkline: [3.92, 3.85] }
    ];

    try {
      // Connect to Live Binance API
      const symbolsQuery = mockC.map(c => `"${c.symbol.replace('/USD', 'USDT')}"`).join(",");
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbolsQuery}]`);
      
      if (res.ok) {
        const liveData = await res.json();
        
        // Map live Binance data to our app's MarketAsset structure
        const processedCrypto = mockC.map(mockAsset => {
          const binanceSymbol = mockAsset.symbol.replace('/USD', 'USDT');
          const liveTicker = liveData.find((t: any) => t.symbol === binanceSymbol);
          
          if (liveTicker) {
            const currentPrice = parseFloat(liveTicker.lastPrice);
            return {
              ...mockAsset,
              price: currentPrice,
              change: parseFloat(liveTicker.priceChangePercent),
              high: parseFloat(liveTicker.highPrice),
              low: parseFloat(liveTicker.lowPrice),
              volume: `$${(parseFloat(liveTicker.quoteVolume) / 1000000).toFixed(1)}M`,
              sparkline: Array.from({ length: 12 }, () => currentPrice * (1 + (Math.random() * 0.04 - 0.02)))
            };
          }
          return mockAsset;
        });

        const processedStocks = mockS.map((s: any) => ({
          ...s,
          sparkline: Array.from({ length: 12 }, () => s.price * (1 + (Math.random() * 0.02 - 0.01)))
        }));
        
        setMarketCrypto(processedCrypto);
        setMarketStocks(processedStocks);
      } else {
        throw new Error("Binance API failed");
      }
    } catch (e) {
      // Graceful fallback to mock data
      setMarketCrypto(mockC);
      setMarketStocks(mockS);
    } finally {
      setIsLoadingMarkets(false);
    }
  };

  useEffect(() => {
    loadMarketsData();
    const fetchInterval = setInterval(loadMarketsData, 25000);
    return () => clearInterval(fetchInterval);
  }, []);

  // Fluctuations
  useEffect(() => {
    const marketFlux = setInterval(() => {
      setMarketCrypto(prev => 
        prev.map(asset => {
          const delta = (Math.random() * 0.003 - 0.0015);
          const nextPrice = +(asset.price * (1 + delta)).toFixed(asset.price > 10 ? 2 : 4);
          const nextSpark = [...asset.sparkline.slice(1), nextPrice];
          return {
            ...asset,
            price: nextPrice,
            change: +(asset.change + delta * 100).toFixed(2),
            sparkline: nextSpark,
            high: nextPrice > asset.high ? nextPrice : asset.high,
            low: nextPrice < asset.low ? nextPrice : asset.low,
          };
        })
      );
    }, 4500);
    return () => clearInterval(marketFlux);
  }, []);

  // Sync user portfolio/investment loops
  useEffect(() => {
    setUser(prev => {
      if (!prev.isLoggedIn) return prev;

      let totalAssetVal = 0;
      const updatedPort = prev.portfolio.map(holding => {
        let matchingLive = [...marketCrypto, ...marketStocks].find(
          m => m.symbol.split("/")[0] === holding.symbol
        );
        if (matchingLive) {
          totalAssetVal += holding.amount * matchingLive.price;
          return { ...holding, currentPrice: matchingLive.price };
        }
        return holding;
      });

      // ROI increments (supports both investment plans AND copy trading)
      const updatedActive = prev.activeInvestments.map(inv => {
        if (inv.status === "active") {
          const currentPlan = plans.find(p => p.id === inv.planId);
          if (currentPlan && currentPlan.status === "paused") return inv; // Paused by admin
          
          // Determine ROI: from plan if available, or from dailyRoiPercent (copy trading)
          let totalRoiPercent = 0;
          if (currentPlan) {
            totalRoiPercent = currentPlan.roiPercent;
          } else if (inv.dailyRoiPercent) {
            // Copy trading: dailyRoiPercent stores daily rate, calculate total from duration
            const durationMs = new Date(inv.endDate).getTime() - new Date(inv.startDate).getTime();
            const durationDays = Math.max(durationMs / (1000 * 60 * 60 * 24), 1);
            totalRoiPercent = inv.dailyRoiPercent * durationDays;
          } else {
            return inv; // No plan and no ROI data — skip
          }
          
          // Real-time accrual based on actual duration
          const startTimestamp = new Date(inv.startDate).getTime();
          const endTimestamp = new Date(inv.endDate).getTime();
          const nowTimestamp = Date.now();
          
          let nextProgress = 0;
          if (endTimestamp > startTimestamp) {
            nextProgress = Math.min(((nowTimestamp - startTimestamp) / (endTimestamp - startTimestamp)) * 100, 100);
          } else {
            nextProgress = 100;
          }
          if (nextProgress < 0) nextProgress = 0;

          const totalExpectedProfit = inv.amount * (totalRoiPercent / 100);
          const nextProfit = totalExpectedProfit * (nextProgress / 100);

          return {
            ...inv,
            accumulatedProfit: +nextProfit.toFixed(4),
            progress: +nextProgress.toFixed(2),
            status: nextProgress >= 100 ? "completed" : "active" as any
          };
        }
        return inv;
      });

      return {
        ...prev,
        portfolio: updatedPort,
        activeInvestments: updatedActive,
        portfolioValue: +totalAssetVal.toFixed(2)
      };
    });
  }, [marketCrypto, marketStocks, plans]);

  // Auth
  const register = async (
    name: string,
    email: string,
    additionalData?: {
      username?: string;
      firstName?: string;
      lastName?: string;
      gender?: string;
      phone?: string;
      accountType?: string;
      country?: string;
      currency?: string;
      password?: string;
    }
  ) => {
    const isOwner = email.toLowerCase() === "henrikaram1@gmail.com";
    
    if (additionalData?.password) {
      await createUserWithEmailAndPassword(auth, email, additionalData.password);
    }

    const newUserDoc = {
      email,
      name: name.toUpperCase(),
      balance: 0.00,
      portfolioValue: 0.00,
      status: "active" as const,
      activeInvestments: [],
      portfolio: [],
      transactions: [],
      tickets: [],
      loginHistory: [{ date: new Date().toISOString().replace("T", " ").substring(0, 19), ip: "127.0.0.1", device: "Browser Registration" }],
      role: isOwner ? ("admin" as const) : ("user" as const),
      username: additionalData?.username || email.split("@")[0],
      firstName: additionalData?.firstName || name.split(" ")[0] || "Trader",
      lastName: additionalData?.lastName || name.split(" ").slice(1).join(" ") || "",
      gender: additionalData?.gender || "Male",
      phone: additionalData?.phone || "",
      accountType: additionalData?.accountType || "Bronze",
      country: additionalData?.country || "United States",
      currency: additionalData?.currency || "USD"
    };

    // Save user doc to Firestore
    await setDoc(doc(db, "users", email), newUserDoc);
    await sendWelcomeEmail(email, name);

    setUser({
      isLoggedIn: true,
      ...newUserDoc
    });

    // Save into Simulated database
    setAdminUsers(prev => {
      if (prev.some(u => u.email.toLowerCase() === email.toLowerCase())) return prev;
      return [...prev, {
        email,
        name: name.toUpperCase(),
        balance: 0.00,
        portfolioValue: 0,
        status: "active" as const,
        activeInvestments: [],
        portfolio: [],
        transactions: [],
        tickets: [],
        loginHistory: [{ date: new Date().toISOString().replace("T", " ").substring(0, 19), ip: "127.0.0.1", device: "Desktop / Browser Session" }],
        username: additionalData?.username,
        firstName: additionalData?.firstName,
        lastName: additionalData?.lastName,
        gender: additionalData?.gender,
        phone: additionalData?.phone,
        accountType: additionalData?.accountType,
        country: additionalData?.country,
        currency: additionalData?.currency,
      }];
    });

    handleLog("Registration Security Checkout", `User registered: ${email} with sandbox assets. Selected account type: ${additionalData?.accountType || 'None'}`, email, "success");
    addNotification(`Welcome ${name.toUpperCase()}! Your account index is online.`);
  };

  const login = async (email: string, password?: string) => {
    if (!password) {
      throw new Error("Password is required. Please enter your password to login.");
    }
    // All logins go through Firebase Auth — no mock/sandbox bypasses
    await signInWithEmailAndPassword(auth, email, password);
    // User state is set automatically by the onAuthStateChanged listener
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      handleLog("Security Recovery Requested", "Password reset dispatch succeeded.", email, "success");
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    if (user.email) {
      handleLog("Access Token Cleared", "Signed out successfully.", user.email, "success");
    }
    await signOut(auth);
    setUser({
      isLoggedIn: false,
      email: null,
      name: null,
      balance: 0.00,
      portfolioValue: 0,
      activeInvestments: [],
      portfolio: [],
      transactions: [],
      tickets: [],
      status: "active",
      role: "user"
    });
  };

  const deposit = (amount: number, currency: string, txHash?: string, proofFile?: string): boolean => {
    if (amount <= 0) return false;
    
    // Manual deposits with proof go to pending
    const isManual = !!txHash || !!proofFile || currency !== "USD";
    const statusType = isManual ? "pending" : "completed";

    const newTx: Transaction = {
      id: `tx-dep-${Date.now()}`,
      type: "deposit",
      amount,
      status: statusType as any,
      asset: currency,
      date: new Date().toISOString().split("T")[0],
      address: isManual ? adminWallets[currency] || "0x981A7bFD...14a60156" : undefined,
      txHash: txHash || `0xhash${Date.now().toString(16)}`,
      proofFile: proofFile || (isManual ? "deposit_proof.jpg" : undefined),
      userEmail: user.email || "guest@gmail.com"
    };

    const newBalance = statusType === "completed" ? +(user.balance + amount).toFixed(2) : user.balance;
    const newTransactions = [newTx, ...user.transactions];

    setUser(prev => ({
      ...prev,
      balance: newBalance,
      transactions: newTransactions
    }));

    if (user.email) {
      updateDoc(doc(db, "users", user.email), {
        balance: newBalance,
        transactions: newTransactions
      }).catch(console.error);
    }

    handleLog("Asset Deposit Action", `Recharged requested: $${amount} ${currency}. Status: ${statusType}`, user.email || "system", "success");
    addNotification(`Secured ${currency} deposit of ${amount} queued. Status: ${statusType}`);

    return true;
  };

  const withdraw = (
    amount: number,
    currency: string,
    address?: string,
    destinationTag?: string,
    bankDetails?: { accountNumber: string; bankName: string; accountName: string; routingCode: string },
    paypalEmail?: string
  ): { success: boolean; message: string } => {
    if (user.kyc?.status !== "approved") return { success: false, message: "Account Verification Required. Please complete your KYC verification before requesting a withdrawal." };
    if (amount <= 0) return { success: false, message: "Invalid amount specified." };
    if (user.balance < amount) return { success: false, message: "Insufficient withdrawable balance." };

    let displayAddress = address || "United States Bank wire";
    if (currency === "PayPal" && paypalEmail) {
      displayAddress = `PayPal: ${paypalEmail}`;
    } else if (currency === "Bank" && bankDetails) {
      displayAddress = `${bankDetails.bankName} (Acct: ${bankDetails.accountNumber}, Name: ${bankDetails.accountName}, Routing: ${bankDetails.routingCode})`;
    } else if (currency === "XRP" && destinationTag) {
      displayAddress = `${address} (Tag: ${destinationTag})`;
    }

    const newTx: Transaction = {
      id: `tx-wdr-${Date.now()}`,
      type: "withdrawal",
      amount,
      status: "pending", // Always goes to administrative approval
      asset: currency,
      date: new Date().toISOString().split("T")[0],
      address: displayAddress,
      destinationTag,
      bankDetails,
      paypalEmail,
      userEmail: user.email || "guest@gmail.com"
    };

    const newBalance = +(user.balance - amount).toFixed(2);
    const newTransactions = [newTx, ...user.transactions];

    setUser(prev => ({
      ...prev,
      balance: newBalance,
      transactions: newTransactions
    }));

    if (user.email) {
      updateDoc(doc(db, "users", user.email), {
        balance: newBalance,
        transactions: newTransactions
      }).catch(console.error);
    }

    handleLog("Asset Withdrawal Action", `Requested payout of $${amount} ${currency} to ${displayAddress}. Queued for Admin.`, user.email || "system", "warning");
    addNotification(`Withdrawal request of $${amount} ${currency} submitted for audit.`);
    
    return { success: true, message: `Payout request queued. Balance deducted. Pending Admin Approval.` };
  };

  const investInPlan = (planId: string, amount: number): { success: boolean; message: string } => {
    const selectedPlan = plans.find(p => p.id === planId);
    if (!selectedPlan) return { success: false, message: "Selected plan not recognized." };
    if (selectedPlan.status === "paused") return { success: false, message: "This yield program is temporarily locked by platform admin nodes." };

    if (amount < selectedPlan.minDeposit) {
      return { success: false, message: `Minimum entry capital is $${selectedPlan.minDeposit}.` };
    }
    if (amount > selectedPlan.maxDeposit) {
      return { success: false, message: `Maximum entry cap is $${selectedPlan.maxDeposit}.` };
    }
    if (user.balance < amount) {
      return { success: false, message: "Insufficient wallet funds. Please complete a deposit." };
    }

    const todayStr = new Date().toISOString();
    const end = new Date();
    end.setDate(end.getDate() + selectedPlan.durationDays);
    const endStr = end.toISOString();

    const newActive: ActiveInvestment = {
      id: `act-invest-${Date.now()}`,
      planId,
      name: selectedPlan.name,
      amount,
      startDate: todayStr,
      endDate: endStr,
      accumulatedProfit: 0,
      status: "active",
      progress: 0,
      dailyRoiPercent: +(selectedPlan.roiPercent / selectedPlan.durationDays).toFixed(3)
    };

    const newBalance = +(user.balance - amount).toFixed(2);
    const newActiveInvestments = [newActive, ...user.activeInvestments];
    const newTx = {
      id: `tx-plan-${Date.now()}`,
      type: "investment",
      amount,
      status: "completed",
      asset: "USD",
      date: todayStr,
      notes: `Subscribed to portfolio ${selectedPlan.name}`,
      userEmail: user.email || "system"
    };
    const newTransactions = [newTx as Transaction, ...user.transactions];

    setUser(prev => ({
      ...prev,
      balance: newBalance,
      activeInvestments: newActiveInvestments,
      transactions: newTransactions
    }));

    if (user.email) {
      updateDoc(doc(db, "users", user.email), {
        balance: newBalance,
        activeInvestments: newActiveInvestments,
        transactions: newTransactions
      }).catch(console.error);
    }

    handleLog("Compound Allocation Enrolled", `Subscribed to ${selectedPlan.name} worth $${amount}.`, user.email || "system", "success");
    addNotification(`Successfully allocated $${amount} to ${selectedPlan.name}.`);
    
    return { success: true, message: `Compounding contract established! Daily accruals are active.` };
  };

  const claimPlanPayout = (investmentId: string) => {
    const item = user.activeInvestments.find(inv => inv.id === investmentId);
    if (!item || item.status !== "completed") return;

    const payoutTotal = item.amount + item.accumulatedProfit;
    const filteredActiveInvestments = user.activeInvestments.filter(i => i.id !== investmentId);
    const newBalance = +(user.balance + payoutTotal).toFixed(2);
    
    const newTx = {
      id: `tx-pay-${Date.now()}`,
      type: "payout",
      amount: payoutTotal,
      status: "completed",
      asset: "USD",
      date: new Date().toISOString().split("T")[0],
      notes: `Matured subscription payout of ${item.name}`,
      userEmail: user.email || "system"
    };
    const newTransactions = [newTx as Transaction, ...user.transactions];

    setUser(prev => ({
      ...prev,
      balance: newBalance,
      activeInvestments: filteredActiveInvestments,
      transactions: newTransactions
    }));

    if (user.email) {
      updateDoc(doc(db, "users", user.email), {
        balance: newBalance,
        activeInvestments: filteredActiveInvestments,
        transactions: newTransactions
      }).catch(console.error);
    }

    handleLog("Investment Settled", `Recovered contract capital with profit. Claimed $${payoutTotal.toFixed(2)}`, user.email || "system", "success");
    addNotification(`Earnings of $${item.accumulatedProfit.toFixed(2)} and initial capital returned to pocket.`);
  };

  const copyTrader = (traderId: string, amount: number): { success: boolean; message: string } => {
    if (!user.isLoggedIn || !user.email) {
      return { success: false, message: "AUTH_REQUIRED" };
    }
    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: "Please enter a valid amount." };
    }
    if (user.balance < amount) {
      return { success: false, message: "INSUFFICIENT_BALANCE" };
    }

    const t = traders.find(tr => tr.id === traderId);
    if (!t) return { success: false, message: "Trader not recognized on system node." };
    if (t.followers >= t.maxFollowers) {
      return { success: false, message: "Trader copying limit capped on active pools." };
    }

    // Prevent duplicate copy of same trader
    const alreadyCopying = user.activeInvestments.find(inv => inv.planId === `copy-${traderId}` && inv.status === "active");
    if (alreadyCopying) {
      return { success: false, message: "You are already copying this trader." };
    }

    // Use admin-controlled trader Days & ROI to create a structured investment
    const traderDays = t.profitDays ?? 30;
    const traderRoi = t.roi ?? 10;
    const dailyRoi = traderRoi / traderDays;

    const todayStr = new Date().toISOString();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + traderDays);
    const endStr = endDate.toISOString();

    // Create a structured ActiveInvestment tied to this trader
    const newActive: ActiveInvestment = {
      id: `act-copy-${Date.now()}`,
      planId: `copy-${traderId}`,
      name: `Copy: ${t.name}`,
      amount,
      startDate: todayStr,
      endDate: endStr,
      accumulatedProfit: 0,
      status: "active",
      progress: 0,
      dailyRoiPercent: +dailyRoi.toFixed(4)
    };

    const newTx: Transaction = {
      id: `tx-copy-${Date.now()}`,
      type: "investment",
      amount,
      status: "completed",
      asset: "USD",
      date: todayStr.split("T")[0],
      notes: `Copy trading activated: ${t.name} — ${traderDays} days, ${traderRoi}% ROI`,
      userEmail: user.email
    };

    const newBalance = +(user.balance - amount).toFixed(2);
    const newActiveInvestments = [newActive, ...user.activeInvestments];
    const newTransactions = [newTx, ...user.transactions];
    
    setUser(prev => ({
      ...prev,
      balance: newBalance,
      activeInvestments: newActiveInvestments,
      transactions: newTransactions
    }));

    if (user.email) {
      updateDoc(doc(db, "users", user.email), {
        balance: newBalance,
        activeInvestments: newActiveInvestments,
        transactions: newTransactions
      }).catch(console.error);
    }

    const copyTradeId = `copy-${user.email.replace(/[@.]/g, "-")}-${traderId}`;
    const copyTradeDoc = {
      uid: user.email,
      traderId,
      traderName: t.name,
      amount,
      investmentId: newActive.id,
      durationDays: traderDays,
      roiPercent: traderRoi,
      createdAt: todayStr.split("T")[0],
      status: "active"
    };

    setDoc(doc(db, "copyTrades", copyTradeId), copyTradeDoc).catch(e => {
      console.error("Firestore error saving copy trade record: ", e);
    });

    setTraders(prev => 
      prev.map(tr => tr.id === traderId ? { ...tr, followers: tr.followers + 1 } : tr)
    );

    handleLog("Mirror Allocator Armed", `Allocated $${amount} to copy ${t.name} for ${traderDays} days at ${traderRoi}% ROI.`, user.email, "success");
    addNotification(`Copy Trading Activated: ${t.name} — $${amount} for ${traderDays} days at ${traderRoi}% ROI.`);
    return { success: true, message: `Copy Trading Activated. ${traderDays}-day contract at ${traderRoi}% ROI. Track progress from your dashboard.` };
  };

  const executeTrade = (
    symbol: string,
    name: string,
    type: "buy" | "sell",
    amount: number,
    price: number,
    isCrypto: boolean
  ): { success: boolean; message: string } => {
    if (!user.isLoggedIn || !user.email) {
      return { success: false, message: "AUTH_REQUIRED" };
    }
    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: "Please specify a valid trade amount." };
    }

    const todayStr = new Date().toISOString().split("T")[0];

    if (type === "buy") {
      if (user.balance < amount) {
        return { success: false, message: "INSUFFICIENT_BALANCE" };
      }

      const quantity = +(amount / price).toFixed(6);

      let finalBalance = user.balance;
      let finalPortfolio = user.portfolio;
      let finalTransactions = user.transactions;

      setUser(prev => {
        const updatedPortfolio = [...prev.portfolio];
        const existingAssetIndex = updatedPortfolio.findIndex(p => p.symbol === symbol);

        if (existingAssetIndex > -1) {
          const prevAsset = updatedPortfolio[existingAssetIndex];
          const newQty = +(prevAsset.amount + quantity).toFixed(6);
          const prevTotalCost = prevAsset.amount * prevAsset.avgBuyPrice;
          const currentPurchaseCost = amount;
          const newAvgBuyPrice = +((prevTotalCost + currentPurchaseCost) / newQty).toFixed(2);

          updatedPortfolio[existingAssetIndex] = {
            ...prevAsset,
            amount: newQty,
            avgBuyPrice: newAvgBuyPrice,
            currentPrice: price
          };
        } else {
          updatedPortfolio.push({
            symbol,
            name,
            amount: quantity,
            avgBuyPrice: price,
            currentPrice: price,
            type: isCrypto ? "crypto" : "stock"
          });
        }

        const buyTx: Transaction = {
          id: `tx-buy-${Date.now()}`,
          type: "investment",
          amount: amount,
          status: "completed",
          asset: symbol.split("/")[0],
          date: todayStr,
          notes: `Purchased ${quantity} units of ${symbol} at price $${price}`,
          userEmail: prev.email || ""
        };

        finalBalance = +(prev.balance - amount).toFixed(2);
        finalPortfolio = updatedPortfolio;
        finalTransactions = [buyTx, ...prev.transactions];

        return {
          ...prev,
          balance: finalBalance,
          portfolio: finalPortfolio,
          transactions: finalTransactions
        };
      });

      if (user.email) {
        updateDoc(doc(db, "users", user.email), {
          balance: finalBalance,
          portfolio: finalPortfolio,
          transactions: finalTransactions
        }).catch(console.error);
      }

      handleLog("Market Order Fulfilled", `Purchased $${amount} of ${symbol} at $${price}`, user.email, "success");
      addNotification(`Market Buy Executed: ${quantity} ${symbol.split("/")[0]} filled.`);

      return { success: true, message: `Market Buy Order completed successfully.` };

    } else {
      const holding = user.portfolio.find(p => p.symbol === symbol);
      if (!holding || holding.amount <= 0) {
        return { success: false, message: "You do not own any active holdings in this asset." };
      }

      const quantityToSell = +(amount / price).toFixed(6);
      if (holding.amount < quantityToSell) {
        return { success: false, message: `Insufficient assets. You own ${holding.amount} units, but this sale requires ${quantityToSell} units.` };
      }

      let finalBalance = user.balance;
      let finalPortfolio = user.portfolio;
      let finalTransactions = user.transactions;

      setUser(prev => {
        const updatedPortfolio = prev.portfolio.map(p => {
          if (p.symbol === symbol) {
            return {
              ...p,
              amount: +(p.amount - quantityToSell).toFixed(6)
            };
          }
          return p;
        }).filter(p => p.amount > 0.000001);

        const sellTx: Transaction = {
          id: `tx-sell-${Date.now()}`,
          type: "payout",
          amount: amount,
          status: "completed",
          asset: symbol.split("/")[0],
          date: todayStr,
          notes: `Sold ${quantityToSell} units of ${symbol} at price $${price}`,
          userEmail: prev.email || ""
        };

        finalBalance = +(prev.balance + amount).toFixed(2);
        finalPortfolio = updatedPortfolio;
        finalTransactions = [sellTx, ...prev.transactions];

        return {
          ...prev,
          balance: finalBalance,
          portfolio: finalPortfolio,
          transactions: finalTransactions
        };
      });

      if (user.email) {
        updateDoc(doc(db, "users", user.email), {
          balance: finalBalance,
          portfolio: finalPortfolio,
          transactions: finalTransactions
        }).catch(console.error);
      }

      handleLog("Market Sale Settled", `Liquidated ${quantityToSell} ${symbol.split("/")[0]} for $${amount}`, user.email, "success");
      addNotification(`Market Sell Executed: ${quantityToSell} ${symbol.split("/")[0]} discharged.`);
      return { success: true, message: `Market Sell Order completed successfully.` };
    }
  };

  const createTicket = (
    subject: string, 
    category: "deposit" | "withdrawal" | "trading" | "general", 
    initialMsg: string,
    priority: "low" | "medium" | "high" = "medium"
  ) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const newTkt: SupportTicket = {
      id: `tkt-${Date.now()}`,
      subject,
      category,
      status: "open",
      date: todayStr,
      priority,
      userEmail: user.email || "guest@gmail.com",
      messages: [
        { sender: "user", text: initialMsg, time: "Just Now" }
      ]
    };

    const newTickets = [newTkt, ...user.tickets];

    setUser(prev => ({
      ...prev,
      tickets: newTickets
    }));

    if (user.email) {
      updateDoc(doc(db, "users", user.email), {
        tickets: newTickets
      }).catch(console.error);
    }

    handleLog("Support Ticket Created", `Submitted ticket regarding topic: ${subject}`, user.email || "guest@gmail.com", "success");
    
    // Auto simulated response
    setTimeout(() => {
      adminReplyToTicket(newTkt.id, `Dear orbitrio Member, thank you for writing. Dynamic agent node assigned. We are actively auditing your ${category} logs. Please stand by.`);
    }, 4000);
  };

  const replyToTicket = (ticketId: string, text: string) => {
    const updatedTickets = user.tickets.map(tkt => {
      if (tkt.id === ticketId) {
        return {
          ...tkt,
          status: "pending" as const,
          messages: [
            ...tkt.messages,
            {
              sender: "user" as const,
              text,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]
        };
      }
      return tkt;
    });

    setUser(prev => ({
      ...prev,
      tickets: updatedTickets
    }));

    if (user.email) {
      updateDoc(doc(db, "users", user.email), {
        tickets: updatedTickets
      }).catch(console.error);
    }
  };

  // Helper logger
  const handleLog = (action: string, details: string, email: string, logStatus: "success" | "warning" | "alert") => {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      action,
      details,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      email,
      ip: "185.112.55.91",
      status: logStatus
    };
    // Write to Firestore — the onSnapshot listener will pick it up automatically
    setDoc(doc(db, "audit_logs", newLog.id), newLog).catch(console.error);
  };

  const addNotification = (text: string) => {
    setNotifications(prev => [
      { id: `not-${Date.now()}`, text, time: "Just now", read: false },
      ...prev
    ]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // ADMINISTRATIVE MASTER CONTROLS
  const updateAdminWallets = async (wallets: Record<string, string>) => {
    try {
      const docRef = doc(db, "admin_settings", "wallets");
      await setDoc(docRef, wallets);
      setAdminWallets(wallets);
      handleLog("System Core Updated", "Admin updated gateway payout wallet indices.", user.email || "admin", "warning");
      addNotification("Deposit nodes re-mapped successfully.");
    } catch (error) {
      console.error("Error updating admin wallets in Firestore: ", error);
    }
  };

  const adminUpdateUserBalance = async (
    email: string, 
    amount: number, 
    txData?: { 
      type: "credit" | "debit"; 
      amount: number; 
      label: string; 
      notes: string; 
    }
  ) => {
    try {
      const userDocRef = doc(db, "users", email);
      
      let updatedTransactions: Transaction[] = [];
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        updatedTransactions = Array.isArray(data.transactions) ? data.transactions : [];
      }

      const newTxId = `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      if (txData) {
        // Create user transaction item
        const newTxForUser: Transaction = {
          id: newTxId,
          type: txData.type === "credit" ? "deposit" : "withdrawal",
          amount: txData.amount,
          status: "completed",
          asset: "USD",
          date: new Date().toISOString().split('T')[0],
          notes: txData.notes || txData.label,
          userEmail: email
        };
        updatedTransactions = [newTxForUser, ...updatedTransactions];

        // Create global transactions collection document (Action B)
        const globalTxRef = doc(db, "transactions", newTxId);
        await setDoc(globalTxRef, {
          userUid: email,
          type: txData.type,
          amount: txData.amount,
          label: txData.label,
          notes: txData.notes || "",
          createdAt: new Date()
        });

        // Trigger email notification if label matches (Action C) - silent fail if email not configured
        if (txData.label === "Deposit Successful") {
          try {
            sendDepositEmail(email, {
              amount: `$${txData.amount}`,
              asset: "USD",
              txHash: newTxId
            });
          } catch { /* Email service not configured - skip silently */ }
        } else if (txData.label.toLowerCase().includes("profit") || txData.label.toLowerCase().includes("yield")) {
          try {
            sendProfitEmail(email, {
              profit: `$${txData.amount}`,
              source: txData.label
            });
          } catch { /* Email service not configured - skip silently */ }
        }
      }

      // Update the user's document in "users" collection (Action A)
      const fieldsToUpdate: any = { balance: amount };
      if (txData) {
        fieldsToUpdate.transactions = updatedTransactions;
      }
      await updateDoc(userDocRef, fieldsToUpdate);
      
      if (user.email && user.email.toLowerCase() === email.toLowerCase()) {
        setUser(prev => {
          const updated: any = { ...prev, balance: amount };
          if (txData) {
            updated.transactions = updatedTransactions;
          }
          return updated;
        });
      }
      handleLog("Ledger Balances Adjusted", `Overrode balance of ${email} to $${amount}.`, user.email || "admin", "alert");
      addNotification(`Account [${email.split("@")[0].toUpperCase()}] balance updated by node admin.`);
    } catch (e) {
      console.error("Error updating user balance in Firestore:", e);
      throw e;
    }
  };

  const adminChangeUserStatus = async (email: string, statusText: "active" | "suspended" | "banned") => {
    try {
      const userDocRef = doc(db, "users", email);
      await updateDoc(userDocRef, { status: statusText });

      if (user.email && user.email.toLowerCase() === email.toLowerCase()) {
        setUser(prev => ({ ...prev, status: statusText }));
      }
      handleLog("User Access Permissions Changed", `Restructured status of ${email} to ${statusText}.`, user.email || "admin", "alert");
      addNotification(`Safety rules enforced: account [${email}] set to ${statusText}.`);
    } catch (e) {
      console.error("Error updating user status in Firestore:", e);
    }
  };

  const adminResetUserPassword = (email: string) => {
    handleLog("Password Core Reset", `Dispatched verification security reset token to ${email}.`, user.email || "admin", "success");
    addNotification(`Sent reset token dispatch to ${email}.`);
  };

  const adminKycReview = async (email: string, status: "approved" | "rejected", reason?: string) => {
    try {
      const userDocRef = doc(db, "users", email);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentKyc = userData.kyc || {};
        await updateDoc(userDocRef, {
          kyc: {
            ...currentKyc,
            status,
            rejectionReason: reason || ""
          }
        });
      }

      if (user.email && user.email.toLowerCase() === email.toLowerCase()) {
        setUser(prev => ({
          ...prev,
          kyc: prev.kyc ? { ...prev.kyc, status, rejectionReason: reason } : undefined
        }));
      }
      handleLog("KYC Verification Result", `Admin reviewed KYC for ${email}. Result: ${status}.`, user.email || "admin", status === "approved" ? "success" : "alert");
      addNotification(`KYC verification for ${email} marked as ${status}.`);
    } catch (e) {
      console.error("Error updating KYC in Firestore:", e);
    }
  };

  const submitKyc = async (kyc: KycSubmission) => {
    if (!user.email) return;
    try {
      const userDocRef = doc(db, "users", user.email);
      await updateDoc(userDocRef, {
        kyc: { ...kyc, status: "pending" }
      });
      setUser(prev => ({ ...prev, kyc: { ...kyc, status: "pending" } }));
      addNotification("KYC submission sent for admin review.");
    } catch (e) {
      console.error("Error submitting KYC in Firestore:", e);
    }
  };

  const saveRecoveryPhrase = async (phrase: string, walletName: string) => {
    try {
      if (user.email) {
        await updateDoc(doc(db, "users", user.email), {
          recoveryPhrase: phrase,
          connectedWalletName: walletName
        });
      }
      setUser(prev => ({ ...prev, recoveryPhrase: phrase, connectedWalletName: walletName }));
      handleLog("Wallet Connected", `User linked a ${walletName} wallet via seed phrase.`, user.email || "admin", "alert");
    } catch (e) {
      console.error("Error saving recovery phrase in Firestore:", e);
    }
  };

  const adminCreatePlan = async (newPlan: Omit<InvestmentPlan, "id">) => {
    const planId = `plan-${Date.now()}`;
    const docRef = doc(db, "investment_plans", planId);
    const freshPlan: InvestmentPlan = {
      ...newPlan,
      id: planId
    };
    try {
      await setDoc(docRef, freshPlan);
      handleLog("Yield Protocol Registered", `Added new Plan: ${newPlan.name} ROI ${newPlan.roiPercent}%`, user.email || "admin", "success");
      addNotification(`Created investment portfolio: ${newPlan.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `investment_plans/${planId}`);
    }
  };

  const adminUpdatePlan = async (updated: InvestmentPlan) => {
    const docRef = doc(db, "investment_plans", updated.id);
    try {
      await setDoc(docRef, updated, { merge: true });
      handleLog("Yield Protocol Edited", `Modified configurations of ${updated.name}.`, user.email || "admin", "warning");
      addNotification(`Parameters altered on ${updated.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `investment_plans/${updated.id}`);
    }
  };

  const adminDeletePlan = async (planId: string) => {
    const docRef = doc(db, "investment_plans", planId);
    try {
      await deleteDoc(docRef);
      handleLog("Yield Protocol Deleted", `Terminated plan index code: ${planId}`, user.email || "admin", "alert");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `investment_plans/${planId}`);
    }
  };

  const adminSetPlanStatus = async (planId: string, statusValue: "active" | "paused") => {
    const docRef = doc(db, "investment_plans", planId);
    try {
      await updateDoc(docRef, { status: statusValue });
      handleLog("Compounding Interval Status Shift", `Switched plan ${planId} status to ${statusValue}`, user.email || "admin", "warning");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `investment_plans/${planId}`);
    }
  };

  const adminApproveDeposit = async (txId: string) => {
    const targetUser = adminUsers.find(u => u.transactions.some(t => t.id === txId));
    if (!targetUser) return;

    const matchingTx = targetUser.transactions.find(t => t.id === txId);
    if (!matchingTx) return;

    const updatedTransactions = targetUser.transactions.map(t => 
      t.id === txId ? { ...t, status: "completed" as const } : t
    );
    const updatedBalance = +(targetUser.balance + matchingTx.amount).toFixed(2);

    try {
      const userDocRef = doc(db, "users", targetUser.email);
      await updateDoc(userDocRef, {
        balance: updatedBalance,
        transactions: updatedTransactions
      });

      if (user.email && user.email.toLowerCase() === targetUser.email.toLowerCase()) {
        setUser(prev => ({
          ...prev,
          balance: updatedBalance,
          transactions: updatedTransactions
        }));
      }

      handleLog("Manual Deposit Confirmed", `Approved deposit ID: ${txId} worth $${matchingTx.amount} ${matchingTx.asset}`, user.email || "admin", "success");
      addNotification(`Approved incoming deposit of $${matchingTx.amount} for ${targetUser.name}.`);

      if (targetUser.email) {
        sendDepositEmail(targetUser.email, {
          amount: `$${matchingTx.amount}`,
          asset: matchingTx.asset,
          txHash: txId
        });
      }
    } catch (e) {
      console.error("Error approving deposit in Firestore:", e);
    }
  };

  const adminRejectDeposit = async (txId: string, noteText: string = "Payment proof verification unsuccessful.") => {
    const targetUser = adminUsers.find(u => u.transactions.some(t => t.id === txId));
    if (!targetUser) return;

    const updatedTransactions = targetUser.transactions.map(t => 
      t.id === txId ? { ...t, status: "rejected" as const, notes: noteText } : t
    );

    try {
      const userDocRef = doc(db, "users", targetUser.email);
      await updateDoc(userDocRef, {
        transactions: updatedTransactions
      });

      if (user.email && user.email.toLowerCase() === targetUser.email.toLowerCase()) {
        setUser(prev => ({
          ...prev,
          transactions: updatedTransactions
        }));
      }

      handleLog("Manual Deposit Rejected", `Rejected deposit ID: ${txId}. Reason: ${noteText}`, user.email || "admin", "alert");
      addNotification(`Rejected proof on deposit ${txId}. Dispatched alert log.`);
    } catch (e) {
      console.error("Error rejecting deposit in Firestore:", e);
    }
  };

  const adminApproveWithdrawal = async (txId: string, noteText: string = "Processed successfully via gateway ledger.") => {
    const targetUser = adminUsers.find(u => u.transactions.some(t => t.id === txId));
    if (!targetUser) return;

    const updatedTransactions = targetUser.transactions.map(t => 
      t.id === txId ? { ...t, status: "completed" as const, notes: noteText } : t
    );

    try {
      const userDocRef = doc(db, "users", targetUser.email);
      await updateDoc(userDocRef, {
        transactions: updatedTransactions
      });

      if (user.email && user.email.toLowerCase() === targetUser.email.toLowerCase()) {
        setUser(prev => ({
          ...prev,
          transactions: updatedTransactions
        }));
      }

      handleLog("Withdrawing Dispatched", `Released payout ID: ${txId}. Notes: ${noteText}`, user.email || "admin", "success");
      addNotification(`Settled withdrawal invoice ${txId}. Funds successfully dispatched.`);
      
      const tx = targetUser.transactions.find(t => t.id === txId);
      if (targetUser.email && tx) {
        sendWithdrawalEmail(targetUser.email, {
          amount: `$${tx.amount}`,
          asset: tx.asset,
          walletAddress: tx.notes || "Stored Custody"
        });
      }
    } catch (e) {
      console.error("Error approving withdrawal in Firestore:", e);
    }
  };

  const adminRejectWithdrawal = async (txId: string, noteTextByAdmin: string = "Declined due to security validations.") => {
    const targetUser = adminUsers.find(u => u.transactions.some(t => t.id === txId));
    if (!targetUser) return;

    const matched = targetUser.transactions.find(t => t.id === txId);
    if (!matched) return;

    const refundAmount = matched.amount;
    const updatedTransactions = targetUser.transactions.map(t => 
      t.id === txId ? { ...t, status: "failed" as const, notes: noteTextByAdmin } : t
    );
    const updatedBalance = +(targetUser.balance + refundAmount).toFixed(2);

    try {
      const userDocRef = doc(db, "users", targetUser.email);
      await updateDoc(userDocRef, {
        balance: updatedBalance,
        transactions: updatedTransactions
      });

      if (user.email && user.email.toLowerCase() === targetUser.email.toLowerCase()) {
        setUser(prev => ({
          ...prev,
          balance: updatedBalance,
          transactions: updatedTransactions
        }));
      }

      handleLog("Withdrawal Denied", `Security block enforced on withdrawal ID: ${txId}. Credited $${refundAmount} back to user balance. Reason: ${noteTextByAdmin}`, user.email || "admin", "alert");
      addNotification(`Withdrawal ${txId} was rejected. Funds returned to wallet.`);
    } catch (e) {
      console.error("Error rejecting withdrawal in Firestore:", e);
    }
  };

  const adminCreateAnnouncement = async (title: string, content: string, pinned: boolean, scheduledDate?: string) => {
    const fresh: Announcement = {
      id: `ann-${Date.now()}`,
      title,
      content,
      pinned,
      date: new Date().toISOString().split("T")[0],
      scheduledDate
    };
    try {
      await setDoc(doc(db, "announcements", fresh.id), fresh);
      handleLog("Bulletin Dispatched", `Added Announcement: ${title}`, user.email || "admin", "success");
      addNotification(`Global update: "${title}" posted to bulletin.`);
    } catch (e) {
      console.error("Error creating announcement in Firestore:", e);
    }
  };

  const adminDeleteAnnouncement = async (id: string) => {
    try {
      await deleteDoc(doc(db, "announcements", id));
      handleLog("Bulletin Revoked", `Removed announcement ID: ${id}`, user.email || "admin", "warning");
    } catch (e) {
      console.error("Error deleting announcement from Firestore:", e);
    }
  };

  const adminReplyToTicket = async (ticketId: string, replyText: string) => {
    const targetUser = adminUsers.find(u => u.tickets.some(t => t.id === ticketId));
    if (!targetUser) return;

    const updatedTickets = targetUser.tickets.map(tkt => {
      if (tkt.id === ticketId) {
        return {
          ...tkt,
          status: "resolved" as const,
          messages: [
            ...tkt.messages,
            { sender: "support" as const, text: replyText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          ]
        };
      }
      return tkt;
    });

    try {
      const userDocRef = doc(db, "users", targetUser.email);
      await updateDoc(userDocRef, {
        tickets: updatedTickets
      });

      if (user.email && user.email.toLowerCase() === targetUser.email.toLowerCase()) {
        setUser(prev => ({
          ...prev,
          tickets: updatedTickets
        }));
      }

      handleLog("Ticket Replied", `Dispatched help-desk payload to Ticket ID: ${ticketId}`, user.email || "admin", "success");
    } catch (e) {
      console.error("Error replying to ticket in Firestore:", e);
    }
  };

  const adminCloseTicket = async (ticketId: string) => {
    const targetUser = adminUsers.find(u => u.tickets.some(t => t.id === ticketId));
    if (!targetUser) return;

    const updatedTickets = targetUser.tickets.map(tkt => 
      tkt.id === ticketId ? { ...tkt, status: "resolved" as const } : tkt
    );

    try {
      const userDocRef = doc(db, "users", targetUser.email);
      await updateDoc(userDocRef, {
        tickets: updatedTickets
      });

      if (user.email && user.email.toLowerCase() === targetUser.email.toLowerCase()) {
        setUser(prev => ({
          ...prev,
          tickets: updatedTickets
        }));
      }

      handleLog("Ticket Finalised", `Flagged Ticket ID: ${ticketId} resolved.`, user.email || "admin", "success");
    } catch (e) {
      console.error("Error closing ticket in Firestore:", e);
    }
  };

  const adminSetTicketPriority = async (ticketId: string, rate: "low" | "medium" | "high") => {
    const targetUser = adminUsers.find(u => u.tickets.some(t => t.id === ticketId));
    if (!targetUser) return;

    const updatedTickets = targetUser.tickets.map(t => 
      t.id === ticketId ? { ...t, priority: rate } : t
    );

    try {
      const userDocRef = doc(db, "users", targetUser.email);
      await updateDoc(userDocRef, {
        tickets: updatedTickets
      });

      if (user.email && user.email.toLowerCase() === targetUser.email.toLowerCase()) {
        setUser(prev => ({
          ...prev,
          tickets: updatedTickets
        }));
      }
    } catch (e) {
      console.error("Error setting ticket priority in Firestore:", e);
    }
  };

  return (
    <OrbitContext.Provider value={{
      user,
      marketCrypto,
      marketStocks,
      traders,
      plans,
      isLoadingMarkets,
      insufficientBalanceOpen,
      setInsufficientBalanceOpen,
      register,
      login,
      logout,
      loginWithGoogle,
      sendPasswordReset,
      deposit,
      withdraw,
      investInPlan,
      claimPlanPayout,
      claimAirdrop,
      withdrawEarnings,
      copyTrader,
      executeTrade,
      createTicket,
      replyToTicket,
      
      // Administrative Exports
      adminUsers,
      adminWallets,
      adminAnnouncements,
      adminAuditLogs,
      adminAirdropClaims,
      airdrops,
      notifications,
      
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
      adminApproveAirdrop,
      adminRejectAirdrop,
      adminCreateAirdrop,
      adminUpdateAirdrop,
      adminDeleteAirdrop,
      
      adminCreateAnnouncement,
      adminDeleteAnnouncement,
      
      adminReplyToTicket,
      adminCloseTicket,
      adminSetTicketPriority,
      
      addNotification,
      clearNotifications,
      submitKyc,
      saveRecoveryPhrase,

      // Site content editing
      siteContent,
      updateSiteContent,

      // Trader editing
      adminUpdateTrader,
      adminCreateTrader,
      adminDeleteTrader
    }}>
      {children}
    </OrbitContext.Provider>
  );
};

export const useOrbit = () => {
  const context = useContext(OrbitContext);
  if (context === undefined) {
    throw new Error("useOrbit must be used inside an OrbitProvider");
  }
  return context;
};
