import React, { useState } from "react";
import { useOrbit } from "../../../context/OrbitContext";
import { InvestmentPlan } from "../../../types";
import { motion } from "motion/react";
import { 
  Users, Layers, ArrowDownLeft, ArrowUpRight, Bell, Volume2, ShieldAlert, 
  MessageSquare, Activity, UserCheck, Ban, PenTool, Check, X, Menu, CreditCard, 
  Key, Database, Search, Plus, Trash2, FileText, Lock, Compass, DollarSign, Award, Gift
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from "recharts";

export const AdminOverviewTab: React.FC = () => {
  const orbit = useOrbit();
  const { user, plans, adminUsers } = orbit;
  



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

  const chartData = [
    { name: "Deposits", volume: totalDepositVolume },
    { name: "Withdrawals", volume: totalWithdrawalVolume }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
          <div className="space-y-6">
            
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Network Volume", val: `$${totalDepositVolume.toLocaleString()}`, change: "+14.2%", icon: Activity, color: "text-orbit-green" },
                { label: "Active Investors", val: activeUserCount, change: "+5.8%", icon: Users, color: "text-orbit-accent" },
                { label: "Pending Payouts", val: pendingPayoutCount, change: "-2", icon: ArrowUpRight, color: "text-[#DFAD12]" },
                { label: "Total Asset Investments", val: `$${totalInvestmentsPlaced.toLocaleString()}`, change: "+22%", icon: Layers, color: "text-orbit-white" }
              ].map((stat, idx) => (
                <div key={idx} className="bg-orbit-card border border-orbit-border rounded-2xl p-5 flex flex-col justify-between h-[120px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-orbit-gray-text font-bold uppercase tracking-wider">{stat.label}</span>
                    <stat.icon size={16} className={stat.color} />
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-orbit-white font-data">{stat.val}</span>
                    <span className="text-[10px] font-bold text-orbit-green">{stat.change}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-orbit-bg border border-orbit-border/50 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
              <button onClick={() => window.location.hash = "#users"} className="flex-1 py-2 bg-orbit-card border border-orbit-border text-orbit-white hover:border-orbit-accent text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-2">
                <Users size={14} className="text-orbit-accent" />
                Manage Users
              </button>
              <button onClick={() => window.location.hash = "#deposits"} className="flex-1 py-2 bg-orbit-card border border-orbit-border text-orbit-white hover:border-orbit-accent text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-2">
                <ArrowDownLeft size={14} className="text-orbit-green" />
                Review Invoices
              </button>
              <button onClick={() => window.location.hash = "#support"} className="flex-1 py-2 bg-orbit-card border border-orbit-border text-orbit-white hover:border-orbit-accent text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-2">
                <MessageSquare size={14} className="text-[#DFAD12]" />
                Support Desk
              </button>
            </div>

            {/* Platform Financial Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="bg-orbit-card border border-orbit-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-orbit-white">Platform Fiscal Hedging</h3>
                  <span className="text-[10px] uppercase font-bold text-orbit-accent border border-orbit-accent/30 bg-orbit-accent/10 px-2 py-0.5 rounded-full">Automated Mode</span>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-medium uppercase tracking-wider">Hedged Revenue Base</span>
                    <span className="font-bold text-orbit-green font-data text-sm">+${platformHedgedRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-medium uppercase tracking-wider">Projected Next Month</span>
                    <span className="font-bold text-orbit-white font-data text-sm">+${(platformHedgedRevenue * 1.15).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500 font-medium uppercase tracking-wider">System Yield Rate</span>
                    <span className="font-bold text-orbit-accent font-data text-sm">4.2%</span>
                  </div>
                  
                  <div className="pt-4 border-t border-orbit-border/40 mt-4">
                    <button className="w-full py-2 bg-orbit-accent text-orbit-bg font-bold uppercase tracking-wider text-[10px] rounded hover:opacity-90 cursor-pointer">
                      Export Hedging Log
                    </button>
                  </div>
                </div>
              </div>

              {/* Added Recharts Graph */}
              <div className="bg-orbit-card border border-orbit-border rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-orbit-white">In/Out Volume Breakdown</h3>
                  <p className="text-[10px] text-orbit-gray-text mt-1">Comparisons of total accepted deposits against total settled withdrawals.</p>
                </div>
                <div className="h-[200px] mt-4">
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                      <XAxis type="number" stroke="#666" tick={{ fill: "#666", fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" stroke="#666" tick={{ fill: "#ccc", fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#111", borderColor: "#333", borderRadius: "8px", fontSize: "12px" }} 
                        itemStyle={{ color: "#fff" }}
                        formatter={(val) => `$${Number(val).toLocaleString()}`}
                      />
                      <Bar dataKey="volume" fill="#FF7F00" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
    </motion.div>
  );
};
