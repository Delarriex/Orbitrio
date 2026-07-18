import React from "react";
import { motion } from "motion/react";
import { useOrbit } from "../context/OrbitContext";

interface FooterProps {
  onNavigate: (view: string) => void;
}

const FOOTER_LINKS: { label: string; view: string }[] = [
  { label: "About Us", view: "home#about-us" },
  { label: "Markets", view: "markets" },
  // Guests get bounced to /auth by the route guard; signed-in users land on KYC.
  { label: "Security", view: "dashboard-kyc" },
  { label: "Contact", view: "home#contact" },
  { label: "Terms of Service", view: "terms" },
  { label: "Privacy Policy", view: "privacy" }
];

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { appSettings } = useOrbit();

  return (
    <footer className="py-20 px-4 bg-[#05070B] border-t border-[#2B3139]/30">
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 1 }}
        className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mb-16"
      />
      <div className="orb-panel max-w-7xl mx-auto grid gap-10 p-6 sm:p-8 md:grid-cols-[1.2fr_0.8fr_0.8fr] font-mono text-sm">
        <div className="mb-4">
          <div className="flex items-center gap-2.5 mb-2">
            <svg className="w-[28px] h-[28px] transform hover:rotate-12 transition-transform duration-500 filter drop-shadow-[0_2px_8px_rgba(247,147,26,0.2)]" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="footerGoldGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#E05B00" />
                  <stop offset="45%" stopColor="#F7931A" />
                  <stop offset="100%" stopColor="#FFBA3B" />
                </linearGradient>
                <linearGradient id="footerSilverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="50%" stopColor="#E6E8EF" />
                  <stop offset="100%" stopColor="#A3AABF" />
                </linearGradient>
              </defs>
              <path d="M 18,50 A 30,30 0 0,1 78,28 L 71,35 A 20,20 0 0,0 26,50 Z" fill="url(#footerGoldGrad)" />
              <path d="M 18,50 C 23,48 45,38 78,28 C 65,37 40,45 18,50" fill="url(#footerGoldGrad)" />
              <path d="M 23,55 A 30,30 0 0,0 82,50 A 30,30 0 0,0 78,28 L 71,35 A 20,20 0 0,1 74,50 A 20,20 0 0,1 28,54 Z" fill="url(#footerSilverGrad)" />
              <circle cx="85" cy="22" r="5.5" fill="#F7931A" />
            </svg>
            <h4 className="font-bold text-white text-brand font-brand text-lg tracking-tight lowercase">
              orbit<span className="text-[#FFB11A]">rio</span>
            </h4>
          </div>
          <p className="text-neutral-400 mb-4">Trade smarter with confidence.</p>
          <p className="text-neutral-500">
            <span className="lowercase text-white font-medium">orbit<span className="text-[#FFB11A]">rio</span></span> is committed to delivering a secure and seamless trading experience through innovation, transparency, and reliability.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {FOOTER_LINKS.map(link => (
            <button
              key={link.label}
              type="button"
              onClick={() => onNavigate(link.view)}
              className="text-neutral-400 hover:text-amber-500 transition-colors text-left cursor-pointer"
            >
              {link.label}
            </button>
          ))}
        </div>
        <div>
          <h4 className="font-bold text-white mb-4">Contact Us</h4>
          <p className="text-neutral-400 mb-2">Need help? Our support team is here for you.</p>
          <a href={`mailto:${appSettings.supportEmail}`} className="text-amber-500 hover:text-amber-400 hover:underline transition-colors flex items-center gap-2">
            {appSettings.supportEmail}
          </a>
          <p className="text-neutral-500 mt-2">{appSettings.supportPhone}</p>
        </div>
      </div>
    </footer>
  );
};
