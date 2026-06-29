import React, { useState } from "react";
import { useOrbit } from "../../../context/OrbitContext";
import { motion } from "motion/react";
import { Volume2, Plus, Trash2, Pin, Calendar, Check } from "lucide-react";

export const AdminBulletinsTab: React.FC = () => {
  const { adminAnnouncements, adminCreateAnnouncement, adminDeleteAnnouncement } = useOrbit();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCreate = () => {
    if (!title || !content) { setFeedback("Title and content are required."); setTimeout(() => setFeedback(null), 3000); return; }
    adminCreateAnnouncement(title, content, pinned, scheduledDate || undefined);
    setFeedback(`Announcement "${title}" published!`);
    setTitle(""); setContent(""); setPinned(false); setScheduledDate("");
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6">
      {/* Header */}
      <div className="bg-orbit-card border border-orbit-border rounded-2xl p-6">
        <h1 className="text-xl font-bold text-orbit-white flex items-center gap-2">
          <Volume2 size={20} className="text-orbit-accent" /> Announcements Panel
        </h1>
        <p className="text-xs text-orbit-gray-text mt-1">Create and manage global platform announcements.</p>
      </div>

      {/* Feedback */}
      {feedback && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <Check size={14} /> {feedback}
        </motion.div>
      )}

      {/* Create Form */}
      <div className="bg-orbit-card border border-orbit-border rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-orbit-white flex items-center gap-2"><Plus size={14} className="text-orbit-accent" /> New Announcement</h3>
        <input placeholder="Announcement Title" value={title} onChange={e => setTitle(e.target.value)}
          className="w-full px-4 py-3 bg-orbit-bg border border-orbit-border rounded-xl text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent" />
        <textarea placeholder="Announcement content..." value={content} onChange={e => setContent(e.target.value)} rows={3}
          className="w-full px-4 py-3 bg-orbit-bg border border-orbit-border rounded-xl text-sm text-orbit-white placeholder:text-orbit-gray-text focus:outline-none focus:border-orbit-accent resize-none" />
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)}
              className="w-4 h-4 rounded border border-orbit-border accent-orbit-accent" />
            <span className="text-xs text-orbit-gray-text font-bold flex items-center gap-1"><Pin size={12} /> Pin to top</span>
          </label>
          <div className="flex items-center gap-2">
            <Calendar size={12} className="text-orbit-gray-text" />
            <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
              className="px-3 py-1.5 bg-orbit-bg border border-orbit-border rounded-lg text-xs text-orbit-white focus:outline-none focus:border-orbit-accent" />
          </div>
        </div>
        <button onClick={handleCreate}
          className="flex items-center gap-2 px-6 py-2.5 bg-orbit-accent text-orbit-bg font-bold text-xs uppercase rounded-lg hover:opacity-90 transition-colors cursor-pointer">
          <Plus size={14} /> Publish Announcement
        </button>
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {adminAnnouncements.map(ann => (
          <div key={ann.id} className={`bg-orbit-card border rounded-2xl p-5 space-y-2 ${ann.pinned ? "border-orbit-accent/40" : "border-orbit-border"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {ann.pinned && <Pin size={12} className="text-orbit-accent" />}
                  <h3 className="text-sm font-bold text-orbit-white">{ann.title}</h3>
                </div>
                <p className="text-xs text-orbit-gray-text mt-2 leading-relaxed">{ann.content}</p>
                <div className="flex items-center gap-3 mt-3 text-[10px] text-orbit-gray-text">
                  <span>Published: {ann.date}</span>
                  {ann.scheduledDate && <span className="text-orbit-accent">Scheduled: {ann.scheduledDate}</span>}
                </div>
              </div>
              <button onClick={() => { if (window.confirm(`Delete "${ann.title}"?`)) adminDeleteAnnouncement(ann.id); }}
                className="p-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors cursor-pointer shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {adminAnnouncements.length === 0 && (
          <div className="text-center py-12 text-orbit-gray-text text-sm">No announcements yet.</div>
        )}
      </div>
    </motion.div>
  );
};
