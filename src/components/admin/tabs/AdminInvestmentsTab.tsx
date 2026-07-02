import React, { useState } from "react";
import { useOrbit } from "../../../context/OrbitContext";
import { motion } from "motion/react";
import { Layers, Plus, Trash2, Edit3, Pause, Play, Save, X, Check } from "lucide-react";
import type { InvestmentPlan } from "../../../types";

export const AdminInvestmentsTab: React.FC = () => {
  const { plans, adminCreatePlan, adminUpdatePlan, adminDeletePlan, adminSetPlanStatus } = useOrbit();

  const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: "", minDeposit: "", maxDeposit: "", durationDays: "", roiPercent: "", description: "" });
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => { setFeedback(msg); setTimeout(() => setFeedback(null), 3000); };

  const resetForm = () => {
    setFormData({ name: "", minDeposit: "", maxDeposit: "", durationDays: "", roiPercent: "", description: "" });
    setIsCreating(false);
    setEditingPlan(null);
  };

  const handleCreate = () => {
    const { name, minDeposit, maxDeposit, durationDays, roiPercent, description } = formData;
    if (!name || !minDeposit || !maxDeposit || !durationDays || !roiPercent) return showFeedback("Fill all required fields.");
    const parsedRoi = parseFloat(roiPercent);
    const parsedDays = parseInt(durationDays);
    if (parsedRoi <= 0) return showFeedback("ROI must be greater than 0.");
    if (parsedDays <= 0) return showFeedback("Duration must be at least 1 day.");
    adminCreatePlan({
      name, description,
      minDeposit: parseFloat(minDeposit), maxDeposit: parseFloat(maxDeposit),
      durationDays: parsedDays, roiPercent: parsedRoi,
      roiCapPercent: parsedRoi,
      status: "active"
    });
    showFeedback(`Created plan: ${name} — ROI ${parsedRoi}%, ${parsedDays} days`);
    resetForm();
  };

  const handleUpdate = () => {
    if (!editingPlan) return;
    const updatedRoi = formData.roiPercent !== "" ? parseFloat(formData.roiPercent) : editingPlan.roiPercent;
    const updatedDays = formData.durationDays !== "" ? parseInt(formData.durationDays) : editingPlan.durationDays;
    if (updatedRoi <= 0) return showFeedback("ROI must be greater than 0.");
    if (updatedDays <= 0) return showFeedback("Duration must be at least 1 day.");
    const updatedName = formData.name || editingPlan.name;
    adminUpdatePlan({
      ...editingPlan,
      name: updatedName,
      minDeposit: formData.minDeposit !== "" ? parseFloat(formData.minDeposit) : editingPlan.minDeposit,
      maxDeposit: formData.maxDeposit !== "" ? parseFloat(formData.maxDeposit) : editingPlan.maxDeposit,
      durationDays: updatedDays,
      roiPercent: updatedRoi,
      roiCapPercent: editingPlan.roiCapPercent ?? updatedRoi,
      description: formData.description || editingPlan.description
    });
    showFeedback(`Updated plan: ${updatedName} — ROI ${updatedRoi}%, ${updatedDays} days`);
    resetForm();
  };

  const startEdit = (plan: InvestmentPlan) => {
    setEditingPlan(plan);
    setIsCreating(false);
    setFormData({
      name: plan.name,
      minDeposit: plan.minDeposit.toString(),
      maxDeposit: plan.maxDeposit.toString(),
      durationDays: plan.durationDays.toString(),
      roiPercent: plan.roiPercent.toString(),
      description: plan.description
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <div className="bg-orbit-card border border-orbit-border rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-orbit-white flex items-center gap-2">
            <Layers size={20} className="text-orbit-accent" /> Investment Plans
          </h1>
          <p className="text-xs text-orbit-gray-text mt-1">Create, edit, pause, or delete investment plans.</p>
        </div>
        <button
          onClick={() => { setIsCreating(true); setEditingPlan(null); setFormData({ name: "", minDeposit: "", maxDeposit: "", durationDays: "", roiPercent: "", description: "" }); }}
          className="flex items-center gap-2 px-4 py-2 bg-orbit-accent text-orbit-bg font-bold text-xs uppercase rounded-lg hover:opacity-90 transition-colors cursor-pointer"
        >
          <Plus size={14} /> New Plan
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <Check size={14} /> {feedback}
        </motion.div>
      )}

      {/* Create / Edit Form */}
      {(isCreating || editingPlan) && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-orbit-card border border-orbit-accent/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-orbit-white">{isCreating ? "Create New Plan" : `Editing: ${editingPlan?.name}`}</h3>
            <button onClick={resetForm} className="p-1.5 rounded-lg bg-orbit-border/50 text-orbit-gray-text hover:text-orbit-white transition-colors cursor-pointer"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input placeholder="Plan Name" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
              className="px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent" />
            <input type="number" placeholder="Min Deposit ($)" value={formData.minDeposit} onChange={e => setFormData(f => ({ ...f, minDeposit: e.target.value }))}
              className="px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent" />
            <input type="number" placeholder="Max Deposit ($)" value={formData.maxDeposit} onChange={e => setFormData(f => ({ ...f, maxDeposit: e.target.value }))}
              className="px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent" />
            <input type="number" placeholder="Duration Days (e.g. 14)" value={formData.durationDays} onChange={e => setFormData(f => ({ ...f, durationDays: e.target.value }))} min="1"
              className="px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent" />
            <input type="number" placeholder="ROI % (Total Return)" value={formData.roiPercent} onChange={e => setFormData(f => ({ ...f, roiPercent: e.target.value }))} min="0.1" step="0.1"
              className="px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent" />
            <input placeholder="Description" value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
              className="px-3 py-2 bg-orbit-bg border border-orbit-border rounded-lg text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent sm:col-span-2 lg:col-span-1" />
          </div>
          <button onClick={isCreating ? handleCreate : handleUpdate}
            className="flex items-center gap-2 px-6 py-2 bg-orbit-accent text-orbit-bg font-bold text-xs uppercase rounded-lg hover:opacity-90 transition-colors cursor-pointer">
            <Save size={14} /> {isCreating ? "Create Plan" : "Save Changes"}
          </button>
        </motion.div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map(plan => (
          <div key={plan.id} className="bg-orbit-card border border-orbit-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-orbit-white">{plan.name}</h3>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${plan.status === "active" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"}`}>
                {plan.status.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-orbit-gray-text">Min:</span> <span className="text-orbit-white font-bold font-data ml-1">${plan.minDeposit.toLocaleString()}</span></div>
              <div><span className="text-orbit-gray-text">Max:</span> <span className="text-orbit-white font-bold font-data ml-1">${plan.maxDeposit.toLocaleString()}</span></div>
              <div><span className="text-orbit-gray-text">Duration:</span> <span className="text-orbit-white font-bold font-data ml-1">{plan.durationDays}d</span></div>
              <div><span className="text-orbit-gray-text">ROI:</span> <span className="text-orbit-accent font-bold font-data ml-1">{plan.roiPercent}%</span></div>
            </div>
            <p className="text-[10px] text-orbit-gray-text leading-relaxed line-clamp-2">{plan.description}</p>
            <div className="flex gap-2 pt-2 border-t border-orbit-border/50">
              <button onClick={() => startEdit(plan)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-orbit-accent/10 border border-orbit-accent/30 text-orbit-accent text-[10px] font-bold rounded-lg hover:bg-orbit-accent/20 cursor-pointer">
                <Edit3 size={10} /> Edit
              </button>
              <button onClick={() => adminSetPlanStatus(plan.id, plan.status === "active" ? "paused" : "active")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer border ${plan.status === "active" ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"}`}>
                {plan.status === "active" ? <><Pause size={10} /> Pause</> : <><Play size={10} /> Activate</>}
              </button>
              <button onClick={() => { if (window.confirm(`Delete "${plan.name}"?`)) adminDeletePlan(plan.id); }}
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
