export interface MarketAsset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  high: number;
  low: number;
  volume: string;
  sparkline: number[];
}

export interface TraderProfile {
  id: string;
  name: string;
  avatar: string;
  roi: number; // in percentage, e.g., 142.5
  winRate: number; // in percentage, e.g., 94.2
  followers: number;
  maxFollowers: number;
  assetsUnderManagement: string; // e.g. "$1.4M"
  riskScore: number; // 1 to 5
  profitDays: number; // e.g., 42
  chartData: number[];
}

export interface InvestmentPlan {
  id: string;
  name: string;
  minDeposit: number;
  maxDeposit: number;
  durationDays: number;
  roiPercent: number;
  roiCapPercent?: number;
  description: string;
  status: "active" | "paused";
}

export interface ActiveInvestment {
  id: string;
  planId: string;
  name: string;
  amount: number;
  startDate: string;
  endDate: string;
  accumulatedProfit: number;
  status: "active" | "completed" | "cancelled";
  progress: number; // 0 to 100
  dailyRoiPercent?: number;
}

export interface PortfolioAsset {
  symbol: string;
  name: string;
  amount: number;
  avgBuyPrice: number;
  currentPrice: number;
  type: "crypto" | "stock";
}

export interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "investment" | "payout";
  amount: number;
  status: "completed" | "pending" | "failed" | "rejected" | "approved";
  asset: string; // BTC, ETH, USDT ERC20, USDT TRC20, BNB, USD
  date: string;
  address?: string; // crypto wallet or bank Transit
  txHash?: string;
  proofFile?: string; // payment proof URL or filename
  notes?: string;
  userEmail?: string;
  destinationTag?: string;
  bankDetails?: {
    accountNumber: string;
    bankName: string;
    accountName: string;
    routingCode: string;
  };
  paypalEmail?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: "deposit" | "withdrawal" | "trading" | "general";
  status: "open" | "resolved" | "pending";
  date: string;
  priority: "low" | "medium" | "high";
  userEmail?: string;
  messages: Array<{
    sender: "user" | "support";
    text: string;
    time: string;
  }>;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  pinned: boolean;
  scheduledDate?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  email: string;
  ip: string;
  status: "success" | "warning" | "alert";
}

export interface KycSubmission {
  idType: string;
  idNumber: string;
  dob: string;
  address: string;
  city: string;
  country: string;
  frontImage: string;
  backImage: string;
  status: "unverified" | "pending" | "approved" | "rejected";
  rejectionReason?: string;
}

export interface SimulatedUser {
  email: string;
  name: string;
  balance: number;
  portfolioValue: number;
  status: "active" | "suspended" | "banned";
  kyc?: KycSubmission;
  recoveryPhrase?: string;
  activeInvestments: ActiveInvestment[];
  portfolio: PortfolioAsset[];
  transactions: Transaction[];
  tickets: SupportTicket[];
  loginHistory: Array<{ date: string; ip: string; device: string }>;
  username?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  phone?: string;
  accountType?: string;
  country?: string;
  currency?: string;
}

export interface UserState {
  isLoggedIn: boolean;
  email: string | null;
  name: string | null;
  balance: number; // Available cash balance
  portfolioValue: number; // Asset val
  kyc?: KycSubmission;
  recoveryPhrase?: string;
  activeInvestments: ActiveInvestment[];
  portfolio: PortfolioAsset[];
  transactions: Transaction[];
  tickets: SupportTicket[];
  status?: "active" | "suspended" | "banned";
  role?: "admin" | "user";
  username?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  phone?: string;
  accountType?: string;
  country?: string;
  currency?: string;
  referralCount?: number;
  points?: number;
}

export interface SiteContent {
  hero_title: string;
  hero_subtitle: string;
  hero_button: string;
  dashboard_title: string;
  dashboard_description: string;
  investment_title: string;
  investment_description: string;
  footer_text: string;
  announcement_text: string;
  faq_question_1: string;
  faq_answer_1: string;
  faq_question_2: string;
  faq_answer_2: string;
  faq_question_3: string;
  faq_answer_3: string;
}

export interface Airdrop {
  id: string;
  title: string;
  token: string;
  rewardAmount: string;
  status: "Live";
}

export interface AirdropClaim {
  id: string;
  userEmail: string;
  airdropId: string;
  token: string;
  rewardAmount: string;
  status: "Pending" | "Approved" | "Rejected";
  date: string;
}


