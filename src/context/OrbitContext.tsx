import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import type {
  MarketAsset,
  TraderProfile,
  InvestmentPlan,
  DepositWallet,
  Transaction,
  SupportTicket,
  UserState,
  SimulatedUser,
  Announcement,
  AuditLog,
  SiteContent,
  AppSettings,
  Airdrop,
  AirdropClaim,
  KycSubmission
} from "../types";
import {
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  deleteDoc,
  auth,
  googleProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  db,
  handleFirestoreError,
  OperationType
} from "../lib/firebase";
import {
  buildActiveInvestment,
  buildAuditLog,
  buildTransaction,
  buildAirdrop,
  buildAirdropClaim,
  findUserCampaignClaim,
  hasReachedClaimLimit,
  isAirdropActive,
  normalizeAirdrop,
  buildCopyTrade,
  buildCopyTransaction,
  buildDepositWallet,
  buildDepositTransaction,
  buildInvestmentTransaction,
  buildNotification,
  type BuildNotificationOptions,
  type NotificationItem,
  deleteNotificationById,
  formatRelativeTimestamp,
  markNotificationReadById,
  markNotificationsReadById,
  normalizeNotification,
  saveNotification,
  sortNotifications,
  watchNotifications,
  createKycSubmission,
  buildRegistrationUserDoc,
  buildSimulatedUserFromRegistration,
  buildTopUpTransaction,
  buildUncopyTransaction,
  enrichTransaction,
  buildWithdrawalTransaction,
  createMockAirdrop,
  createMockInvestmentPlan,
  deleteMockAirdrop,
  deleteMockDepositWallet,
  deleteMockInvestmentPlan,
  deleteMockTrader,
  getMockAirdropClaims,
  getMockAirdrops,
  getMockDepositWallets,
  getMockInvestmentPlans,
  getMockTraders,
  saveMockAirdrop,
  saveMockAirdropClaim,
  saveMockDepositWallet,
  saveMockInvestmentPlan,
  saveMockTrader,
  setMockInvestmentPlanEnabled,
  updateMockAirdropClaimStatus,
  USE_MOCK_DATA,
  createInvestmentPlan,
  createLoggedOutUser,
  createSignedOutUser,
  decrementTraderFollowers,
  DEFAULT_INVESTMENT_PLANS,
  reviewKycSubmission,
  deleteInvestmentPlan,
  formatWithdrawalAddress,
  getEnabledDepositWallets,
  incrementTraderFollowers,
  INVESTMENT_PLANS_COLLECTION,
  isAdminEmail,
  mapDepositWalletsToAddressBook,
  normalizeDepositWallet,
  safeParse,
  saveInvestmentPlan,
  seedDefaultInvestmentPlans,
  setInvestmentPlanEnabled,
  settleMaturedInvestments,
  settleMaturedCopyTrades,
  filterActiveAnnouncements,
  isAnnouncementRead,
  normalizeAnnouncement,
  sortAnnouncementsForAdmin,
  sortInvestmentPlans,
  watchInvestmentPlans,
  loadLocalAppSettings,
  mergeAppSettings,
  normalizeAppSettings,
  saveLocalAppSettings,
  SETTINGS_DOC_PATH
} from "../services";
import { useEmailNotifications } from "../hooks/useEmailNotifications";
import type { TransactionalEmailEvent } from "../lib/emailClient";

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
  topUpInvestment: (investmentId: string, amount: number) => { success: boolean; message: string };
  copyTrader: (traderId: string, amount: number) => { success: boolean; message: string };
  uncopyTrader: (traderId: string) => { success: boolean; message: string };
  executeTrade: (symbol: string, name: string, type: "buy" | "sell", amount: number, price: number, isCrypto: boolean) => { success: boolean; message: string };
  createTicket: (subject: string, category: "deposit" | "withdrawal" | "trading" | "general", initialMsg: string, priority?: "low" | "medium" | "high") => void;
  replyToTicket: (ticketId: string, text: string) => void;

  // Administrative Operations
  adminUsers: SimulatedUser[];
  adminWallets: Record<string, string>;
  depositWallets: DepositWallet[];
  enabledDepositWallets: DepositWallet[];
  adminAnnouncements: Announcement[];
  userAnnouncements: Announcement[];
  adminAuditLogs: AuditLog[];
  adminAirdropClaims: AirdropClaim[];
  airdrops: Airdrop[];
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  
  updateAdminWallets: (wallets: Record<string, string>) => void;
  adminSaveDepositWallet: (wallet: DepositWallet | Omit<DepositWallet, "id">) => Promise<void>;
  adminDeleteDepositWallet: (walletId: string) => Promise<void>;
  adminUpdateUserBalance: (email: string, amount: number, txData?: { type: "credit" | "debit"; amount: number; label: string; notes: string; }) => Promise<void>;
  adminChangeUserStatus: (email: string, status: "active" | "suspended" | "banned") => void;
  adminResetUserPassword: (email: string) => void;
  adminKycReview: (email: string, status: "approved" | "rejected", reason?: string) => void;
  
  adminCreatePlan: (plan: Omit<InvestmentPlan, "id">) => Promise<void>;
  adminUpdatePlan: (plan: InvestmentPlan) => Promise<void>;
  adminDeletePlan: (planId: string) => Promise<void>;
  adminSetPlanStatus: (planId: string, status: "active" | "paused") => Promise<void>;
  
  adminApproveDeposit: (txId: string, notes?: string) => void;
  adminRejectDeposit: (txId: string, notes?: string) => void;
  adminApproveWithdrawal: (txId: string, notes?: string) => void;
  adminRejectWithdrawal: (txId: string, notes?: string) => void;
  
  adminApproveAirdrop: (claimId: string) => void;
  adminRejectAirdrop: (claimId: string) => void;
  adminCreateAirdrop: (airdrop: Omit<Airdrop, "id">) => void;
  adminUpdateAirdrop: (airdrop: Airdrop) => void;
  adminDeleteAirdrop: (airdropId: string) => void;
  
  adminCreateAnnouncement: (announcement: Omit<Announcement, "id" | "date" | "updatedAt"> & Partial<Pick<Announcement, "id" | "date" | "updatedAt">>) => Promise<void>;
  adminUpdateAnnouncement: (announcement: Announcement) => Promise<void>;
  adminDeleteAnnouncement: (announcementId: string) => Promise<void>;
  markAnnouncementRead: (announcementId: string) => Promise<void>;
  
  adminReplyToTicket: (ticketId: string, text: string) => void;
  adminCloseTicket: (ticketId: string) => void;
  adminSetTicketPriority: (ticketId: string, priority: "low" | "medium" | "high") => void;
  
  addNotification: (text: string, options?: BuildNotificationOptions) => void;
  clearNotifications: () => void;
  submitKyc: (kyc: KycSubmission) => void;
  saveWalletConnection: (walletName?: string) => void;

  // Real-time site content editing
  siteContent: SiteContent;
  updateSiteContent: (newContent: Partial<SiteContent>) => Promise<void>;
  appSettings: AppSettings;
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;

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

const localDev = import.meta.env.VITE_LOCAL_DEV === "true";
const DEFAULT_ADMIN_NOTIFICATION_EMAIL = "henrikaram1@gmail.com";

const localStorageGet = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  return safeParse<T>(window.localStorage.getItem(key), fallback);
};

const localStorageSet = (key: string, value: any) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const localSaveUserDoc = async (email: string, doc: any) => {
  const users = localStorageGet<Record<string, any>>( "orbitrio_local_users", {} );
  users[email.toLowerCase()] = { ...doc };
  localStorageSet("orbitrio_local_users", users);
};

const localLoadUserDoc = async (email: string) => {
  const users = localStorageGet<Record<string, any>>( "orbitrio_local_users", {} );
  return users[email.toLowerCase()] ?? null;
};

const localUpdateUserDoc = async (email: string, updates: any) => {
  const users = localStorageGet<Record<string, any>>( "orbitrio_local_users", {} );
  const existing = users[email.toLowerCase()];
  if (!existing) return null;
  users[email.toLowerCase()] = { ...existing, ...updates };
  localStorageSet("orbitrio_local_users", users);
  return users[email.toLowerCase()];
};

const localDeleteUserDoc = async (email: string) => {
  const users = localStorageGet<Record<string, any>>( "orbitrio_local_users", {} );
  delete users[email.toLowerCase()];
  localStorageSet("orbitrio_local_users", users);
};

const normalizeLedgerTransactions = (
  transactions: Transaction[] = [],
  email?: string | null,
  name?: string | null
): Transaction[] => transactions.map(transaction => enrichTransaction(
  transaction,
  { userEmail: transaction.userEmail || email || undefined, userId: transaction.userId || email || undefined, userName: transaction.userName || name || undefined },
  {
    currency: transaction.currency || transaction.asset,
    relatedReferenceId: transaction.relatedReferenceId || transaction.txHash || transaction.id,
    timestamp: transaction.timestamp
  }
));

const DEFAULT_PLANS = DEFAULT_INVESTMENT_PLANS;

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
    copyTrades: [],
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
    copyTrades: [],
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
    copyTrades: [],
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
    copyTrades: [],
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
    sendSecurityAlert,
    sendTransactionalEmail,
    sendPasswordResetRequestEmail
  } = useEmailNotifications();
  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [appSettings, setAppSettings] = useState<AppSettings>(() => loadLocalAppSettings());
  const sentEmailEventIdsRef = useRef<Set<string>>(new Set(localStorageGet<string[]>("orbitrio_sent_email_events", [])));

  const emailSettingsMetadata = () => ({
    companyName: appSettings.companyName,
    supportEmail: appSettings.supportEmail,
    senderName: appSettings.senderName,
    replyToEmail: appSettings.replyToEmail || appSettings.supportEmail
  });

  const reserveEmailEvent = (eventId: string) => {
    if (sentEmailEventIdsRef.current.has(eventId)) return false;
    sentEmailEventIdsRef.current.add(eventId);
    localStorageSet("orbitrio_sent_email_events", Array.from(sentEmailEventIdsRef.current));
    return true;
  };

  const dispatchTransactionalEmail = (
    to: string | null | undefined,
    eventType: TransactionalEmailEvent,
    eventId: string,
    metadata: Record<string, any> = {}
  ) => {
    if (!to || !reserveEmailEvent(eventId)) return;

    void sendTransactionalEmail(to, eventType, {
      ...emailSettingsMetadata(),
      ...metadata,
      eventId,
      email: to
    }).then(result => {
      if (result?.success === false) {
        console.error(`Transactional email ${eventType} failed:`, result.error || result.message);
      }
    }).catch(error => {
      console.error(`Transactional email ${eventType} failed:`, error);
    });
  };

  const updateSiteContent = async (newContent: Partial<SiteContent>) => {
    setSiteContent(prev => ({ ...prev, ...newContent }));
    if (USE_MOCK_DATA) return;

    const docPath = "site_content/texts";
    try {
      const docRef = doc(db, "site_content", "texts");
      await setDoc(docRef, newContent, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  };
  const updateAppSettings = async (settings: Partial<AppSettings>) => {
    const nextSettings = mergeAppSettings(appSettings, settings);
    setAppSettings(nextSettings);
    saveLocalAppSettings(nextSettings);

    if (USE_MOCK_DATA) return;

    try {
      await setDoc(doc(db, "app_settings", "business"), nextSettings, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, SETTINGS_DOC_PATH);
      throw error;
    }
  };
  useEffect(() => {
    if (USE_MOCK_DATA) return;

    const docPath = "site_content/texts";
    const unsubscribe = onSnapshot(doc(db, "site_content", "texts"), (snapshot) => {
      if (snapshot.exists()) {
        setSiteContent(prev => ({ ...prev, ...(snapshot.data() as Partial<SiteContent>) }));
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, docPath));

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (USE_MOCK_DATA) {
      setAppSettings(loadLocalAppSettings());
      return;
    }

    const unsubscribe = onSnapshot(doc(db, "app_settings", "business"), (snapshot) => {
      if (!snapshot.exists()) return;
      const nextSettings = normalizeAppSettings(snapshot.data() as Partial<AppSettings>);
      setAppSettings(nextSettings);
      saveLocalAppSettings(nextSettings);
    }, (error) => handleFirestoreError(error, OperationType.GET, SETTINGS_DOC_PATH));

    return unsubscribe;
  }, []);

  const adminUpdateTrader = async (traderId: string, updatedData: Partial<TraderProfile>) => {
    const existingTrader = traders.find(trader => trader.id === traderId);
    if (!existingTrader) throw new Error("Trader not found.");
    const updatedTrader = { ...existingTrader, ...updatedData };

    if (USE_MOCK_DATA) {
      saveMockTrader(updatedTrader);
      setTraders(getMockTraders(INITIAL_TRADERS));
      addNotification(`Trader ${updatedData.name || traderId} updated on mock node successfully.`);
      return;
    }

    try {
      const docRef = doc(db, "traders", traderId);
      await updateDoc(docRef, updatedData);
      setTraders(prev => prev.map(trader => trader.id === traderId ? updatedTrader : trader));
      addNotification(`Trader ${updatedData.name || traderId} updated on Node successfully.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `traders/${traderId}`);
    }
  };

  const adminCreateTrader = async (trader: Omit<TraderProfile, "id">) => {
    const freshTrader = { ...trader, id: `trader-${Date.now()}` };

    if (USE_MOCK_DATA) {
      saveMockTrader(freshTrader);
      setTraders(getMockTraders(INITIAL_TRADERS));
      addNotification(`Trader ${trader.name} registered on mock node successfully.`);
      return;
    }

    try {
      const docRef = doc(db, "traders", freshTrader.id);
      await setDoc(docRef, freshTrader);
      setTraders(prev => [...prev, freshTrader]);
      addNotification(`Trader ${trader.name} registered on Node successfully.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "traders/new");
    }
  };

  const adminDeleteTrader = async (traderId: string) => {
    if (USE_MOCK_DATA) {
      deleteMockTrader(traderId);
      setTraders(getMockTraders(INITIAL_TRADERS));
      addNotification(`Trader decommissioned on mock node successfully.`);
      return;
    }

    try {
      const docRef = doc(db, "traders", traderId);
      await deleteDoc(docRef);
      setTraders(prev => prev.filter(trader => trader.id !== traderId));
      addNotification(`Trader decommissioned on Node successfully.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `traders/${traderId}`);
    }
  };

  // Configurable master plans
  const [plans, setPlans] = useState<InvestmentPlan[]>(() => getMockInvestmentPlans());

  // Frontend development uses shared in-app mock data; Firebase sync can be re-enabled with VITE_USE_MOCK_DATA=false.
  useEffect(() => {
    if (USE_MOCK_DATA) {
      setPlans(getMockInvestmentPlans());
      return;
    }

    let seededDefaults = false;
    const unsubscribe = watchInvestmentPlans((loadedPlans) => {
      if (loadedPlans.length === 0 && !seededDefaults && auth.currentUser?.email && isAdminEmail(auth.currentUser.email)) {
        seededDefaults = true;
        seedDefaultInvestmentPlans().catch((error) => {
          handleFirestoreError(error, OperationType.WRITE, INVESTMENT_PLANS_COLLECTION);
        });
        return;
      }
      setPlans(loadedPlans);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, INVESTMENT_PLANS_COLLECTION);
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
        if (u.isLoggedIn && isAdminEmail(u.email)) {
          u.role = "admin";
          u.isAdmin = true;
        } else if (u.isLoggedIn && !u.role) {
          u.role = "user";
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
        u.copyTrades = Array.isArray(u.copyTrades) ? u.copyTrades : [];
        u.readAnnouncementIds = Array.isArray(u.readAnnouncementIds) ? u.readAnnouncementIds : [];
        delete u.recoveryPhrase;
        return u;
      } catch (e) {}
    }
    return createLoggedOutUser();
  });
  const [authReady, setAuthReady] = useState(USE_MOCK_DATA || localDev);

  const [insufficientBalanceOpen, setInsufficientBalanceOpen] = useState(false);
  const enrichUserTransaction = (
    transaction: Transaction,
    owner: Pick<UserState, "email" | "name"> = user,
    relatedReferenceId?: string
  ) => enrichTransaction(transaction, {
    userId: owner.email,
    userEmail: owner.email,
    userName: owner.name
  }, {
    relatedReferenceId
  });

  // Simulated Master administrative structures
  const [adminUsers, setAdminUsers] = useState<SimulatedUser[]>([]);

  const [depositWallets, setDepositWallets] = useState<DepositWallet[]>(() => {
    const saved = localStorage.getItem("orbitrio_deposit_wallets");
    return saved ? safeParse<DepositWallet[]>(saved, []) : [];
  });
  const enabledDepositWallets = getEnabledDepositWallets(depositWallets);
  const [adminWallets, setAdminWallets] = useState<Record<string, string>>(() =>
    mapDepositWalletsToAddressBook(depositWallets)
  );

  const [adminAnnouncements, setAdminAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem("orbitrio_announcements");
    const parsed = saved ? safeParse<Announcement[]>(saved, INITIAL_ANNOUNCEMENTS) : INITIAL_ANNOUNCEMENTS;
    return sortAnnouncementsForAdmin(parsed.map(item => normalizeAnnouncement(item, item.id)));
  });
  const userAnnouncements = filterActiveAnnouncements(adminAnnouncements);
  useEffect(() => {
    if (USE_MOCK_DATA) return;
    if (!authReady || !user.isLoggedIn) {
      setAdminAnnouncements([]);
      return;
    }

    const announcementsCol = collection(db, "announcements");
    const unsubscribe = onSnapshot(announcementsCol, (snapshot) => {
      if (snapshot.empty && user.isAdmin) {
        INITIAL_ANNOUNCEMENTS.forEach(async (announcement) => {
          const normalized = normalizeAnnouncement(announcement, announcement.id);
          await setDoc(doc(db, "announcements", normalized.id), normalized);
        });
        setAdminAnnouncements(sortAnnouncementsForAdmin(INITIAL_ANNOUNCEMENTS.map(item => normalizeAnnouncement(item, item.id))));
        return;
      }

      const loaded = snapshot.docs.map(docSnap => normalizeAnnouncement(docSnap.data() as Announcement, docSnap.id));
      setAdminAnnouncements(sortAnnouncementsForAdmin(loaded));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "announcements");
    });

    return () => unsubscribe();
  }, [authReady, user.isLoggedIn]);

  const [adminAuditLogs, setAdminAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem("orbitrio_audit_logs");
    return saved ? JSON.parse(saved) : [
      { id: "log-1", action: "System Booted", details: "orbitrio financial core initialised on secured cluster nodes.", timestamp: "2026-06-19 00:01:00", email: "system", ip: "127.0.0.1", status: "success" },
      { id: "log-2", action: "Cold Storage Verified", details: "Multi-sig 10-layer physical vaults synchronised and validated.", timestamp: "2026-06-19 00:05:22", email: "sec-op", ip: "10.0.1.5", status: "success" }
    ];
  });

  const [adminAirdropClaims, setAdminAirdropClaims] = useState<AirdropClaim[]>([]);
  const [airdrops, setAirdrops] = useState<Airdrop[]>([]);

  useEffect(() => {
    if (USE_MOCK_DATA) {
      setAirdrops(getMockAirdrops());
      setAdminAirdropClaims(getMockAirdropClaims());
      return;
    }

    if (!authReady || !user.email) {
      setAirdrops([]);
      setAdminAirdropClaims([]);
      return;
    }

    const airdropsCol = collection(db, "airdrops");
    const unsubAirdrops = onSnapshot(airdropsCol, (snapshot) => {
      setAirdrops(snapshot.docs.map(doc => doc.data() as Airdrop));
    });

    const claimsRef = user.isAdmin
      ? collection(db, "airdrop_claims")
      : query(collection(db, "airdrop_claims"), where("userEmail", "==", user.email));
    const unsubClaims = onSnapshot(claimsRef, (snapshot) => {
      setAdminAirdropClaims(snapshot.docs.map(doc => doc.data() as AirdropClaim));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "airdrop_claims");
    });

    return () => {
      unsubAirdrops();
      unsubClaims();
    };
  }, [authReady, user.email, user.isAdmin]);
  const adminApproveAirdrop = async (claimId: string) => {
    const claim = adminAirdropClaims.find(c => c.id === claimId);
    if (!claim || claim.status !== "Pending") {
      addNotification("This airdrop claim has already been reviewed.");
      return;
    }

    const campaign = airdrops.find(item => item.id === claim.airdropId);
    const reward = parseFloat(claim.rewardAmount) || 0;
    const payoutReference = `airdrop:${claim.airdropId}:${claim.userEmail.toLowerCase()}`;

    if (claim.payoutTransactionId) {
      addNotification("Duplicate payout blocked for this approved airdrop claim.");
      return;
    }

    if (USE_MOCK_DATA) {
      const payoutTx = buildTransaction(
        "tx-airdrop",
        "payout",
        reward,
        "USD",
        {
          notes: `Approved airdrop claim ${claimId} for ${claim.token}`,
          userEmail: claim.userEmail
        },
        { userEmail: claim.userEmail, userName: claim.userName },
        { relatedReferenceId: payoutReference }
      );
      const reviewedClaim = { ...claim, status: "Approved" as const, reviewedAt: new Date().toISOString(), payoutTransactionId: payoutTx.id };
      saveMockAirdropClaim(reviewedClaim);
      setAdminAirdropClaims(getMockAirdropClaims());
      setAdminUsers(prev => prev.map(item => {
        if (item.email.toLowerCase() !== claim.userEmail.toLowerCase()) return item;
        const alreadyPaid = item.transactions.some(tx => tx.relatedReferenceId === payoutReference);
        return alreadyPaid ? item : {
          ...item,
          balance: Number((item.balance + reward).toFixed(2)),
          transactions: [payoutTx, ...item.transactions]
        };
      }));
      if (user.email?.toLowerCase() === claim.userEmail.toLowerCase()) {
        setUser(prev => {
          const alreadyPaid = prev.transactions.some(tx => tx.relatedReferenceId === payoutReference);
          return alreadyPaid ? prev : {
            ...prev,
            balance: Number((prev.balance + reward).toFixed(2)),
            transactions: [payoutTx, ...prev.transactions]
          };
        });
      }
      handleLog("Airdrop Claim Approved", `Approved mock claim ${claimId} for ${claim.userEmail}.`, user.email || "admin", "success");
      addNotification(`Airdrop claim approved for ${claim.userEmail}.`, { title: "Airdrop approved", type: "success", eventKey: `admin:airdrop:approved:${claimId}` });
      addNotification(`Your ${claim.token} airdrop claim was approved and credited.`, { title: "Airdrop approved", type: "success", recipientEmail: claim.userEmail, eventKey: `airdrop:approved:${claimId}`, action: { label: "View airdrops", view: "dashboard-airdrops" } });
      dispatchTransactionalEmail(claim.userEmail, "AIRDROP_CLAIM_APPROVED", `airdrop:approved:${claimId}`, {
        name: claim.userName || claim.userEmail.split("@")[0],
        campaignTitle: claim.campaignTitle || campaign?.title,
        token: claim.token,
        rewardAmount: claim.rewardAmount,
        amount: reward,
        claimId,
        transactionId: payoutTx.id,
        status: "approved"
      });
      return;
    }

    try {
      const userDocRef = doc(db, "users", claim.userEmail);
      const userSnap = await getDoc(userDocRef);
      const targetName = claim.userName || adminUsers.find(u => u.email.toLowerCase() === claim.userEmail.toLowerCase())?.name;
      const currentBalance = userSnap.exists() && typeof userSnap.data().balance === "number"
        ? userSnap.data().balance
        : adminUsers.find(u => u.email.toLowerCase() === claim.userEmail.toLowerCase())?.balance || 0;
      const currentTransactions = userSnap.exists() && Array.isArray(userSnap.data().transactions)
        ? normalizeLedgerTransactions(userSnap.data().transactions, claim.userEmail, targetName)
        : [];

      const existingPayout = currentTransactions.find(tx => tx.relatedReferenceId === payoutReference);
      if (existingPayout) {
        await updateDoc(doc(db, "airdrop_claims", claimId), {
          status: "Approved",
          reviewedAt: claim.reviewedAt || new Date().toISOString(),
          payoutTransactionId: claim.payoutTransactionId || existingPayout.id,
          adminNotes: "Duplicate approval attempt blocked; existing payout retained."
        });
        addNotification("Duplicate payout blocked; existing airdrop payout retained.");
        dispatchTransactionalEmail(claim.userEmail, "AIRDROP_CLAIM_APPROVED", `airdrop:approved:${claimId}`, {
          name: targetName || claim.userEmail.split("@")[0],
          campaignTitle: claim.campaignTitle || campaign?.title,
          token: claim.token,
          rewardAmount: claim.rewardAmount,
          amount: reward,
          claimId,
          transactionId: existingPayout.id,
          status: "approved"
        });
        return;
      }

      const payoutTx = buildTransaction(
        "tx-airdrop",
        "payout",
        reward,
        "USD",
        {
          notes: `Approved airdrop claim ${claimId}${campaign ? ` for ${campaign.title}` : ""}`,
          userEmail: claim.userEmail
        },
        { userEmail: claim.userEmail, userName: targetName },
        { relatedReferenceId: payoutReference }
      );
      const updatedTransactions = [payoutTx, ...currentTransactions];
      const updatedBalance = Number((currentBalance + reward).toFixed(2));

      await updateDoc(userDocRef, {
        balance: updatedBalance,
        transactions: updatedTransactions
      });
      await setDoc(doc(db, "transactions", payoutTx.id), {
        ...payoutTx,
        label: `Airdrop Reward: ${claim.token}`,
        claimId,
        campaignId: claim.airdropId,
        createdAt: new Date()
      });
      await updateDoc(doc(db, "airdrop_claims", claimId), {
        status: "Approved",
        reviewedAt: new Date().toISOString(),
        payoutTransactionId: payoutTx.id,
        adminNotes: "Wallet credited after admin approval."
      });

      setAdminAirdropClaims(prev => prev.map(c => c.id === claimId ? { ...c, status: "Approved", reviewedAt: new Date().toISOString(), payoutTransactionId: payoutTx.id } : c));
      setAdminUsers(prev => prev.map(item => item.email.toLowerCase() === claim.userEmail.toLowerCase()
        ? { ...item, balance: updatedBalance, transactions: updatedTransactions }
        : item
      ));
      if (user.email?.toLowerCase() === claim.userEmail.toLowerCase()) {
        setUser(prev => ({ ...prev, balance: updatedBalance, transactions: updatedTransactions }));
      }
      handleLog("Airdrop Claim Approved", `Credited ${claim.userEmail} $${reward.toFixed(2)} for ${claim.token}.`, user.email || "admin", "success");
      addNotification(`Airdrop claim approved and $${reward.toFixed(2)} credited.`, { title: "Airdrop approved", type: "success", eventKey: `admin:airdrop:approved:${claimId}` });
      addNotification(`Your ${claim.token} airdrop claim was approved and $${reward.toFixed(2)} credited.`, { title: "Airdrop approved", type: "success", recipientEmail: claim.userEmail, eventKey: `airdrop:approved:${claimId}`, action: { label: "View airdrops", view: "dashboard-airdrops" } });
      dispatchTransactionalEmail(claim.userEmail, "AIRDROP_CLAIM_APPROVED", `airdrop:approved:${claimId}`, {
        name: targetName || claim.userEmail.split("@")[0],
        campaignTitle: claim.campaignTitle || campaign?.title,
        token: claim.token,
        rewardAmount: claim.rewardAmount,
        amount: reward,
        claimId,
        transactionId: payoutTx.id,
        status: "approved"
      });
    } catch (e) {
      console.error("Error approving airdrop claim:", e);
      addNotification("Airdrop approval failed. Please review the claim again.");
    }
  };

  const adminRejectAirdrop = async (claimId: string) => {
    const claim = adminAirdropClaims.find(c => c.id === claimId);
    if (!claim || claim.status !== "Pending") {
      addNotification("This airdrop claim has already been reviewed.");
      return;
    }

    const reviewedAt = new Date().toISOString();
    const campaign = airdrops.find(item => item.id === claim.airdropId);

    if (USE_MOCK_DATA) {
      saveMockAirdropClaim({ ...claim, status: "Rejected", reviewedAt, adminNotes: "Rejected by admin." });
      setAdminAirdropClaims(getMockAirdropClaims());
      handleLog("Airdrop Claim Rejected", `Rejected mock claim ${claimId} for ${claim.userEmail}.`, user.email || "admin", "warning");
      addNotification(`Airdrop claim rejected for ${claim.userEmail}.`, { title: "Airdrop rejected", type: "warning", eventKey: `admin:airdrop:rejected:${claimId}` });
      addNotification(`Your ${claim.token} airdrop claim was rejected.`, { title: "Airdrop rejected", type: "error", recipientEmail: claim.userEmail, eventKey: `airdrop:rejected:${claimId}`, action: { label: "View airdrops", view: "dashboard-airdrops" } });
      dispatchTransactionalEmail(claim.userEmail, "AIRDROP_CLAIM_REJECTED", `airdrop:rejected:${claimId}`, {
        name: claim.userName || claim.userEmail.split("@")[0],
        campaignTitle: claim.campaignTitle || campaign?.title,
        token: claim.token,
        rewardAmount: claim.rewardAmount,
        claimId,
        reason: "Rejected by admin.",
        status: "rejected"
      });
      return;
    }

    try {
      await updateDoc(doc(db, "airdrop_claims", claimId), { status: "Rejected", reviewedAt, adminNotes: "Rejected by admin." });
      setAdminAirdropClaims(prev => prev.map(c => c.id === claimId ? { ...c, status: "Rejected", reviewedAt, adminNotes: "Rejected by admin." } : c));
      handleLog("Airdrop Claim Rejected", `Rejected claim ${claimId} for ${claim.userEmail}.`, user.email || "admin", "warning");
      addNotification(`Airdrop claim ${claimId} rejected.`, { title: "Airdrop rejected", type: "warning", eventKey: `admin:airdrop:rejected:${claimId}` });
      addNotification(`Your ${claim.token} airdrop claim was rejected.`, { title: "Airdrop rejected", type: "error", recipientEmail: claim.userEmail, eventKey: `airdrop:rejected:${claimId}`, action: { label: "View airdrops", view: "dashboard-airdrops" } });
      dispatchTransactionalEmail(claim.userEmail, "AIRDROP_CLAIM_REJECTED", `airdrop:rejected:${claimId}`, {
        name: claim.userName || claim.userEmail.split("@")[0],
        campaignTitle: claim.campaignTitle || campaign?.title,
        token: claim.token,
        rewardAmount: claim.rewardAmount,
        claimId,
        reason: "Rejected by admin.",
        status: "rejected"
      });
    } catch (e) {
      console.error("Error rejecting airdrop claim:", e);
    }
  };

  const adminCreateAirdrop = async (airdrop: Omit<Airdrop, "id">) => {
    const newAirdrop = buildAirdrop(airdrop);
    if (USE_MOCK_DATA) {
      saveMockAirdrop(newAirdrop);
      setAirdrops(getMockAirdrops());
      handleLog("Airdrop Campaign Created", `Created mock campaign ${newAirdrop.title}.`, user.email || "admin", "success");
      addNotification("Mock airdrop campaign created in this app instance.");
      return;
    }

    await setDoc(doc(db, "airdrops", newAirdrop.id), newAirdrop);
    handleLog("Airdrop Campaign Created", `Created campaign ${newAirdrop.title}.`, user.email || "admin", "success");
    addNotification("Airdrop campaign created successfully.");
  };

  const adminUpdateAirdrop = async (airdrop: Airdrop) => {
    const updated = normalizeAirdrop(airdrop, airdrop.id);
    if (USE_MOCK_DATA) {
      saveMockAirdrop(updated);
      setAirdrops(getMockAirdrops());
      handleLog("Airdrop Campaign Updated", `Updated mock campaign ${updated.title}.`, user.email || "admin", "warning");
      addNotification("Mock airdrop campaign updated in this app instance.");
      return;
    }

    await updateDoc(doc(db, "airdrops", updated.id), { ...updated });
    handleLog("Airdrop Campaign Updated", `Updated campaign ${updated.title}.`, user.email || "admin", "warning");
    addNotification("Airdrop campaign updated successfully.");
  };

  const adminDeleteAirdrop = async (airdropId: string) => {
    if (USE_MOCK_DATA) {
      deleteMockAirdrop(airdropId);
      setAirdrops(getMockAirdrops());
      handleLog("Airdrop Campaign Deleted", `Deleted mock campaign ${airdropId}.`, user.email || "admin", "alert");
      addNotification("Mock airdrop campaign deleted in this app instance.");
      return;
    }

    await deleteDoc(doc(db, "airdrops", airdropId));
    handleLog("Airdrop Campaign Deleted", `Deleted campaign ${airdropId}.`, user.email || "admin", "alert");
    addNotification("Airdrop campaign deleted successfully.");
  };

  const claimAirdrop = async (airdropId: string, token?: string, rewardAmount?: string) => {
    if (!user.email) return;
    const campaign = airdrops.find(item => item.id === airdropId);
    if (!campaign) {
      addNotification("This airdrop campaign is no longer available.");
      return;
    }
    if (!isAirdropActive(campaign)) {
      addNotification("This airdrop campaign is not active.");
      return;
    }
    if (findUserCampaignClaim(adminAirdropClaims, user.email, airdropId)) {
      addNotification("You already submitted a claim for this campaign.");
      return;
    }
    if (hasReachedClaimLimit(campaign, adminAirdropClaims)) {
      addNotification("This airdrop campaign has reached its claim limit.");
      return;
    }

    const newClaim = buildAirdropClaim(
      user.email,
      airdropId,
      token || campaign.token,
      rewardAmount || campaign.rewardAmount,
      campaign.title,
      user.name
    );

    if (USE_MOCK_DATA) {
      saveMockAirdropClaim(newClaim);
      setAdminAirdropClaims(getMockAirdropClaims());
      addNotification("Your airdrop claim has been submitted for admin approval.", { title: "Airdrop claim submitted", type: "info", eventKey: `airdrop:submitted:${newClaim.id}`, action: { label: "View airdrops", view: "dashboard-airdrops" } });
      notifyAdmins(`${user.email || "A user"} submitted an airdrop claim for ${newClaim.token}.`, { title: "Airdrop claim requires review", type: "warning", eventKey: `airdrop:review:${newClaim.id}`, action: { label: "Review airdrops", view: "dashboard-admin" } });
      return;
    }

    await setDoc(doc(db, "airdrop_claims", newClaim.id), newClaim);
    addNotification("Your airdrop claim has been submitted for admin approval.", { title: "Airdrop claim submitted", type: "info", eventKey: `airdrop:submitted:${newClaim.id}`, action: { label: "View airdrops", view: "dashboard-airdrops" } });
      notifyAdmins(`${user.email || "A user"} submitted an airdrop claim for ${newClaim.token}.`, { title: "Airdrop claim requires review", type: "warning", eventKey: `airdrop:review:${newClaim.id}`, action: { label: "Review airdrops", view: "dashboard-admin" } });
  };
  const withdrawEarnings = () => {
    if (!user.points || user.points < 100) return;
    const usdAmount = user.points * 1; 
    setUser(prev => ({
      ...prev,
      balance: prev.balance + usdAmount,
      points: 0
    }));
    addNotification(`Withdrew $${usdAmount.toFixed(2)} to wallet.`);
  };

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem("orbitrio_notifications");
    const fallback = [
      buildNotification("Welcome to Orbitrio Crypto Hub! Verify security rules inside setting pane.", {
        id: "not-1",
        title: "Welcome to Orbitrio",
        type: "success"
      })
    ];
    const parsed = saved ? safeParse<Array<Partial<NotificationItem> & { id?: string }>>(saved, fallback) : fallback;
    return sortNotifications(parsed.map(item => normalizeNotification(item, item.id)));
  });
  const unreadNotificationsCount = notifications.filter(item => !item.read).length;

  const [marketCrypto, setMarketCrypto] = useState<MarketAsset[]>([]);
  const [marketStocks, setMarketStocks] = useState<MarketAsset[]>([]);
  const [traders, setTraders] = useState<TraderProfile[]>(() => getMockTraders(INITIAL_TRADERS));
  const [isLoadingMarkets, setIsLoadingMarkets] = useState<boolean>(true);

  // Frontend development reads traders from the shared in-app mock store. Firebase sync is only used when mock data is disabled.
  useEffect(() => {
    if (USE_MOCK_DATA) {
      setTraders(getMockTraders(INITIAL_TRADERS));
      return;
    }

    const tradersCol = collection(db, "traders");
    const unsubscribe = onSnapshot(tradersCol, (snapshot) => {
      if (snapshot.empty) {
        if (user.isAdmin) {
          // Seed default traders to the database in background
          INITIAL_TRADERS.forEach(async (trader) => {
            try {
              await setDoc(doc(db, "traders", trader.id), trader);
            } catch (e) {
              console.error("Error seeding trader: ", e);
            }
          });
        }
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
  }, [authReady, user.isAdmin]);

  // Frontend development reads deposit wallets from the shared in-app mock store. Firebase sync is only used when mock data is disabled.
  useEffect(() => {
    if (USE_MOCK_DATA) {
      const loaded = getMockDepositWallets(depositWallets);
      setDepositWallets(loaded);
      setAdminWallets(mapDepositWalletsToAddressBook(loaded));
      return;
    }

    if (!authReady || !user.isLoggedIn) {
      setDepositWallets([]);
      setAdminWallets({});
      return;
    }

    const walletsCol = collection(db, "depositWallets");
    const unsubscribe = onSnapshot(walletsCol, (snapshot) => {
      const loaded: DepositWallet[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push(normalizeDepositWallet(docSnap.id, docSnap.data() as Partial<DepositWallet>));
      });
      setDepositWallets(loaded);
      setAdminWallets(mapDepositWalletsToAddressBook(loaded));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "depositWallets");
    });
    return () => unsubscribe();
  }, [authReady, user.isLoggedIn]);

  // Synchronically listen to all registered users from Firestore
  useEffect(() => {
    if (!authReady || !user.isAdmin) {
      setAdminUsers([]);
      return;
    }

    const usersCol = collection(db, "users");
    const unsubscribe = onSnapshot(usersCol, (snapshot) => {
      if (snapshot.empty && localDev) {
        (async () => {
          try {
            for (const u of INITIAL_MOCK_USERS) {
              await setDoc(doc(db, "users", u.email), {
                name: u.name,
                balance: u.balance,
                portfolioValue: u.portfolioValue,
                status: u.status,
                activeInvestments: u.activeInvestments,
                copyTrades: u.copyTrades || [],
                portfolio: u.portfolio,
                transactions: normalizeLedgerTransactions(u.transactions, u.email, u.name),
                tickets: u.tickets,
                loginHistory: u.loginHistory,
                registrationDate: u.registrationDate || u.loginHistory[0]?.date || new Date().toISOString(),
                role: isAdminEmail(u.email) ? "admin" : "user",
                username: u.email.split("@")[0],
              });
            }
          } catch (seedErr) {
            console.error("Error seeding mock users:", seedErr);
          }
        })();

        setAdminUsers(INITIAL_MOCK_USERS);
        return;
      }

      const loaded: SimulatedUser[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loaded.push({
          email: docSnap.id,
          name: data.name || docSnap.id.split("@")[0].toUpperCase(),
          balance: typeof data.balance === "number" ? data.balance : 1000.0,
          portfolioValue: typeof data.portfolioValue === "number" ? data.portfolioValue : 0.0,
          status: data.status || "active",
          activeInvestments: Array.isArray(data.activeInvestments) ? data.activeInvestments : [],
          copyTrades: Array.isArray(data.copyTrades) ? data.copyTrades : [],
          portfolio: Array.isArray(data.portfolio) ? data.portfolio : [],
          transactions: normalizeLedgerTransactions(Array.isArray(data.transactions) ? data.transactions : [], docSnap.id, data.name),
          tickets: Array.isArray(data.tickets) ? data.tickets : [],
          loginHistory: Array.isArray(data.loginHistory) ? data.loginHistory : [],
          registrationDate: data.registrationDate || data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || data.loginHistory?.[0]?.date,
          role: isAdminEmail(docSnap.id) ? "admin" : (data.role || "user"),
          kyc: data.kyc,
          connectedWalletName: data.connectedWalletName,
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          gender: data.gender,
          phone: data.phone,
          accountType: data.accountType,
          country: data.country,
          currency: data.currency,
          readAnnouncementIds: Array.isArray(data.readAnnouncementIds) ? data.readAnnouncementIds : []
        } as SimulatedUser);
      });
      setAdminUsers(loaded);
    }, (error) => {
      console.error("Firestore user sync error: ", error);
    });
    return () => unsubscribe();
  }, [authReady, user.isAdmin]);

  const lastSyncedRef = useRef<string>("");
  const lastTickSyncRef = useRef<number>(0);

  // Synchronize local caches and Firestore user profiles
  useEffect(() => {
    localStorage.setItem("orbitrio_user", JSON.stringify(user));

    if (!user.isLoggedIn || !user.email) return;

    const firebaseUser = auth.currentUser;
    if (!firebaseUser || firebaseUser.email !== user.email) return;

    const meaningfulSnapshot = JSON.stringify({
      balance: user.balance,
      transactions: user.transactions,
      tickets: user.tickets,
      status: user.status,
      role: user.role,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      gender: user.gender,
      phone: user.phone,
      accountType: user.accountType,
      country: user.country,
      currency: user.currency,
      readAnnouncementIds: user.readAnnouncementIds,
      portfolio: user.portfolio,
      kyc: user.kyc,
      connectedWalletName: user.connectedWalletName,
      activeInvestments: user.activeInvestments,
      copyTrades: user.copyTrades
    });

    const now = Date.now();
    const meaningfulChanged = meaningfulSnapshot !== lastSyncedRef.current;
    const tickIntervalPassed = now - lastTickSyncRef.current > 60000;

    if (!meaningfulChanged && !tickIntervalPassed) return;

    const fieldsToUpdate = {
      name: user.name,
      balance: user.balance,
      portfolioValue: user.portfolioValue,
      activeInvestments: user.activeInvestments,
      copyTrades: user.copyTrades,
      portfolio: user.portfolio,
      transactions: user.transactions,
      tickets: user.tickets,
      username: user.username || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      gender: user.gender || "",
      phone: user.phone || "",
      accountType: user.accountType || "",
      country: user.country || "",
      currency: user.currency || "",
      readAnnouncementIds: user.readAnnouncementIds || []
    };

    const userDocRef = doc(db, "users", user.email);
    setDoc(userDocRef, fieldsToUpdate, { merge: true })
      .then(() => {
        lastSyncedRef.current = meaningfulSnapshot;
        lastTickSyncRef.current = now;
      })
      .catch(err => {
        console.error("Failed to sync state to Firestore:", err);
      });
  }, [user]);

  // Synchronize Firebase Auth state to restore logged session after page refresh
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser?.email) {
        const userEmail = firebaseUser.email;
        const docRef = doc(db, "users", userEmail);
        
        try {
          const userSnap = await getDoc(docRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setUser({
              isLoggedIn: true,
              email: userEmail,
              name: data.name || (firebaseUser.displayName || userEmail.split("@")[0]).toUpperCase(),
              balance: typeof data.balance === "number" ? data.balance : 0.00,
              portfolioValue: typeof data.portfolioValue === "number" ? data.portfolioValue : 0.00,
              activeInvestments: Array.isArray(data.activeInvestments) ? data.activeInvestments : [],
              copyTrades: Array.isArray(data.copyTrades) ? data.copyTrades : [],
              portfolio: Array.isArray(data.portfolio) ? data.portfolio : [],
              transactions: normalizeLedgerTransactions(Array.isArray(data.transactions) ? data.transactions : [], userEmail, data.name),
              tickets: Array.isArray(data.tickets) ? data.tickets : [],
              status: data.status || "active",
              role: data.isAdmin === true || isAdminEmail(userEmail) ? "admin" : (data.role || "user"),
              isAdmin: data.isAdmin === true || isAdminEmail(userEmail),
              username: data.username || userEmail.split("@")[0],
              firstName: data.firstName || firebaseUser.displayName?.split(" ")[0] || "Trader",
              lastName: data.lastName || firebaseUser.displayName?.split(" ").slice(1).join(" ") || "Admin",
              gender: data.gender || "Male",
              phone: data.phone || "",
              accountType: data.accountType || "Bronze",
              country: data.country || "United States",
              currency: data.currency || "USD",
              readAnnouncementIds: Array.isArray(data.readAnnouncementIds) ? data.readAnnouncementIds : []
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
              copyTrades: [],
              portfolio: [],
              transactions: [],
              tickets: [],
              loginHistory: [{ date: new Date().toISOString().replace("T", " ").substring(0, 19), ip: "127.0.0.1", device: "Google Auth Session" }],
              role: isAdminEmail(userEmail) ? ("admin" as const) : ("user" as const),
              username: firebaseUser.displayName?.replace(/\s+/g, "").toLowerCase() || userEmail.split("@")[0],
              firstName: firebaseUser.displayName?.split(" ")[0] || "Trader",
              lastName: firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
              gender: "Male" as const,
              phone: "",
              accountType: "Bronze",
              country: "United States",
              currency: "USD",
              readAnnouncementIds: []
            };
            await setDoc(docRef, initialUser);
            
            setUser({
              isLoggedIn: true,
              ...initialUser
            });
            
            addNotification(`Profile created successfully for ${initialName}!`);
          }
        } catch (err) {
          console.error("Error setting up user from Firestore: ", err);
        } finally {
          setAuthReady(true);
        }
      } else {
        setUser(createSignedOutUser());
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem("orbitrio_plans_v3", JSON.stringify(plans));
  }, []);

  useEffect(() => {
    localStorage.setItem("orbitrio_admin_wallets", JSON.stringify(adminWallets));
  }, [adminWallets]);

  useEffect(() => {
    localStorage.setItem("orbitrio_deposit_wallets", JSON.stringify(depositWallets));
  }, [depositWallets]);

  useEffect(() => {
    localStorage.setItem("orbitrio_announcements", JSON.stringify(adminAnnouncements));
  }, [adminAnnouncements]);

  useEffect(() => {
    localStorage.setItem("orbitrio_audit_logs", JSON.stringify(adminAuditLogs));
  }, [adminAuditLogs]);

  useEffect(() => {
    localStorage.setItem("orbitrio_notifications", JSON.stringify(notifications));
  }, [notifications]);
  useEffect(() => {
    if (!authReady || !user.isLoggedIn || !user.email) {
      setNotifications([]);
      return;
    }

    if (USE_MOCK_DATA) {
      setNotifications(prev => sortNotifications(prev.map(item => ({
        ...normalizeNotification(item, item.id),
        time: formatRelativeTimestamp(item.timestamp)
      }))));
      return;
    }

    const unsubscribe = watchNotifications(user.email, setNotifications, error => {
      console.error("Notification sync error:", error);
    });
    return () => unsubscribe();
  }, [authReady, user.isLoggedIn, user.email]);

  useEffect(() => {
    localStorage.setItem("orbitrio_airdrops", JSON.stringify(airdrops));
  }, [airdrops]);

  // Load Markets Data
  const loadMarketsData = async () => {
    try {
      const res = await fetch("/api/markets");
      if (res.ok) {
        const data = await res.json();
        const processedCrypto = data.crypto.map((c: any) => ({
          ...c,
          sparkline: Array.from({ length: 12 }, () => c.price * (1 + (Math.random() * 0.04 - 0.02)))
        }));
        const processedStocks = data.stocks.map((s: any) => ({
          ...s,
          sparkline: Array.from({ length: 12 }, () => s.price * (1 + (Math.random() * 0.02 - 0.01)))
        }));
        setMarketCrypto(processedCrypto);
        setMarketStocks(processedStocks);
      } else {
        throw new Error("API failed");
      }
    } catch (e) {
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
        { symbol: "FIDA/USD", name: "Bonfida", price: 0.28, change: 0.95, high: 0.30, low: 0.26, volume: "15M", sparkline: [0.27, 0.275, 0.28] },
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

  // Sync live portfolio marks and timestamp-based investment maturity.
  useEffect(() => {
    setUser(prev => {
      if (!prev.isLoggedIn) return prev;

      let totalAssetVal = 0;
      const updatedPort = prev.portfolio.map(holding => {
        const matchingLive = [...marketCrypto, ...marketStocks].find(
          m => m.symbol.split("/")[0] === holding.symbol
        );
        if (matchingLive) {
          totalAssetVal += holding.amount * matchingLive.price;
          return { ...holding, currentPrice: matchingLive.price };
        }
        return holding;
      });

      const settlement = settleMaturedInvestments(prev.activeInvestments, plans, prev.email);
      const copySettlement = settleMaturedCopyTrades(prev.copyTrades, prev.email);
      const settledTransactions = [...copySettlement.transactions, ...settlement.transactions];

      return {
        ...prev,
        balance: +(prev.balance + settlement.payoutAmount + copySettlement.payoutAmount).toFixed(2),
        portfolio: updatedPort,
        activeInvestments: settlement.investments,
        copyTrades: copySettlement.trades,
        transactions: settledTransactions.length
          ? [...settledTransactions, ...prev.transactions]
          : prev.transactions,
        portfolioValue: +totalAssetVal.toFixed(2)
      };
    });
  }, [marketCrypto, marketStocks, plans]);

  useEffect(() => {
    if (!user.isLoggedIn || !user.email) return;

    user.activeInvestments
      .filter(investment => (investment.status === "Completed" || investment.status === "completed") && investment.payoutTransactionId)
      .forEach(investment => {
        addNotification(`${investment.name} completed and funds were credited to your wallet.`, {
          title: "Investment completed",
          type: "success",
          eventKey: `investment:completed:${investment.id}`,
          action: { label: "View portfolio", view: "dashboard-portfolio" }
        });
        dispatchTransactionalEmail(user.email, "INVESTMENT_COMPLETED", `investment:completed:${investment.id}`, {
          name: user.name,
          investmentName: investment.name,
          payoutAmount: investment.totalReturn || investment.amount + investment.accumulatedProfit,
          profit: investment.expectedProfit ?? investment.accumulatedProfit,
          transactionId: investment.payoutTransactionId,
          status: "completed"
        });
      });

    user.copyTrades
      .filter(trade => trade.status === "Completed" && trade.payoutCompleted)
      .forEach(trade => {
        addNotification(`Copy trade with ${trade.traderName} completed and returns were credited.`, {
          title: "Copy trade completed",
          type: "success",
          eventKey: `copy:completed:${trade.id}`,
          action: { label: "View copy trading", view: "copy-trading" }
        });
        dispatchTransactionalEmail(user.email, "COPY_TRADE_COMPLETED", `copy:completed:${trade.id}`, {
          name: user.name,
          traderName: trade.traderName,
          payoutAmount: trade.totalReturn,
          profit: trade.expectedProfit,
          transactionId: trade.payoutTransactionId,
          status: "completed"
        });
      });
  }, [user.activeInvestments, user.copyTrades, user.email, user.isLoggedIn]);

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
    if (additionalData?.password) {
      await createUserWithEmailAndPassword(auth, email, additionalData.password);
    }

    const newUserDoc = buildRegistrationUserDoc(name, email, additionalData);

    // Save user doc to Firestore
    await setDoc(doc(db, "users", email), newUserDoc);
    dispatchTransactionalEmail(email, "WELCOME", `auth:welcome:${email.toLowerCase()}`, { name, email });

    setUser({
      isLoggedIn: true,
      ...newUserDoc
    });

    // Save into Simulated database
    setAdminUsers(prev => {
      if (prev.some(u => u.email.toLowerCase() === email.toLowerCase())) return prev;
      return [...prev, buildSimulatedUserFromRegistration(name, email, additionalData)];
    });

    handleLog("Registration Security Checkout", `User registered: ${email} with sandbox assets. Selected account type: ${additionalData?.accountType || 'None'}`, email, "success");
    addNotification(`Welcome ${name.toUpperCase()}! Your account index is online.`, { title: "Welcome to Orbitrio", type: "success", recipientEmail: email, eventKey: `auth:welcome:${email.toLowerCase()}`, action: { label: "Open dashboard", view: "dashboard" } });
  };

  const login = async (email: string, password?: string) => {
    const isMock = ["john.wealth@outlook.com", "sarah.crypto@gmail.com", "banned.scammer@gmail.com"].includes(email.toLowerCase());
    
    if (isMock) {
      const isOwner = email.toLowerCase() === "henrikaram1@gmail.com";
      const match = adminUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

      const userObj: UserState = {
        isLoggedIn: true,
        email,
        name: match ? match.name : email.split("@")[0].toUpperCase(),
        balance: match ? match.balance : 1500.00,
        portfolioValue: match ? match.portfolioValue : 0.00,
        activeInvestments: match ? match.activeInvestments : [],
        copyTrades: match?.copyTrades || [],
        portfolio: match ? match.portfolio : [],
        transactions: match ? normalizeLedgerTransactions(match.transactions, match.email, match.name) : [],
        tickets: match ? match.tickets : [],
        status: match ? match.status : "active",
        role: isOwner ? "admin" : "user",
        username: match?.username,
        firstName: match?.firstName,
        lastName: match?.lastName,
        gender: match?.gender,
        phone: match?.phone,
        accountType: match?.accountType,
        country: match?.country,
        currency: match?.currency,
        readAnnouncementIds: match?.readAnnouncementIds || [],
      };

      setUser(userObj);
      handleLog("Account Access Authenticated", `Login verified.`, email, "success");
      addNotification(`Authenticated logged session: ${userObj.name}`);
      
      try {
        const userDocRef = doc(db, "users", email);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.data();

        if (userData && userData.lastLoginDevice && userData.lastLoginDevice !== navigator.userAgent) {
          sendSecurityAlert(email, {
            time: new Date().toUTCString(),
            device: navigator.userAgent
          });
        }
        await updateDoc(userDocRef, { lastLoginDevice: navigator.userAgent });
      } catch (e) {
        console.error("Error checking device for security alert:", e);
      }
      return;
    }

    if (password) {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      // Passwordless mock login fallback for platform testing
      const docRef = doc(db, "users", email);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setUser({
          isLoggedIn: true,
          email,
          name: data.name || email.split("@")[0].toUpperCase(),
          balance: data.balance ?? 0.00,
          portfolioValue: data.portfolioValue ?? 0.00,
          activeInvestments: data.activeInvestments ?? [],
          copyTrades: data.copyTrades ?? [],
          portfolio: data.portfolio ?? [],
          transactions: normalizeLedgerTransactions(data.transactions ?? [], email, data.name),
          tickets: data.tickets ?? [],
          status: data.status ?? "active",
          role: data.role ?? (email.toLowerCase() === "henrikaram1@gmail.com" ? "admin" : "user"),
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          gender: data.gender,
          phone: data.phone,
          accountType: data.accountType,
          country: data.country,
          currency: data.currency,
          readAnnouncementIds: Array.isArray(data.readAnnouncementIds) ? data.readAnnouncementIds : []
        });
      } else {
        throw new Error("No database user found matching this email. Please register first.");
      }
    }
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const sendPasswordReset = async (email: string) => {
    const result = await sendPasswordResetRequestEmail(email, {
      ...emailSettingsMetadata(),
      name: adminUsers.find(item => item.email.toLowerCase() === email.toLowerCase())?.name || email.split("@")[0]
    });

    if (result?.success === false) {
      throw new Error(result.error || "Password reset email could not be sent.");
    }

    handleLog("Security Recovery Requested", "Password reset dispatch succeeded.", email, "success");
  };

  const logout = async () => {
    if (user.email) {
      handleLog("Access Token Cleared", "Signed out successfully.", user.email, "success");
    }
    await signOut(auth);
    setUser(createSignedOutUser());
  };

  const deposit = (amount: number, currency: string, txHash?: string, proofFile?: string): boolean => {
    if (amount <= 0) return false;
    const { transaction: newTx } = buildDepositTransaction(amount, currency, user.email, adminWallets, txHash, proofFile);
    const statusType = newTx.status;

    setUser(prev => ({
      ...prev,
      balance: statusType === "completed" ? +(prev.balance + amount).toFixed(2) : prev.balance,
      transactions: [newTx, ...prev.transactions]
    }));

    handleLog("Asset Deposit Action", `Recharged requested: $${amount} ${currency}. Status: ${statusType}`, user.email || "system", "success");
    addNotification(`Your ${currency} deposit of ${amount} has been submitted for review.`, { title: "Deposit submitted", type: statusType === "completed" ? "success" : "info", eventKey: `deposit:submitted:${newTx.id}`, action: { label: "View wallet", view: "dashboard-wallet" } });
    dispatchTransactionalEmail(user.email, statusType === "completed" ? "DEPOSIT_APPROVED" : "DEPOSIT_SUBMITTED", `deposit:${statusType === "completed" ? "approved" : "submitted"}:${newTx.id}`, { name: user.name, amount, asset: currency, txHash: newTx.txHash, transactionId: newTx.id, status: statusType });
    if (statusType !== "completed") {
      notifyAdmins(`${user.email || "A user"} submitted a ${currency} deposit of ${amount} for review.`, { title: "Deposit requires review", type: "warning", eventKey: `deposit:review:${newTx.id}`, action: { label: "Review deposits", view: "dashboard-admin" } });
    }

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

    const displayAddress = formatWithdrawalAddress(currency, address, destinationTag, bankDetails, paypalEmail);
    const newTx = buildWithdrawalTransaction(amount, currency, user.email, displayAddress, destinationTag, bankDetails, paypalEmail);

    setUser(prev => ({
      ...prev,
      balance: +(prev.balance - amount).toFixed(2),
      transactions: [newTx, ...prev.transactions]
    }));

    handleLog("Asset Withdrawal Action", `Requested payout of $${amount} ${currency} to ${displayAddress}. Queued for Admin.`, user.email || "system", "warning");
    addNotification(`Your withdrawal request of $${amount} ${currency} has been submitted for review.`, { title: "Withdrawal submitted", type: "info", eventKey: `withdrawal:submitted:${newTx.id}`, action: { label: "View wallet", view: "dashboard-wallet" } });
    dispatchTransactionalEmail(user.email, "WITHDRAWAL_SUBMITTED", `withdrawal:submitted:${newTx.id}`, { name: user.name, amount, asset: currency, destination: displayAddress, walletAddress: displayAddress, transactionId: newTx.id, status: newTx.status });
    notifyAdmins(`${user.email || "A user"} submitted a withdrawal request of $${amount} ${currency}.`, { title: "Withdrawal requires review", type: "warning", eventKey: `withdrawal:review:${newTx.id}`, action: { label: "Review withdrawals", view: "dashboard-admin" } });
    
    return { success: true, message: `Payout request queued. Balance deducted. Pending Admin Approval.` };
  };

  const investInPlan = (planId: string, amount: number): { success: boolean; message: string } => {
    const selectedPlan = plans.find(p => p.id === planId);
    if (!selectedPlan) return { success: false, message: "Selected plan not recognized." };
    if (!selectedPlan.enabled || selectedPlan.status !== "active") return { success: false, message: "This yield program is temporarily locked by platform admin nodes." };

    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, message: "Please specify a valid numeric capital amount." };
    }
    if (amount < selectedPlan.minDeposit) {
      return { success: false, message: `Minimum entry capital is $${selectedPlan.minDeposit}.` };
    }
    if (amount > selectedPlan.maxDeposit) {
      return { success: false, message: `Maximum entry cap is $${selectedPlan.maxDeposit}.` };
    }
    if (user.balance < amount) {
      setInsufficientBalanceOpen(true);
      return { success: false, message: "INSUFFICIENT_BALANCE" };
    }

    const newActive = buildActiveInvestment(selectedPlan, amount);
    const investmentTx = buildInvestmentTransaction(amount, selectedPlan.name, user.email, newActive.id);

    setUser(prev => ({
      ...prev,
      balance: +(prev.balance - amount).toFixed(2),
      activeInvestments: [newActive, ...prev.activeInvestments],
      transactions: [investmentTx, ...prev.transactions]
    }));

    handleLog("Compound Allocation Enrolled", `Subscribed to ${selectedPlan.name} worth $${amount}.`, user.email || "system", "success");
    addNotification(`Your $${amount} allocation to ${selectedPlan.name} is now running.`, { title: "Investment started", type: "success", eventKey: `investment:started:${newActive.id}`, action: { label: "View portfolio", view: "dashboard-portfolio" } });
    dispatchTransactionalEmail(user.email, "INVESTMENT_STARTED", `investment:started:${newActive.id}`, { name: user.name, amount, planName: selectedPlan.name, investmentName: newActive.name, totalReturn: newActive.totalReturn, endDate: newActive.endDate, transactionId: investmentTx.id });
    
    return { success: true, message: `Investment started. Total return at maturity: $${newActive.totalReturn.toLocaleString()}.` };
  };

  const claimPlanPayout = (investmentId: string) => {
    const item = user.activeInvestments.find(inv => inv.id === investmentId);
    if (!item) return;

    const settlement = settleMaturedInvestments([item], plans, user.email);
    if (!settlement.transactions.length) return;

    setUser(prev => ({
      ...prev,
      balance: +(prev.balance + settlement.payoutAmount).toFixed(2),
      activeInvestments: prev.activeInvestments.map(inv =>
        inv.id === investmentId ? settlement.investments[0] : inv
      ),
      transactions: [...settlement.transactions, ...prev.transactions]
    }));

    handleLog("Investment Settled", `Recovered contract capital with profit. Paid $${settlement.payoutAmount.toFixed(2)}`, user.email || "system", "success");
    addNotification(`Your investment matured and $${settlement.payoutAmount.toFixed(2)} was credited to your wallet.`, { title: "Investment completed", type: "success", eventKey: `investment:completed:${investmentId}`, action: { label: "View portfolio", view: "dashboard-portfolio" } });
    dispatchTransactionalEmail(user.email, "INVESTMENT_COMPLETED", `investment:completed:${investmentId}`, { name: user.name, investmentName: item.name, payoutAmount: settlement.payoutAmount, profit: Math.max(0, settlement.payoutAmount - item.amount), transactionId: settlement.transactions[0]?.id });
  };

  const topUpInvestment = (investmentId: string, amount: number): { success: boolean; message: string } => {
    if (!user.isLoggedIn || !user.email) {
      return { success: false, message: "AUTH_REQUIRED" };
    }
    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: "Please enter a valid amount." };
    }
    if (user.balance < amount) {
      return { success: false, message: "INSUFFICIENT_BALANCE" };
    }

    const investment = user.activeInvestments.find(inv => inv.id === investmentId);
    if (!investment) {
      return { success: false, message: "Investment not found." };
    }
    if (investment.status === "Completed" || investment.status === "completed" || investment.payoutTransactionId) {
      return { success: false, message: "Completed investments cannot be topped up." };
    }

    const plan = plans.find(item => item.id === investment.planId);
    const roiPercent = investment.roiPercent ?? plan?.roiPercent ?? 0;
    const nextAmount = +(investment.amount + amount).toFixed(2);
    const expectedProfit = +(nextAmount * (roiPercent / 100)).toFixed(2);
    const updatedInvestment = {
      ...investment,
      amount: nextAmount,
      roiPercent,
      expectedProfit,
      totalReturn: +(nextAmount + expectedProfit).toFixed(2),
      accumulatedProfit: 0,
      progress: 0,
      remainingDays: investment.remainingDays,
      status: "Running" as const
    };

    const topUpTx = buildTopUpTransaction(amount, investment.name, user.email, investmentId);

    setUser(prev => ({
      ...prev,
      balance: +(prev.balance - amount).toFixed(2),
      activeInvestments: prev.activeInvestments.map(inv => inv.id === investmentId ? updatedInvestment : inv),
      transactions: [topUpTx, ...prev.transactions]
    }));

    addNotification(`Added $${amount.toFixed(2)} to ${investment.name}.`);
    return { success: true, message: "Top-up completed successfully." };
  };

  const copyTrader = (traderId: string, amount: number): { success: boolean; message: string } => {
    if (!user.isLoggedIn || !user.email) {
      return { success: false, message: "AUTH_REQUIRED" };
    }

    const copyAmount = Number(amount);
    if (!Number.isFinite(copyAmount) || copyAmount <= 0) {
      return { success: false, message: "Please enter a valid amount." };
    }

    const t = traders.find(tr => tr.id === traderId);
    if (!t) return { success: false, message: "Trader not recognized on system node." };
    if ((t.active ?? true) === false) {
      return { success: false, message: "This trader is not accepting copy allocations right now." };
    }
    if (t.followers >= t.maxFollowers) {
      return { success: false, message: "Trader copying limit capped on active pools." };
    }

    const minCopyAmount = typeof t.minimumCopyAmount === "number" && Number.isFinite(t.minimumCopyAmount) ? t.minimumCopyAmount : 10;
    const maxCopyAmount = typeof t.maximumCopyAmount === "number" && Number.isFinite(t.maximumCopyAmount) ? t.maximumCopyAmount : Number.POSITIVE_INFINITY;

    if (copyAmount < minCopyAmount) {
      return { success: false, message: `Minimum copy amount for ${t.name} is $${minCopyAmount.toLocaleString()}.` };
    }
    if (copyAmount > maxCopyAmount) {
      return { success: false, message: `Maximum copy amount for ${t.name} is $${maxCopyAmount.toLocaleString()}.` };
    }
    if (user.balance < copyAmount) {
      setInsufficientBalanceOpen(true);
      return { success: false, message: "INSUFFICIENT_BALANCE" };
    }

    const newCopyTrade = buildCopyTrade(t, copyAmount, user.email);
    const newTx = buildCopyTransaction(copyAmount, t.name, user.email, newCopyTrade.id);

    setUser(prev => ({
      ...prev,
      balance: +(prev.balance - copyAmount).toFixed(2),
      copyTrades: [newCopyTrade, ...prev.copyTrades],
      transactions: [newTx, ...prev.transactions]
    }));

    if (!USE_MOCK_DATA) {
      setDoc(doc(db, "copyTrades", newCopyTrade.id), {
        ...newCopyTrade,
        uid: user.email
      }).catch(e => {
        console.error("Firestore error saving copy trade record: ", e);
      });
    }

    setTraders(prev => incrementTraderFollowers(prev, traderId));

    handleLog("Mirror Allocator Armed", `Allocated $${copyAmount} to copy ${t.name}.`, user.email, "success");
    addNotification(`Copy trade with ${t.name} started. Total return at maturity: $${newCopyTrade.totalReturn.toLocaleString()}.`, { title: "Copy trade started", type: "success", eventKey: `copy:started:${newCopyTrade.id}`, action: { label: "View copy trading", view: "copy-trading" } });
    dispatchTransactionalEmail(user.email, "COPY_TRADE_STARTED", `copy:started:${newCopyTrade.id}`, { name: user.name, traderName: t.name, amount: copyAmount, allocation: copyAmount, totalReturn: newCopyTrade.totalReturn, transactionId: newTx.id });
    return { success: true, message: "Copy Trading Activated. You are now copying this trader." };
  };

  const uncopyTrader = (traderId: string): { success: boolean; message: string } => {
    if (!user.isLoggedIn || !user.email) {
       return { success: false, message: "Authentication required." };
    }

    const activeTrade = user.copyTrades.find(trade => trade.traderId === traderId && trade.status === "Running" && !trade.payoutCompleted);
    if (!activeTrade) {
      return { success: false, message: "No running copy trade found for this trader." };
    }

    const refundAmount = activeTrade.amountInvested;
    const returnTx = buildUncopyTransaction(refundAmount, user.email, activeTrade.id);

    setUser(prev => ({
      ...prev,
      balance: +(prev.balance + refundAmount).toFixed(2),
      copyTrades: prev.copyTrades.map(trade =>
        trade.id === activeTrade.id
          ? { ...trade, status: "Cancelled", remainingDays: 0, progress: 100, payoutCompleted: true, completedAt: new Date().toISOString() }
          : trade
      ),
      transactions: [returnTx, ...prev.transactions]
    }));

    if (!USE_MOCK_DATA) {
      deleteDoc(doc(db, "copyTrades", activeTrade.id)).catch(e => {
        console.error(e);
      });
    }

    setTraders(prev => decrementTraderFollowers(prev, traderId));
    addNotification(`Copy trading was cancelled and $${refundAmount} returned to your wallet balance.`, { title: "Copy trade cancelled", type: "warning", eventKey: `copy:cancelled:${activeTrade.id}`, action: { label: "View copy trading", view: "copy-trading" } });

    return { success: true, message: "Copy Trading Deactivated. Your funds have been released." };
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

        const buyTx = buildTransaction(
          "tx-buy",
          "investment",
          amount,
          symbol.split("/")[0],
          { notes: `Purchased ${quantity} units of ${symbol} at price $${price}`, date: todayStr, userEmail: prev.email || "" },
          { userEmail: prev.email, userName: prev.name },
          { relatedReferenceId: symbol }
        );

        return {
          ...prev,
          balance: +(prev.balance - amount).toFixed(2),
          portfolio: updatedPortfolio,
          transactions: [buyTx, ...prev.transactions]
        };
      });

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

        const sellTx = buildTransaction(
          "tx-sell",
          "payout",
          amount,
          symbol.split("/")[0],
          { notes: `Sold ${quantityToSell} units of ${symbol} at price $${price}`, date: todayStr, userEmail: prev.email || "" },
          { userEmail: prev.email, userName: prev.name },
          { relatedReferenceId: symbol }
        );

        return {
          ...prev,
          balance: +(prev.balance + amount).toFixed(2),
          portfolio: updatedPortfolio,
          transactions: [sellTx, ...prev.transactions]
        };
      });

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

    setUser(prev => ({
      ...prev,
      tickets: [newTkt, ...prev.tickets]
    }));

    handleLog("Support Ticket Created", `Submitted ticket regarding topic: ${subject}`, user.email || "guest@gmail.com", "success");
    
    // Auto simulated response
    setTimeout(() => {
      adminReplyToTicket(newTkt.id, `Dear orbitrio Member, thank you for writing. Dynamic agent node assigned. We are actively auditing your ${category} logs. Please stand by.`);
    }, 4000);
  };

  const replyToTicket = (ticketId: string, text: string) => {
    setUser(prev => ({
      ...prev,
      tickets: prev.tickets.map(tkt => {
        if (tkt.id === ticketId) {
          return {
            ...tkt,
            status: "pending",
            messages: [
              ...tkt.messages,
              {
                sender: "user",
                text,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]
          };
        }
        return tkt;
      })
    }));
  };

  // Helper logger
  const handleLog = (action: string, details: string, email: string, logStatus: "success" | "warning" | "alert") => {
    const auditLog = buildAuditLog(action, details, email, logStatus);
    setAdminAuditLogs(prev => [auditLog, ...prev]);

    if (!USE_MOCK_DATA && (user.role === "admin" || user.isAdmin === true)) {
      setDoc(doc(db, "audit_logs", auditLog.id), auditLog).catch(error => {
        console.error("Error saving audit log:", error);
      });
    }
  };

  const syncNotificationLocally = (notification: NotificationItem) => {
    setNotifications(prev => {
      if (notification.eventKey && prev.some(item => item.eventKey === notification.eventKey && item.recipientEmail === notification.recipientEmail)) {
        return prev;
      }
      if (prev.some(item => item.id === notification.id)) return prev;
      return sortNotifications([notification, ...prev]);
    });
  };

  const shouldShowNotificationLocally = (notification: NotificationItem) => {
    if (!notification.recipientEmail) return true;
    return user.email?.toLowerCase() === notification.recipientEmail.toLowerCase();
  };

  const addNotification = (text: string, options: BuildNotificationOptions = {}) => {
    const recipientEmail = options.recipientEmail || user.email || undefined;
    const notification = buildNotification(text, {
      ...options,
      recipientEmail,
      audience: options.audience || (user.role === "admin" ? "admin" : "user")
    });

    if (shouldShowNotificationLocally(notification)) {
      syncNotificationLocally(notification);
    }

    if (!USE_MOCK_DATA && notification.recipientEmail) {
      saveNotification(notification).catch(error => {
        console.error("Error saving notification:", error);
      });
    }
  };

  const notifyAdmins = (text: string, options: BuildNotificationOptions = {}) => {
    const adminEmails = Array.from(new Set([
      ...adminUsers
        .filter(adminUser => adminUser.role === "admin" || isAdminEmail(adminUser.email))
        .map(adminUser => adminUser.email),
      user.role === "admin" && user.email ? user.email : DEFAULT_ADMIN_NOTIFICATION_EMAIL
    ].filter(Boolean) as string[]));

    adminEmails.forEach(adminEmail => {
      addNotification(text, {
        ...options,
        recipientEmail: adminEmail,
        audience: "admin",
        eventKey: options.eventKey ? `admin:${adminEmail}:${options.eventKey}` : undefined
      });
    });
  };

  const markNotificationRead = async (notificationId: string) => {
    setNotifications(prev => prev.map(item => item.id === notificationId ? { ...item, read: true } : item));
    if (!USE_MOCK_DATA) {
      await markNotificationReadById(notificationId);
    }
  };

  const markAllNotificationsRead = async () => {
    const unreadIds = notifications.filter(item => !item.read).map(item => item.id);
    if (!unreadIds.length) return;
    setNotifications(prev => prev.map(item => ({ ...item, read: true })));
    if (!USE_MOCK_DATA) {
      await markNotificationsReadById(unreadIds);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev => prev.filter(item => item.id !== notificationId));
    if (!USE_MOCK_DATA) {
      await deleteNotificationById(notificationId);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // ADMINISTRATIVE MASTER CONTROLS
  const updateAdminWallets = async (wallets: Record<string, string>) => {
    try {
      setAdminWallets(wallets);
      handleLog("System Core Updated", "Legacy wallet address book updated locally.", user.email || "admin", "warning");
      addNotification("Wallet address book updated.");
    } catch (error) {
      console.error("Error updating wallet address book: ", error);
    }
  };

  const adminSaveDepositWallet = async (walletInput: DepositWallet | Omit<DepositWallet, "id">) => {
    const wallet = buildDepositWallet(walletInput as DepositWallet & { id?: string });

    if (USE_MOCK_DATA) {
      saveMockDepositWallet(wallet);
      const next = getMockDepositWallets();
      setDepositWallets(next);
      setAdminWallets(mapDepositWalletsToAddressBook(next));
      handleLog("Deposit Wallet Updated", `Saved ${wallet.coinName} ${wallet.network} deposit wallet in mock data.`, user.email || "admin", "success");
      addNotification("Mock deposit wallet saved in this app instance.");
      return;
    }

    try {
      await setDoc(doc(db, "depositWallets", wallet.id), wallet, { merge: true });
      setDepositWallets(prev => {
        const exists = prev.some(item => item.id === wallet.id);
        const next = exists ? prev.map(item => item.id === wallet.id ? wallet : item) : [...prev, wallet];
        setAdminWallets(mapDepositWalletsToAddressBook(next));
        return next;
      });
      handleLog("Deposit Wallet Updated", `Saved ${wallet.coinName} ${wallet.network} deposit wallet.`, user.email || "admin", "success");
      addNotification("Deposit wallet saved successfully.");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `depositWallets/${wallet.id}`);
    }
  };

  const adminDeleteDepositWallet = async (walletId: string) => {
    if (USE_MOCK_DATA) {
      deleteMockDepositWallet(walletId);
      const next = getMockDepositWallets();
      setDepositWallets(next);
      setAdminWallets(mapDepositWalletsToAddressBook(next));
      handleLog("Deposit Wallet Removed", `Deleted mock deposit wallet ${walletId}.`, user.email || "admin", "warning");
      addNotification("Mock deposit wallet deleted in this app instance.");
      return;
    }

    try {
      await deleteDoc(doc(db, "depositWallets", walletId));
      setDepositWallets(prev => {
        const next = prev.filter(wallet => wallet.id !== walletId);
        setAdminWallets(mapDepositWalletsToAddressBook(next));
        return next;
      });
      handleLog("Deposit Wallet Removed", `Deleted deposit wallet ${walletId}.`, user.email || "admin", "warning");
      addNotification("Deposit wallet deleted.");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `depositWallets/${walletId}`);
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
        // Create user ledger transaction item
        const targetName = adminUsers.find(item => item.email.toLowerCase() === email.toLowerCase())?.name;
        const newTxForUser = buildTransaction(
          "tx-adj",
          "adjustment",
          txData.amount,
          "USD",
          { id: newTxId, notes: txData.notes || txData.label, userEmail: email },
          { userEmail: email, userName: targetName },
          { relatedReferenceId: newTxId }
        );
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

        // Trigger email notification if label matches (Action C)
        if (txData.label === "Deposit Successful") {
          dispatchTransactionalEmail(email, "DEPOSIT_APPROVED", `deposit:admin-balance:${newTxId}`, {
            name: targetName,
            amount: txData.amount,
            asset: "USD",
            txHash: newTxId,
            transactionId: newTxId,
            status: "approved"
          });
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
      const targetUser = adminUsers.find(item => item.email.toLowerCase() === email.toLowerCase());
      const currentKyc = (userSnap.exists() ? userSnap.data().kyc : targetUser?.kyc) as KycSubmission | undefined;
      if (!currentKyc) return;

      const reviewedKyc = reviewKycSubmission(currentKyc, status, reason || (status === "approved" ? "Verified by admin." : "Documents not sufficient."));
      await updateDoc(userDocRef, { kyc: reviewedKyc });

      setAdminUsers(prev => prev.map(adminUser =>
        adminUser.email.toLowerCase() === email.toLowerCase()
          ? { ...adminUser, kyc: reviewedKyc }
          : adminUser
      ));

      if (user.email && user.email.toLowerCase() === email.toLowerCase()) {
        setUser(prev => ({ ...prev, kyc: reviewedKyc }));
      }
      handleLog("KYC Verification Result", `Admin reviewed KYC for ${email}. Result: ${status}.`, user.email || "admin", status === "approved" ? "success" : "alert");
      addNotification(`KYC verification for ${email} marked as ${status}.`, { title: `KYC ${status}`, type: status === "approved" ? "success" : "warning", eventKey: `admin:kyc:${status}:${email}` });
      addNotification(status === "approved" ? "Your KYC verification was approved." : "Your KYC verification was rejected. Please review the notes and resubmit.", { title: status === "approved" ? "KYC approved" : "KYC rejected", type: status === "approved" ? "success" : "error", recipientEmail: email, eventKey: `kyc:${status}:${email}:${reviewedKyc.reviewedAt || reviewedKyc.submissionDate}`, action: { label: "View KYC", view: "dashboard-kyc" } });
      dispatchTransactionalEmail(email, status === "approved" ? "KYC_APPROVED" : "KYC_REJECTED", `kyc:${status}:${email}:${reviewedKyc.reviewedAt || reviewedKyc.submissionDate}`, { name: targetUser?.name || email.split("@")[0], documentType: reviewedKyc.documentType || reviewedKyc.idType, reason: reviewedKyc.rejectionReason || reason, status });
    } catch (e) {
      console.error("Error updating KYC in Firestore:", e);
    }
  };

  const submitKyc = async (kyc: KycSubmission) => {
    if (!user.email) return;
    try {
      const submission = createKycSubmission(kyc);
      const userDocRef = doc(db, "users", user.email);
      await updateDoc(userDocRef, { kyc: submission });
      setUser(prev => ({ ...prev, kyc: submission }));
      setAdminUsers(prev => prev.map(adminUser =>
        adminUser.email.toLowerCase() === user.email?.toLowerCase()
          ? { ...adminUser, kyc: submission }
          : adminUser
      ));
      addNotification("Your KYC submission has been sent for admin review.", { title: "KYC submitted", type: "info", eventKey: `kyc:submitted:${submission.submissionDate || user.email}`, action: { label: "View KYC", view: "dashboard-kyc" } });
      dispatchTransactionalEmail(user.email, "KYC_SUBMITTED", `kyc:submitted:${submission.submissionDate || user.email}`, { name: user.name, documentType: submission.documentType || submission.idType, status: "pending" });
      notifyAdmins(`${user.email} submitted KYC documents for review.`, { title: "KYC requires review", type: "warning", eventKey: `kyc:review:${user.email}:${submission.submissionDate || submission.idNumber}`, action: { label: "Review KYC", view: "dashboard-admin" } });
    } catch (e) {
      console.error("Error submitting KYC in Firestore:", e);
    }
  };

  const saveWalletConnection = async (walletName?: string) => {
    if (!user.email) return;
    try {
      const userDocRef = doc(db, "users", user.email);
      await updateDoc(userDocRef, {
        connectedWalletName: walletName || ""
      });
      setUser(prev => ({ ...prev, connectedWalletName: walletName || "" }));
      addNotification("Wallet connection preference saved.");
    } catch (e) {
      console.error("Error saving wallet connection preference in Firestore:", e);
    }
  };

  const assertAdminPermission = () => {
    if (!user.isLoggedIn || (user.role !== "admin" && user.isAdmin !== true)) {
      throw new Error("Admin permission is required to manage investment plans.");
    }
  };

  const adminCreatePlan = async (newPlan: Omit<InvestmentPlan, "id">) => {
    assertAdminPermission();

    if (USE_MOCK_DATA) {
      const freshPlan = createMockInvestmentPlan(newPlan);
      setPlans(getMockInvestmentPlans());
      handleLog("Yield Protocol Registered", `Added mock Plan: ${freshPlan.name} ROI ${freshPlan.roiPercent}%`, user.email || "admin", "success");
      addNotification(`Mock investment portfolio created in this app instance: ${freshPlan.name}`);
      return;
    }

    try {
      const freshPlan = await createInvestmentPlan(newPlan);
      setPlans(prev => sortInvestmentPlans([...prev, freshPlan]));
      handleLog("Yield Protocol Registered", `Added new Plan: ${newPlan.name} ROI ${newPlan.roiPercent}%`, user.email || "admin", "success");
      addNotification(`Created investment portfolio: ${freshPlan.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${INVESTMENT_PLANS_COLLECTION}/new`);
    }
  };

  const adminUpdatePlan = async (updated: InvestmentPlan) => {
    assertAdminPermission();

    if (USE_MOCK_DATA) {
      saveMockInvestmentPlan(updated);
      setPlans(getMockInvestmentPlans());
      handleLog("Yield Protocol Edited", `Modified mock configurations of ${updated.name}.`, user.email || "admin", "warning");
      addNotification(`Mock investment plan updated in this app instance: ${updated.name}`);
      return;
    }

    try {
      await saveInvestmentPlan(updated);
      setPlans(prev => sortInvestmentPlans(prev.map(plan => plan.id === updated.id ? updated : plan)));
      handleLog("Yield Protocol Edited", `Modified configurations of ${updated.name}.`, user.email || "admin", "warning");
      addNotification(`Parameters altered on ${updated.name}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${INVESTMENT_PLANS_COLLECTION}/${updated.id}`);
    }
  };

  const adminDeletePlan = async (planId: string) => {
    assertAdminPermission();

    if (USE_MOCK_DATA) {
      deleteMockInvestmentPlan(planId);
      setPlans(getMockInvestmentPlans());
      handleLog("Yield Protocol Deleted", `Terminated mock plan index code: ${planId}`, user.email || "admin", "alert");
      addNotification(`Mock investment plan deleted in this app instance: ${planId}`);
      return;
    }

    try {
      await deleteInvestmentPlan(planId);
      setPlans(prev => prev.filter(plan => plan.id !== planId));
      handleLog("Yield Protocol Deleted", `Terminated plan index code: ${planId}`, user.email || "admin", "alert");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${INVESTMENT_PLANS_COLLECTION}/${planId}`);
    }
  };

  const adminSetPlanStatus = async (planId: string, statusValue: "active" | "paused") => {
    assertAdminPermission();

    if (USE_MOCK_DATA) {
      setMockInvestmentPlanEnabled(planId, statusValue === "active");
      setPlans(getMockInvestmentPlans());
      handleLog("Compounding Interval Status Shift", `Switched mock plan ${planId} status to ${statusValue}`, user.email || "admin", "warning");
      addNotification(`Mock investment plan status changed in this app instance: ${planId}`);
      return;
    }

    try {
      await setInvestmentPlanEnabled(planId, statusValue === "active");
      setPlans(prev => sortInvestmentPlans(prev.map(plan => plan.id === planId ? {
        ...plan,
        enabled: statusValue === "active",
        status: statusValue
      } : plan)));
      handleLog("Compounding Interval Status Shift", `Switched plan ${planId} status to ${statusValue}`, user.email || "admin", "warning");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${INVESTMENT_PLANS_COLLECTION}/${planId}`);
    }
  };

  const adminApproveDeposit = async (txId: string, noteText: string = "Deposit verified by admin.") => {
    const targetUser = adminUsers.find(u => u.transactions.some(t => t.id === txId));
    if (!targetUser) return;

    const matchingTx = targetUser.transactions.find(t => t.id === txId);
    if (!matchingTx) return;

    const updatedTransactions = targetUser.transactions.map(t =>
      t.id === txId ? { ...t, status: "approved" as const, notes: noteText } : t
    );
    const updatedBalance = +(targetUser.balance + matchingTx.amount).toFixed(2);
    const syncAdminDepositState = () => {
      setAdminUsers(prev => prev.map(adminUser => adminUser.email === targetUser.email ? {
        ...adminUser,
        balance: updatedBalance,
        transactions: updatedTransactions
      } : adminUser));
    };

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

      syncAdminDepositState();
      handleLog("Manual Deposit Confirmed", `Approved deposit ID: ${txId} worth ${matchingTx.amount} ${matchingTx.asset}`, user.email || "admin", "success");
      addNotification(`Approved incoming deposit of ${matchingTx.amount} for ${targetUser.name}.`, { title: "Deposit approved", type: "success", eventKey: `admin:deposit:approved:${txId}` });
      addNotification(`Your ${matchingTx.asset} deposit of ${matchingTx.amount} was approved.`, { title: "Deposit approved", type: "success", recipientEmail: targetUser.email, eventKey: `deposit:approved:${txId}`, action: { label: "View wallet", view: "dashboard-wallet" } });

      dispatchTransactionalEmail(targetUser.email, "DEPOSIT_APPROVED", `deposit:approved:${txId}`, {
        name: targetUser.name,
        amount: matchingTx.amount,
        asset: matchingTx.asset,
        txHash: matchingTx.txHash || txId,
        transactionId: txId,
        status: "approved"
      });
    } catch (e) {
      console.error("Error approving deposit in Firestore:", e);
      syncAdminDepositState();
    }
  };

  const adminRejectDeposit = async (txId: string, noteText: string = "Payment proof verification unsuccessful.") => {
    const targetUser = adminUsers.find(u => u.transactions.some(t => t.id === txId));
    if (!targetUser) return;

    const updatedTransactions = targetUser.transactions.map(t =>
      t.id === txId ? { ...t, status: "rejected" as const, notes: noteText } : t
    );
    const syncAdminDepositState = () => {
      setAdminUsers(prev => prev.map(adminUser => adminUser.email === targetUser.email ? {
        ...adminUser,
        transactions: updatedTransactions
      } : adminUser));
    };

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

      syncAdminDepositState();
      handleLog("Manual Deposit Rejected", `Rejected deposit ID: ${txId}. Reason: ${noteText}`, user.email || "admin", "alert");
      addNotification(`Rejected proof on deposit ${txId}. Dispatched alert log.`, { title: "Deposit rejected", type: "warning", eventKey: `admin:deposit:rejected:${txId}` });
      addNotification(`Your deposit ${txId} was rejected. ${noteText}`, { title: "Deposit rejected", type: "error", recipientEmail: targetUser.email, eventKey: `deposit:rejected:${txId}`, action: { label: "View wallet", view: "dashboard-wallet" } });
      dispatchTransactionalEmail(targetUser.email, "DEPOSIT_REJECTED", `deposit:rejected:${txId}`, { name: targetUser.name, amount: targetUser.transactions.find(t => t.id === txId)?.amount, asset: targetUser.transactions.find(t => t.id === txId)?.asset, transactionId: txId, reason: noteText, status: "rejected" });
    } catch (e) {
      console.error("Error rejecting deposit in Firestore:", e);
      syncAdminDepositState();
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
      addNotification(`Settled withdrawal invoice ${txId}. Funds successfully dispatched.`, { title: "Withdrawal approved", type: "success", eventKey: `admin:withdrawal:approved:${txId}` });
      addNotification(`Your withdrawal ${txId} was approved and dispatched.`, { title: "Withdrawal approved", type: "success", recipientEmail: targetUser.email, eventKey: `withdrawal:approved:${txId}`, action: { label: "View wallet", view: "dashboard-wallet" } });
      
      const tx = targetUser.transactions.find(t => t.id === txId);
      if (tx) {
        dispatchTransactionalEmail(targetUser.email, "WITHDRAWAL_APPROVED", `withdrawal:approved:${txId}`, {
          name: targetUser.name,
          amount: tx.amount,
          asset: tx.asset,
          walletAddress: tx.address || tx.notes || "Stored Custody",
          transactionId: txId,
          status: "approved"
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
      addNotification(`Withdrawal ${txId} was rejected. Funds returned to wallet.`, { title: "Withdrawal rejected", type: "warning", eventKey: `admin:withdrawal:rejected:${txId}` });
      addNotification(`Your withdrawal ${txId} was rejected and funds were returned to your wallet.`, { title: "Withdrawal rejected", type: "error", recipientEmail: targetUser.email, eventKey: `withdrawal:rejected:${txId}`, action: { label: "View wallet", view: "dashboard-wallet" } });
      dispatchTransactionalEmail(targetUser.email, "WITHDRAWAL_REJECTED", `withdrawal:rejected:${txId}`, { name: targetUser.name, amount: matched.amount, asset: matched.asset, walletAddress: matched.address || matched.notes, transactionId: txId, reason: noteTextByAdmin, status: "rejected" });
    } catch (e) {
      console.error("Error rejecting withdrawal in Firestore:", e);
    }
  };

  const adminCreateAnnouncement = async (announcement: Omit<Announcement, "id" | "date" | "updatedAt"> & Partial<Pick<Announcement, "id" | "date" | "updatedAt">>) => {
    const fresh = normalizeAnnouncement(announcement);
    setAdminAnnouncements(prev => sortAnnouncementsForAdmin([fresh, ...prev]));
    if (!USE_MOCK_DATA) {
      await setDoc(doc(db, "announcements", fresh.id), fresh);
    }
    handleLog("Announcement Published", `Added announcement: ${fresh.title}`, user.email || "admin", "success");
    addNotification(`Global announcement published: "${fresh.title}".`, { title: "Announcement published", type: "success", eventKey: `admin:announcement:${fresh.id}` });
    adminUsers.filter(target => target.role !== "admin" && !isAdminEmail(target.email)).forEach(target => {
      addNotification(fresh.content, { title: fresh.title, type: fresh.priority === "Critical" ? "warning" : "info", recipientEmail: target.email, eventKey: `announcement:${fresh.id}:${target.email}`, action: { label: "View dashboard", view: "dashboard" } });
    });
  };

  const adminUpdateAnnouncement = async (announcement: Announcement) => {
    const updated = normalizeAnnouncement(announcement, announcement.id);
    setAdminAnnouncements(prev => sortAnnouncementsForAdmin(prev.map(item => item.id === updated.id ? updated : item)));
    if (!USE_MOCK_DATA) {
      await setDoc(doc(db, "announcements", updated.id), updated, { merge: true });
    }
    handleLog("Announcement Updated", `Updated announcement: ${updated.title}`, user.email || "admin", "warning");
  };

  const adminDeleteAnnouncement = async (id: string) => {
    setAdminAnnouncements(prev => prev.filter(a => a.id !== id));
    if (!USE_MOCK_DATA) {
      await deleteDoc(doc(db, "announcements", id));
    }
    handleLog("Announcement Deleted", `Removed announcement ID: ${id}`, user.email || "admin", "warning");
  };

  const markAnnouncementRead = async (announcementId: string) => {
    if (!user.email || isAnnouncementRead(announcementId, user.readAnnouncementIds)) return;

    const readAnnouncementIds = [...(user.readAnnouncementIds || []), announcementId];
    setUser(prev => ({ ...prev, readAnnouncementIds }));
    setAdminUsers(prev => prev.map(adminUser => adminUser.email.toLowerCase() === user.email?.toLowerCase()
      ? { ...adminUser, readAnnouncementIds }
      : adminUser
    ));

    if (!USE_MOCK_DATA) {
      await updateDoc(doc(db, "users", user.email), { readAnnouncementIds });
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
      uncopyTrader,
      executeTrade,
      createTicket,
      replyToTicket,
      
      // Administrative Exports
      adminUsers,
      adminWallets,
      depositWallets,
      enabledDepositWallets,
      adminAnnouncements,
      userAnnouncements,
      adminAuditLogs,
      adminAirdropClaims,
      airdrops,
      notifications,
      unreadNotificationsCount,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      
      updateAdminWallets,
      adminSaveDepositWallet,
      adminDeleteDepositWallet,
      adminUpdateUserBalance,
      adminChangeUserStatus,
      adminResetUserPassword,
      adminKycReview,
      
      adminCreatePlan,
      adminUpdatePlan,
      adminDeletePlan,
      adminSetPlanStatus,
      topUpInvestment,
      
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
      adminUpdateAnnouncement,
      adminDeleteAnnouncement,
      markAnnouncementRead,
      
      adminReplyToTicket,
      adminCloseTicket,
      adminSetTicketPriority,
      
      addNotification,
      clearNotifications,
      submitKyc,
      saveWalletConnection,

      // Site content editing
      siteContent,
      updateSiteContent,
      appSettings,
      updateAppSettings,

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


