const fs = require('fs');
const path = require('path');

const tabsInfo = JSON.parse(fs.readFileSync('tabs_debug.json', 'utf-8'));
const content = fs.readFileSync('src/pages/DashboardAdmin.tsx', 'utf-8');
const lines = content.split('\n');

const outDir = 'src/components/admin/tabs';
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

// All possible states and their declaration line
const stateDeclarations = {
    editingTraderId: "const [editingTraderId, setEditingTraderId] = useState<string | null>(null);",
    traderForm: `const [traderForm, setTraderForm] = useState({
    name: "", avatar: "", roi: 0, winRate: 0, followers: 0, maxFollowers: 0,
    assetsUnderManagement: "", riskScore: 3, profitDays: 30, chartDataString: ""
  });`,
    usersSearch: "const [usersSearch, setUsersSearch] = useState(\"\");",
    selectedUserEmail: "const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);",
    balanceOverrideVal: "const [balanceOverrideVal, setBalanceOverrideVal] = useState(\"\");",
    editingBalanceEmail: "const [editingBalanceEmail, setEditingBalanceEmail] = useState<string | null>(null);",
    tempBalanceVal: "const [tempBalanceVal, setTempBalanceVal] = useState<string>(\"\");",
    adjustmentType: "const [adjustmentType, setAdjustmentType] = useState<\"credit\" | \"debit\">(\"credit\");",
    transactionLabel: "const [transactionLabel, setTransactionLabel] = useState<string>(\"Credit Transaction\");",
    internalProtocolNote: "const [internalProtocolNote, setInternalProtocolNote] = useState<string>(\"\");",
    activeTicketId: "const [activeTicketId, setActiveTicketId] = useState<string | null>(null);",
    adminReplyTxt: "const [adminReplyTxt, setAdminReplyTxt] = useState(\"\");",
    newPlanName: "const [newPlanName, setNewPlanName] = useState(\"\");",
    newPlanMin: "const [newPlanMin, setNewPlanMin] = useState(\"\");",
    newPlanMax: "const [newPlanMax, setNewPlanMax] = useState(\"\");",
    newPlanDays: "const [newPlanDays, setNewPlanDays] = useState(\"\");",
    newPlanReturns: "const [newPlanReturns, setNewPlanReturns] = useState(\"\");",
    newPlanDesc: "const [newPlanDesc, setNewPlanDesc] = useState(\"\");",
    editingPlan: "const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);",
    newAnnTitle: "const [newAnnTitle, setNewAnnTitle] = useState(\"\");",
    newAnnContent: "const [newAnnContent, setNewAnnContent] = useState(\"\");",
    newAnnPin: "const [newAnnPin, setNewAnnPin] = useState(false);",
    btcConf: "const [btcConf, setBtcConf] = useState(adminWallets?.BTC || \"\");",
    ethConf: "const [ethConf, setEthConf] = useState(adminWallets?.ETH || \"\");",
    usdtErcConf: "const [usdtErcConf, setUsdtErcConf] = useState(adminWallets?.USDT_ERC20 || \"\");",
    usdtTrcConf: "const [usdtTrcConf, setUsdtTrcConf] = useState(adminWallets?.USDT_TRC20 || \"\");",
    bnbConf: "const [bnbConf, setBnbConf] = useState(adminWallets?.BNB || \"\");",
};

const orbitKeys = [
    "user", "plans", "adminUsers", "adminWallets", "adminAnnouncements", "adminAuditLogs",
    "updateAdminWallets", "adminUpdateUserBalance", "adminChangeUserStatus", "adminResetUserPassword",
    "adminKycReview", "adminCreatePlan", "adminUpdatePlan", "adminDeletePlan", "adminSetPlanStatus",
    "adminApproveDeposit", "adminRejectDeposit", "adminApproveWithdrawal", "adminRejectWithdrawal",
    "adminCreateAnnouncement", "adminDeleteAnnouncement", "adminReplyToTicket", "adminCloseTicket",
    "adminSetTicketPriority", "addNotification", "siteContent", "updateSiteContent", "traders",
    "adminUpdateTrader", "adminCreateTrader", "adminDeleteTrader", "adminAirdropClaims",
    "adminApproveAirdrop", "airdrops", "adminCreateAirdrop", "adminUpdateAirdrop", "adminDeleteAirdrop"
];

// Base derived properties calculation
const derivedCalc = `
  const currentUser = orbit.user;
  const adminUsersList = orbit.adminUsers || [];
  const aggregateUsers = adminUsersList.length + 10;
  const activeUserCount = adminUsersList.filter(u => u.status === "active").length + 8;
  const bannedCount = adminUsersList.filter(u => u.status === "banned").length;
  
  const allDeposits = [];
  const allWithdrawals = [];
  const allTickets = [];

  currentUser.transactions.forEach(t => {
    const enriched = { ...t, userEmail: currentUser.email, userName: currentUser.name || "HENRIK" };
    if (t.type === "deposit") allDeposits.push(enriched);
    else if (t.type === "withdrawal") allWithdrawals.push(enriched);
  });
  currentUser.tickets.forEach(tk => {
    allTickets.push({ ...tk, userEmail: currentUser.email, userName: currentUser.name || "HENRIK" });
  });

  adminUsersList.forEach(sim => {
    sim.transactions.forEach(t => {
      const enriched = { ...t, userEmail: sim.email, userName: sim.name };
      if (t.type === "deposit") allDeposits.push(enriched);
      else if (t.type === "withdrawal") allWithdrawals.push(enriched);
    });
    sim.tickets.forEach(tk => {
      allTickets.push({ ...tk, userEmail: sim.email, userName: sim.name });
    });
  });

  const sortedDeposits = [...allDeposits].sort((a,b) => b.id.localeCompare(a.id));
  const sortedWithdrawals = [...allWithdrawals].sort((a,b) => b.id.localeCompare(a.id));
  const sortedTickets = [...allTickets].sort((a,b) => b.status === "open" ? -1 : 1);

  const totalDepositVolume = allDeposits
    .filter(t => t.status === "completed" || t.status === "approved")
    .reduce((acc, current) => acc + current.amount, 0) + 1450000;

  const totalWithdrawalVolume = allWithdrawals
    .filter(t => t.status === "completed" || t.status === "approved")
    .reduce((acc, current) => acc + current.amount, 0) + 210000;

  const totalInvestmentsPlaced = (orbit.plans?.length || 0) * 48000 + 482900;
  const platformHedgedRevenue = totalDepositVolume * 0.08;
  const pendingPayoutCount = sortedWithdrawals.filter(w => w.status === "pending").length;
`;

tabsInfo.forEach(tab => {
    const tabName = tab.id.charAt(0).toUpperCase() + tab.id.slice(1);
    const compName = `Admin${tabName}Tab`;
    let jsxLines = lines.slice(tab.startLine - 1, tab.startLine - 1 + tab.length);
    let jsxString = jsxLines.join('\n');
    jsxString = jsxString.replace(/^\s*\{\s*activeTab\s*===\s*".*?"\s*&&\s*\(/, '');
    jsxString = jsxString.replace(/\)\s*\}\s*$/, '');
    
    // Find used states
    const usedStates = [];
    Object.keys(stateDeclarations).forEach(s => {
        if (jsxString.includes(s)) {
            usedStates.push(stateDeclarations[s]);
        }
    });

    const fileContent = `import React, { useState } from "react";
import { useOrbit } from "../../../context/OrbitContext";
import { InvestmentPlan } from "../../../types";
import { motion } from "motion/react";
import { 
  Users, Layers, ArrowDownLeft, ArrowUpRight, Bell, Volume2, ShieldAlert, 
  MessageSquare, Activity, UserCheck, Ban, PenTool, Check, X, Menu, CreditCard, 
  Key, Database, Search, Plus, Trash2, FileText, Lock, Compass, DollarSign, Award, Gift
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from "recharts";

export const ${compName}: React.FC = () => {
  const orbit = useOrbit();
  const { ${orbitKeys.filter(k => jsxString.includes(k) || derivedCalc.includes(k)).join(', ')} } = orbit;
  
${usedStates.join('\n  ')}

${derivedCalc}

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
${jsxString}
    </motion.div>
  );
};
`;

    fs.writeFileSync(path.join(outDir, `${compName}.tsx`), fileContent);
    console.log(`Generated ${compName}.tsx`);
});
