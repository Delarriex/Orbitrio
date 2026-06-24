import React from "react";
import { ShieldCheck } from "lucide-react";
import { useOrbit } from "../context/OrbitContext";

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { siteContent } = useOrbit();
  return (
    <footer className="w-full bg-[#0B0E14] border-t border-orbit-border/95 py-12 text-xs text-orbit-gray-text mt-auto font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        <div className="md:col-span-4 space-y-3">
          <span className="font-sans font-black tracking-widest text-[#F5F6F8]">ORBITR<span className="text-orbit-accent">IO</span></span>
          <p className="leading-relaxed pr-6 text-[11px] font-sans">
            {siteContent?.footer_text || "Simple, fast, and secure crypto trading. Enjoy real-time charts, automated copy trading, and 24/7 AI-powered assistance."}
          </p>
        </div>

        <div className="md:col-span-2 space-y-2">
          <strong className="text-orbit-white uppercase font-mono tracking-wider text-[10px] block">Explore</strong>
          <button onClick={() => onNavigate("home")} className="block hover:text-orbit-white hover:underline text-left cursor-pointer font-sans">Homepage</button>
          <button onClick={() => onNavigate("markets")} className="block hover:text-orbit-white hover:underline text-left cursor-pointer font-sans">Markets</button>
          <button onClick={() => onNavigate("copy-trading")} className="block hover:text-orbit-white hover:underline text-left cursor-pointer font-sans">Copy Trading</button>
          <button onClick={() => onNavigate("plans")} className="block hover:text-orbit-white hover:underline text-left cursor-pointer font-sans">Earn</button>
          <button onClick={() => onNavigate("dashboard-admin")} className="block text-orbit-accent hover:underline text-left cursor-pointer font-sans font-semibold">Administrative Access</button>
        </div>

        <div className="md:col-span-2 space-y-2">
          <strong className="text-orbit-white uppercase font-mono tracking-wider text-[10px] block">Legal</strong>
          <button onClick={() => onNavigate("home#about-us")} className="block hover:text-orbit-white hover:underline text-left cursor-pointer font-sans">About Us</button>
          <button onClick={() => onNavigate("home#contact")} className="block hover:text-orbit-white hover:underline text-left cursor-pointer font-sans">Contact Us</button>
          <button onClick={() => onNavigate("terms")} className="block hover:text-orbit-white hover:underline text-left cursor-pointer font-sans">Terms of Service</button>
          <button onClick={() => onNavigate("privacy")} className="block hover:text-orbit-white hover:underline text-left cursor-pointer font-sans">Privacy Policy</button>
        </div>

        <div className="md:col-span-3 space-y-2 col-span-1">
          <strong className="text-orbit-white uppercase font-mono tracking-wider text-[10px] block">Fund Safety</strong>
          <div className="flex items-center gap-1.5 min-h-[16px] font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-orbit-green animate-ping" />
            <span>1:1 Fully Backed Reserves</span>
          </div>
          <p className="text-[10px] pr-2 font-sans">
            All user balances are secured with high-standard protection. Trade with absolute peace of mind.
          </p>
        </div>

        <div className="md:col-span-3 space-y-2 col-span-1">
          <strong className="text-orbit-white uppercase font-mono tracking-wider text-[10px] block">Contact Us</strong>
          <p className="text-[10px] leading-relaxed font-sans mb-1">
            Need help? Our support team is here for you.
          </p>
          <a href="mailto:support@orbitrio.com" className="text-orbit-accent hover:underline text-[10px] font-sans">support@orbitrio.com</a>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-orbit-border/50 mt-8 text-center text-[10px] text-orbit-gray-text flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
        <span>© 2026 <span className="lowercase text-orbit-white font-semibold">orbit<span className="text-orbit-accent">rio</span></span> Crypto Trading Platform. All rights reserved. Support Email: support@orbitrio.com</span>
        <div className="flex items-center gap-1">
          <ShieldCheck size={14} className="text-orbit-green shrink-0" />
          <span>Secure SSL Encryption</span>
        </div>
      </div>
    </footer>
  );
};
