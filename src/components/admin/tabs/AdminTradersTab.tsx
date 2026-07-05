import React, { useState, useRef } from "react";
import { useOrbit } from "../../../context/OrbitContext";
import { motion } from "motion/react";
import { Award, Edit3, Plus, Trash2, Save, X, Check, Upload, ImagePlus } from "lucide-react";
import type { TraderProfile } from "../../../types";

export const AdminTradersTab: React.FC = () => {
  const { traders, adminUpdateTrader, adminCreateTrader, adminDeleteTrader } = useOrbit();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", avatar: "", roi: "", winRate: "", followers: "", maxFollowers: "",
    assetsUnderManagement: "", riskScore: "", profitDays: ""
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setForm({ name: "", avatar: "", roi: "", winRate: "", followers: "", maxFollowers: "", assetsUnderManagement: "", riskScore: "", profitDays: "" });
    setIsCreating(false);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (PNG, JPG, WEBP, etc.)");
      return;
    }
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5MB.");
      return;
    }
    // Read file and resize to 256px for optimized storage
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 256;
        let w = img.width, h = img.height;
        if (w > h) { h = (h / w) * MAX; w = MAX; }
        else { w = (w / h) * MAX; h = MAX; }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL("image/webp", 0.85);
          setForm(f => ({ ...f, avatar: dataUrl }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const startEdit = (t: TraderProfile) => {
    setEditingId(t.id);
    setIsCreating(false);
    setForm({
      name: t.name, avatar: t.avatar, roi: (t.roi ?? 0).toString(), winRate: (t.winRate ?? 0).toString(),
      followers: (t.followers ?? 0).toString(), maxFollowers: (t.maxFollowers ?? 500).toString(),
      assetsUnderManagement: t.assetsUnderManagement || "$0", riskScore: (t.riskScore ?? 2).toString(), profitDays: (t.profitDays ?? 0).toString()
    });
  };

  const handleCreate = async () => {
    if (!form.name || !form.avatar) {
      alert("Please enter a name and upload a profile photo.");
      return;
    }
    try {
      await adminCreateTrader({
        name: form.name,
        avatar: form.avatar,
        roi: form.roi !== "" ? parseFloat(form.roi) : 0,
        winRate: form.winRate !== "" ? parseFloat(form.winRate) : 0,
        followers: form.followers !== "" ? parseInt(form.followers) : 0,
        maxFollowers: form.maxFollowers !== "" ? parseInt(form.maxFollowers) : 500,
        assetsUnderManagement: form.assetsUnderManagement || "$0",
        riskScore: form.riskScore !== "" ? parseInt(form.riskScore) : 2,
        profitDays: form.profitDays !== "" ? parseInt(form.profitDays) : 0,
        chartData: Array.from({ length: 10 }, () => Math.random() * 100)
      });
      setFeedback(`Created trader: ${form.name}`);
      resetForm();
    } catch (e: any) {
      setFeedback(`Failed to create trader: ${e.message}`);
    }
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      await adminUpdateTrader(editingId, {
        name: form.name,
        avatar: form.avatar,
        roi: form.roi !== "" ? parseFloat(form.roi) : 0,
        winRate: form.winRate !== "" ? parseFloat(form.winRate) : 0,
        followers: form.followers !== "" ? parseInt(form.followers) : 0,
        maxFollowers: form.maxFollowers !== "" ? parseInt(form.maxFollowers) : 500,
        assetsUnderManagement: form.assetsUnderManagement,
        riskScore: form.riskScore !== "" ? parseInt(form.riskScore) : 2,
        profitDays: form.profitDays !== "" ? parseInt(form.profitDays) : 0,
      });
      setFeedback(`Updated trader: ${form.name}`);
      resetForm();
    } catch (e: any) {
      setFeedback(`Failed to update trader: ${e.message}`);
    }
    setTimeout(() => setFeedback(null), 5000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <div className="bg-orbit-card border border-orbit-border rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-orbit-white flex items-center gap-2">
            <Award size={20} className="text-orbit-accent" /> Traders List
          </h1>
          <p className="text-xs text-orbit-gray-text mt-1">Manage copy trading master traders displayed on the platform.</p>
        </div>
        <button onClick={() => { setIsCreating(true); setEditingId(null); resetForm(); setIsCreating(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-orbit-accent text-orbit-bg font-bold text-xs uppercase rounded-lg hover:opacity-90 cursor-pointer">
          <Plus size={14} /> Add Trader
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <Check size={14} /> {feedback}
        </motion.div>
      )}

      {/* Create / Edit Form */}
      {(isCreating || editingId) && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-orbit-card border border-orbit-accent/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-orbit-white">{isCreating ? "Add New Trader" : "Edit Trader"}</h3>
            <button onClick={resetForm} className="p-1.5 rounded-lg bg-orbit-border/50 text-orbit-gray-text hover:text-orbit-white cursor-pointer"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent" />
            {/* Avatar File Upload */}
            <div className="flex items-center gap-3 px-3 py-1.5 bg-orbit-bg border border-orbit-border rounded-lg relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
                id="trader-avatar-upload"
              />
              {form.avatar ? (
                <img src={form.avatar} alt="Avatar preview" className="w-8 h-8 rounded-full object-cover border-2 border-orbit-accent/40 flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-orbit-border/50 flex items-center justify-center flex-shrink-0">
                  <ImagePlus size={14} className="text-orbit-gray-text" />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-orbit-accent font-semibold hover:text-orbit-white transition-colors cursor-pointer truncate"
              >
                <Upload size={12} />
                {form.avatar ? "Change Photo" : "Upload Photo"}
              </button>
            </div>
            <input type="number" placeholder="ROI % (e.g. 142.5)" value={form.roi} onChange={e => setForm(f => ({ ...f, roi: e.target.value }))}
              className="px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent" />
            <input type="number" placeholder="Win Rate (%)" value={form.winRate} onChange={e => setForm(f => ({ ...f, winRate: e.target.value }))}
              className="px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent" />
            <input type="number" placeholder="Followers" value={form.followers} onChange={e => setForm(f => ({ ...f, followers: e.target.value }))}
              className="px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent" />
            <input type="number" placeholder="Max Followers" value={form.maxFollowers} onChange={e => setForm(f => ({ ...f, maxFollowers: e.target.value }))}
              className="px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent" />
            <input placeholder="AUM (e.g. $1.4M)" value={form.assetsUnderManagement} onChange={e => setForm(f => ({ ...f, assetsUnderManagement: e.target.value }))}
              className="px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent" />
            <input type="number" placeholder="Risk Score (1-5)" value={form.riskScore} onChange={e => setForm(f => ({ ...f, riskScore: e.target.value }))}
              className="px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent" />
            <input type="number" placeholder="Profit Days (e.g. 90)" value={form.profitDays} onChange={e => setForm(f => ({ ...f, profitDays: e.target.value }))}
              className="px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent" />
          </div>
          <button onClick={isCreating ? handleCreate : handleUpdate}
            className="flex items-center gap-2 px-6 py-2 bg-orbit-accent text-orbit-bg font-bold text-xs uppercase rounded-lg hover:opacity-90 cursor-pointer">
            <Save size={14} /> {isCreating ? "Create Trader" : "Save Changes"}
          </button>
        </motion.div>
      )}

      {/* Traders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {traders.map(t => (
          <div key={t.id} className="bg-orbit-card border border-orbit-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover border-2 border-orbit-accent/30" />
              <div>
                <h3 className="text-sm font-bold text-orbit-white">{t.name}</h3>
                <p className="text-[10px] text-orbit-gray-text">{t.assetsUnderManagement} AUM</p>
              </div>
            </div>
            {/* Highlighted ROI & Days */}
            <div className="flex gap-2">
              <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 text-center">
                <p className="text-[9px] text-orbit-gray-text uppercase tracking-wider">ROI</p>
                <p className="text-sm font-bold text-emerald-400">{t.roi ?? 0}%</p>
              </div>
              <div className="flex-1 bg-orbit-accent/10 border border-orbit-accent/20 rounded-lg px-3 py-2 text-center">
                <p className="text-[9px] text-orbit-gray-text uppercase tracking-wider">Profit Days</p>
                <p className="text-sm font-bold text-orbit-accent">{t.profitDays ?? 0}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div><span className="text-orbit-gray-text">Win:</span> <span className="text-orbit-white font-bold ml-1">{t.winRate}%</span></div>
              <div><span className="text-orbit-gray-text">Risk:</span> <span className="text-orbit-accent font-bold ml-1">{t.riskScore}/5</span></div>
              <div><span className="text-orbit-gray-text">Followers:</span> <span className="text-orbit-white font-bold ml-1">{t.followers}/{t.maxFollowers}</span></div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-orbit-border/50">
              <button onClick={() => startEdit(t)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-orbit-accent/10 border border-orbit-accent/30 text-orbit-accent text-[10px] font-bold rounded-lg hover:bg-orbit-accent/20 cursor-pointer">
                <Edit3 size={10} /> Edit
              </button>
              <button onClick={() => { if (window.confirm(`Delete "${t.name}"?`)) adminDeleteTrader(t.id); }}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold rounded-lg hover:bg-red-500/20 cursor-pointer">
                <Trash2 size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
