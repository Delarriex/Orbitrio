import React, { useState } from "react";
import { useOrbit } from "../context/OrbitContext";
import { Menu, X, User, LogOut, LayoutDashboard, Coins, Briefcase, Wallet2, TrendingUp, LogIn, UserPlus, History, Gift, Share2, Shield, CheckCircle2 } from "lucide-react";

interface NavigationProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate }) => {
  const { user, logout } = useOrbit();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const guestLinks = [
    { id: "home", label: "Home" },
    { id: "markets", label: "Markets" },
    { id: "dashboard-plans", label: "Earn" },
    { id: "about-us", label: "About" },
    { id: "contact", label: "Contact" }
  ];

  const authLinks = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="text-blue-400" size={14} /> },
    { id: "dashboard-wallet-connect", label: "Connect Wallet", icon: <Wallet2 className="text-pink-400" size={14} /> },
    { id: "dashboard-kyc", label: user.kyc?.status === "approved" ? "Verified" : "Verify Identity", icon: user.kyc?.status === "approved" ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Shield size={14} className="text-amber-400" /> },
    { id: "dashboard-trading", label: "Trade", icon: <TrendingUp className="text-emerald-400" size={14} /> },
    { id: "copy-trading", label: "Copy Trading", icon: <User className="text-violet-400" size={14} /> },
    { id: "dashboard-portfolio", label: "Assets", icon: <Briefcase className="text-amber-400" size={14} /> },
    { id: "dashboard-wallet", label: "Deposit / Withdraw", icon: <Wallet2 className="text-cyan-400" size={14} /> },
    { id: "dashboard-transactions", label: "Transaction History", icon: <History className="text-gray-400" size={14} /> },
    { id: "dashboard-airdrops", label: "Airdrop", icon: <Gift className="text-rose-400" size={14} /> },
    { id: "dashboard-referral", label: "Refer & Earn", icon: <Share2 className="text-indigo-400" size={14} /> },
    { id: "dashboard-plans", label: "Earn", icon: <Coins className="text-yellow-400" size={14} /> }
  ];

  const getUID = (email: string | null) => {
    if (!email) return "4982637";
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    const uid = Math.abs(hash) % 10000000;
    return String(uid).padStart(7, "7");
  };

  const isLinkActive = (id: string) => {
    if (id === "home") {
      return currentView === "home" || currentView === "";
    }
    return currentView === id;
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 w-full bg-[#07090E]/90 backdrop-blur-md border-b border-orbit-border/80 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 sm:h-16 flex items-center justify-between">
          
          {/* Logo Brand Title (Upper Hemisphere Orange-Gold, Bottom Metallic White) */}
          <div 
            onClick={() => onNavigate(user.isLoggedIn ? "dashboard" : "home")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {/* SVG high-fidelity Orbitrio brand replica */}
            <svg className="w-[32px] h-[32px] sm:w-[38px] sm:h-[38px] transform group-hover:rotate-12 transition-transform duration-500 filter drop-shadow-[0_2px_8px_rgba(247,147,26,0.2)]" viewBox="0 0 100 100">
              <defs>
                {/* Original Gold/Orange Gradient */}
                <linearGradient id="navGoldGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#E05B00" />
                  <stop offset="45%" stopColor="#F7931A" />
                  <stop offset="100%" stopColor="#FFBA3B" />
                </linearGradient>
                {/* Original Metallic Silver/White Gradient */}
                <linearGradient id="navSilverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="50%" stopColor="#E6E8EF" />
                  <stop offset="100%" stopColor="#A3AABF" />
                </linearGradient>
              </defs>
              
              {/* Top-left Orange Crescent loop */}
              <path 
                d="M 18,50 A 30,30 0 0,1 78,28 L 71,35 A 20,20 0 0,0 26,50 Z" 
                fill="url(#navGoldGrad)" 
              />
              
              {/* Diagonal premium sweeping logo slash */}
              <path 
                d="M 18,50 C 23,48 45,38 78,28 C 65,37 40,45 18,50" 
                fill="url(#navGoldGrad)" 
              />

              {/* Bottom-right Silver/White Crescent loop */}
              <path 
                d="M 23,55 A 30,30 0 0,0 82,50 A 30,30 0 0,0 78,28 L 71,35 A 20,20 0 0,1 74,50 A 20,20 0 0,1 28,54 Z" 
                fill="url(#navSilverGrad)" 
              />

              {/* Top right orange brand accent satellite dot */}
              <circle cx="85" cy="22" r="5.5" fill="#F7931A" />
            </svg>
            
            <div>
              <span className="font-brand font-bold tracking-[0.02em] text-lg sm:text-xl text-orbit-white block leading-none lowercase">
                orbit<span className="text-orbit-accent">rio</span>
              </span>
              <span className="text-[6.5px] sm:text-[7.5px] font-mono tracking-[0.25em] text-orbit-gray-text block mt-1">
                TRADE. ELEVATE. ORBIT.
              </span>
            </div>
          </div>

          {/* Desktop Links (Public + Live states) */}
          <div className="hidden lg:flex items-center gap-6 text-xs text-orbit-gray-text font-medium">
            {!user.isLoggedIn ? (
              <>
                <div className="flex gap-1.5 border-r border-orbit-border/50 pr-6">
                  {guestLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => {
                        if (link.id === "about-us" || link.id === "contact") {
                          if (window.location.pathname === '/') {
                            const el = document.getElementById(link.id);
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                            window.history.pushState(null, '', `/#${link.id}`);
                          } else {
                            onNavigate("home#"+link.id);
                          }
                        } else {
                           onNavigate(link.id);
                        }
                        setMobileMenuOpen(false);
                      }}
                      className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        isLinkActive(link.id)
                          ? "text-orbit-accent bg-orbit-accent/10 font-bold"
                          : "hover:text-orbit-white"
                      }`}
                    >
                      {link.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'instant' });
                      onNavigate("login");
                    }}
                    className="px-4 py-2 hover:text-orbit-white transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'instant' });
                      onNavigate("register");
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orbit-accent to-[#FF7F00] text-orbit-bg font-bold shadow-md shadow-orbit-accent/10 hover:opacity-95 transition-all cursor-pointer"
                  >
                    Register
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Authenticated Desktop Links */}
                <div className="flex gap-1.5 border-r border-orbit-border/50 pr-6">
                  {authLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => { 
                          if (link.id === 'dashboard-kyc' && user.kyc?.status === 'approved') return;
                          onNavigate(link.id); setMobileMenuOpen(false); 
                      }}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        isLinkActive(link.id)
                          ? "text-orbit-accent bg-orbit-accent/10 font-bold"
                          : "hover:text-orbit-white"
                      }`}
                    >
                      {link.icon}
                      <span>{link.label}</span>
                    </button>
                  ))}
                </div>

                {/* User details and exit button */}
                <div className="flex items-center gap-4">
                  {user.role === "admin" && (
                    <button
                      onClick={() => onNavigate("dashboard-admin")}
                      className="py-1.5 px-3 rounded text-[10px] bg-gradient-to-r from-orbit-accent to-[#FF7F00] text-orbit-bg font-black uppercase tracking-widest cursor-pointer shadow hover:opacity-95"
                    >
                      Admin
                    </button>
                  )}
                  
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] font-mono text-orbit-white font-bold leading-none">
                      UID: {getUID(user.email)}
                    </span>
                    <span className="text-[9px] text-orbit-gray-text font-mono mt-0.5 truncate max-w-[120px]" title={user.username || user.name || user.email || ""}>
                      {user.username || user.name || user.email}
                    </span>
                  </div>

                  <button
                    onClick={() => { logout(); onNavigate("home"); }}
                    className="p-1.5 text-orbit-gray-text hover:text-orbit-red transition-all cursor-pointer rounded hover:bg-orbit-red/10 animate-pulse hover:animate-none"
                    title="Sign Out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Activator hamburger */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-orbit-gray-text hover:text-orbit-white cursor-pointer"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

        </div>
      </nav>

      {/* Mobile drop-down drawer overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-[#07090E] z-50 overflow-y-auto px-5 py-5 flex flex-col pb-24 animate-fadeIn">
          
          <div className="flex flex-col space-y-6">
            {/* Mobile Header Bar inside overlay */}
            <div className="flex items-center justify-between border-b border-orbit-border/50 pb-4 shrink-0">
              {/* Logo Brand Title */}
              <div 
                onClick={() => { onNavigate(user.isLoggedIn ? "dashboard" : "home"); setMobileMenuOpen(false); }}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <svg className="w-[38px] h-[38px] transform group-hover:rotate-12 transition-transform duration-500 filter drop-shadow-[0_2px_8px_rgba(247,147,26,0.2)]" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="navGoldGradMenu" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#E05B00" />
                      <stop offset="45%" stopColor="#F7931A" />
                      <stop offset="100%" stopColor="#FFBA3B" />
                    </linearGradient>
                    <linearGradient id="navSilverGradMenu" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="50%" stopColor="#E6E8EF" />
                      <stop offset="100%" stopColor="#A3AABF" />
                    </linearGradient>
                  </defs>
                  <path 
                    d="M 18,50 A 30,30 0 0,1 78,28 L 71,35 A 20,20 0 0,0 26,50 Z" 
                    fill="url(#navGoldGradMenu)" 
                  />
                  <path 
                    d="M 18,50 C 23,48 45,38 78,28 C 65,37 40,45 18,50" 
                    fill="url(#navGoldGradMenu)" 
                  />
                  <path 
                    d="M 23,55 A 30,30 0 0,0 82,50 A 30,30 0 0,0 78,28 L 71,35 A 20,20 0 0,1 74,50 A 20,20 0 0,1 28,54 Z" 
                    fill="url(#navSilverGradMenu)" 
                  />
                  <circle cx="85" cy="22" r="5.5" fill="#F7931A" />
                </svg>
                <div>
                  <span className="font-brand font-bold tracking-[0.02em] text-xl text-orbit-white block leading-none lowercase">
                    orbit<span className="text-orbit-accent">rio</span>
                  </span>
                  <span className="text-[7.5px] font-mono tracking-[0.25em] text-orbit-gray-text block mt-1">
                    TRADE. ELEVATE. ORBIT.
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-orbit-gray-text hover:text-orbit-white cursor-pointer focus:outline-none"
              >
                <X size={22} />
              </button>
            </div>

          {/* Dynamic Navigation Menu Items inside list */}
            <div className="flex flex-col space-y-0.5 pb-24">
              {!user.isLoggedIn ? (
                // Guest Menu Items: Home, Markets, Earn, About, Contact
                <>
                  {guestLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => {
                        if (link.id === "about-us" || link.id === "contact") {
                          if (window.location.pathname === '/' || window.location.pathname === '') {
                            const el = document.getElementById(link.id);
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                            window.history.pushState(null, '', `/#${link.id}`);
                          } else {
                            onNavigate("home#"+link.id);
                          }
                        } else {
                           onNavigate(link.id);
                        }
                        setMobileMenuOpen(false);
                      }}
                      className={`py-3.5 px-4 rounded-xl text-left text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                        isLinkActive(link.id)
                          ? "text-orbit-accent bg-orbit-accent/10 border-l-[3px] border-orbit-accent font-bold pl-4"
                          : "text-orbit-gray-text hover:text-orbit-white hover:bg-orbit-card/40"
                      }`}
                    >
                      <span>{link.label}</span>
                    </button>
                  ))}
                  
                  {/* Divider */}
                  <div className="w-full h-[1px] bg-neutral-950/40 my-4" />
                  
                  {/* Auth Buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'instant' });
                        onNavigate("login");
                        setMobileMenuOpen(false);
                      }}
                      className="w-full py-3.5 rounded-xl border border-orbit-border text-center text-xs font-bold font-subheading text-orbit-white hover:bg-orbit-card transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogIn size={14} /> Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'instant' });
                        onNavigate("register");
                        setMobileMenuOpen(false);
                      }}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orbit-accent to-[#FF7F00] text-orbit-bg font-bold text-center text-xs font-subheading hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <UserPlus size={14} /> Register
                    </button>
                  </div>
                </>
              ) : (
                // Authenticated Menu Items: Dashboard, Trade, Copy Trading, Assets, Deposit / Withdraw, Earn
                <>
                  {authLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => { 
                          if (link.id === 'dashboard-kyc' && user.kyc?.status === 'approved') return;
                          onNavigate(link.id); setMobileMenuOpen(false); 
                      }}
                      className={`py-3.5 px-4 rounded-xl text-left text-sm font-medium transition-all flex items-center gap-3.5 cursor-pointer ${
                        isLinkActive(link.id)
                          ? "text-orbit-accent bg-orbit-accent/10 border-l-[3px] border-orbit-accent font-bold pl-3.5"
                          : "text-orbit-gray-text hover:text-orbit-white hover:bg-orbit-card/40"
                      }`}
                    >
                      <span className={isLinkActive(link.id) ? "text-orbit-accent" : "text-orbit-gray-text"}>
                        {link.icon}
                      </span>
                      <span>{link.label}</span>
                    </button>
                  ))}
                  
                  {/* Authenticated User Profile & Sign Out - Integrated Flow */}
                  <div className="w-full h-[1px] bg-neutral-900/60 my-4" />
                  <div className="flex items-center justify-between gap-4 px-4 pt-2">
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-orbit-white font-mono tracking-wide">
                        UID: {getUID(user.email)}
                      </span>
                      <span className="text-[10px] text-orbit-gray-text font-sans truncate max-w-[155px] mt-0.5" title={user.username || user.name || user.email || ""}>
                        {user.username || user.name || user.email}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {user.role === "admin" && (
                        <button
                          onClick={() => { onNavigate("dashboard-admin"); setMobileMenuOpen(false); }}
                          className="py-1.5 px-3 rounded text-[10px] bg-gradient-to-r from-orbit-accent to-[#FF7F00] text-orbit-bg font-black uppercase tracking-widest cursor-pointer shadow"
                        >
                          Admin
                        </button>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => { logout(); onNavigate("home"); setMobileMenuOpen(false); }}
                        className="flex items-center gap-2 py-2 px-4 rounded-xl border border-orbit-red/40 bg-orbit-red/10 text-orbit-red text-xs font-bold font-subheading hover:bg-orbit-red/20 transition-all cursor-pointer"
                      >
                        <LogOut size={13} /> Sign-Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer Area inside overlay */}
        </div>
      )}
    </>
  );
};
