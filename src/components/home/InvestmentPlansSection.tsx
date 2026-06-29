import React from 'react';
import { motion } from 'motion/react';
import { Zap, Shield, ShieldCheck, BarChart3, Lock, Globe, Layers, Target, Users, TrendingUp, ThumbsUp, Headset, Database, Puzzle, Fingerprint, Mail, Sparkles } from 'lucide-react';
import { useOrbit } from '../../context/OrbitContext';

// Investment Plans Section (matching reference image precisely with floating transparent cards, gold-orange theme, and scroll entrance effects)
export const InvestmentPlansSection = ({ onNavigate }: { onNavigate: (view: string) => void }) => {
  const { user } = useOrbit();
  const plansList = [
    {
      name: "BRONZE PLAN",
      roi: "12.00%",
      min: "$100.00",
      max: "$999.00",
      duration: "7 Days",
      icon: Sparkles,
      colorClass: "text-[#CD7F32] bg-[#CD7F32]/10 border-[#CD7F32]/20",
      glowClass: "via-[#CD7F32]/30"
    },
    {
      name: "SILVER PLAN",
      roi: "18.00%",
      min: "$1,000.00",
      max: "$4,999.00",
      duration: "10 Days",
      icon: Shield,
      colorClass: "text-blue-400 bg-blue-400/10 border-blue-400/20",
      glowClass: "via-blue-400/30"
    },
    {
      name: "GOLD PLAN",
      roi: "24.00%",
      min: "$5,000.00",
      max: "$9,999.00",
      duration: "14 Days",
      icon: Layers,
      colorClass: "text-[#FFB11A] bg-[#FFB11A]/10 border-[#FFB11A]/20",
      glowClass: "via-[#FFB11A]/30"
    },
    {
      name: "PLATINUM PLAN",
      roi: "36.00%",
      min: "$10,000.00",
      max: "$49,999.00",
      duration: "21 Days",
      icon: Zap,
      colorClass: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
      glowClass: "via-indigo-400/30"
    },
    {
      name: "DIAMOND PLAN",
      roi: "48.00%",
      min: "$50,000.00",
      max: "Unlimited",
      duration: "30 Days",
      icon: Target,
      colorClass: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
      glowClass: "via-emerald-400/30"
    }
  ];

  return (
    <section className="pt-12 pb-10 px-4 bg-[#0B0E11]/30 border-t border-[#2B3139]/10 relative overflow-hidden" id="investment-plans">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/[0.03] blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header section with INVESTMENT PLANS badge */}
        <div className="text-center mb-10 space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-amber-500/15 bg-amber-500/5 text-[10px] md:text-xs text-amber-500 font-bold tracking-[0.2em] font-bybit uppercase mb-1"
          >
            <Layers className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10" />
            INVESTMENT PLANS
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 60, damping: 14 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-semibold text-white tracking-tight leading-tight max-w-4xl mx-auto font-bybit"
          >
            Choose your plan and target
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 60, damping: 14, delay: 0.1 }}
            className="text-neutral-400 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed font-bybit"
          >
            Select a plan that fits your budget and timeline. Track progress from your dashboard.
          </motion.p>
        </div>

        {/* Horizontal grid with floating animated cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8">
          {plansList.map((plan, idx) => {
            const PlanIcon = plan.icon;
            return (
              <motion.div
                key={idx}
                custom={idx}
                initial={{ opacity: 0, y: 70, scale: 0.92 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.05 }}
                transition={{ type: "spring", stiffness: 65, damping: 13, delay: idx * 0.08 }}
                className={`bg-neutral-900/15 backdrop-blur-md border border-neutral-800/30 rounded-3xl p-6 flex flex-col justify-between text-left shadow-2xl relative group transition-all duration-300 hover:scale-[1.02] hover:border-white/10 transform-gpu min-h-[300px]`}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.005] to-transparent rounded-3xl pointer-events-none" />
                
                <div className="space-y-6 relative z-10">
                  {/* Colorful Plan Icon */}
                  <div className={`p-3 border rounded-2xl w-12 h-12 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 ${plan.colorClass}`}>
                    <PlanIcon className="w-6 h-6" />
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-white tracking-wider font-bybit uppercase">
                      {plan.name}
                    </h3>
                    
                    <div className="space-y-2">
                      <p className="text-neutral-400 font-bybit text-xs leading-relaxed">
                        Expected return: <span className="font-semibold text-white">{plan.roi}</span>
                      </p>
                      <p className="text-neutral-500 font-bybit text-[11px] leading-relaxed">
                        Min: {plan.min} | Max: {plan.max}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-neutral-900/40 pt-4 relative z-10">
                  <p className="text-neutral-400 font-bybit text-xs">
                    Duration: <span className="font-semibold text-white">{plan.duration}</span>
                  </p>
                  <button
                    onClick={() => {
                      if (user?.isLoggedIn) {
                        onNavigate('dashboard');
                      } else {
                        onNavigate('auth');
                      }
                    }}
                    className="mt-4 w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs py-2 rounded-lg transition-colors"
                  >
                    Invest Now
                  </button>
                </div>

                {/* Bottom accent glow */}
                <div className={`absolute bottom-0 left-6 right-6 h-[1.5px] bg-gradient-to-r from-transparent ${plan.glowClass} to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

// Section 2: Why Choose (Platform Trust Section redesigned based on User Request with gold orange theme and container-less sleekness)