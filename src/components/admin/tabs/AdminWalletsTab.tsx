import React, { useState } from "react";
import { useOrbit } from "../../../context/OrbitContext";
import { motion } from "motion/react";
import { CreditCard, Save, Check, Copy } from "lucide-react";

export const AdminWalletsTab: React.FC = () => {
  const { adminWallets, updateAdminWallets } = useOrbit();
  const [form, setForm] = useState<Record<string, string>>({ ...adminWallets });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleSave = () => {
    updateAdminWallets(form);
    setFeedback("Wallet addresses updated successfully!");
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const walletLabels: Record<string, string> = {
    BTC: "Bitcoin (BTC)",
    ETH: "Ethereum (ETH)",
    USDT_ERC20: "USDT (ERC-20)",
    USDT_TRC20: "USDT (TRC-20)",
    BNB: "Binance Coin (BNB)"
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <div className="bg-orbit-card border border-orbit-border rounded-2xl p-6">
        <h1 className="text-xl font-bold text-orbit-white flex items-center gap-2">
          <CreditCard size={20} className="text-orbit-accent" /> Wallet Gateways
        </h1>
        <p className="text-xs text-orbit-gray-text mt-1">Configure the deposit wallet addresses shown to users. Changes update globally in real-time via Firestore.</p>
      </div>

      {/* Feedback */}
      {feedback && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <Check size={14} /> {feedback}
        </motion.div>
      )}

      {/* Wallet Fields */}
      <div className="space-y-4">
        {Object.keys(adminWallets).map(key => (
          <div key={key} className="bg-orbit-card border border-orbit-border rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-orbit-gray-text uppercase tracking-wider">
                {walletLabels[key] || key}
              </label>
              <button onClick={() => handleCopy(key, form[key] || "")}
                className="flex items-center gap-1 text-[10px] text-orbit-accent hover:text-orbit-white transition-colors cursor-pointer">
                {copiedKey === key ? <><Check size={10} /> Copied!</> : <><Copy size={10} /> Copy</>}
              </button>
            </div>
            <input
              value={form[key] || ""}
              onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
              className="w-full px-4 py-2.5 bg-orbit-bg border border-orbit-border rounded-lg text-sm text-orbit-white font-mono placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent"
            />
          </div>
        ))}
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave}
          className="flex items-center gap-2 px-8 py-3 bg-orbit-accent text-orbit-bg font-bold text-xs uppercase rounded-xl hover:opacity-90 cursor-pointer">
          <Save size={14} /> Save Wallet Addresses
        </button>
      </div>
    </motion.div>
  );
};
