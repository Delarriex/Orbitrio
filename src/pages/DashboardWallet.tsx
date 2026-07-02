import React, { useState, useRef } from "react";
import { useOrbit } from "../context/OrbitContext";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebase";
import { 
  PlusSquare, 
  MinusSquare, 
  History, 
  LifeBuoy, 
  Copy, 
  Check, 
  Send, 
  MessageSquare,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Download,
  Info,
  Wallet,
  Eye,
  EyeOff
} from "lucide-react";

interface DashboardWalletProps {
  initialOpenTab?: "deposit" | "withdraw" | "ledger" | "support";
}

export const DashboardWallet: React.FC<DashboardWalletProps> = ({ initialOpenTab = "deposit" }) => {
  const { user, deposit, withdraw, createTicket, replyToTicket, adminWallets, addNotification } = useOrbit();
  const [activeSubTab, setActiveSubTab] = useState<"deposit" | "withdraw" | "ledger" | "support">(initialOpenTab);
  const [showBalance, setShowBalance] = useState(true);

  // Deposit states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [depositCurrency, setDepositCurrency] = useState("USDT ERC20");
  const [depositAmountTxt, setDepositAmountTxt] = useState("");
  const [depositTxHash, setDepositTxHash] = useState("");
  const [depositProofName, setDepositProofName] = useState("");
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [depositSuccessLog, setDepositSuccessLog] = useState<string | null>(null);

  // Address generator stubs
  const depositAddresses: Record<string, string> = {
    "USDT ERC20": adminWallets.USDT_ERC20 || "0x981A7bFDE6D211a76B97A1f6DAe82b7814a60156",
    "USDT TRC20": adminWallets.USDT_TRC20 || "TYc8Dq6pB1A8C8xbeGf4mDqsD84Kda67vE",
    BTC: adminWallets.BTC || "bc1qxy2kg3ut7ytu6e8f4t9rga2dfws368ff66e5g8",
    ETH: adminWallets.ETH || "0x7Fba9fB5994A1F62aB016a2E9D843D0B6A780E2e",
    BNB: adminWallets.BNB || "0x3fC91A3afd20b00230230233ea86976828a923",
    SOL: adminWallets.SOL || "7xKX3rncM9G9tve2S4g849mDsa9X8veFDSasf9adFad3",
    XRP: adminWallets.XRP || "rEb8TK3gKLgai2asdaAdsaA324aFD9safAdadW"
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositSuccessLog(null);

    const amount = parseFloat(depositAmountTxt);
    if (!amount || amount < 100) {
      triggerDepositFeedback("Error: The minimum deposit amount is $100 equivalent.");
      return;
    }

    let finalProofURL = depositProofName || "payment_proof_receipt.jpg";

    if (fileInputRef.current?.files?.[0]) {
      try {
        const file = fileInputRef.current.files[0];
        const storageRef = ref(storage, `deposits/${user.email}_${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        finalProofURL = await getDownloadURL(storageRef);
      } catch (err) {
        console.error("Error uploading deposit proof:", err);
      }
    }

    const success = deposit(
      amount, 
      depositCurrency, 
      depositTxHash.trim() || "N/A", 
      finalProofURL
    );
    if (success) {
      setDepositAmountTxt("");
      setDepositTxHash("");
      setDepositProofName("");
      triggerDepositFeedback(`Successfully submitted! Mapped $${amount} ${depositCurrency} secure deposit pending verification. ${depositTxHash.trim() ? "Transaction Hash registered." : ""}`);
    } else {
      triggerDepositFeedback("Error occurred while processing deposit.");
    }
  };

  const handleCopyAddr = () => {
    const addr = depositAddresses[depositCurrency] || "0x981A7bFDE6D211a76B97A1f6DAe82b7814a60156";
    navigator.clipboard.writeText(addr);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const triggerDepositFeedback = (msg: string) => {
    setDepositSuccessLog(msg);
    setTimeout(() => setDepositSuccessLog(null), 7000);
  };

  // Withdraw states
  const [wdrCurrency, setWdrCurrency] = useState("USDT");
  const [wdrNetwork, setWdrNetwork] = useState("TRC20");
  const [wdrAmountTxt, setWdrAmountTxt] = useState("");
  const [wdrAddress, setWdrAddress] = useState("");
  const [wdrLog, setWdrLog] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Supplementary states for bank/paypal/xrp tag
  const [destinationTag, setDestinationTag] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [routingCode, setRoutingCode] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");

  const validateWithdrawal = (): { valid: boolean; message: string } => {
    const amount = parseFloat(wdrAmountTxt);
    if (!amount || amount <= 0) {
      return { valid: false, message: "Error: Please specify valid numerical withdraw quantities." };
    }
    if (user.balance < amount) {
      return { valid: false, message: "Error: Insufficient withdrawable balance." };
    }

    if (wdrCurrency === "PayPal") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!paypalEmail.trim()) {
        return { valid: false, message: "Error: PayPal email is required." };
      }
      if (!emailRegex.test(paypalEmail)) {
        return { valid: false, message: "Error: Please enter a logical PayPal email address." };
      }
    } else if (wdrCurrency === "Bank") {
      if (!bankName.trim()) return { valid: false, message: "Error: Bank Name is required." };
      if (!accountNumber.trim()) return { valid: false, message: "Error: Account number is required." };
      if (!accountName.trim()) return { valid: false, message: "Error: Account name is required." };
      if (!routingCode.trim()) return { valid: false, message: "Error: Routing code is required." };

      const acctRegex = /^[a-zA-Z0-9\- ]{4,30}$/;
      if (!acctRegex.test(accountNumber)) {
        return { valid: false, message: "Error: Account number should be 4-30 characters alphanumeric." };
      }
      const routingRegex = /^[a-zA-Z0-9]{4,15}$/;
      if (!routingRegex.test(routingCode)) {
        return { valid: false, message: "Error: Routing code should be 4-15 characters alphanumeric." };
      }
    } else {
      if (!wdrAddress.trim()) {
        return { valid: false, message: "Error: Withdrawal address is required." };
      }

      if (wdrCurrency === "BTC") {
        const btcRegex = /^(?:1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-zA-Z0-9]{25,62})$/;
        if (!btcRegex.test(wdrAddress)) {
          return { valid: false, message: "Error: Invalid Bitcoin (BTC) address format. Must start with 1, 3, or bc1." };
        }
      } else if (wdrCurrency === "ETH") {
        const ethRegex = /^0x[a-fA-F0-9]{40}$/;
        if (!ethRegex.test(wdrAddress)) {
          return { valid: false, message: "Error: Invalid Ethereum (ETH) address format. Must start with 0x followed by 40 hex digits." };
        }
      } else if (wdrCurrency === "SOL") {
        const solRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
        if (!solRegex.test(wdrAddress)) {
          return { valid: false, message: "Error: Invalid Solana (SOL) address format. Must be 32-44 base58 characters." };
        }
      } else if (wdrCurrency === "XRP") {
        const xrpRegex = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
        if (!xrpRegex.test(wdrAddress)) {
          return { valid: false, message: "Error: Invalid Ripple (XRP) address format. Must start with 'r' and be 25-35 base58 characters." };
        }
        if (!destinationTag.trim()) {
          return { valid: false, message: "Error: XRP Destination Tag / Memo is required. Enter a tags code, or '0' if not required." };
        }
        const tagRegex = /^[a-zA-Z0-9]{1,10}$/;
        if (!tagRegex.test(destinationTag)) {
          return { valid: false, message: "Error: Destination Tag / Memo must be alphanumeric, up to 10 characters." };
        }
      } else if (wdrCurrency === "USDT") {
        if (wdrNetwork === "TRC20") {
          const trcRegex = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
          if (!trcRegex.test(wdrAddress)) {
            return { valid: false, message: "Error: Invalid TRC20 USDT address format. Must start with T." };
          }
        } else {
          const ethRegex = /^0x[a-fA-F0-9]{40}$/;
          if (!ethRegex.test(wdrAddress)) {
            return { valid: false, message: "Error: Invalid USDT address format. Must start with 0x for ERC20/BEP20." };
          }
        }
      }
    }

    return { valid: true, message: "" };
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWdrLog(null);

    const check = validateWithdrawal();
    if (!check.valid) {
      setWdrLog({ type: "error", message: check.message });
      return;
    }

    const amount = parseFloat(wdrAmountTxt);
    let currencyWithNetwork = wdrCurrency;
    if (wdrCurrency === "USDT") {
      currencyWithNetwork = `USDT (${wdrNetwork})`;
    } else if (wdrCurrency === "Bank") {
      currencyWithNetwork = "Bank Withdrawal";
    } else if (wdrCurrency === "PayPal") {
      currencyWithNetwork = "PayPal Withdrawal";
    }

    const res = withdraw(
      amount,
      currencyWithNetwork,
      wdrCurrency === "Bank" || wdrCurrency === "PayPal" ? undefined : wdrAddress,
      wdrCurrency === "XRP" ? destinationTag : undefined,
      wdrCurrency === "Bank" ? { accountNumber, bankName, accountName, routingCode } : undefined,
      wdrCurrency === "PayPal" ? paypalEmail : undefined
    );

    if (res.success) {
      setWdrLog({ type: "success", message: res.message });
      setWdrAmountTxt("");
      setWdrAddress("");
      setDestinationTag("");
      setBankName("");
      setAccountNumber("");
      setAccountName("");
      setRoutingCode("");
      setPaypalEmail("");
    } else {
      setWdrLog({ type: "error", message: res.message });
    }
  };

  // Support states
  const [tktSubject, setTktSubject] = useState("");
  const [tktCategory, setTktCategory] = useState<"deposit" | "withdrawal" | "trading" | "general">("general");
  const [tktInitialMsg, setTktInitialMsg] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(user.tickets[0]?.id || null);
  const [tktReplyTxt, setTktReplyTxt] = useState("");

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tktSubject.trim() || !tktInitialMsg.trim()) return;

    createTicket(tktSubject, tktCategory, tktInitialMsg);
    
    // Clear forms
    setTktSubject("");
    setTktInitialMsg("");

    // Set active selection to the newly created ticket on the next tick
    setTimeout(() => {
      if (user.tickets.length > 0) {
        setSelectedTicketId(user.tickets[0].id);
      }
    }, 100);
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !tktReplyTxt.trim()) return;

    replyToTicket(selectedTicketId, tktReplyTxt);
    setTktReplyTxt("");
  };

  const activeTicketObj = user.tickets.find(t => t.id === selectedTicketId);

  return (
    <div className="space-y-8 pb-20 font-sans">
      
      {/* Page Header */}
      <div className="border-b border-orbit-border/50 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-orbit-white">
            <Wallet size={24} className="text-orbit-white shrink-0" />
            <h1 className="text-2xl font-bold font-heading">Wallet</h1>
          </div>
          <p className="text-xs text-orbit-gray-text mt-1 font-sans">
            Deposit funds, withdraw assets, view history, or contact support instantly.
          </p>
        </div>

        <div className="bg-orbit-card border border-orbit-border rounded-xl px-4 py-3 font-subheading text-xs text-right min-w-[160px]">
          <div className="flex items-center justify-end gap-1.5 text-orbit-gray-text">
            <button 
              type="button"
              onClick={() => setShowBalance(!showBalance)} 
              className="text-neutral-400 hover:text-orbit-white focus:outline-none transition-colors cursor-pointer"
              title={showBalance ? "Hide balance" : "Show balance"}
            >
              {showBalance ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
            <span className="text-[10px] uppercase select-none">Available Balance</span>
          </div>
          <strong className="text-orbit-accent block text-sm font-data mt-0.5">
            {showBalance ? `$${user.balance.toLocaleString()}` : "••••••"}
          </strong>
        </div>
      </div>

      {/* Navigation Layout Tabs */}
      <div className="flex bg-orbit-card border border-orbit-border/80 rounded-xl p-1.5 w-fit font-sans">
        <button
          onClick={() => setActiveSubTab("deposit")}
          className={`flex items-center gap-1.5 px-4 sm:px-6 py-2 rounded-lg text-xs font-bold font-subheading transition-all cursor-pointer ${
            activeSubTab === "deposit" ? "bg-orbit-accent text-orbit-bg" : "text-orbit-gray-text hover:text-orbit-white"
          }`}
        >
          <PlusSquare size={14} /> Deposit
        </button>
        <button
          onClick={() => setActiveSubTab("withdraw")}
          className={`flex items-center gap-1.5 px-4 sm:px-6 py-2 rounded-lg text-xs font-bold font-subheading transition-all cursor-pointer ${
            activeSubTab === "withdraw" ? "bg-orbit-accent text-orbit-bg" : "text-orbit-gray-text hover:text-orbit-white"
          }`}
        >
          <MinusSquare size={14} /> Withdraw
        </button>
        <button
          onClick={() => setActiveSubTab("ledger")}
          className={`flex items-center gap-1.5 px-4 sm:px-6 py-2 rounded-lg text-xs font-bold font-subheading transition-all cursor-pointer ${
            activeSubTab === "ledger" ? "bg-orbit-accent text-orbit-bg" : "text-orbit-gray-text hover:text-orbit-white"
          }`}
        >
          <History size={14} /> History
        </button>
        <button
          onClick={() => setActiveSubTab("support")}
          className={`flex items-center gap-1.5 px-4 sm:px-6 py-2 rounded-lg text-xs font-bold font-subheading transition-all cursor-pointer ${
            activeSubTab === "support" ? "bg-orbit-accent text-orbit-bg" : "text-orbit-gray-text hover:text-orbit-white"
          }`}
        >
          <LifeBuoy size={14} /> Help Center
        </button>
      </div>

      {/* Main interactive Tab panels */}
      <div className="bg-orbit-card border border-orbit-border rounded-xl p-6 shadow-2xl overflow-hidden min-h-[360px] font-sans">
        
        {/* TAB 1: DEPOSIT ASSETS */}
        {activeSubTab === "deposit" && (
          <div className="max-w-xl mx-auto w-full">
            
            {/* Input form */}
            <form onSubmit={handleDepositSubmit} className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-orbit-white">Deposit</h3>
                <p className="text-xs text-orbit-gray-text mt-1">Select currency and enter deposit amount.</p>
              </div>

              {depositSuccessLog && (
                <div className={`p-4 text-xs font-semibold rounded-xl border font-sans ${
                  depositSuccessLog.startsWith("Error") ? "bg-orbit-red/10 border-orbit-red/30 text-orbit-red" : "bg-orbit-green/10 border-orbit-green/30 text-orbit-green"
                }`}>
                  {depositSuccessLog}
                </div>
              )}

              {/* Currency selectors */}
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text">
                  <Download size={13} className="text-orbit-accent shrink-0" />
                  <span>Select Crypto</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {["USDT ERC20", "USDT TRC20", "BTC", "ETH", "BNB", "SOL", "XRP"].map((coin) => (
                    <button
                      key={coin}
                      type="button"
                      onClick={() => {
                        setDepositCurrency(coin);
                      }}
                      className={`p-2 py-2.5 rounded-lg border text-center text-[10px] font-bold font-data cursor-pointer transition-all ${
                        depositCurrency === coin 
                          ? "border-orbit-accent bg-orbit-accent/10 text-orbit-accent" 
                          : "border-orbit-border bg-orbit-bg/50 text-orbit-gray-text"
                      }`}
                    >
                      {coin}
                    </button>
                  ))}
                </div>
              </div>

              {/* Repositioned: DEPOSIT INSTRUCTIONS address card */}
              <div className="bg-orbit-darkcard/60 border border-orbit-border rounded-xl p-4.5 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-orbit-accent uppercase tracking-wider font-heading">
                  <Info size={14} className="text-orbit-accent shrink-0" />
                  <span>Deposit Instructions</span>
                </div>
                
                <p className="text-xs text-orbit-gray-text leading-relaxed font-sans font-medium">
                  Send only the selected coin to this address. Credits after 1 network confirmation.
                </p>

                {/* Secure Key panel */}
                <div className="p-3.5 rounded-xl border border-orbit-border bg-orbit-bg space-y-2 font-sans">
                  <span className="text-[9px] uppercase tracking-normal text-orbit-gray-text font-subheading block">Your {depositCurrency} Deposit Address</span>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-orbit-white font-semibold select-all break-all pr-2 font-data">
                      {depositAddresses[depositCurrency]}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyAddr}
                      className="p-1.5 rounded bg-orbit-card border border-orbit-border hover:border-orbit-accent hover:text-orbit-accent transition-all shrink-0 cursor-pointer flex items-center justify-center"
                    >
                      {copiedAddress ? <Check size={14} className="text-orbit-green" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Optional XRP Destination Tag Box */}
                {depositCurrency === "XRP" && (
                  <div className="p-3.5 rounded-xl border border-orbit-border bg-orbit-bg space-y-2 font-sans animate-fadeIn">
                    <span className="text-[9px] uppercase tracking-normal text-orbit-gray-text font-subheading block">Your XRP Deposit Destination Tag / Memo (Required)</span>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-orbit-white font-mono font-bold select-all bg-orbit-darkcard px-2 py-0.5 rounded border border-orbit-border">
                        108253
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText("108253");
                          addNotification("Copied XRP Destination Tag: 108253");
                        }}
                        className="p-1.5 px-3 rounded bg-orbit-card border border-orbit-border hover:border-orbit-accent hover:text-orbit-accent transition-all shrink-0 cursor-pointer flex items-center justify-center text-[10px] text-orbit-white font-semibold"
                      >
                        Copy Tag
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-orbit-gray-text italic space-y-0.5 font-sans">
                  <span>• Ensure you send only {depositCurrency} to this address.</span>
                  <span className="block">• Assets are safely held 1:1.</span>
                </div>
              </div>

              {/* Deposit Amount input (repositioned immediately below address card) */}
              <div className="space-y-1.5 font-sans">
                <label className="text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text block">Deposit Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orbit-gray-text font-bold font-data">$</span>
                  <input
                    type="number"
                    required
                    value={depositAmountTxt}
                    onChange={(e) => setDepositAmountTxt(e.target.value)}
                    placeholder="Min. Deposit: 100 USD"
                    className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent rounded-xl pl-8 pr-4 py-2.5 text-xs text-orbit-white font-bold font-data placeholder:text-[11px] placeholder:font-medium"
                  />
                </div>
              </div>

              {/* Transaction Hash (TxID) input (pushed as part of the absolute bottom fields) */}
              <div className="space-y-1.5 font-sans">
                <label className="text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text block">Transaction Hash (Optional)</label>
                <input
                  type="text"
                  value={depositTxHash}
                  onChange={(e) => setDepositTxHash(e.target.value)}
                  placeholder="Blockchain validation hash / transaction index"
                  className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent rounded-xl px-4 py-2.5 text-xs text-orbit-white font-mono placeholder:text-[10.5px] placeholder:font-normal"
                />
              </div>

              {/* Transaction Screenshot (Optional) with native image gallery selection */}
              <div className="space-y-2 font-sans">
                <label className="text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text block">Transaction Screenshot (Optional)</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setDepositProofName(e.target.files[0].name);
                    }
                  }}
                  className="hidden"
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    depositProofName 
                      ? "border-orbit-green/50 bg-orbit-green/5 text-orbit-green" 
                      : "border-orbit-border bg-orbit-bg hover:border-orbit-accent"
                  }`}
                >
                  <p className="text-[11px] font-sans font-medium">
                    {depositProofName ? "✓ Receipt Proof Attached" : "📸 Upload transfer receipt or block explorer snapshot"}
                  </p>
                  <span className="text-[9px] text-zinc-500 font-mono block mt-1">
                    {depositProofName || "Supports JPG, PNG (Max size: 5MB)"}
                  </span>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orbit-accent to-[#FF7F00] text-orbit-bg font-bold font-subheading text-xs uppercase shadow transition-all transform hover:-translate-y-0.5 cursor-pointer text-center"
                >
                  Confirm Deposit
                </button>
                <p className="text-xs text-neutral-400 text-center mt-2 font-sans">
                  Please only click the Confirm Deposit button if you have already transferred the funds.
                </p>
              </div>
            </form>

          </div>
        )}

        {/* TAB 2: WITHDRAW SECURITIES */}
        {activeSubTab === "withdraw" && (
          <form onSubmit={handleWithdrawSubmit} className="max-w-xl mx-auto space-y-6 font-sans">
            <div>
              <h3 className="text-sm font-bold font-heading text-orbit-white">Withdraw Assets</h3>
              <p className="text-xs text-orbit-gray-text mt-1 font-sans">Withdraw your assets to external addresses.</p>
            </div>

            {wdrLog && (
              <div className={`p-4 text-xs font-semibold rounded-xl border font-sans ${
                wdrLog.type === "error" ? "bg-orbit-red/10 border-orbit-red/30 text-orbit-red" : "bg-orbit-green/10 border-orbit-green/30 text-orbit-green"
              }`}>
                {wdrLog.message}
              </div>
            )}

            {/* Denomination Coin selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text">Select Withdrawal Method</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 font-data">
                {["USDT", "BTC", "ETH", "XRP", "SOL", "Bank", "PayPal"].map((coin) => (
                  <button
                    key={coin}
                    type="button"
                    onClick={() => setWdrCurrency(coin)}
                    className={`p-2 py-2.5 rounded-lg border text-center text-[10px] font-bold cursor-pointer transition-all ${
                      wdrCurrency === coin 
                        ? "border-orbit-accent bg-orbit-accent/10 text-orbit-accent" 
                        : "border-orbit-border bg-orbit-bg/50 text-orbit-gray-text"
                    }`}
                  >
                    {coin === "Bank" ? "Bank Wire" : coin === "PayPal" ? "PayPal" : coin}
                  </button>
                ))}
              </div>
            </div>

            {wdrCurrency === "USDT" && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text">Select USDT Network</label>
                <div className="grid grid-cols-3 gap-3 font-data">
                  {["TRC20", "ERC20", "BEP20"].map((net) => (
                    <button
                      key={net}
                      type="button"
                      onClick={() => setWdrNetwork(net)}
                      className={`p-2.5 rounded-lg border text-center text-xs font-bold cursor-pointer transition-all ${
                        wdrNetwork === net 
                          ? "border-orbit-accent bg-orbit-accent/10 text-orbit-accent" 
                          : "border-orbit-border bg-orbit-bg/50 text-orbit-gray-text"
                      }`}
                    >
                      {net}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Wallet Cash limit checking */}
            <div className="space-y-1.5 font-sans">
              <div className="flex justify-between text-[10px] uppercase text-orbit-gray-text font-subheading">
                <span>Amount (USD)</span>
                <span className="font-data">Available Balance: ${user.balance.toLocaleString()}</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orbit-gray-text font-bold font-data">$</span>
                <input
                  type="number"
                  required
                  value={wdrAmountTxt}
                  onChange={(e) => setWdrAmountTxt(e.target.value)}
                  placeholder="Enter withdraw amount"
                  className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent rounded-xl pl-8 pr-4 py-2 text-xs text-orbit-white font-bold font-data"
                />
              </div>
            </div>

            {/* Conditional input fields based on payout method */}
            {wdrCurrency === "PayPal" && (
              <div className="space-y-1.5 animate-fadeIn font-sans">
                <label className="text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text">PayPal Email Address</label>
                <input
                  type="email"
                  required
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="e.g., yourname@paypal.com"
                  className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent rounded-lg py-2 px-3 text-xs text-orbit-white focus:outline-none"
                />
              </div>
            )}

            {wdrCurrency === "Bank" && (
              <div className="space-y-3.5 animate-fadeIn font-sans">
                <h4 className="text-[11px] font-bold font-subheading uppercase text-orbit-accent tracking-wider">Local Bank Settlement Fields</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text">Bank Name</label>
                    <input
                      type="text"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g., Chase Bank"
                      className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent rounded-lg py-2.5 px-3 text-xs text-orbit-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text">Account Name</label>
                    <input
                      type="text"
                      required
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="e.g., John Doe"
                      className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent rounded-lg py-2.5 px-3 text-xs text-orbit-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text">Account Number</label>
                    <input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g., 12345678"
                      className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent rounded-lg py-2.5 px-3 text-xs text-orbit-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text">Routing / Transit Code</label>
                    <input
                      type="text"
                      required
                      value={routingCode}
                      onChange={(e) => setRoutingCode(e.target.value)}
                      placeholder="e.g., 021000021"
                      className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent rounded-lg py-2.5 px-3 text-xs text-orbit-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {wdrCurrency !== "Bank" && wdrCurrency !== "PayPal" && (
              <div className="space-y-3.5 animate-fadeIn font-sans">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text">Withdrawal Address</label>
                  <input
                    type="text"
                    required
                    value={wdrAddress}
                    onChange={(e) => setWdrAddress(e.target.value)}
                    placeholder={`Enter external ${wdrCurrency} crypto wallet address`}
                    className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent rounded-lg py-2.5 px-3 text-xs text-orbit-white focus:outline-none"
                  />
                </div>

                {wdrCurrency === "XRP" && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text">XRP Destination Tag / Memo</label>
                    <input
                      type="text"
                      required
                      value={destinationTag}
                      onChange={(e) => setDestinationTag(e.target.value)}
                      placeholder="Required. Enter up to 10-digit number, e.g. 108253"
                      className="w-full bg-orbit-bg border border-orbit-border focus:border-orbit-accent rounded-lg py-2.5 px-3 text-xs text-orbit-white focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2.5">
              <button
                type="submit"
                className="w-full py-3.5 bg-orbit-bg border border-orbit-accent text-orbit-accent hover:bg-orbit-accent hover:text-orbit-bg font-bold font-subheading text-xs uppercase rounded-xl transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                Withdraw
              </button>
              <p className="text-xs text-neutral-400 text-center mt-2 font-sans select-none px-4 leading-normal">
                Please ensure your settlement coordinates are flawless. Incorrect instructions will result in permanent loss or queue rejection.
              </p>
            </div>
          </form>
        )}

        {/* TAB 3: MASTER TRANSACTION AUDITOR */}
        {activeSubTab === "ledger" && (
          <div className="space-y-4 font-sans">
            <div>
              <h3 className="text-sm font-bold font-heading text-orbit-white">Transaction History</h3>
              <p className="text-xs text-orbit-gray-text mt-1 font-sans">View all past deposits and withdrawals.</p>
            </div>

            {user.transactions.length === 0 ? (
              <p className="text-xs text-center text-orbit-gray-text py-16 font-sans">No transactions yet.</p>
            ) : (
              <div className="overflow-x-auto text-sans">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-orbit-border text-[9px] uppercase font-subheading tracking-wider text-orbit-gray-text bg-orbit-bg/40">
                      <th className="p-3 pl-4">TxID</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Asset</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3 pr-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orbit-border/30 font-data">
                    {user.transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-orbit-darkcard/50 transition-colors">
                        <td className="p-3 pl-4 font-bold text-orbit-white select-all">{t.id}</td>
                        <td className="p-3 text-orbit-gray-text font-sans">{t.date}</td>
                        <td className="p-3 uppercase font-semibold font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            t.type === "deposit" ? "bg-orbit-green/10 text-orbit-green" : "bg-orbit-red/10 text-orbit-red"
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-orbit-white font-data">{t.asset}</td>
                        <td className="p-3 text-orbit-white font-bold">${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 pr-4 text-right">
                          <span className={`text-[11px] font-bold flex items-center justify-end gap-1 font-subheading ${
                            t.status === "completed" || t.status === "approved" ? "text-orbit-green" :
                            t.status === "pending" ? "text-yellow-400" :
                            "text-orbit-red"
                          }`}>
                            <CheckCircle2 size={12} /> {t.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SUPPORT DESK TICKET CHATS */}
        {activeSubTab === "support" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Left Column: Create new ticket (col-span-5) */}
            <form onSubmit={handleCreateTicketSubmit} className="lg:col-span-5 border-r border-orbit-border/40 pr-6 space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-orbit-accent border-b border-orbit-border/50 pb-2">
                New Support Ticket
              </h3>
              
              <div className="space-y-1">
                <label className="text-[10px] text-orbit-gray-text uppercase font-mono">Subject</label>
                <input
                  type="text"
                  required
                  value={tktSubject}
                  onChange={(e) => setTktSubject(e.target.value)}
                  placeholder="e.g., Deposit delay"
                  className="w-full bg-orbit-bg border border-orbit-border rounded-lg py-2 px-3 text-xs text-orbit-white focus:border-orbit-accent focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-orbit-gray-text uppercase font-mono">Category</label>
                <select
                  value={tktCategory}
                  onChange={(e) => setTktCategory(e.target.value as any)}
                  className="w-full bg-orbit-bg border border-orbit-border rounded-lg py-2 px-3 text-xs text-orbit-white focus:border-orbit-accent focus:outline-none"
                >
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="trading">Trading</option>
                  <option value="general">Account</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-orbit-gray-text uppercase font-mono font-semibold">Message</label>
                <textarea
                  required
                  rows={4}
                  value={tktInitialMsg}
                  onChange={(e) => setTktInitialMsg(e.target.value)}
                  placeholder="Detail your request..."
                  className="w-full bg-orbit-bg border border-orbit-border rounded-lg py-2 px-3 text-xs text-orbit-white focus:border-orbit-accent focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-orbit-accent text-orbit-bg font-bold text-xs uppercase rounded-lg shadow-md shadow-orbit-accent/15 hover:opacity-95 transition-all text-center cursor-pointer"
              >
                Submit
              </button>
            </form>

            {/* Right Column: Active Interactive chat logs (col-span-7) */}
            <div className="lg:col-span-7 flex flex-col justify-between h-[360px]">
              
              {/* Ticket selector header */}
              <div className="flex bg-orbit-bg p-1.5 border border-orbit-border/70 rounded-lg justify-start gap-2 overflow-x-auto scrollbar-none">
                {user.tickets.length === 0 ? (
                  <span className="text-[10px] text-orbit-gray-text p-1 font-sans">No active support tickets.</span>
                ) : (
                  user.tickets.map((tkt) => (
                    <button
                      key={tkt.id}
                      onClick={() => setSelectedTicketId(tkt.id)}
                      className={`px-3 py-1.5 rounded text-[10px] font-semibold tracking-normal shrink-0 transition-all ${
                        selectedTicketId === tkt.id 
                          ? "bg-orbit-card text-orbit-accent border border-orbit-border" 
                          : "text-orbit-gray-text hover:text-orbit-white"
                      }`}
                    >
                      {tkt.subject.slice(0, 16)}...
                    </button>
                  ))
                )}
              </div>

              {/* Chat log messages */}
              <div className="flex-1 overflow-y-auto my-4 p-3 bg-orbit-darkcard/50 border border-orbit-border/40 rounded-xl space-y-4">
                {activeTicketObj ? (
                  activeTicketObj.messages.map((m, idx) => {
                    const isSupport = m.sender === "support";
                    return (
                      <div 
                        key={idx}
                        className={`flex flex-col ${isSupport ? "items-start" : "items-end"}`}
                      >
                        <div className={`max-w-[85%] rounded-xl p-3 text-xs leading-normal ${
                          isSupport 
                            ? "bg-orbit-bg/85 border border-orbit-border text-orbit-white rounded-tl-none" 
                            : "bg-orbit-accent text-orbit-bg font-medium rounded-tr-none"
                        }`}>
                          <p>{m.text}</p>
                          <span className="block text-[8px] text-right mt-1 opacity-70">
                            {m.time}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-orbit-gray-text space-y-2">
                    <MessageSquare size={24} className="text-orbit-border animate-bounce" />
                    <p className="text-xs">Select active ticket tabs above, or submit new ones on the left-wing form.</p>
                  </div>
                )}
              </div>

              {/* Chat Reply form */}
              {activeTicketObj && (
                <form onSubmit={handleReplySubmit} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={tktReplyTxt}
                    onChange={(e) => setTktReplyTxt(e.target.value)}
                    placeholder="Type supplementary explanations..."
                    className="flex-1 bg-orbit-bg border border-orbit-border focus:border-orbit-accent rounded-xl px-4 py-2 text-xs text-orbit-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="p-2.5 rounded-xl bg-orbit-accent text-orbit-bg font-bold transition-all cursor-pointer"
                  >
                    <Send size={14} />
                  </button>
                </form>
              )}

            </div>

          </div>
        )}

      </div>

    </div>
  );
};
