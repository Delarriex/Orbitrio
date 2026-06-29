import React, { useState } from "react";
import { useOrbit } from "../context/OrbitContext";
import { Mail, Lock, User, CheckCircle2, Phone, ChevronDown } from "lucide-react";

interface AuthPageProps {
  onNavigate: (view: string) => void;
  initialTab?: "login" | "register";
}

export const AuthPage: React.FC<AuthPageProps> = ({ onNavigate, initialTab = "register" }) => {
  const { register, login, loginWithGoogle, sendPasswordReset } = useOrbit();
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialTab);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loginPassword, setLoginPassword] = useState("");

  // Register States
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sex, setSex] = useState("Select Gender");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [accountType, setAccountType] = useState("Select Account Type");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("Choose Country");
  const [currency, setCurrency] = useState("Select Currency");
  const [checkedTerms, setCheckedTerms] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsSuccess(true);
    try {
      await loginWithGoogle();
      setTimeout(() => {
        onNavigate("dashboard");
      }, 1000);
    } catch (err: any) {
      setIsSuccess(false);
      setErrorMsg(err.message || "Failed to authenticate with Google.");
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setErrorMsg("Please provide your email address index.");
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setForgotLoading(true);
    try {
      await sendPasswordReset(forgotEmail);
      setSuccessMsg("Check your inbox! A secure password reset link has been dispatched.");
      setForgotEmail("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to dispatch recovery link.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (activeTab === "register") {
      if (!username.trim()) {
        setErrorMsg("Username is required.");
        return;
      }
      if (!firstName.trim()) {
        setErrorMsg("First name is required.");
        return;
      }
      if (!lastName.trim()) {
        setErrorMsg("Last name is required.");
        return;
      }
      if (sex === "Select Gender" || !sex) {
        setErrorMsg("Please select your gender (Sex).");
        return;
      }
      if (!email.trim() || !email.includes("@")) {
        setErrorMsg("Please enter a valid email address.");
        return;
      }
      if (!phone.trim()) {
        setErrorMsg("Phone number is required.");
        return;
      }
      if (accountType === "Select Account Type" || !accountType) {
        setErrorMsg("Please select an investment account type tier.");
        return;
      }
      if (!password) {
        setErrorMsg("Password is required.");
        return;
      }
      if (password.length < 5) {
        setErrorMsg("Password must be at least 5 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match.");
        return;
      }
      if (country === "Choose Country" || !country) {
        setErrorMsg("Please select your country.");
        return;
      }
      if (currency === "Select Currency" || !currency) {
        setErrorMsg("Please select a transaction account currency.");
        return;
      }
      if (!checkedTerms) {
        setErrorMsg("You must accept the terms & privacy policy to continue.");
        return;
      }

      setIsSuccess(true);
      try {
        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        await register(fullName, email, {
          username: username.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          gender: sex,
          phone: phone.trim(),
          accountType,
          country,
          currency,
          password,
        });
        setTimeout(() => {
          onNavigate("dashboard");
        }, 1200);
      } catch (err: any) {
        setIsSuccess(false);
        setErrorMsg(err.message || "Registration failed. Please attempt with different email.");
      }

    } else {
      // Login
      if (!loginEmail.trim() || !loginEmail.includes("@")) {
        setErrorMsg("Please enter a valid email address.");
        return;
      }
      if (!loginPassword) {
        setErrorMsg("Please enter your password.");
        return;
      }

      setIsSuccess(true);
      try {
        await login(loginEmail.trim(), loginPassword);
        setTimeout(() => {
          onNavigate("dashboard");
        }, 1000);
      } catch (err: any) {
        setIsSuccess(false);
        setErrorMsg(err.message || "Invalid credentials specified or user doesn't exist.");
      }
    }
  };

  const countriesList = [
    "United States", "United Kingdom", "Canada", "Australia", "Singapore", 
    "Germany", "France", "Switzerland", "United Arab Emirates", "Saudi Arabia", 
    "Qatar", "South Africa", "Nigeria", "Japan", "India", "Brazil", "Mexico"
  ];

  const currenciesList = ["USD", "EUR", "GBP", "BTC", "USDT"];

  return (
    <div className="mx-auto my-8 w-full max-w-2xl px-4 sm:px-6 lg:px-8 font-sans">
      <div className="relative overflow-hidden rounded-[30px] border border-orbit-border/70 bg-gradient-to-br from-[#12161D] via-[#0D1014] to-[#090B10] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.45)] sm:p-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orbit-accent via-amber-500 to-[#FF7F00]" />
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-orbit-gray-text">
          <span className="rounded-full border border-orbit-border/70 bg-black/30 px-3 py-1">Secure</span>
          <span className="rounded-full border border-orbit-border/70 bg-black/30 px-3 py-1">Responsive</span>
          <span className="rounded-full border border-orbit-border/70 bg-black/30 px-3 py-1">Fast onboarding</span>
        </div>
      
      {/* Pills switcher - completely borderless/containerless */}
      <div className="flex justify-center gap-3 mb-10">
        <button
          type="button"
          onClick={() => { setActiveTab("register"); setErrorMsg(null); }}
          className={`px-5 py-2 text-xs font-bold font-subheading rounded-full transition-all cursor-pointer ${
            activeTab === "register" 
              ? "bg-orbit-accent text-orbit-bg shadow-md shadow-orbit-accent/10" 
              : "text-orbit-gray-text hover:text-orbit-white bg-orbit-card/30 border border-orbit-border/25"
          }`}
        >
          Register Account
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("login"); setErrorMsg(null); }}
          className={`px-5 py-2 text-xs font-bold font-subheading rounded-full transition-all cursor-pointer ${
            activeTab === "login" 
              ? "bg-orbit-accent text-orbit-bg shadow-md shadow-orbit-accent/10" 
              : "text-orbit-gray-text hover:text-orbit-white bg-orbit-card/30 border border-orbit-border/25"
          }`}
        >
          Sign In
        </button>
      </div>

      {/* Content Wrapper - Containerless & Borderless & maintaining Black Theme */}
      <div className="bg-transparent p-0 border-none shadow-none">
        
        {/* Header Title */}
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl font-extrabold font-heading tracking-tight text-orbit-white">
            {activeTab === "register" ? "Create Account" : "Sign In to Your Workspace"}
          </h2>
          <p className="text-xs text-orbit-gray-text max-w-sm mx-auto leading-relaxed">
            {activeTab === "register" 
              ? "Join millions of traders worldwide. Access advanced trading tools and seamless trade execution."
              : "Access real-time indicators, current tier yields, and copy performance logs."
            }
          </p>
        </div>

        {/* Success screen loader */}
        {isSuccess ? (
          <div className="text-center py-16 space-y-4 animate-medium flex flex-col items-center justify-center">
            <span className="inline-flex w-12 h-12 items-center justify-center rounded-full mx-auto border bg-orbit-accent/10 border-orbit-accent/30 text-orbit-accent">
              <CheckCircle2 size={24} className="animate-bounce" />
            </span>
            <p className="text-sm font-subheading font-bold text-orbit-accent">
              {activeTab === "register" ? "Creating account..." : "Signing in..."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {errorMsg && (
              <div className="p-3.5 text-xs rounded-xl font-sans border bg-red-500/10 border-red-500/20 text-red-400">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 text-xs rounded-xl font-sans border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                {successMsg}
              </div>
            )}

            {activeTab === "register" ? (
              /* Interactive Register Form Layout exactly matching screens */
              <div className="space-y-5">
                
                {/* User Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text block">
                    Set Username <span className="text-orbit-accent ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                      <User size={15} />
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter Unique Username"
                      className="w-full bg-orbit-bg border border-orbit-border/85 focus:border-orbit-accent rounded-xl pl-10 pr-4 py-3 text-xs text-orbit-white cursor-text outline-none transition-all placeholder:text-zinc-600 font-sans"
                      required
                    />
                  </div>
                </div>

                {/* Name Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text block">
                      First Name <span className="text-orbit-accent ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                        <User size={15} />
                      </span>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter First Name"
                        className="w-full bg-orbit-bg border border-orbit-border/85 focus:border-orbit-accent rounded-xl pl-10 pr-4 py-3 text-xs text-orbit-white cursor-text outline-none transition-all placeholder:text-zinc-600 font-sans"
                        required
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text block">
                      Last Name <span className="text-orbit-accent ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                        <User size={15} />
                      </span>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter Last Name"
                        className="w-full bg-orbit-bg border border-orbit-border/85 focus:border-orbit-accent rounded-xl pl-10 pr-4 py-3 text-xs text-orbit-white cursor-text outline-none transition-all placeholder:text-zinc-600 font-sans"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Sex & Phone Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Sex */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text block">
                      Sex <span className="text-orbit-accent ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={sex}
                        onChange={(e) => setSex(e.target.value)}
                        className="w-full bg-orbit-bg border border-orbit-border/85 focus:border-orbit-accent rounded-xl px-4 py-3 text-xs text-orbit-white cursor-pointer outline-none appearance-none font-sans"
                        required
                      >
                        <option disabled value="Select Gender">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                        <ChevronDown size={14} />
                      </span>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text block">
                      Phone Number <span className="text-orbit-accent ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                        <Phone size={15} />
                      </span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter Phone number"
                        className="w-full bg-orbit-bg border border-orbit-border/85 focus:border-orbit-accent rounded-xl pl-10 pr-4 py-3 text-xs text-orbit-white cursor-text outline-none transition-all placeholder:text-zinc-600 font-sans"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text block">
                    Your Email <span className="text-orbit-accent ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                      <Mail size={15} />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-orbit-bg border border-orbit-border/85 focus:border-orbit-accent rounded-xl pl-10 pr-4 py-3 text-xs text-orbit-white cursor-text outline-none transition-all placeholder:text-zinc-600 font-sans"
                      required
                    />
                  </div>
                </div>

                {/* Account / Investment Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text block">
                    Select Account Type <span className="text-orbit-accent ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value)}
                      className="w-full bg-orbit-bg border border-orbit-border/85 focus:border-orbit-accent rounded-xl px-4 py-3 text-xs text-orbit-white cursor-pointer outline-none appearance-none font-sans"
                      required
                    >
                      <option disabled value="Select Account Type">Select Account Type</option>
                      <option value="Bronze">Bronze Tier (Standard)</option>
                      <option value="Silver">Silver Tier (Advanced)</option>
                      <option value="Gold">Gold Tier (Premium)</option>
                      <option value="Platinum">Platinum Tier (Elite)</option>
                      <option value="Diamond">Diamond Tier (Pro)</option>
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                      <ChevronDown size={14} />
                    </span>
                  </div>
                </div>

                {/* Password Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text block">
                      Password <span className="text-orbit-accent ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                        <Lock size={15} />
                      </span>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter Password"
                        className="w-full bg-orbit-bg border border-orbit-border/85 focus:border-orbit-accent rounded-xl pl-10 pr-4 py-3 text-xs text-orbit-white cursor-text outline-none transition-all placeholder:text-zinc-600 font-sans"
                        required
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text block">
                      Confirm Password <span className="text-orbit-accent ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                        <Lock size={15} />
                      </span>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm Password"
                        className="w-full bg-orbit-bg border border-orbit-border/85 focus:border-orbit-accent rounded-xl pl-10 pr-4 py-3 text-xs text-orbit-white cursor-text outline-none transition-all placeholder:text-zinc-600 font-sans"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Country & Currency Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Country */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text block">
                      Country <span className="text-orbit-accent ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full bg-orbit-bg border border-orbit-border/85 focus:border-orbit-accent rounded-xl px-3 py-3 text-xs text-orbit-white cursor-pointer outline-none appearance-none font-sans"
                        required
                      >
                        <option disabled value="Choose Country">Choose Country</option>
                        {countriesList.map((c, i) => (
                          <option key={i} value={c}>{c}</option>
                        ))}
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                        <ChevronDown size={14} />
                      </span>
                    </div>
                  </div>

                  {/* Currency */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text block">
                      Select Currency <span className="text-orbit-accent ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full bg-orbit-bg border border-orbit-border/85 focus:border-orbit-accent rounded-xl px-3 py-3 text-xs text-orbit-white cursor-pointer outline-none appearance-none font-sans"
                        required
                      >
                        <option disabled value="Select Currency">Select Currency</option>
                        {currenciesList.map((curr, idx) => (
                          <option key={idx} value={curr}>{curr}</option>
                        ))}
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                        <ChevronDown size={14} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Terms checkbox inside screen */}
                <div className="flex items-start gap-2.5 pt-2 text-xs text-orbit-gray-text font-sans">
                  <input
                    type="checkbox"
                    id="chk-terms"
                    checked={checkedTerms}
                    onChange={(e) => setCheckedTerms(e.target.checked)}
                    className="mt-0.5 accent-orbit-accent h-4 w-4 border border-orbit-border rounded cursor-pointer"
                  />
                  <label htmlFor="chk-terms" className="leading-tight cursor-pointer select-none">
                    I Accept the Terms And Privacy Policy
                  </label>
                </div>

                {/* Register Button block */}
                <button
                  type="submit"
                  className="orb-button mt-4 w-full py-4"
                >
                  Register Account
                </button>

                <p className="text-[10px] text-center text-orbit-gray-text leading-tight mt-2">
                  By creating an account, you agree to <span className="lowercase text-orbit-white font-medium">orbit<span className="text-orbit-accent">rio</span></span>’s <button type="button" onClick={() => onNavigate("terms")} className="text-orbit-accent hover:underline">Terms of Service</button> and <button type="button" onClick={() => onNavigate("privacy")} className="text-orbit-accent hover:underline">Privacy Policy</button>.
                </p>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-orbit-border/15"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold">
                    <span className="bg-[#0e0f11] px-3 text-orbit-gray-text">Or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-3.5 px-4 rounded-xl border border-orbit-accent/30 hover:border-orbit-accent/80 bg-[#121318] hover:bg-orbit-accent/5 text-orbit-white hover:text-orbit-accent font-bold font-subheading text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm"
                >
                  <svg className="w-4 h-4 cursor-pointer" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.3-4.53-3.85-5.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </button>

                <div className="text-center text-xs text-orbit-gray-text pt-2">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    className="text-orbit-accent font-semibold hover:underline"
                  >
                    Login
                  </button>
                </div>

              </div>
            ) : showForgotPassword ? (
              /* Forgot Password recovery view */
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-sm font-subheading font-bold text-orbit-white">Reset Password</h3>
                  <p className="text-[11px] text-orbit-gray-text leading-tight">
                    Provide your email address to reset your password.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-subheading tracking-wider block text-orbit-gray-text">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                      <Mail size={15} />
                    </span>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full bg-orbit-bg border border-orbit-border/85 focus:border-orbit-accent rounded-xl pl-10 pr-4 py-3 text-xs text-orbit-white cursor-text font-sans outline-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={forgotLoading}
                  onClick={handleForgotPasswordSubmit}
                  className="orb-button mt-2 w-full py-4 disabled:opacity-50"
                >
                  {forgotLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-orbit-bg/30 border-t-orbit-bg rounded-full animate-spin inline-block mr-1" />
                      Processing...
                    </>
                  ) : "Verify Email & Send Reset Link"}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs font-semibold text-orbit-accent hover:underline cursor-pointer bg-transparent border-none outline-none"
                  >
                    Return to sign in
                  </button>
                </div>
              </div>
            ) : (
              /* Traditional Clean Login View matching the dark card theme */
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text block">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                      <Mail size={15} />
                    </span>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full bg-orbit-bg border border-orbit-border/85 focus:border-orbit-accent rounded-xl pl-10 pr-4 py-3 text-xs text-orbit-white cursor-text font-sans outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-subheading tracking-wider text-orbit-gray-text block">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[10px] font-semibold text-orbit-accent hover:underline cursor-pointer bg-transparent border-none outline-none"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                      <Lock size={15} />
                    </span>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••"
                      className="w-full bg-orbit-bg border border-orbit-border/85 focus:border-orbit-accent rounded-xl pl-10 pr-4 py-3 text-xs text-orbit-white cursor-text font-sans outline-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="orb-button mt-6 w-full py-4"
                >
                  Login
                </button>

                <p className="text-[10px] text-center text-orbit-gray-text leading-tight mt-2">
                  By signing in, you agree to <span className="lowercase text-orbit-white font-medium">orbit<span className="text-orbit-accent">rio</span></span>’s <button type="button" onClick={() => onNavigate("terms")} className="text-orbit-accent hover:underline bg-transparent border-none outline-none cursor-pointer">Terms of Service</button> and <button type="button" onClick={() => onNavigate("privacy")} className="text-orbit-accent hover:underline bg-transparent border-none outline-none cursor-pointer">Privacy Policy</button>.
                </p>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-orbit-border/15"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold">
                    <span className="bg-[#0e0f11] px-3 text-orbit-gray-text">Or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-3.5 px-4 rounded-xl border border-orbit-accent/30 hover:border-orbit-accent/80 bg-[#121318] hover:bg-orbit-accent/5 text-orbit-white hover:text-orbit-accent font-bold font-subheading text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-sm"
                >
                  <svg className="w-4 h-4 cursor-pointer" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.3-4.53-3.85-5.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </button>

                <div className="text-center text-xs text-orbit-gray-text pt-2">
                  Don't have an account yet?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("register")}
                    className="text-orbit-accent font-semibold hover:underline"
                  >
                    Register Now
                  </button>
                </div>
              </div>
            )}

          </form>
        )}

        {/* Secure signpost */}
        <div className="pt-8 border-t border-orbit-border/15 mt-8 text-center space-y-2 text-[10px] text-zinc-500">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-orbit-green animate-ping" />
            Security node active. End-to-end multi-layer data encryption active.
          </div>
          <div className="text-zinc-400">
            Need assistance? <a href="mailto:support@orbitriotrades.com" className="text-orbit-accent hover:underline">Contact Support</a>
          </div>
        </div>

      </div>
      </div>
    </div>
  );
};
