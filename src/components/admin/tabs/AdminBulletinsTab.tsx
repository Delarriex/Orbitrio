import React, { useMemo, useState } from "react";
import { useOrbit } from "../../../context/OrbitContext";
import { motion } from "motion/react";
import {
  Calendar,
  Check,
  Edit3,
  Eye,
  EyeOff,
  Filter,
  Pin,
  Plus,
  Search,
  Trash2,
  Volume2,
  X
} from "lucide-react";
import type { Announcement, AnnouncementPriority } from "../../../types";

const priorities: AnnouncementPriority[] = ["Normal", "Important", "Critical"];

type FormState = {
  id?: string;
  title: string;
  content: string;
  pinned: boolean;
  enabled: boolean;
  priority: AnnouncementPriority;
  publishDate: string;
  expiryDate: string;
};

const emptyForm: FormState = {
  title: "",
  content: "",
  pinned: false,
  enabled: true,
  priority: "Normal",
  publishDate: "",
  expiryDate: ""
};

const priorityClass: Record<AnnouncementPriority, string> = {
  Normal: "bg-slate-500/10 text-slate-300 border-slate-500/30",
  Important: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  Critical: "bg-red-500/10 text-red-300 border-red-500/30"
};

export const AdminBulletinsTab: React.FC = () => {
  const { adminAnnouncements, adminCreateAnnouncement, adminUpdateAnnouncement, adminDeleteAnnouncement } = useOrbit();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | AnnouncementPriority>("all");
  const [pinFilter, setPinFilter] = useState<"all" | "pinned" | "unpinned">("all");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const editing = Boolean(form.id);

  const filteredAnnouncements = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return adminAnnouncements.filter(announcement => {
      const matchesQuery = !normalizedQuery
        || announcement.title.toLowerCase().includes(normalizedQuery)
        || announcement.content.toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "all" || (statusFilter === "enabled" ? announcement.enabled !== false : announcement.enabled === false);
      const matchesPriority = priorityFilter === "all" || (announcement.priority || "Normal") === priorityFilter;
      const matchesPin = pinFilter === "all" || (pinFilter === "pinned" ? announcement.pinned : !announcement.pinned);
      return matchesQuery && matchesStatus && matchesPriority && matchesPin;
    });
  }, [adminAnnouncements, pinFilter, priorityFilter, query, statusFilter]);

  const stats = useMemo(() => ({
    total: adminAnnouncements.length,
    enabled: adminAnnouncements.filter(item => item.enabled !== false).length,
    pinned: adminAnnouncements.filter(item => item.pinned).length,
    critical: adminAnnouncements.filter(item => item.priority === "Critical").length
  }), [adminAnnouncements]);

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 3000);
  };

  const resetForm = () => setForm(emptyForm);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      showFeedback("Title and content are required.");
      return;
    }

    if (form.publishDate && form.expiryDate && form.publishDate > form.expiryDate) {
      showFeedback("Expiry date must be after the publish date.");
      return;
    }

    setSaving(true);
    const payload = {
      title: form.title,
      content: form.content,
      pinned: form.pinned,
      enabled: form.enabled,
      priority: form.priority,
      publishDate: form.publishDate,
      expiryDate: form.expiryDate,
      scheduledDate: form.publishDate || undefined
    };

    try {
      if (form.id) {
        const existing = adminAnnouncements.find(item => item.id === form.id);
        if (!existing) throw new Error("Announcement no longer exists.");
        await adminUpdateAnnouncement({ ...existing, ...payload });
        showFeedback(`Announcement "${form.title}" updated.`);
      } else {
        await adminCreateAnnouncement(payload);
        showFeedback(`Announcement "${form.title}" created.`);
      }
      resetForm();
    } catch {
      showFeedback("Announcement could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setForm({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      pinned: announcement.pinned,
      enabled: announcement.enabled !== false,
      priority: announcement.priority || "Normal",
      publishDate: announcement.publishDate || announcement.scheduledDate || "",
      expiryDate: announcement.expiryDate || ""
    });
  };

  const handleToggleEnabled = async (announcement: Announcement) => {
    await adminUpdateAnnouncement({ ...announcement, enabled: announcement.enabled === false });
    showFeedback(`Announcement ${announcement.enabled === false ? "enabled" : "disabled"}.`);
  };

  const handleDelete = async (announcement: Announcement) => {
    if (!window.confirm(`Delete "${announcement.title}"?`)) return;
    await adminDeleteAnnouncement(announcement.id);
    if (form.id === announcement.id) resetForm();
    showFeedback("Announcement deleted.");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="bg-orbit-card border border-orbit-border rounded-2xl p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-orbit-white flex items-center gap-2">
            <Volume2 size={20} className="text-orbit-accent" /> Announcements Panel
          </h1>
          <p className="text-xs text-orbit-gray-text mt-1">Manage platform announcements with scheduling, priority, pinning, and status controls.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <span className="px-3 py-2 rounded-lg bg-orbit-bg border border-orbit-border text-orbit-gray-text">Total <strong className="block text-orbit-white">{stats.total}</strong></span>
          <span className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">Active <strong className="block">{stats.enabled}</strong></span>
          <span className="px-3 py-2 rounded-lg bg-orbit-accent/10 border border-orbit-accent/20 text-orbit-accent">Pinned <strong className="block">{stats.pinned}</strong></span>
          <span className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300">Critical <strong className="block">{stats.critical}</strong></span>
        </div>
      </div>

      {feedback && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <Check size={14} /> {feedback}
        </motion.div>
      )}

      <div className="bg-orbit-card border border-orbit-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-orbit-white flex items-center gap-2">
            {editing ? <Edit3 size={14} className="text-orbit-accent" /> : <Plus size={14} className="text-orbit-accent" />}
            {editing ? "Edit Announcement" : "New Announcement"}
          </h3>
          {editing && (
            <button onClick={resetForm} className="p-2 bg-orbit-bg border border-orbit-border text-orbit-gray-text rounded-lg hover:text-orbit-white" title="Cancel edit">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <input placeholder="Announcement title" value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-4 py-3 bg-orbit-bg border border-orbit-border rounded-xl text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent" />
          <select value={form.priority} onChange={e => setForm(prev => ({ ...prev, priority: e.target.value as AnnouncementPriority }))}
            className="w-full px-4 py-3 bg-orbit-bg border border-orbit-border rounded-xl text-sm text-orbit-white focus:outline-none focus:border-orbit-accent">
            {priorities.map(priority => <option key={priority} value={priority}>{priority} Priority</option>)}
          </select>
        </div>

        <textarea placeholder="Announcement content..." value={form.content} onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))} rows={4}
          className="w-full px-4 py-3 bg-orbit-bg border border-orbit-border rounded-xl text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent resize-none" />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <label className="flex items-center gap-2 px-3 py-2 bg-orbit-bg border border-orbit-border rounded-xl cursor-pointer">
            <input type="checkbox" checked={form.enabled} onChange={e => setForm(prev => ({ ...prev, enabled: e.target.checked }))} className="w-4 h-4 accent-orbit-accent" />
            <span className="text-xs text-orbit-gray-text font-bold flex items-center gap-1"><Eye size={12} /> Enabled</span>
          </label>
          <label className="flex items-center gap-2 px-3 py-2 bg-orbit-bg border border-orbit-border rounded-xl cursor-pointer">
            <input type="checkbox" checked={form.pinned} onChange={e => setForm(prev => ({ ...prev, pinned: e.target.checked }))} className="w-4 h-4 accent-orbit-accent" />
            <span className="text-xs text-orbit-gray-text font-bold flex items-center gap-1"><Pin size={12} /> Pinned</span>
          </label>
          <label className="flex items-center gap-2 px-3 py-2 bg-orbit-bg border border-orbit-border rounded-xl">
            <Calendar size={12} className="text-orbit-gray-text" />
            <input type="date" value={form.publishDate} onChange={e => setForm(prev => ({ ...prev, publishDate: e.target.value }))}
              className="min-w-0 flex-1 bg-transparent text-xs text-orbit-white focus:outline-none" />
          </label>
          <label className="flex items-center gap-2 px-3 py-2 bg-orbit-bg border border-orbit-border rounded-xl">
            <Calendar size={12} className="text-orbit-gray-text" />
            <input type="date" value={form.expiryDate} onChange={e => setForm(prev => ({ ...prev, expiryDate: e.target.value }))}
              className="min-w-0 flex-1 bg-transparent text-xs text-orbit-white focus:outline-none" />
          </label>
        </div>

        <button onClick={handleSubmit} disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-orbit-accent text-orbit-bg font-bold text-xs uppercase rounded-lg hover:opacity-90 transition-colors cursor-pointer disabled:opacity-50">
          {editing ? <Edit3 size={14} /> : <Plus size={14} />} {saving ? "Saving..." : editing ? "Save Announcement" : "Publish Announcement"}
        </button>
      </div>

      <div className="bg-orbit-card border border-orbit-border rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <label className="md:col-span-2 flex items-center gap-2 px-3 py-2 bg-orbit-bg border border-orbit-border rounded-xl">
            <Search size={14} className="text-orbit-gray-text" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search announcements" className="w-full bg-transparent text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none" />
          </label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} className="px-3 py-2 bg-orbit-bg border border-orbit-border rounded-xl text-xs text-orbit-white focus:outline-none focus:border-orbit-accent">
            <option value="all">All statuses</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as typeof priorityFilter)} className="px-3 py-2 bg-orbit-bg border border-orbit-border rounded-xl text-xs text-orbit-white focus:outline-none focus:border-orbit-accent">
            <option value="all">All priorities</option>
            {priorities.map(priority => <option key={priority} value={priority}>{priority}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-orbit-gray-text">
          <Filter size={13} />
          {["all", "pinned", "unpinned"].map(item => (
            <button key={item} onClick={() => setPinFilter(item as typeof pinFilter)} className={`px-3 py-1.5 rounded-lg border font-bold capitalize ${pinFilter === item ? "bg-orbit-accent text-orbit-bg border-orbit-accent" : "bg-orbit-bg border-orbit-border hover:text-orbit-white"}`}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredAnnouncements.map(announcement => {
          const priority = announcement.priority || "Normal";
          const disabled = announcement.enabled === false;
          return (
            <div key={announcement.id} className={`bg-orbit-card border rounded-2xl p-5 space-y-3 ${announcement.pinned ? "border-orbit-accent/40" : "border-orbit-border"} ${disabled ? "opacity-60" : ""}`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {announcement.pinned && <Pin size={12} className="text-orbit-accent" />}
                    <h3 className="text-sm font-bold text-orbit-white break-words">{announcement.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${priorityClass[priority]}`}>{priority}</span>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${disabled ? "bg-slate-500/10 text-slate-400 border-slate-500/30" : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"}`}>{disabled ? "Disabled" : "Enabled"}</span>
                  </div>
                  <p className="text-xs text-orbit-gray-text mt-2 leading-relaxed break-words">{announcement.content}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] text-orbit-gray-text">
                    <span>Created: {announcement.date}</span>
                    {announcement.publishDate && <span className="text-orbit-accent">Publishes: {announcement.publishDate}</span>}
                    {announcement.expiryDate && <span className="text-red-300">Expires: {announcement.expiryDate}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleToggleEnabled(announcement)} className="p-2 bg-orbit-bg border border-orbit-border text-orbit-gray-text rounded-lg hover:text-orbit-white" title={disabled ? "Enable" : "Disable"}>
                    {disabled ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => handleEdit(announcement)} className="p-2 bg-orbit-bg border border-orbit-border text-orbit-accent rounded-lg hover:bg-orbit-accent/10" title="Edit">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => handleDelete(announcement)} className="p-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredAnnouncements.length === 0 && (
          <div className="text-center py-12 text-orbit-gray-text text-sm bg-orbit-card border border-orbit-border rounded-2xl">No announcements match the current filters.</div>
        )}
      </div>
    </motion.div>
  );
};

