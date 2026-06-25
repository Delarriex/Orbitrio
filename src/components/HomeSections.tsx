import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Zap,
  Shield,
  ShieldCheck,
  BarChart3,
  Clock,
  Lock,
  Globe,
  RefreshCcw,
  Smile,
  Orbit,
  Mail,
  ArrowRight,
  Sparkles,
  Settings,
  HelpCircle,
  MousePointer2,
  Slash,
  Layers,
  Paintbrush,
  Type,
  Grid,
  Ruler,
  Magnet,
  EyeOff,
  Trash2,
  ChevronDown,
  Plus,
  Users,
  TrendingUp,
  ThumbsUp,
  Headset,
  Database,
  Puzzle,
  Target,
  Fingerprint
} from 'lucide-react';
import { useOrbit } from '../context/OrbitContext';

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CoinInfo {
  symbol: string;
  name: string;
  icon: string;
  iconBg: string;
  basePrice: number;
  minPriceD: number;
  maxPriceD: number;
  minPriceOther: number;
  maxPriceOther: number;
}

const SUPPORTED_COINS: CoinInfo[] = [
  {
    symbol: "BTC",
    name: "Bitcoin / U.S. Dollar",
    icon: "฿",
    iconBg: "bg-[#E07F00] border-amber-600 text-white",
    basePrice: 64318.07,
    minPriceD: 55000,
    maxPriceD: 102000,
    minPriceOther: 60000,
    maxPriceOther: 67000
  },
  {
    symbol: "ETH",
    name: "Ethereum / U.S. Dollar",
    icon: "Ξ",
    iconBg: "bg-[#627EEA] border-[#4B62C5] text-white",
    basePrice: 3450.25,
    minPriceD: 2500,
    maxPriceD: 4300,
    minPriceOther: 3100,
    maxPriceOther: 3600
  },
  {
    symbol: "SOL",
    name: "Solana / U.S. Dollar",
    icon: "S",
    iconBg: "bg-purple-600 border-purple-800 text-white",
    basePrice: 142.80,
    minPriceD: 80,
    maxPriceD: 240,
    minPriceOther: 120,
    maxPriceOther: 160
  },
  {
    symbol: "MNT",
    name: "Mantle / U.S. Dollar",
    icon: "M",
    iconBg: "bg-teal-600 border-teal-800 text-white",
    basePrice: 0.782,
    minPriceD: 0.40,
    maxPriceD: 1.50,
    minPriceOther: 0.65,
    maxPriceOther: 0.90
  }
];

// Helper to render premium stock and brand keycaps with authentic high-fidelity SVG logos
const renderKeycap = (type: string) => {
  switch (type) {
    case 'MSFT':
      return (
        <div key="msft" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16 transform-gpu">
          <span className="text-blue-400 font-bold text-[8px] tracking-wider font-sans leading-none mb-1">MSFT</span>
          <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
            <div className="bg-[#F25022] w-1.5 h-1.5"></div>
            <div className="bg-[#7FBA00] w-1.5 h-1.5"></div>
            <div className="bg-[#00A4EF] w-1.5 h-1.5"></div>
            <div className="bg-[#FFB900] w-1.5 h-1.5"></div>
          </div>
        </div>
      );
    case 'CAT':
      return (
        <div key="cat" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16 relative overflow-hidden">
          <span className="text-white font-black text-[9px] font-sans relative z-10 leading-none mb-0.5">CAT</span>
          <svg className="w-3.5 h-1.5 relative z-10" viewBox="0 0 20 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 0L20 10H0L10 0Z" fill="#FFB11A"/>
          </svg>
        </div>
      );
    case 'DIS':
      return (
        <div key="dis" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16 text-sky-400">
          <svg className="w-5.5 h-5.5" viewBox="0 0 32 32" fill="currentColor">
            <path d="M10 24c-1.3 0-2.4-.6-3.2-1.7-.8-1.1-.9-2.5-.4-4 .6-1.7 1.8-3.4 3.7-5.1C12 11.5 14.5 9.7 17.5 8c1.2-.7 2.4-1.2 3.5-1.5.8-.2 1.5-.1 2 .2s.7.9.6 1.7c-.1 1.2-.6 2.6-1.5 4.1s-.8 1.9-.3 2.1c.4.1.9-.1 1.4-.6.6-.5 1.1-1.1 1.5-1.9.4-.8.8-1.5 1.1-2h2.2c-.4.9-.9 1.9-1.5 2.9-.6 1-1.2 1.9-1.9 2.5a4 4 0 01-1.4.8c-.5.1-1 0-1.3-.3s-.3-.7-.2-1.3c.1-.8.2-1.6.2-2.3 0-.7-.3-1.1-.9-1.2-.6 0-1.2.3-1.8.8-1.2.9-2.2 2-3 3.4s-1.2 2.7-1.2 4c0 1.5.5 2.2 1.5 2.2 1.3 0 2.8-.9 4.4-2.8 1.6-1.9 2.8-4.2 3.6-6.9.1-.4.3-.8.4-1.2h2c-.3 1.5-.9 3-1.7 4.5s-1.8 2.8-3 3.9c-1.2 1.1-2.4 1.7-3.6 1.7V24z"/>
          </svg>
        </div>
      );
    case 'NFLX':
      return (
        <div key="nflx" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16">
          <svg className="w-3.5 h-6.5 filter drop-shadow-sm" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 0h6v28.8L4 36V0z" fill="#E50914" />
            <path d="M14 0h6v36l-6-7.2V0z" fill="#B81D24" />
            <path d="M4 0l16 28.8V36L4 7.2V0z" fill="#E50914" opacity="0.95" />
          </svg>
        </div>
      );
    case 'TWTR':
      return (
        <div key="twtr" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16">
          <svg className="w-5 h-5 text-[#1DA1F2]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
        </div>
      );
    case 'GOOG':
      return (
        <div key="goog" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16">
          <svg viewBox="0 0 24 24" className="w-4 h-4">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.08H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.92l2.85-2.22.81-.6z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.08l3.66 2.84c.87-2.6 3.3-4.54 6.16-4.54z" fill="#EA4335"/>
          </svg>
        </div>
      );
    case 'AAPL':
      return (
        <div key="aapl" className="bg-white border border-neutral-200 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2.5px_white,0_4px_0_#d1d5db,0_15px_25px_rgba(255,255,255,0.65)] h-12 w-16 relative scale-105 z-10 transition-transform">
          <svg viewBox="0 0 24 24" fill="#000" className="w-4.5 h-4.5 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.7-1.13 1.84-.99 2.94.1.08.1.08.1.08.97 0 2.06-.61 2.72-1.41z"/>
          </svg>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-white/10 to-transparent mix-blend-overlay pointer-events-none"></div>
        </div>
      );
    case 'SLACK':
      return (
        <div key="slack" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16">
          <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none">
            <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523 2.528 2.528 0 01-2.522-2.523 2.528 2.528 0 012.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 012.52-2.52h5.043a2.528 2.528 0 012.522 2.52v5.043a2.528 2.528 0 01-2.522 2.52H8.823a2.528 2.528 0 01-2.52-2.52v-5.043z" fill="#36C5F0"/>
            <path d="M8.823 5.043a2.528 2.528 0 01-2.52-2.52 2.528 2.528 0 012.52-2.522 2.528 2.528 0 012.522 2.522v2.52h-2.522zm0 1.261a2.528 2.528 0 012.522 2.52v5.042a2.528 2.528 0 01-2.522 2.52H3.78a2.528 2.528 0 01-2.52-2.52V8.824a2.528 2.528 0 012.52-2.52h5.043z" fill="#2EB67D"/>
            <path d="M18.958 8.824a2.528 2.528 0 012.522-2.52 2.528 2.528 0 012.52 2.52 2.528 2.528 0 01-2.52 2.522h-2.522v-2.522zm-1.261 0a2.528 2.528 0 01-2.52 2.522h-5.043a2.528 2.528 0 01-2.522-2.522V3.78a2.528 2.528 0 012.522-2.52h5.043a2.528 2.528 0 012.52 2.52v5.044z" fill="#ECB22E"/>
            <path d="M15.177 18.957a2.528 2.528 0 012.52 2.522 2.528 2.528 0 01-2.52 2.52 2.528 2.528 0 01-2.522-2.52v-2.522h2.522zm0-1.261a2.528 2.528 0 01-2.522-2.52v-5.043a2.528 2.528 0 012.522-2.52H20.22c1.393 0 2.52 1.128 2.52 2.52v5.043c0 1.393-1.127 2.52-2.52 2.52h-5.043z" fill="#E01E5A"/>
          </svg>
        </div>
      );
    case 'CSCO':
      return (
        <div key="csco" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16">
          <svg className="w-5 h-4 mb-0.5" viewBox="0 0 24 16" fill="none">
            <rect x="2" y="11" width="1.5" height="3" fill="#00BCEB"/>
            <rect x="5" y="8" width="1.5" height="6" fill="#00BCEB"/>
            <rect x="8" y="5" width="1.5" height="9" fill="#00BCEB"/>
            <rect x="11" y="2" width="1.5" height="12" fill="#00BCEB"/>
            <rect x="14" y="5" width="1.5" height="9" fill="#00BCEB"/>
            <rect x="17" y="8" width="1.5" height="6" fill="#00BCEB"/>
            <rect x="20" y="11" width="1.5" height="3" fill="#00BCEB"/>
          </svg>
          <span className="text-[6.5px] text-[#00BCEB] font-extrabold tracking-widest leading-none uppercase select-none font-sans">CISCO</span>
        </div>
      );
    case 'SBUX':
      return (
        <div key="sbux" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16">
          <svg className="w-5 h-5 text-[#006241]" viewBox="0 0 100 100" fill="currentColor">
            <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="4.5"/>
            <circle cx="50" cy="50" r="38" fill="currentColor"/>
            <path d="M50 20l3 9 9.5.5-7 6.5 2 9-7.5-5-7.5 5 2-9-7-6.5 9.5-.5z" fill="white" />
            <path d="M30 40c2 5 8 10 20 10s18-5 20-10l4 25s-14 5-24 5-24-5-24-5l4-25z" fill="white" opacity="0.6" />
          </svg>
        </div>
      );
    case 'TSLA':
      return (
        <div key="tsla" className="bg-[#E82127] border border-red-500 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2.5px_rgba(255,100,100,0.5),0_4px_0_#b2161a,0_15px_25px_rgba(232,33,39,0.65)] h-12 w-16 relative scale-105 z-10 transition-transform">
          <svg viewBox="0 0 24 24" fill="#fff" className="w-4.5 h-4.5 filter drop-shadow-sm">
            <path d="M21.3 2c-5.8 2-12.8 2-18.6 0-.2 0-.4.1-.4.3l.5 3c0 .1.2.2.3.2 1.4-.2 2.8-.2 4.2-.1v4.7c-1.3.1-2.6.4-3.8.9-.1 0-.2.2-.2.3c0 .8.1 1.6.3 2.4.1.2.3.3.5.2 1-.3 2.1-.5 3.2-.5v8.1c0 .3.2.5.5.5h3c.3 0 .5-.2.5-.5V13.3c1.1.1 2.1.3 3.1.5.2 0 .4-.1.5-.3.2-.8.3-1.6.3-2.4 0-.1-.1-.3-.2-.3-1.2-.5-2.5-.8-3.8-.9V5.4c1.4-.1 2.8-.1 4.2.1.1 0 .3-.1.3-.2l.5-3c0-.2-.2-.3-.4-.3z"/>
          </svg>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-white/10 to-transparent mix-blend-overlay pointer-events-none"></div>
        </div>
      );
    case 'AMZN':
      return (
        <div key="amzn" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16">
          <span className="text-white font-extrabold text-[12px] font-sans leading-none -mb-0.5">a</span>
          <svg viewBox="0 0 24 8" fill="none" className="w-4.5 h-1.5 filter drop-shadow-sm">
            <path d="M2.5 1.5c4.5 3.5 14.5 3.5 19 0" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M19 1.5l2.5 2.5l2-3" stroke="#FF9900" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );
    case 'MCD':
      return (
        <div key="mcd" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16">
          <svg className="w-4.5 h-4.5 text-[#FFC72C] filter drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 21h3v-9.5c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5V21h3v-9.5c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5V21h3V10.5c0-3.59-2.91-6.5-6.5-6.5-2.06 0-3.89 1.05-5 2.67C9.89 5.05 8.06 4 6 4 2.41 4-.5 6.91-.5 10.5V21h2.5z" />
          </svg>
        </div>
      );
    case 'NVDA':
      return (
        <div key="nvda" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16">
          <svg className="w-5.5 h-4.5 text-[#76B900] filter drop-shadow-sm" viewBox="0 0 24 16" fill="currentColor">
            <path d="M18.8 1.4C16.8.5 14.5 0 12 0c-4.1 0-7.7 1.4-10 3.7C.8 5 .1 6.8 0 8.7h2.3c.1-1.3.5-2.4 1.2-3.3C5.1 3.5 8.3 2.3 12 2.3c1.7 0 3.3.3 4.8.8l2-1.7zm1.6 3.1c-1.5-.8-3.3-1.2-5.1-1.2-3.3 0-6.1 1.2-7.8 3.1-1 1.1-1.6 2.4-1.7 3.9H8c.1-1 .5-1.9 1.1-2.5 1.1-1.2 2.8-1.9 4.9-1.9 1 0 1.9.2 2.7.5l2.1-1.8zm1.5 3.3c-.8-.5-1.7-.8-2.7-.8-1.9 0-3.4.8-4.2 1.9-.5.6-.7 1.3-.8 2.1h6L22 7.8z" />
          </svg>
        </div>
      );
    case 'EBAY':
      return (
        <div key="ebay" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16">
          <div className="flex items-center space-x-0.2 select-none font-bold" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
            <span className="text-[#E53238] font-bold text-[11px] tracking-tight">e</span>
            <span className="text-[#0064D2] font-semibold text-[11px] tracking-tight -ml-[0.5px]">b</span>
            <span className="text-[#F5AF02] font-semibold text-[12px] tracking-tight -ml-[1px]">a</span>
            <span className="text-[#86B817] font-semibold text-[11px] tracking-tight -ml-[1.2px]">y</span>
          </div>
        </div>
      );
    case 'BIDU':
      return (
        <div key="bidu" className="bg-[#12161F] border border-neutral-800 rounded-xl p-3 flex flex-col justify-center items-center shadow-[inset_0_2px_2px_rgba(255,255,255,0.1),0_4px_0_#06080d,0_8px_15px_rgba(0,0,0,0.85)] h-12 w-16">
          <svg className="w-4.5 h-4.5 text-blue-600 filter drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm6-1c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-12 0c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm14.5 4c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5zm-17 0C2.672 14 2 13.328 2 12.5S2.672 11 3.5 11 5 11.672 5 12.5 4.328 14 3.5 14zm8.5 2c-3.314 0-6 2.686-6 6h12c0-3.314-2.686-6-6-6z"/>
          </svg>
        </div>
      );
    case 'ORBIT':
      return (
        <div key="orbit" className="bg-[#12161F] border-2 border-[#FFB11A]/95 rounded-xl p-2.5 flex flex-col justify-center items-center shadow-[0_4px_0_#b27b12,0_15px_22px_rgba(255,177,26,0.55)] h-12 w-16 scale-105 relative z-10 transition-transform">
          <span className="text-[#FFB11A] font-extrabold text-sm leading-none font-sans">O</span>
          <span className="text-[5.5px] text-white/95 font-mono tracking-widest uppercase mt-0.5 leading-none">ORBIT</span>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-[#FFB11A]/15 to-transparent mix-blend-overlay pointer-events-none"></div>
        </div>
      );
    default:
      return null;
  }
};

// Beautiful video looping card with integrated high-performance 3D vector graphics fallback
export const ZeroPercentLoopCard = () => {
  const [videoError, setVideoError] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  return (
    <div className="relative flex flex-col items-center justify-center p-1 bg-transparent overflow-hidden h-[340px] sm:h-[380px] w-full group/card">
      {/* Loop video wrapper */}
      {!videoError && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none z-10 transition-opacity duration-300 ${
            videoPlaying ? "opacity-100" : "opacity-0"
          }`}
          onPlaying={() => setVideoPlaying(true)}
          onCanPlayThrough={() => setVideoPlaying(true)}
          onError={() => setVideoError(true)}
        >
          <source src="/assets/input_file_0.mp4" type="video/mp4" />
          <source src="/input_file_0.mp4" type="video/mp4" />
          <source src="/assets/input_file_1.mp4" type="video/mp4" />
          <source src="/assets/.aistudio/input_file_0.mp4" type="video/mp4" />
        </video>
      )}

      {/* Exquisite pure React Fallback or overlay text */}
      <div className="relative z-20 flex flex-col items-center text-center w-full h-full justify-center">
        {/* Render a gorgeous interactive 3D layout if video is not yet loaded, playing, or has failed */}
        {(!videoPlaying || videoError) && (
          <div className="relative flex items-center justify-center mb-1">
            <motion.div
              animate={{
                y: [0, -6, 0],
                rotateY: [-5, 5, -5],
                rotateX: [3, -3, 3]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center select-none"
              style={{ transformStyle: "preserve-3d", perspective: "800px" }}
            >
              {/* Massive 3D-styled puffy metallic "0" SVG */}
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_15px_25px_rgba(255,255,255,0.12)]">
                <defs>
                  <linearGradient id="metalBevel" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="30%" stopColor="#E2E8F0" />
                    <stop offset="70%" stopColor="#94A3B8" />
                    <stop offset="100%" stopColor="#475569" />
                  </linearGradient>
                  
                  <linearGradient id="metalFace" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="50%" stopColor="#F1F5F9" />
                    <stop offset="100%" stopColor="#CBD5E1" />
                  </linearGradient>
                  
                  <linearGradient id="accentGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFB11A" />
                    <stop offset="100%" stopColor="#FF6600" />
                  </linearGradient>

                  <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Rear 3D Depth Shadow Ring */}
                <ellipse cx="50" cy="85" rx="35" ry="6" fill="#000000" opacity="0.45" filter="url(#softGlow)" />

                {/* 3D Extrusion Side Layers */}
                <path d="M50,15 A25,30 0 1,0 50,75 A25,30 0 1,0 50,15 Z M50,28 A12,17 0 1,1 50,62 A12,17 0 1,1 50,28 Z" fill="url(#metalBevel)" transform="translate(0, 5)" />
                <path d="M50,15 A25,30 0 1,0 50,75 A25,30 0 1,0 50,15 Z M50,28 A12,17 0 1,1 50,62 A12,17 0 1,1 50,28 Z" fill="url(#metalBevel)" transform="translate(0, 3)" />
                <path d="M50,15 A25,30 0 1,0 50,75 A25,30 0 1,0 50,15 Z M50,28 A12,17 0 1,1 50,62 A12,17 0 1,1 50,28 Z" fill="url(#metalBevel)" transform="translate(0, 1)" />

                {/* Front Face of the "0" */}
                <path d="M50,15 A25,30 0 1,0 50,75 A25,30 0 1,0 50,15 Z M50,28 A12,17 0 1,1 50,62 A12,17 0 1,1 50,28 Z" fill="url(#metalFace)" stroke="#FFFFFF" strokeWidth="0.5" />
                
                {/* Embedded % accent */}
                <g transform="translate(48, 48) scale(0.38)" fill="none" stroke="url(#accentGlow)" strokeWidth="6">
                  <circle cx="20" cy="20" r="8" fill="#FFB11A" fillOpacity="0.2" strokeWidth="4" />
                  <circle cx="50" cy="50" r="8" fill="#FFB11A" fillOpacity="0.2" strokeWidth="4" />
                  <line x1="50" y1="20" x2="20" y2="50" strokeLinecap="round" strokeWidth="5" />
                </g>
              </svg>

              {/* Orbiting / Floating 3D Crypto Coins */}
              <div className="absolute inset-0 z-20 pointer-events-none">
                {/* 1. Tether (USDT) - Green/Teal */}
                <motion.div
                  animate={{
                    x: [30, 20, -40, -50, -40, 20, 30],
                    y: [40, -55, -45, 10, 50, 65, 40],
                    scale: [0.9, 1.15, 0.75, 0.65, 0.8, 1.05, 0.9],
                    rotate: [0, 180, 360],
                    zIndex: [25, 25, 5, 5, 25, 25, 25]
                  }}
                  transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                  className="absolute left-1/2 top-1/2 -ml-5 -mt-5 w-10 h-10 rounded-full bg-gradient-to-br from-[#26A17B] to-[#1a7d5f] border-2 border-[#FFFFFF]/80 flex items-center justify-center text-white text-xs font-black font-sans shadow-lg shadow-[#26A17B]/30 transform-gpu"
                >
                  USDT
                </motion.div>

                {/* 2. Bitcoin (BTC) - Orange */}
                <motion.div
                  animate={{
                    x: [-45, -35, 30, 45, 30, -35, -45],
                    y: [-40, 15, 50, 30, -55, -50, -40],
                    scale: [0.75, 0.65, 0.9, 1.12, 0.95, 0.75, 0.75],
                    rotate: [360, 180, 0],
                    zIndex: [5, 5, 25, 25, 25, 5, 5]
                  }}
                  transition={{ duration: 8.5, repeat: Infinity, ease: "linear" }}
                  className="absolute left-1/2 top-1/2 -ml-5 -mt-5 w-10 h-10 rounded-full bg-gradient-to-br from-[#FF9900] to-[#FF5500] border-2 border-slate-200/90 flex items-center justify-center text-white text-lg font-black font-mono shadow-lg shadow-[#FF9900]/30 transform-gpu"
                >
                  ₿
                </motion.div>

                {/* 3. Solana (SOL) - Purple/Teal */}
                <motion.div
                  animate={{
                    x: [20, 50, 40, -20, -45, -20, 20],
                    y: [-45, 10, 45, 50, -10, -55, -45],
                    scale: [1.1, 0.9, 0.7, 0.8, 1.12, 1.15, 1.1],
                    rotate: [45, 225, 405],
                    zIndex: [25, 25, 5, 25, 25, 25, 25]
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  className="absolute left-1/2 top-1/2 -ml-4.5 -mt-4.5 w-9 h-9 rounded-full bg-gradient-to-tr from-[#9945FF] via-[#14F195] to-[#9945FF] border border-white/50 flex items-center justify-center text-neutral-900 text-[9px] font-black shadow-lg transform-gpu"
                >
                  SOL
                </motion.div>

                {/* 4. TRON (TRX) - Red */}
                <motion.div
                  animate={{
                    x: [-15, -50, -20, 40, 52, 15, -15],
                    y: [55, 15, -45, -52, 5, 45, 55],
                    scale: [0.85, 1.05, 1.1, 0.75, 0.65, 0.82, 0.85],
                    rotate: [-30, 150, 330],
                    zIndex: [25, 25, 25, 5, 5, 25, 25]
                  }}
                  transition={{ duration: 9.2, repeat: Infinity, ease: "linear" }}
                  className="absolute left-1/2 top-1/2 -ml-4 -mt-4 w-8 h-8 rounded-full bg-gradient-to-br from-[#FF0013] to-[#b3000e] border border-white/40 flex items-center justify-center text-white text-[10px] font-bold shadow-lg transform-gpu"
                >
                  TRX
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Labels below for Derivative Fee Rate details */}
        <div className={`transition-all duration-300 ${videoPlaying ? "absolute bottom-3 left-2 right-2 p-2 text-center" : "w-full mt-2"}`}>
          <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-[#FFB11A] uppercase block drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            Derivative Fee Rate
          </span>
          <span className="text-[9px] text-neutral-300 font-sans mt-1 max-w-[210px] mx-auto block leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            Institutional liquidity with zero standard maker commission charges.
          </span>
        </div>
      </div>
    </div>
  );
};

// Section 1: Features (Now beautiful high-fidelity TradingView candidate matching image 2)
export const TradeFeatures = ({ onNavigate }: { onNavigate?: (view: string) => void }) => {
  const { user } = useOrbit();
  const [selectedCoin, setSelectedCoin] = useState<CoinInfo>(SUPPORTED_COINS[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [timeframe, setTimeframe] = useState<"1m" | "30m" | "1h" | "D">("D");
  const [showEMA, setShowEMA] = useState(true);
  const [realtimePrice, setRealtimePrice] = useState(64318.07);
  const [priceChangePercent, setPriceChangePercent] = useState(1.66);
  const [priceChangeAbs, setPriceChangeAbs] = useState(1052.04);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [mouseCoords, setMouseCoords] = useState<{ x: number, y: number } | null>(null);
  const [activeTool, setActiveTool] = useState<"cursor" | "line" | "fib" | "brush" | "text" | "measure">("cursor");
  const [drawings, setDrawings] = useState<{ type: string, x1: number, y1: number, x2: number, y2: number }[]>([]);
  const [drawingStart, setDrawingStart] = useState<{ x: number, y: number } | null>(null);
  const [showDrawings, setShowDrawings] = useState(true);

  // Advanced clickable features added to satisfy "let all the buttons in this live chart be clickable"
  const [chartType, setChartType] = useState<"candles" | "line" | "bars" | "hollow" | "heikin" | "area">("candles");
  const [chartTypeMenuOpen, setChartTypeMenuOpen] = useState(false);
  const [extraTimeframeOpen, setExtraTimeframeOpen] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [showMA20, setShowMA20] = useState(false);
  const [showBB, setShowBB] = useState(false);
  const [indicatorsMenuOpen, setIndicatorsMenuOpen] = useState(false);
  const [brushStrokes, setBrushStrokes] = useState<{ x: number, y: number }[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<{ x: number, y: number }[] | null>(null);
  const [isDrawingBrush, setIsDrawingBrush] = useState(false);
  const [textAnnotations, setTextAnnotations] = useState<{ x: number, y: number, text: string }[]>([
    { x: 280, y: 150, text: "Breakout Zone" },
    { x: 550, y: 310, text: "Strong Support Level" }
  ]);
  const [measureStart, setMeasureStart] = useState<{ x: number, y: number } | null>(null);
  const [activeMeasure, setActiveMeasure] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
  const [magnetEnabled, setMagnetEnabled] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showGridlines, setShowGridlines] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [colorTheme, setColorTheme] = useState<"default" | "neon" | "amber">("default");
  const [helpOpen, setHelpOpen] = useState(false);
  const [isFullWidth, setIsFullWidth] = useState(false);

  // Predefined realistic candlestick datasets to match the second image pattern exactly
  const getCandleDataForTimeframe = (tf: typeof timeframe): Candle[] => {
    switch (tf) {
      case "D":
        return [
          { time: "05-24", open: 92800, high: 95500, low: 91200, close: 94000, volume: 18400 },
          { time: "05-25", open: 94000, high: 96000, low: 92500, close: 93200, volume: 14500 },
          { time: "05-26", open: 93200, high: 93800, low: 90100, close: 91500, volume: 22100 },
          { time: "05-27", open: 91500, high: 95400, low: 91000, close: 94600, volume: 19800 },
          { time: "05-28", open: 94600, high: 96800, low: 93400, close: 95800, volume: 16200 },
          { time: "05-29", open: 95800, high: 96200, low: 91100, close: 92000, volume: 28400 },
          { time: "05-30", open: 92000, high: 92500, low: 88400, close: 89100, volume: 24700 },
          { time: "05-31", open: 89100, high: 91050, low: 86400, close: 87400, volume: 21500 },
          { time: "06-01", open: 87400, high: 88500, low: 83200, close: 84300, volume: 30100 },
          { time: "06-02", open: 84300, high: 86800, low: 83100, close: 85600, volume: 22400 },
          { time: "06-03", open: 85600, high: 89200, low: 85000, close: 88200, volume: 18900 },
          { time: "06-04", open: 88200, high: 90100, low: 87500, close: 89000, volume: 15400 },
          { time: "06-05", open: 89000, high: 89500, low: 85200, close: 86100, volume: 20300 },
          { time: "06-06", open: 86100, high: 86400, low: 82100, close: 83400, volume: 23600 },
          { time: "06-07", open: 83400, high: 84100, low: 81000, close: 82000, volume: 19100 },
          { time: "06-08", open: 82000, high: 83800, low: 81500, close: 82900, volume: 14700 },
          { time: "06-09", open: 82900, high: 85200, low: 82500, close: 84500, volume: 17200 },
          { time: "06-10", open: 84500, high: 84800, low: 80100, close: 81000, volume: 22900 },
          { time: "06-11", open: 81000, high: 81500, low: 77100, close: 78305, volume: 29500 },
          { time: "06-12", open: 78305, high: 80500, low: 78100, close: 79200, volume: 16100 },
          { time: "06-13", open: 79200, high: 79800, low: 75200, close: 76100, volume: 25400 },
          { time: "06-14", open: 76100, high: 76500, low: 74100, close: 75200, volume: 20800 },
          { time: "06-15", open: 75200, high: 75400, low: 72100, close: 73400, volume: 24100 },
          { time: "06-16", open: 73400, high: 73800, low: 69200, close: 70600, volume: 32600 },
          { time: "06-17", open: 70600, high: 71250, low: 67100, close: 68400, volume: 29900 },
          { time: "06-18", open: 68400, high: 68900, low: 65200, close: 66300, volume: 35100 },
          { time: "06-19", open: 66300, high: 66700, low: 63100, close: 64205, volume: 38500 },
          { time: "06-20", open: 64205, high: 64500, low: 60100, close: 61100, volume: 44200 },
          { time: "06-21", open: 61100, high: 63500, low: 60800, close: 62400, volume: 26800 },
          { time: "06-22", open: 62400, high: 62900, low: 60500, close: 61500, volume: 31200 },
          { time: "06-23", open: 61500, high: 63900, low: 61200, close: 63200, volume: 24300 },
          { time: "06-24", open: 63200, high: 65583, low: 63325, close: 64318.07, volume: 28800 }
        ];
      case "1h":
        return [
          { time: "08:00", open: 63500, high: 63800, low: 63400, close: 63650, volume: 4200 },
          { time: "09:00", open: 63650, high: 63900, low: 63550, close: 63800, volume: 3800 },
          { time: "10:00", open: 63800, high: 64200, low: 63700, close: 64100, volume: 5500 },
          { time: "11:00", open: 64100, high: 64150, low: 63800, close: 63900, volume: 3100 },
          { time: "12:00", open: 63900, high: 64300, low: 63850, close: 64250, volume: 4800 },
          { time: "13:00", open: 64250, high: 64600, low: 64200, close: 64500, volume: 6200 },
          { time: "14:00", open: 64500, high: 64550, low: 63900, close: 64050, volume: 5100 },
          { time: "15:00", open: 64050, high: 64200, low: 63800, close: 63950, volume: 3900 },
          { time: "16:00", open: 63950, high: 64450, low: 63900, close: 64300, volume: 4600 },
          { time: "17:00", open: 64300, high: 64800, low: 64250, close: 64750, volume: 7100 },
          { time: "18:00", open: 64750, high: 64900, low: 64400, close: 64500, volume: 5900 },
          { time: "19:00", open: 64500, high: 64550, low: 64100, close: 64200, volume: 4100 },
          { time: "20:00", open: 64200, high: 64400, low: 64050, close: 64350, volume: 3300 },
          { time: "21:00", open: 64350, high: 64600, low: 64200, close: 64550, volume: 4900 },
          { time: "22:00", open: 64550, high: 64800, low: 64450, close: 64600, volume: 5200 },
          { time: "23:00", open: 64600, high: 65100, low: 64550, close: 64630, volume: 6800 }
        ];
      case "30m":
        return [
          { time: "14:30", open: 62800, high: 63100, low: 62750, close: 63000, volume: 2100 },
          { time: "15:00", open: 63000, high: 63200, low: 62900, close: 63150, volume: 1850 },
          { time: "15:30", open: 63150, high: 63400, low: 63050, close: 63300, volume: 2500 },
          { time: "16:00", open: 63300, high: 63350, low: 63100, close: 63200, volume: 1400 },
          { time: "16:30", open: 63200, high: 63600, low: 63150, close: 63550, volume: 2900 },
          { time: "17:00", open: 63550, high: 63800, low: 63500, close: 63700, volume: 3100 },
          { time: "17:30", open: 63700, high: 63750, low: 63300, close: 63400, volume: 2750 },
          { time: "18:00", open: 63400, high: 63800, low: 63350, close: 63650, volume: 2200 },
          { time: "18:30", open: 63650, high: 64200, low: 63600, close: 64100, volume: 4300 },
          { time: "19:00", open: 64100, high: 64500, low: 64050, close: 64300, volume: 5100 },
          { time: "19:30", open: 64300, high: 64400, low: 64100, close: 64250, volume: 3300 },
          { time: "20:00", open: 64250, high: 64650, low: 64200, close: 64500, volume: 3800 },
          { time: "20:30", open: 64500, high: 64550, low: 64200, close: 64300, volume: 2900 },
          { time: "21:00", open: 64300, high: 64800, low: 64250, close: 64650, volume: 4600 },
          { time: "21:30", open: 64650, high: 64750, low: 64400, close: 64500, volume: 3400 },
          { time: "22:00", open: 64500, high: 64950, low: 64450, close: 64600, volume: 4100 }
        ];
      case "1m":
      default:
        return [
          { time: "10:14", open: 64280, high: 64320, low: 64270, close: 64300, volume: 340 },
          { time: "10:15", open: 64300, high: 64350, low: 64290, close: 64340, volume: 410 },
          { time: "10:16", open: 64340, high: 64345, low: 64280, close: 64295, volume: 290 },
          { time: "10:17", open: 64295, high: 64330, low: 64285, close: 64320, volume: 310 },
          { time: "10:18", open: 64320, high: 64380, low: 64310, close: 64355, volume: 480 },
          { time: "10:19", open: 64355, high: 64360, low: 64290, close: 64310, volume: 530 },
          { time: "10:20", open: 64310, high: 64340, low: 64295, close: 64330, volume: 380 },
          { time: "10:21", open: 64330, high: 64395, low: 64320, close: 64360, volume: 620 }
        ];
    }
  };

  const rawCandles = getCandleDataForTimeframe(timeframe);
  const scale = selectedCoin.basePrice / 64318.07;
  const candleData = rawCandles.map((c, idx, arr) => {
    const isLast = idx === arr.length - 1;
    const finalClose = isLast ? realtimePrice : c.close * scale;
    const scaled = {
      ...c,
      open: c.open * scale,
      high: c.high * scale,
      low: c.low * scale,
      close: finalClose,
    };
    if (isLast) {
      scaled.high = Math.max(scaled.high, realtimePrice);
      scaled.low = Math.min(scaled.low, realtimePrice);
    }
    return scaled;
  });

  // Reset realtimePrice when active coin changes
  useEffect(() => {
    const coinScale = selectedCoin.basePrice / 64318.07;
    setRealtimePrice(selectedCoin.basePrice);
    const openPrice = 63200 * coinScale;
    const diff = selectedCoin.basePrice - openPrice;
    const pct = (diff / openPrice) * 100;
    setPriceChangeAbs(diff);
    setPriceChangePercent(pct);
  }, [selectedCoin]);

  // Auto-ticking simulation loop to make the chart look active and high-tech
  useEffect(() => {
    const timer = setInterval(() => {
      // Fluctuate price slightly proportional to current base price
      const volatility = selectedCoin.basePrice * 0.0002;
      const change = (Math.random() - 0.46) * volatility;
      setRealtimePrice(prev => {
        const nextPrice = Number((prev + change).toFixed(selectedCoin.basePrice < 10 ? 4 : 2));
        
        // Calculate dynamic ticker updates relative to open price
        const coinScale = selectedCoin.basePrice / 64318.07;
        const openPrice = 63200 * coinScale;
        const diff = Number((nextPrice - openPrice).toFixed(selectedCoin.basePrice < 10 ? 4 : 2));
        const pct = Number(((diff / openPrice) * 100).toFixed(2));
        
        setPriceChangeAbs(diff);
        setPriceChangePercent(pct);
        return nextPrice;
      });
    }, 1800);

    return () => clearInterval(timer);
  }, [selectedCoin]);

  // SVG Chart Coordinate calculations
  const minPrice = (timeframe === "D" ? 55000 : timeframe === "1m" ? 64200 : 62000) * scale;
  const maxPrice = (timeframe === "D" ? 102000 : timeframe === "1m" ? 64450 : 65800) * scale;
  const maxVolume = Math.max(...candleData.map(c => c.volume));

  const getX = (index: number) => {
    const marginL = 50;
    const marginR = 100;
    const boundsWidth = 1000 - marginL - marginR;
    return marginL + (index * (boundsWidth / (candleData.length - 1 || 1)));
  };

  const getY = (val: number) => {
    // scale candles inside 40px to 330px
    const marginT = 40;
    const marginB = 120;
    const boundsHeight = 450 - marginT - marginB;
    return 450 - marginB - ((val - minPrice) / (maxPrice - minPrice)) * boundsHeight;
  };

  const getVolY = (vol: number) => {
    // scale volume bars inside 350px to 430px
    const chartBottom = 435;
    const maxVolHeight = 60;
    const pct = vol / (maxVolume || 1);
    return chartBottom - pct * maxVolHeight;
  };

  // Generate Heikin Ashi values dynamically
  const getHeikinAshiData = () => {
    const haData: { open: number; high: number; low: number; close: number; volume: number; time: string }[] = [];
    candleData.forEach((candle, idx) => {
      let haOpen = candle.open;
      if (idx > 0) {
        const prevHa = haData[idx - 1];
        haOpen = (prevHa.open + prevHa.close) / 2;
      }
      const haClose = (candle.open + candle.high + candle.low + candle.close) / 4;
      const haHigh = Math.max(candle.high, haOpen, haClose);
      const haLow = Math.min(candle.low, haOpen, haClose);
      haData.push({
        open: haOpen,
        high: haHigh,
        low: haLow,
        close: haClose,
        volume: candle.volume,
        time: candle.time
      });
    });
    return haData;
  };

  // Generate smooth EMA curve
  const getEMAPathString = () => {
    const emaPeriod = 10;
    const emaValues: number[] = [];
    candleData.forEach((candle, idx) => {
      if (idx === 0) {
        emaValues.push(candle.close);
      } else {
        const k = 2 / (emaPeriod + 1);
        emaValues.push(candle.close * k + emaValues[idx - 1] * (1 - k));
      }
    });

    return emaValues.map((val, idx) => {
      const x = getX(idx);
      const y = getY(val);
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  // Generate 15-period Simple Moving Average (SMA)
  const getMAPathString = () => {
    const period = 15;
    const maValues: number[] = [];
    candleData.forEach((candle, idx) => {
      const startIdx = Math.max(0, idx - period + 1);
      const windowCandles = candleData.slice(startIdx, idx + 1);
      const sum = windowCandles.reduce((acc, c) => acc + c.close, 0);
      maValues.push(sum / windowCandles.length);
    });

    return maValues.map((val, idx) => {
      const x = getX(idx);
      const y = getY(val);
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  // Calculate Bollinger Bands with a period of 15 and multiplier of 1.8
  const getBBPaths = () => {
    const period = 15;
    const upper: { x: number; y: number }[] = [];
    const lower: { x: number; y: number }[] = [];

    candleData.forEach((candle, idx) => {
      const startIdx = Math.max(0, idx - period + 1);
      const sub = candleData.slice(startIdx, idx + 1);
      const mean = sub.reduce((acc, c) => acc + c.close, 0) / sub.length;
      const variance = sub.reduce((acc, c) => acc + Math.pow(c.close - mean, 2), 0) / sub.length;
      const stdDev = Math.sqrt(variance) || (candle.close * 0.01);

      const upperVal = mean + 1.8 * stdDev;
      const lowerVal = mean - 1.8 * stdDev;

      upper.push({ x: getX(idx), y: getY(upperVal) });
      lower.push({ x: getX(idx), y: getY(lowerVal) });
    });

    const upperPath = upper.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const lowerPath = lower.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    // Closed polygon path for Bollinger shadow shading
    const areaPoints: string[] = [];
    upper.forEach(p => areaPoints.push(`${p.x},${p.y}`));
    for (let i = lower.length - 1; i >= 0; i--) {
      areaPoints.push(`${lower[i].x},${lower[i].y}`);
    }
    const areaPathStr = areaPoints.join(' L ');

    return { upperPath, lowerPath, areaPathStr: areaPoints.length > 0 ? `M ${areaPathStr} Z` : "" };
  };

  // Construct Area Mountain line coordinates
  const getLineChartPaths = () => {
    const points = candleData.map((c, idx) => ({ x: getX(idx), y: getY(c.close) }));
    if (points.length === 0) return { strokePath: "", fillPath: "" };

    const strokePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const yBottom = 435;
    const fillPath = `${strokePath} L ${points[points.length - 1].x} ${yBottom} L ${points[0].x} ${yBottom} Z`;

    return { strokePath, fillPath };
  };

  // Cumulative performance correlation to simulate benchmark comparisons side-by-side
  const getComparePathString = () => {
    const startingPrice = candleData[0].close;
    const comparePaths: string[] = [];
    candleData.forEach((candle, idx) => {
      const x = getX(idx);
      // Steadily growing correlated system index comparison line
      const mockIndexMult = 1.0 + (idx * 0.0028) + Math.sin(idx * 0.48) * 0.015;
      const compPrice = startingPrice * mockIndexMult;
      const y = getY(compPrice);
      comparePaths.push(`${idx === 0 ? 'M' : 'L'} ${x} ${y}`);
    });
    return comparePaths.join(' ');
  };

  const currentCandle = hoverIdx !== null ? candleData[hoverIdx] : candleData[candleData.length - 1];
  const isCurrentlyUp = currentCandle.close >= currentCandle.open;

  // Render Horizontal Gridlines & Price Scale labels perfectly
  const getGridlines = () => {
    const gridCount = 6;
    const lines = [];
    for (let i = 0; i < gridCount; i++) {
      const price = minPrice + (i * (maxPrice - minPrice)) / (gridCount - 1);
      lines.push(price);
    }
    return lines;
  };

  // Helper to snap cursor to the nearest candle high/low/open/close price level if magnet is enabled
  const getSnappedCoords = (rawX: number, rawY: number, hoverIndex: number | null) => {
    if (!magnetEnabled || hoverIndex === null) return { x: rawX, y: rawY };
    const candle = candleData[hoverIndex];
    const levels = [candle.open, candle.high, candle.low, candle.close];
    let bestSnapY = rawY;
    let minDistance = Infinity;

    levels.forEach((lvl) => {
      const lvlY = getY(lvl);
      const dist = Math.abs(lvlY - rawY);
      if (dist < minDistance) {
        minDistance = dist;
        bestSnapY = lvlY;
      }
    });

    const bestSnapX = getX(hoverIndex);
    // Snap to level only if the mouse is relatively close (within 45px distance)
    if (minDistance < 45) {
      return { x: bestSnapX, y: bestSnapY };
    }
    return { x: rawX, y: rawY };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert mouse pixels to SVG scale coordinates (1000x450 grid)
    const svgX = (clientX / rect.width) * 1000;
    const svgY = (clientY / rect.height) * 450;

    // Find closest candle index
    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < candleData.length; i++) {
      const xPos = getX(i);
      const diff = Math.abs(xPos - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }

    if (svgX >= 40 && svgX <= 910 && svgY >= 10 && svgY <= 440) {
      const snapped = getSnappedCoords(svgX, svgY, closestIdx);
      setHoverIdx(closestIdx);
      setMouseCoords(snapped);

      // Handle continuous brush drawing
      if (activeTool === "brush" && isDrawingBrush && currentStroke) {
        setCurrentStroke(prev => prev ? [...prev, { x: svgX, y: svgY }] : [{ x: svgX, y: svgY }]);
      }
    } else {
      setHoverIdx(null);
      setMouseCoords(null);
      // Terminate stroke if cursor leaves SVG
      if (isDrawingBrush) {
        if (currentStroke && currentStroke.length > 1) {
          setBrushStrokes(prev => [...prev, currentStroke]);
        }
        setIsDrawingBrush(false);
        setCurrentStroke(null);
      }
    }
  };

  const handleMouseLeave = () => {
    setHoverIdx(null);
    setMouseCoords(null);
    if (isDrawingBrush) {
      if (currentStroke && currentStroke.length > 1) {
        setBrushStrokes(prev => [...prev, currentStroke]);
      }
      setIsDrawingBrush(false);
      setCurrentStroke(null);
    }
  };

  const handleMouseDown = () => {
    if (!mouseCoords || activeTool !== "brush") return;
    setIsDrawingBrush(true);
    setCurrentStroke([{ x: mouseCoords.x, y: mouseCoords.y }]);
  };

  const handleMouseUp = () => {
    if (activeTool === "brush" && isDrawingBrush) {
      if (currentStroke && currentStroke.length > 1) {
        setBrushStrokes(prev => [...prev, currentStroke]);
      }
      setIsDrawingBrush(false);
      setCurrentStroke(null);
    }
  };

  const handleChartClick = () => {
    if (!mouseCoords) return;

    if (activeTool === "line" || activeTool === "fib") {
      if (!drawingStart) {
        setDrawingStart({ x: mouseCoords.x, y: mouseCoords.y });
      } else {
        setDrawings(prev => [
          ...prev,
          { type: activeTool, x1: drawingStart.x, y1: drawingStart.y, x2: mouseCoords.x, y2: mouseCoords.y }
        ]);
        setDrawingStart(null);
      }
    } else if (activeTool === "measure") {
      if (!measureStart) {
        setMeasureStart({ x: mouseCoords.x, y: mouseCoords.y });
      } else {
        // Lock and save measurement drawing
        setDrawings(prev => [
          ...prev,
          { type: "measure", x1: measureStart.x, y1: measureStart.y, x2: mouseCoords.x, y2: mouseCoords.y }
        ]);
        setMeasureStart(null);
      }
    } else if (activeTool === "text") {
      const presets = [
        "Orbitrio Block Purchase",
        "Breakout Verified",
        "Liquidity Grab",
        "Bullish Orderflow",
        "Strong Support Level"
      ];
      const randomPreset = presets[Math.floor(Math.random() * presets.length)];
      setTextAnnotations(prev => [
        ...prev,
        { x: mouseCoords.x, y: mouseCoords.y, text: randomPreset }
      ]);
    }
  };

  return (
    <section className="pt-2 pb-20 px-4 max-w-7xl mx-auto" id="trade-features">
      <div className="flex flex-col items-center text-center mb-12 space-y-4">
        
        {/* Centered Bybit-Style Premium Benchmark Icon */}
        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFB11A]/20 via-[#FFB11A]/5 to-transparent border border-[#FFB11A]/30 flex items-center justify-center shadow-xl shadow-neutral-950/45 shrink-0">
          <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_center,rgba(255,177,26,0.12),transparent_70%)] animate-pulse" />
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#brand-grad-gold)" stroke="#FFB11A" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
            <path d="M2 17L12 22L22 17" stroke="#FFB11A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
            <defs>
              <linearGradient id="brand-grad-gold" x1="2" y1="2" x2="22" y2="12" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFC73C" />
                <stop offset="1" stopColor="#FFB11A" stopOpacity="0.4" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Clean, Premium Sans-Serif Headline */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-semibold text-white tracking-tight leading-tight max-w-3xl mx-auto font-bybit">
          The Benchmark for Secure <span className="whitespace-nowrap">Multi-Asset</span> Investing
        </h2>
        
        <p className="text-neutral-400 mt-4 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed font-sans">
          Join a network of over 6,000 elite investors who rely on <span className="text-white hover:text-amber-500 transition-colors duration-150 font-medium">Orbitrio</span> to automate their growth. Sync your portfolio with top-tier strategists and experience institutional-grade execution in real-time.
        </p>
        <div className="pt-4 flex flex-col items-center">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate(user?.isLoggedIn ? "dashboard-trading" : "auth")}
            className="px-8 py-3.5 rounded-xl bg-orbit-accent hover:bg-orbit-accent-hover text-orbit-bg font-extrabold tracking-wider font-sans text-xs uppercase shadow-lg shadow-orbit-accent/15 transition-all duration-200 transform hover:scale-[1.02] active:scale-95 cursor-pointer inline-flex items-center justify-center gap-2"
          >
            Start Trading
          </button>
          <span className="text-[10px] sm:text-xs text-neutral-500 font-sans tracking-wide mt-3.5 select-none font-medium">
            No dynamic deposit fees • High-grade cold storage custody • Insured asset protection
          </span>
        </div>
      </div>

      {/* Floating Graphic Cards Showcase (Matching visual exactly) */}
      <div className="max-w-6xl mx-auto mb-16 px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: 100+ Assets Grid with scroll trigger float-in animation */}
          <motion.div
            initial={{ opacity: 0, y: 110, scale: 0.85, rotateX: 8 }}
            whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ type: "spring", stiffness: 65, damping: 13, delay: 0, mass: 1.1 }}
            className="h-[390px] sm:h-[410px] flex flex-col justify-between p-4 relative group transform-gpu"
          >
            <h4 className="text-base sm:text-[17px] font-semibold text-neutral-400 tracking-tight leading-snug">
              <span className="block text-white font-extrabold text-lg sm:text-xl mb-1.5 font-sans">100+ assets</span>
              including currency pairs, majors, minors, exotics, crypto and more
            </h4>
            
            {/* 3D Isometric Logo Tile Grid with realistic 3D volumetric keycaps */}
            <div 
              className="relative h-56 sm:h-60 overflow-hidden mt-2 opacity-95 select-none w-full"
              style={{ perspective: "1000px" }}
            >
              <div 
                className="absolute left-1/2 top-4 -translate-x-1/2 w-[340px] grid grid-cols-4 gap-3.5 p-1 pb-16 pointer-events-none"
                style={{ 
                  transform: "rotateX(55deg) rotateZ(-34deg) translateY(0px)", 
                  transformStyle: "preserve-3d" 
                }}
              >
                {/* Dynamically render authentic high-fidelity stock elements using renderKeycap function */}
                {['MSFT', 'CAT', 'DIS', 'NFLX', 'GOOG', 'AAPL', 'NVDA', 'SLACK', 'CSCO', 'TSLA', 'AMZN', 'EBAY'].map((stock) => 
                  renderKeycap(stock)
                )}
              </div>
            </div>
          </motion.div>

          {/* Card 2: 50+ Technical tools indicators with scroll trigger float-in animation */}
          <motion.div
            initial={{ opacity: 0, y: 110, scale: 0.85, rotateX: 8 }}
            whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ type: "spring", stiffness: 65, damping: 13, delay: 0.12, mass: 1.1 }}
            className="h-[390px] sm:h-[410px] flex flex-col justify-between p-4 relative group transform-gpu"
          >
            <h4 className="text-base sm:text-[17px] font-semibold text-neutral-400 tracking-tight leading-snug">
              <span className="block text-white font-extrabold text-lg sm:text-xl mb-1.5 font-sans">50+ technical tools indicators</span>
              integrated trade signals and innovative risk management tools majors, minors.
            </h4>
            
            {/* 3D Isometric Technical Candlestick View (Highly Detailed, Exact Layout) */}
            <div 
              className="relative h-56 sm:h-60 overflow-hidden mt-2 opacity-95 select-none w-full"
              style={{ perspective: "1000px" }}
            >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div 
                  className="w-[300px] h-[210px] bg-[#0E1117] border border-neutral-800 rounded-2xl p-4 shadow-[0_15px_35px_rgba(0,0,0,0.85)] text-[10px] font-mono mt-1 relative overflow-hidden flex flex-col justify-between"
                  style={{ 
                    transform: "rotateX(54deg) rotateZ(-30deg) translateY(4px)", 
                    transformStyle: "preserve-3d" 
                  }}
                >
                  {/* Outer Grid lines backdrop matching professional Bybit UI */}
                  <div className="absolute inset-0 grid grid-cols-6 grid-rows-5 opacity-10 pointer-events-none">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div key={i} className="border-r border-b border-white border-dashed"></div>
                    ))}
                  </div>
                  
                  {/* Upper bar with indicator info & control toolbar overlay */}
                  <div className="flex justify-between items-center text-[9px] border-b border-neutral-800 pb-2 relative z-10 select-none">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#14F195] font-black uppercase tracking-wider">50% Buy Range</span>
                      <span className="text-neutral-500 font-medium">Orbit-EMA(9)</span>
                    </div>
                    {/* Floating Mini Pro UI Overlay Toolbar */}
                    <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1 px-1.5 scale-95 opacity-90">
                      <svg className="w-2.5 h-2.5 text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                      </svg>
                      <span className="text-white font-bold tracking-tight text-[8px] leading-none px-0.5">15s</span>
                      <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping"></span>
                    </div>
                  </div>
 
                  {/* Intertwined charting path & Realistic Candlesticks with coordinate markers */}
                  <div className="relative h-28 flex items-end justify-between px-1.5 py-1 z-10 w-full mb-1">
                    {/* Realistic EMA bezier curves */}
                    <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="absolute inset-0 w-full h-full fill-none stroke-[#14F195] stroke-[1.2] opacity-40">
                      <path d="M0,42 Q15,45 30,22 T60,28 T90,12 T100,6" />
                    </svg>
                    <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="absolute inset-0 w-full h-full fill-none stroke-amber-500/50 stroke-[1.0] stroke-dasharray-[2,2] opacity-30">
                      <path d="M0,46 Q20,38 40,29 T80,18 T100,5" />
                    </svg>
 
                    {/* Highly-accurate Candlestick Nodes (wick lines + body boxes) */}
                    {/* C1: Red drop */}
                    <div className="flex flex-col items-center w-2.5 h-20 justify-end relative select-none">
                      <div className="w-[1.2px] bg-red-500 h-10 absolute bottom-1"></div>
                      <div className="w-2.5 bg-red-500/90 border border-red-600 h-[22px] rounded-sm z-10 relative"></div>
                    </div>
                    {/* C2: Red drop deeper */}
                    <div className="flex flex-col items-center w-2.5 h-20 justify-end relative select-none">
                      <div className="w-[1.2px] bg-red-500 h-12 absolute bottom-0.5"></div>
                      <div className="w-2.5 bg-red-500/90 border border-red-600 h-[15px] rounded-sm z-10 relative"></div>
                    </div>
                    {/* C3: Strong Green rebound */}
                    <div className="flex flex-col items-center w-2.5 h-20 justify-end relative select-none">
                      <div className="w-[1.2px] bg-[#14F195] h-14 absolute bottom-2"></div>
                      <div className="w-2.5 bg-[#14F195]/90 border border-emerald-600 h-[26px] rounded-sm z-10 relative"></div>
                    </div>
                    {/* C4: Green consolidation */}
                    <div className="flex flex-col items-center w-2.5 h-20 justify-end relative select-none">
                      <div className="w-[1.2px] bg-[#14F195] h-12 absolute bottom-4"></div>
                      <div className="w-2.5 bg-[#14F195]/90 border border-emerald-600 h-[14px] rounded-sm z-10 relative"></div>
                    </div>
                    {/* C5: Minor Red pullback */}
                    <div className="flex flex-col items-center w-2.5 h-20 justify-end relative select-none">
                      <div className="w-[1.2px] bg-red-500 h-9 absolute bottom-6"></div>
                      <div className="w-2.5 bg-red-500/80 border border-red-600 h-[9px] rounded-sm z-10 relative"></div>
                    </div>
                    {/* C6: Massive Breakout Green (matching exact close target) */}
                    <div className="flex flex-col items-center w-2.5 h-20 justify-end relative select-none">
                      <div className="w-[1.2px] bg-[#14F195] h-16 absolute bottom-5"></div>
                      <div className="w-2.5 bg-[#14F195] border border-emerald-500 h-[32px] rounded-sm z-10 relative shadow-[0_0_12px_rgba(20,241,149,0.5)]"></div>
                    </div>
 
                    {/* Horizontal Dotted Crosshair locking close target */}
                    <div className="absolute left-0 right-0 border-t border-neutral-600 border-dashed top-[28px] opacity-40 z-0"></div>
                    <div className="absolute left-[70%] top-0 bottom-0 border-l border-neutral-600 border-dashed opacity-40 z-0"></div>
 
                    {/* Glowing breakout Close Price white badge pill */}
                    <div 
                      className="absolute right-1 top-[20px] bg-white text-neutral-950 font-black font-mono text-[8px] tracking-tight py-0.5 px-1.5 rounded-md shadow-[0_0_15px_rgba(255,255,255,0.75)] z-20 flex items-center leading-none"
                    >
                      116.1245
                    </div>
 
                    {/* Grid Coordinate labels inside the space */}
                    <span className="absolute left-1 bottom-1 text-[7px] text-neutral-600 tracking-wide select-none font-bold">12:01</span>
                    <span className="absolute left-[130px] bottom-1 text-[7px] text-neutral-600 tracking-wide select-none">03:25</span>
                    <span className="absolute right-8 top-1 text-[7px] text-neutral-600 tracking-wide select-none">116.1250</span>
                  </div>
 
                  {/* Bottom metrics section display close index */}
                  <div className="bg-neutral-900 border border-neutral-850 rounded-xl p-2.5 flex justify-between items-center text-[8.5px] select-none scale-100 font-sans relative z-10">
                    <span className="text-neutral-500 font-bold tracking-wide uppercase">INDEX CLOSE (BREAKOUT)</span>
                    <span className="text-[#FFB11A] font-black tracking-widest bg-[#FFB11A]/5 px-2 py-0.5 rounded-lg border border-[#FFB11A]/20">116.1245 SECURED</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Seamless trading experience with scroll trigger float-in animation */}
          <motion.div
            initial={{ opacity: 0, y: 110, scale: 0.85, rotateX: 8 }}
            whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ type: "spring", stiffness: 65, damping: 13, delay: 0.24, mass: 1.1 }}
            className="h-[390px] sm:h-[410px] flex flex-col justify-between p-4 relative group transform-gpu"
          >
            <h4 className="text-base sm:text-[17px] font-semibold text-neutral-400 tracking-tight leading-snug">
              <span className="block text-white font-extrabold text-lg sm:text-xl mb-1.5 font-sans">Seamless trading experience</span>
              Enjoy fast execution, intuitive interface, and real-time market data.
            </h4>
            
            {/* 3D Isometric Logo Tile Grid (With identical high-fidelity 3D physical keycaps & customized Orbitrio gold badging) */}
            <div 
              className="relative h-56 sm:h-60 overflow-hidden mt-2 opacity-95 select-none w-full"
              style={{ perspective: "1000px" }}
            >
              <div 
                className="absolute left-1/2 top-4 -translate-x-1/2 w-[340px] grid grid-cols-4 gap-3.5 p-1 pb-16 pointer-events-none"
                style={{ 
                  transform: "rotateX(55deg) rotateZ(-34deg) translateY(0px)", 
                  transformStyle: "preserve-3d" 
                }}
              >
                {/* Dynamically render authentic high-fidelity stock elements including the highlighted ORBIT premium brand keycap */}
                {['MSFT', 'CAT', 'DIS', 'ORBIT', 'GOOG', 'AAPL', 'NVDA', 'SLACK', 'CSCO', 'TSLA', 'AMZN', 'EBAY'].map((stock) => 
                  renderKeycap(stock)
                )}
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* SECTION: The Future of Asset Management (matching reference image precisely with transparent styling, gold-orange accents, and bar chart background patterns) */}
      <div className="relative py-20 overflow-hidden border-t border-b border-neutral-900/40 my-12">
        
        {/* Background rounded bars (bar-chart-like patterns) behind the cards, matching the reference images */}
        <div className="absolute inset-0 pointer-events-none select-none z-0 opacity-[0.14] flex items-end justify-between px-4 sm:px-10">
          <div className="w-[12%] h-[65%] bg-gradient-to-t from-[#FFB11A] to-transparent rounded-t-full" />
          <div className="w-[12%] h-[85%] bg-gradient-to-t from-[#FFB11A] to-transparent rounded-t-full" />
          <div className="w-[12%] h-[72%] bg-gradient-to-t from-[#FFB11A] to-transparent rounded-t-full" />
          <div className="w-[12%] h-[95%] bg-gradient-to-t from-[#FFB11A] to-transparent rounded-t-full" />
          <div className="w-[12%] h-[60%] bg-gradient-to-t from-[#FFB11A] to-transparent rounded-t-full" />
          <div className="w-[12%] h-[80%] bg-gradient-to-t from-[#FFB11A] to-transparent rounded-t-full" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col items-center text-center mb-16 space-y-4">
            <motion.span
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-amber-500/15 bg-amber-500/5 text-[10px] md:text-xs text-amber-500 font-bold tracking-[0.2em] font-bybit uppercase"
            >
              FEATURES
            </motion.span>
            
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 60, damping: 14 }}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-semibold text-white tracking-tight leading-tight max-w-4xl mx-auto font-bybit"
            >
              The Future of Asset Management
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 60, damping: 14, delay: 0.1 }}
              className="text-neutral-400 max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed font-bybit opacity-85"
            >
              Offers a unified platform that fosters innovation while providing end-to-end asset management. See how we help you solve today's biggest financial challenges.
            </motion.p>
          </div>

          {/* First Row: 3 Floating Display Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-12">
            
            {/* Card 1: Fast and Reliable */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.05 }}
              transition={{ type: "spring", stiffness: 65, damping: 13 }}
              className="relative p-6 sm:p-8 flex flex-col justify-start text-left group hover:scale-[1.02] transition-transform duration-300"
            >
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/15 text-[#FFB11A] rounded-2xl w-14 h-14 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3 tracking-tight font-bybit">
                Fast and Reliable
              </h3>
              <p className="text-neutral-400 font-bybit text-xs sm:text-sm leading-relaxed opacity-80">
                Our platform is built on a foundation of cutting-edge technology designed for speed and reliability. We use powerful servers and sophisticated software to ensure your trades are executed quickly and efficiently.
              </p>
            </motion.div>

            {/* Card 2: Your Success, Our Priority (Transparent Styling overlay) */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.05 }}
              transition={{ type: "spring", stiffness: 65, damping: 13, delay: 0.1 }}
              className="bg-neutral-900/15 backdrop-blur-md border border-neutral-800/30 rounded-3xl p-6 sm:p-8 flex flex-col justify-start text-left shadow-2xl relative group hover:border-amber-500/20 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.01] to-transparent rounded-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/15 text-[#FFB11A] rounded-2xl w-14 h-14 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                  <Database className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3 tracking-tight font-bybit">
                  Your Success, Our Priority
                </h3>
                <p className="text-neutral-400 font-bybit text-xs sm:text-sm leading-relaxed opacity-80">
                  We are committed to providing exceptional customer support, ensuring your trading journey is as seamless and satisfying as possible.
                </p>
              </div>
            </motion.div>

            {/* Card 3: Trading Without Limits */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.05 }}
              transition={{ type: "spring", stiffness: 65, damping: 13, delay: 0.2 }}
              className="relative p-6 sm:p-8 flex flex-col justify-start text-left group hover:scale-[1.02] transition-transform duration-300"
            >
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/15 text-[#FFB11A] rounded-2xl w-14 h-14 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Puzzle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3 tracking-tight font-bybit">
                Trading Without Limits
              </h3>
              <p className="text-neutral-400 font-bybit text-xs sm:text-sm leading-relaxed opacity-80">
                Our platform provides the tools and support you need to excel in trading. With no time constraints, you can refine your strategies, implement changes, and maximize your trading performance based on your individual risk appetite and goals.
              </p>
            </motion.div>

          </div>

          {/* Second Row: 3 Floating Display Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            
            {/* Card 4: Risk Management */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.05 }}
              transition={{ type: "spring", stiffness: 65, damping: 13 }}
              className="relative p-6 sm:p-8 flex flex-col justify-start text-left group hover:scale-[1.02] transition-transform duration-300"
            >
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/15 text-[#FFB11A] rounded-2xl w-14 h-14 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3 tracking-tight font-bybit">
                Risk Management
              </h3>
              <p className="text-neutral-400 font-bybit text-xs sm:text-sm leading-relaxed opacity-80">
                We understand that trading involves risk. That's why we've built robust risk management tools into our platform. You can set limits on your trades, manage your positions effectively, and access educational resources to help you make informed decisions.
              </p>
            </motion.div>

            {/* Card 5: Privacy Compliance (Highlighted Transparent block) */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.05 }}
              transition={{ type: "spring", stiffness: 65, damping: 13, delay: 0.1 }}
              className="bg-neutral-900/15 backdrop-blur-md border border-neutral-800/30 rounded-3xl p-6 sm:p-8 flex flex-col justify-start text-left shadow-2xl relative group hover:border-amber-500/20 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.01] to-transparent rounded-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/15 text-[#FFB11A] rounded-2xl w-14 h-14 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                  <Fingerprint className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3 tracking-tight font-bybit">
                  Privacy Compliance
                </h3>
                <p className="text-neutral-400 font-bybit text-xs sm:text-sm leading-relaxed opacity-80">
                  We understand the importance of protecting your privacy. Our platform is designed with robust security measures and adheres to industry-leading privacy regulations like GDPR, CCPA. Your personal information and trading activity are kept confidential and secure.
                </p>
              </div>
            </motion.div>

            {/* Card 6: Unwavering Security */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.05 }}
              transition={{ type: "spring", stiffness: 65, damping: 13, delay: 0.2 }}
              className="relative p-6 sm:p-8 flex flex-col justify-start text-left group hover:scale-[1.02] transition-transform duration-300"
            >
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/15 text-[#FFB11A] rounded-2xl w-14 h-14 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3 tracking-tight font-bybit">
                Unwavering Security
              </h3>
              <p className="text-neutral-400 font-bybit text-xs sm:text-sm leading-relaxed opacity-80">
                Our platform utilizes state-of-the-art security protocols, including encryption, firewalls, and continuous monitoring, to safeguard your data and transactions.
              </p>
            </motion.div>

          </div>
        </div>
      </div>

      {/* Crypto Derivatives & Futures Trading Grid Block (02.) */}
      <div className="max-w-6xl mx-auto mb-14 px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Content Column */}
          <div className="lg:col-span-7 flex flex-col items-center text-center lg:items-start lg:text-left space-y-4">
            
            {/* Premium Bybit-style 3D Geometric Logo Mark placed on top */}
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFB11A]/20 via-[#FFB11A]/5 to-transparent border border-[#FFB11A]/30 flex items-center justify-center shadow-xl shadow-neutral-950/45 shrink-0 mb-1">
              {/* Subtle pulsing background glow */}
              <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_center,rgba(255,177,26,0.12),transparent_70%)] animate-pulse" />
              
              {/* Bybit-style premium intertwined leverage paths SVG */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                <path
                  d="M4 15.5L12 7.5L20 15.5"
                  stroke="#FFB11A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 10.5L12 2.5L20 10.5"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="1,1"
                  opacity="0.8"
                />
                <path
                  d="M12 7.5V21.5"
                  stroke="#FFB11A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.4"
                />
                <circle cx="12" cy="7.5" r="2.5" fill="#FFB11A" stroke="#12161C" strokeWidth="1" />
              </svg>
            </div>

            {/* Title with Premium, Clean Sans-Serif Typography */}
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-semibold text-white tracking-tight leading-tight font-bybit">
              Crypto Derivatives & <span className="text-[#FFB11A] relative inline-block">
                Futures Trading
                <span className="absolute left-0 bottom-1 w-full h-[2px] bg-gradient-to-r from-[#FFB11A]/80 to-transparent rounded-full" />
              </span>
            </h3>
            
            <p className="text-neutral-450 text-sm sm:text-base md:text-lg leading-relaxed font-sans text-neutral-400 pt-1">
              Trade perpetual and futures contracts with industry-leading liquidity, ultra-low latency, and advanced leverage. Gain optimized exposure to major digital assets like <span className="text-white hover:text-[#FFB11A] transition-colors duration-150 font-semibold cursor-pointer">BTC</span>, <span className="text-white hover:text-[#FFB11A] transition-colors duration-150 font-semibold cursor-pointer">ETH</span>, and <span className="text-white hover:text-[#FFB11A] transition-colors duration-150 font-semibold cursor-pointer">SOL</span> using pro-tier charting tools, advanced hedging capabilities, and real-time risk management. 
            </p>

            {/* Premium Highlights */}
            <div className="grid grid-cols-2 gap-4 pt-2 font-sans">
              <div className="flex flex-col">
                <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">Leverage Ratio</span>
                <span className="text-sm font-semibold text-neutral-200 mt-1 block">Up to 100x</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest block">Contract Type</span>
                <span className="text-sm font-semibold text-neutral-200 mt-1 block">Perps & Futures</span>
              </div>
            </div>
          </div>

          {/* Right Floating 0% Graphic Column */}
          <div className="lg:col-span-5 relative">
            <ZeroPercentLoopCard />
          </div>

        </div>
      </div>

      {/* Premium High-Fidelity TradingView Live Charting Panel */}
      <div className="w-full max-w-full overflow-hidden px-2 sm:px-4 mb-10">
        <div className="bg-[#12161C] border border-[#2B3139] rounded-2xl overflow-hidden shadow-2xl shadow-neutral-950/80 max-w-6xl mx-auto">
          
          {/* Toolbar Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#2B3139] bg-[#161a22] px-4 py-2.5 gap-3 select-none relative z-40">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 w-full sm:w-auto flex-nowrap">
            {/* Timeframe Selectors */}
            <div className="flex items-center bg-neutral-900/60 rounded p-0.5 border border-neutral-800/80 relative">
              {["1m", "30m", "1h", "D"].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf as any)}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold cursor-pointer transition-all ${
                    timeframe === tf
                      ? "bg-[#FFB11A] text-[#0B0E11] shadow-md shadow-[#FFB11A]/10 font-bold"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {tf}
                </button>
              ))}
              <button 
                onClick={() => setExtraTimeframeOpen(!extraTimeframeOpen)}
                className="p-1 rounded text-neutral-500 hover:text-white cursor-pointer transition-colors"
                title="More Resolutions"
              >
                <ChevronDown size={11} className={`transition-transform duration-150 ${extraTimeframeOpen ? "rotate-180 text-white" : ""}`} />
              </button>

              {/* Extra Timeframes Dropdown Menu */}
              {extraTimeframeOpen && (
                <div className="absolute left-0 top-full mt-2 w-36 bg-[#14181F] border border-[#2B3139] rounded-xl shadow-xl py-1.5 z-50 animate-fade-in text-left">
                  <div className="px-3 py-1 text-[9px] font-bold text-neutral-500 font-mono uppercase tracking-wider border-b border-[#2B3139]/40 mb-1">
                    Resolutions
                  </div>
                  {["5m (Intraday)", "15m (Trading)", "4h (Strategic)", "1W (Weekly)"].map((tfSub, subIdx) => (
                    <button
                      key={tfSub}
                      onClick={() => {
                        // Change active timeframe and reset simulation values
                        setTimeframe(subIdx === 3 ? "D" : "1h");
                        setExtraTimeframeOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:bg-neutral-800/80 hover:text-white transition-colors cursor-pointer"
                    >
                      {tfSub}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-[#2B3139] mx-1" />

            {/* Candle/Line selection styles Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setChartTypeMenuOpen(!chartTypeMenuOpen)}
                className="flex items-center gap-1.5 bg-neutral-900/60 hover:bg-neutral-900/90 border border-neutral-800/80 p-1 rounded cursor-pointer transition-all text-neutral-400 hover:text-white"
                title="Select Chart Style"
              >
                {/* Dynamic Icon representing current state */}
                <div className="px-1.5 py-0.5 rounded bg-[#1C2028] text-[#FFB11A] border border-[#2B3139]/70 flex items-center justify-center">
                  {chartType === "candles" && (
                    <span className="w-2.5 h-3 flex flex-col justify-between items-center" title="Candlesticks">
                      <span className="w-0.5 h-0.5 bg-[#FFB11A]" />
                      <span className="w-2 h-1.5 border border-[#FFB11A] bg-[#FFB11A]/20" />
                      <span className="w-0.5 h-0.5 bg-[#FFB11A]" />
                    </span>
                  )}
                  {chartType === "hollow" && (
                    <span className="w-2.5 h-3 flex flex-col justify-between items-center" title="Hollow Candles">
                      <span className="w-0.5 h-0.5 bg-[#FFB11A]" />
                      <span className="w-2 h-1.5 border border-[#FFB11A] bg-transparent" />
                      <span className="w-0.5 h-0.5 bg-[#FFB11A]" />
                    </span>
                  )}
                  {chartType === "heikin" && (
                    <div className="flex flex-col items-center justify-center font-bold font-mono text-[9px] w-4.5 h-3 text-[#FFB11A]" title="Heikin-Ashi">HA</div>
                  )}
                  {chartType === "bars" && (
                    <span className="w-3.5 h-3.5 flex items-center justify-center font-bold text-[#FFB11A] text-[10px]" title="Traditional Bars">📊</span>
                  )}
                  {chartType === "line" && (
                    <Slash size={10} className="transform -rotate-45 text-[#FFB11A]" />
                  )}
                  {chartType === "area" && (
                     <span className="flex items-center justify-center font-extrabold text-[#FFB11A] text-[10px]" title="Area Mountain">🏔️</span>
                  )}
                </div>
                
                {/* Dropdown Chevron */}
                <ChevronDown size={11} className={`text-neutral-500 hover:text-white transition-transform ${chartTypeMenuOpen ? 'rotate-180 text-white' : ''}`} />
              </button>

              {/* Chart Styles Dropdown Menu */}
              {chartTypeMenuOpen && (
                <div className="absolute left-0 top-full mt-2 w-48 bg-[#14181F] border border-[#2B3139] rounded-xl shadow-xl p-1.5 z-50 text-left animate-fade-in font-sans">
                  <div className="px-2.5 py-1 text-[9px] font-bold text-neutral-500 font-mono uppercase tracking-wider border-b border-[#2B3139]/40 mb-1.5">
                    Chart Style Views
                  </div>
                  <div className="space-y-0.5">
                    {[
                      { id: "candles", label: "Candlesticks", icon: "🕯️" },
                      { id: "bars", label: "Traditional Bars", icon: "📊" },
                      { id: "hollow", label: "Hollow Candles", icon: "📉" },
                      { id: "heikin", label: "Heikin-Ashi", icon: "📈" },
                      { id: "area", label: "Area Mountain", icon: "🏔️" },
                      { id: "line", label: "Standard Line", icon: "➖" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setChartType(item.id as any);
                          setChartTypeMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          chartType === item.id 
                            ? "bg-[#FFB11A]/10 text-[#FFB11A] font-bold" 
                            : "text-neutral-300 hover:bg-neutral-800/85 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        {chartType === item.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FFB11A]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => {
                if (compareLoading) return;
                if (!showCompare) {
                  setCompareLoading(true);
                  setTimeout(() => {
                    setCompareLoading(false);
                    setShowCompare(true);
                  }, 650);
                } else {
                  setShowCompare(false);
                }
              }}
              className={`p-1.5 rounded border transition-all cursor-pointer flex items-center justify-center relative ${
                showCompare 
                  ? "bg-cyan-950/40 text-cyan-400 border-cyan-800/50" 
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/60 border-transparent hover:border-neutral-800"
              }`} 
              title="Overlay S&P 500 Index comparison"
            >
              {compareLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus size={14} className={showCompare ? "text-cyan-400" : ""} />
              )}
              {showCompare && !compareLoading && (
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              )}
            </button>

            <div className="h-4 w-px bg-[#2B3139] mx-1" />

            {/* Indicators Toggle Button Dropdown wrapper */}
            <div className="relative">
              <button
                onClick={() => setIndicatorsMenuOpen(!indicatorsMenuOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-sans font-extrabold cursor-pointer border transition-all ${
                  showEMA || showMA20 || showBB
                    ? "bg-neutral-900/95 border-[#FFB11A]/40 text-[#FFB11A] shadow-inner shadow-[#FFB11A]/5"
                    : "text-neutral-400 border-transparent hover:text-white hover:bg-neutral-800/60"
                }`}
              >
                <Sparkles size={11} className={(showEMA || showMA20 || showBB) ? "animate-pulse text-[#FFB11A]" : ""} />
                Indicators
              </button>

              {indicatorsMenuOpen && (
                <div className="absolute left-0 top-full mt-2 w-52 bg-[#14181F] border border-[#2B3139] rounded-xl shadow-xl p-2.5 z-50 text-left animate-fade-in">
                  <div className="text-[9px] font-bold text-neutral-500 font-mono uppercase tracking-wider px-2 py-1 mb-1.5 border-b border-[#2B3139]/40">
                    Math Indicators
                  </div>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-neutral-800/40 rounded-lg cursor-pointer text-xs text-neutral-300">
                      <input 
                        type="checkbox" 
                        checked={showEMA} 
                        onChange={() => setShowEMA(!showEMA)}
                        className="accent-[#FFB11A] h-3.5 w-3.5 rounded" 
                      />
                      <span>EMA (10, Close)</span>
                    </label>
                    <label className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-neutral-800/40 rounded-lg cursor-pointer text-xs text-neutral-300">
                      <input 
                        type="checkbox" 
                        checked={showMA20} 
                        onChange={() => setShowMA20(!showMA20)}
                        className="accent-[#FFB11A] h-3.5 w-3.5 rounded" 
                      />
                      <span>SMA (15, Close)</span>
                    </label>
                    <label className="flex items-center gap-2.5 px-2.5 py-2 hover:bg-neutral-800/40 rounded-lg cursor-pointer text-xs text-neutral-300">
                      <input 
                        type="checkbox" 
                        checked={showBB} 
                        onChange={() => setShowBB(!showBB)}
                        className="accent-[#FFB11A] h-3.5 w-3.5 rounded" 
                      />
                      <span>Bollinger Bands (15)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-[#8491A5] ml-auto">
            <span className="text-[10px] font-mono tracking-wider select-none hidden md:flex items-center gap-1.5 bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 px-2.5 py-1 rounded-full font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE DATASTREAM
            </span>
            <div className="flex items-center gap-1.5 border-l border-[#2B3139] pl-2 relative">
              {/* Settings Dropdown Button */}
              <div className="relative">
                <button 
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className={`p-1.5 rounded hover:bg-neutral-800/60 text-neutral-400 hover:text-white transition-all cursor-pointer ${settingsOpen ? "text-[#FFB11A] bg-neutral-800" : ""}`} 
                  title="Chart Settings"
                >
                  <Settings size={14} className={settingsOpen ? "animate-spin-slow text-[#FFB11A]" : ""} />
                </button>

                {settingsOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-[#14181F] border border-[#2B3139] rounded-xl shadow-xl p-3.5 z-50 text-left animate-fade-in font-sans">
                    <div className="text-[9px] font-bold text-neutral-500 font-mono uppercase tracking-wider pb-2 mb-2.5 border-b border-[#2B3139]/40">
                      Chart Settings
                    </div>
                    <div className="space-y-3.5 text-xs text-neutral-300">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span>Gridlines</span>
                        <input 
                          type="checkbox" 
                          checked={showGridlines} 
                          onChange={() => setShowGridlines(!showGridlines)}
                          className="accent-[#FFB11A] h-3.5 w-3.5 cursor-pointer" 
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span>Volume Profile</span>
                        <input 
                          type="checkbox" 
                          checked={showVolume} 
                          onChange={() => setShowVolume(!showVolume)}
                          className="accent-[#FFB11A] h-3.5 w-3.5 cursor-pointer" 
                        />
                      </label>
                      <div className="space-y-2 pt-2 border-t border-[#2B3139]/40">
                        <span className="text-[9px] font-bold text-neutral-500 font-mono uppercase tracking-wider block">Color Palette</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(["default", "neon", "amber"] as const).map((thm) => (
                            <button
                              key={thm}
                              onClick={() => setColorTheme(thm)}
                              className={`px-1 py-1.5 rounded text-[9.5px] font-bold border transition-colors capitalize cursor-pointer ${
                                colorTheme === thm 
                                  ? "bg-[#FFB11A]/20 border-[#FFB11A] text-[#FFB11A]" 
                                  : "bg-neutral-900 border-[#2B3139] text-neutral-400 hover:text-white"
                              }`}
                            >
                              {thm}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Help and shortcuts info drawer trigger */}
              <div className="relative">
                <button 
                  onClick={() => setHelpOpen(!helpOpen)}
                  className={`p-1.5 rounded hover:bg-neutral-800/60 text-neutral-400 hover:text-white transition-all cursor-[#FFB11A] cursor-pointer ${helpOpen ? "text-[#FFB11A] bg-neutral-800" : ""}`} 
                  title="How to draw"
                >
                  <HelpCircle size={14} />
                </button>

                {helpOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-[#14181F] border border-[#2B3139] rounded-xl shadow-xl p-4 z-50 text-left animate-fade-in font-sans">
                    <div className="text-[9px] font-bold text-neutral-500 font-mono uppercase tracking-wider pb-2 mb-2.5 border-b border-[#2B3139]/55">
                      Drawing Guide & Tips
                    </div>
                    <div className="space-y-2.5 text-xs text-neutral-300">
                      <div>
                        <span className="font-semibold block text-white text-[11px]">Brush Drawing Tool:</span>
                        <p className="text-[10px] text-neutral-400 leading-normal">Select the Brush tool. Hold and click-drag mouse coordinates directly onto drawing areas.</p>
                      </div>
                      <div>
                        <span className="font-semibold block text-white text-[11px]">Trendline & Fib Grid:</span>
                        <p className="text-[10px] text-neutral-400 leading-normal">Click start boundary, release cursor, move target pointer, then click a second time to lock positions.</p>
                      </div>
                      <div>
                        <span className="font-semibold block text-white text-[11px]">Comment drop annotations:</span>
                        <p className="text-[10px] text-neutral-400 leading-normal">Select Text tool, then click anywhere inside the grid coordinates to plant smart trade messages.</p>
                      </div>
                      <div>
                        <span className="font-semibold block text-white text-[11px]">Interactive Ruler Gauge:</span>
                        <p className="text-[10px] text-neutral-400 leading-normal">Select the Ruler. Click click start and endpoints to render dynamic percentage gauges.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Legend Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between bg-[#14181F]/40 px-5 py-3 border-b border-[#2B3139]/55 gap-3 relative z-30">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 relative">
              <div className={`w-6 h-6 rounded-full ${selectedCoin.iconBg} border flex items-center justify-center font-bold text-xs select-none font-mono`}>
                {selectedCoin.icon}
              </div>
              <div className="relative">
                <div 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 cursor-pointer group hover:bg-neutral-800/40 px-2 py-1 rounded transition-colors select-none"
                  id="coin-selector-dropdown-trigger"
                >
                  <span className="text-sm font-semibold font-subheading text-[#E2E8F0] group-hover:text-white">
                    {selectedCoin.name}
                  </span>
                  <ChevronDown size={14} className={`text-neutral-400 transition-transform ${dropdownOpen ? "transform rotate-180 text-white" : ""}`} />
                  <span className="text-[10px] font-mono text-neutral-500 bg-[#1E232F] px-1.5 py-0.5 rounded border border-neutral-800 ml-1 select-none">1D · Binance</span>
                </div>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div 
                    className="absolute left-0 mt-2 w-64 bg-[#14181F] border border-[#2B3139] rounded-xl shadow-xl py-1.5 z-50 animate-fade-in"
                    id="coin-selector-dropdown-menu"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-neutral-500 font-mono uppercase border-b border-[#2B3139]/60">
                      Select Cryptocurrency
                    </div>
                    {SUPPORTED_COINS.map((coin) => (
                      <button
                        key={coin.symbol}
                        onClick={() => {
                          setSelectedCoin(coin);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 hover:bg-neutral-800/60 transition-colors cursor-pointer text-left ${selectedCoin.symbol === coin.symbol ? "bg-[#1E232F] text-white" : "text-neutral-400"}`}
                        id={`coin-select-btn-${coin.symbol.toLowerCase()}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-5 h-5 rounded-full ${coin.iconBg} border flex items-center justify-center font-bold text-[10px]`}>
                            {coin.icon}
                          </span>
                          <div>
                            <span className="block text-xs font-semibold text-[#E2E8F0]">
                              {coin.name}
                            </span>
                            <span className="block text-[9px] font-mono text-neutral-500">
                              {coin.symbol} / USD
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-xs font-mono font-bold text-[#FFB11A]">
                            ${coin.basePrice.toLocaleString(undefined, { minimumFractionDigits: coin.basePrice < 10 ? 4 : 2 })}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-neutral-400">
              <span className="flex items-center gap-1">
                O<span className={isCurrentlyUp ? "text-emerald-500 font-bold" : "text-red-500 font-bold"}>{currentCandle.open.toLocaleString(undefined, { maximumFractionDigits: selectedCoin.basePrice < 10 ? 4 : 1 })}</span>
              </span>
              <span className="flex items-center gap-1">
                H<span className={isCurrentlyUp ? "text-emerald-500 font-bold" : "text-red-500 font-bold"}>{currentCandle.high.toLocaleString(undefined, { maximumFractionDigits: selectedCoin.basePrice < 10 ? 4 : 1 })}</span>
              </span>
              <span className="flex items-center gap-1">
                L<span className={isCurrentlyUp ? "text-emerald-500 font-bold" : "text-red-500 font-bold"}>{currentCandle.low.toLocaleString(undefined, { maximumFractionDigits: selectedCoin.basePrice < 10 ? 4 : 1 })}</span>
              </span>
              <span className="flex items-center gap-1">
                C<span className={isCurrentlyUp ? "text-emerald-500 font-bold" : "text-red-500 font-bold"}>{currentCandle.close.toLocaleString(undefined, { maximumFractionDigits: selectedCoin.basePrice < 10 ? 4 : 1 })}</span>
              </span>
              <span className="flex items-center gap-1 hidden sm:inline">
                Vol<span className="text-[#8491A5] font-semibold">{currentCandle.volume.toLocaleString()}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-base font-mono font-bold text-emerald-500 animate-pulse">
              ${realtimePrice.toLocaleString(undefined, { minimumFractionDigits: selectedCoin.basePrice < 10 ? 4 : 2 })}
            </span>
            <span className={`text-xs font-mono font-semibold flex items-center px-1.5 py-0.5 rounded ${priceChangeAbs >= 0 ? "bg-emerald-900/30 text-emerald-400" : "bg-red-900/30 text-red-400"}`}>
              {priceChangeAbs >= 0 ? "+" : ""}{priceChangePercent.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Dashboard Work Area split into: Left Sidebar Tools + Main SVG Canvas */}
        <div className="flex bg-[#0B0E11] relative overflow-x-auto md:overflow-x-visible scrollbar-none">
          <div className="flex min-w-[700px] md:min-w-0 w-full relative">
          
          {/* Vertical Drawer Toolbar on Left Margin (from Image 2) */}
          <div className="w-12 border-r border-[#2B3139]/80 bg-[#14181F]/80 flex flex-col items-center py-4 gap-3.5 text-[#8491A5] select-none z-10 z-index[1]">
            <button
              onClick={() => { setActiveTool("cursor"); setDrawingStart(null); }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${activeTool === "cursor" ? "bg-[#FFB11A] text-[#0B0E11]" : "hover:bg-[#1E232F]/80 hover:text-white"}`}
              title="Crosshair Select"
            >
              <MousePointer2 size={15} />
            </button>
            
            <button
              onClick={() => { setActiveTool("line"); setDrawingStart(null); }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${activeTool === "line" ? "bg-[#FFB11A] text-[#0B0E11]" : "hover:bg-[#1E232F]/80 hover:text-white"}`}
              title="Trendline Drawing"
            >
              <Slash size={15} className="transform rotate-45" />
            </button>

            <button
              onClick={() => { setActiveTool("fib"); setDrawingStart(null); }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${activeTool === "fib" ? "bg-[#FFB11A] text-[#0B0E11]" : "hover:bg-[#1E232F]/80 hover:text-white"}`}
              title="Fibonacci Grid Retracement"
            >
              <Layers size={15} />
            </button>

            <button
              onClick={() => { setActiveTool("brush"); setDrawingStart(null); }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${activeTool === "brush" ? "bg-[#FFB11A] text-[#0B0E11]" : "hover:bg-[#1E232F]/80 hover:text-white"}`}
              title="Geometric Brush Tool"
            >
              <Paintbrush size={15} />
            </button>

            <button
              onClick={() => { setActiveTool("text"); setDrawingStart(null); }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${activeTool === "text" ? "bg-[#FFB11A] text-[#0B0E11]" : "hover:bg-[#1E232F]/80 hover:text-white"}`}
              title="Add text comments"
            >
              <Type size={15} />
            </button>

            <button
              onClick={() => { setActiveTool("measure"); setDrawingStart(null); }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${activeTool === "measure" ? "bg-[#FFB11A] text-[#0B0E11]" : "hover:bg-[#1E232F]/80 hover:text-white"}`}
              title="Ruler Ruler Measure"
            >
              <Ruler size={15} />
            </button>

            <div className="h-px w-6 bg-[#2B3139]/75 my-1" />

            <button
              onClick={() => setMagnetEnabled(!magnetEnabled)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${magnetEnabled ? "bg-[#FFB11A] text-[#0B0E11]" : "hover:bg-[#1E232F]/80 hover:text-white"}`}
              title="Magnet Snapping Mode"
            >
              <Magnet size={15} />
            </button>

            <button
              onClick={() => setShowDrawings(!showDrawings)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${!showDrawings ? "text-red-500" : "hover:bg-[#1E232F]/80 hover:text-white"}`}
              title="Toggle Drawings visibility"
            >
              <EyeOff size={15} />
            </button>

            <button
              onClick={() => {
                setDrawings([]);
                setDrawingStart(null);
                setBrushStrokes([]);
                setTextAnnotations([]);
                setMeasureStart(null);
              }}
              className="p-1.5 rounded-lg hover:bg-red-950/40 text-neutral-500 hover:text-red-400 transition-colors cursor-pointer mt-auto"
              title="Clear all drawings, annotations, and measurements"
            >
              <Trash2 size={15} />
            </button>
          </div>

          {/* Main Candlestick Chart Window Workspace */}
          <div className="relative flex-1 bg-[#0B0E11]" style={{ minHeight: "380px" }}>
            
            {/* Guide Text for Active Mode overlay */}
            {activeTool !== "cursor" && (
              <div className="absolute top-4 right-20 z-20 text-[10px] font-mono pointer-events-none select-none text-[#FFB11A] bg-[#1E232F] border border-[#FFB11A]/40 px-2 py-1 rounded">
                Drawing Active: Click on Chart Area to place checkpoints
              </div>
            )}

            {/* Legend indicator overlay */}
            <div className="absolute top-4 left-5 z-20 text-[10px] font-mono pointer-events-none select-none text-neutral-500 space-y-1 bg-neutral-950/25 p-2 rounded backdrop-blur-xs">
              <div className="text-neutral-400 font-bold flex items-center gap-1">
                <span>Vol (20)</span>
                <span className="text-emerald-500/60">MA (20) 18.2K</span>
              </div>
              {showEMA && (
                <div className="text-[#FFB11A]/80 font-bold flex items-center gap-1">
                  <span>EMA (10, close)</span>
                  <span>{currentCandle.close.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                </div>
              )}
            </div>

            {/* SVG Canvas Workspace */}
            <svg
              className="w-full select-none cursor-crosshair block animate-fade-in"
              viewBox="0 0 1000 450"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={handleChartClick}
              style={{ width: "100%", height: "450px" }}
            >
              {/* Gridlines */}
              {getGridlines().map((priceLevel, idx) => {
                const y = getY(priceLevel);
                return (
                  <g key={`grid-${idx}`}>
                    <line x1={5} y1={y} x2={905} y2={y} stroke="#1A202C" strokeWidth={0.5} strokeDasharray="3,3" />
                    <text x={915} y={y + 3} fill="#4E5D73" className="text-[10px] font-mono font-bold tracking-tight">
                      {priceLevel.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </text>
                  </g>
                );
              })}

              {/* Time stamps bottom indicators */}
              {(() => {
                const dateTicks = timeframe === "D" ? [0, 6, 12, 18, 24, 30] : [0, 3, 6, 9, 12, 15];
                return dateTicks.map((tickIdx) => {
                  if (tickIdx >= candleData.length) return null;
                  const candle = candleData[tickIdx];
                  const x = getX(tickIdx);
                  return (
                    <g key={`date-tick-${tickIdx}`}>
                      <line x1={x} y1={20} x2={x} y2={430} stroke="#1A202C" strokeWidth={0.4} strokeDasharray="3,3" />
                      <text x={x} y={443} fill="#4E5D73" textAnchor="middle" className="text-[9.5px] font-mono font-bold">
                        {candle.time}
                      </text>
                    </g>
                  );
                });
              })()}

              <defs>
                <linearGradient id="area-gradient-amber-glow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFB11A" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#FFB11A" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Volume Bars at Bottom */}
              {showVolume && candleData.map((candle, i) => {
                const isUp = candle.close >= candle.open;
                const volColor = isUp ? 'rgba(0, 180, 96, 0.16)' : 'rgba(224, 34, 68, 0.16)';
                const x = getX(i);
                const volY = getVolY(candle.volume);
                const volH = Math.max(1, 435 - volY);
                return (
                  <rect
                    key={`volume-bar-${i}`}
                    x={x - 4}
                    y={volY}
                    width={8}
                    height={volH}
                    fill={volColor}
                    rx={0.5}
                  />
                );
              })}

              {/* Bollinger Bands Shaded Corridor and outlines */}
              {showBB && showDrawings && (
                <g>
                  {/* Shaded Corridor Channel */}
                  <path
                    d={getBBPaths().areaPathStr}
                    fill="#AA84FF"
                    fillOpacity={0.06}
                  />
                  {/* Upper dashed envelope border */}
                  <path
                    d={getBBPaths().upperPath}
                    fill="none"
                    stroke="#AA84FF"
                    strokeWidth={1.2}
                    strokeDasharray="3,3"
                    opacity={0.7}
                  />
                  {/* Lower dashed envelope border */}
                  <path
                    d={getBBPaths().lowerPath}
                    fill="none"
                    stroke="#AA84FF"
                    strokeWidth={1.2}
                    strokeDasharray="3,3"
                    opacity={0.7}
                  />
                </g>
              )}

              {/* S&P 500 Index Comparative Tracking line */}
              {showCompare && (
                <g>
                  <path
                    d={getComparePathString()}
                    fill="none"
                    stroke="#4DEEEA"
                    strokeWidth={1.5}
                    strokeDasharray="4,2.5"
                    opacity={0.9}
                  />
                  {(() => {
                    const lastIdx = candleData.length - 1;
                    const finalCmpPrice = candleData[0].close * (1.0 + lastIdx * 0.0028 + Math.sin(lastIdx * 0.48) * 0.015);
                    const finalY = getY(finalCmpPrice);
                    return (
                      <g>
                        <circle cx={getX(lastIdx)} cy={finalY} r={3.5} fill="#4DEEEA" className="animate-pulse" />
                        <rect x={getX(lastIdx) - 86} y={finalY - 14} width={78} height={12} rx={2} fill="#14181F" stroke="#4DEEEA" strokeWidth={0.5} opacity={0.8} />
                        <text x={getX(lastIdx) - 47} y={finalY - 5} fill="#4DEEEA" className="text-[7.5px] font-bold font-mono">S&P 500 Benchmark</text>
                      </g>
                    );
                  })()}
                </g>
              )}

              {/* Chart type: Candles, Hollow, Heikin-Ashi, Bars, Line, Area Mountain */}
              {chartType === "line" && (
                <path
                  d={getLineChartPaths().strokePath}
                  fill="none"
                  stroke="#FFB11A"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {chartType === "area" && (
                <g>
                  {/* Mountain fill area gradient */}
                  <path
                    d={getLineChartPaths().fillPath}
                    fill="url(#area-gradient-amber-glow)"
                  />
                  {/* Stroke highlight path line */}
                  <path
                    d={getLineChartPaths().strokePath}
                    fill="none"
                    stroke="#FFB11A"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              )}

              {chartType === "bars" && (
                candleData.map((candle, i) => {
                  const isUp = candle.close >= candle.open;
                  const candleColor = isUp ? '#00b060' : '#ff3b30';
                  const x = getX(i);
                  const yOpen = getY(candle.open);
                  const yClose = getY(candle.close);
                  const yHigh = getY(candle.high);
                  const yLow = getY(candle.low);
                  return (
                    <g key={`bar-${i}`}>
                      {/* High-Low Wick line */}
                      <line
                        x1={x}
                        y1={yHigh}
                        x2={x}
                        y2={yLow}
                        stroke={candleColor}
                        strokeWidth={1.5}
                      />
                      {/* Left Open Tick */}
                      <line
                        x1={x - 3.5}
                        y1={yOpen}
                        x2={x}
                        y2={yOpen}
                        stroke={candleColor}
                        strokeWidth={1.5}
                      />
                      {/* Right Close Tick */}
                      <line
                        x1={x}
                        y1={yClose}
                        x2={x + 3.5}
                        y2={yClose}
                        stroke={candleColor}
                        strokeWidth={1.5}
                      />
                    </g>
                  );
                })
              )}

              {chartType === "candles" && (
                candleData.map((candle, i) => {
                  const isUp = candle.close >= candle.open;
                  const candleColor = isUp ? '#00b060' : '#ff3b30';
                  const x = getX(i);
                  const yOpen = getY(candle.open);
                  const yClose = getY(candle.close);
                  const yHigh = getY(candle.high);
                  const yLow = getY(candle.low);
                  
                  const cTop = Math.min(yOpen, yClose);
                  const cBottom = Math.max(yOpen, yClose);
                  const cHeight = Math.max(1, cBottom - cTop);

                  return (
                    <g key={`candidateset-${i}`}>
                      {/* Wick Line */}
                      <line
                        x1={x}
                        y1={yHigh}
                        x2={x}
                        y2={yLow}
                        stroke={candleColor}
                        strokeWidth={1.2}
                      />
                      {/* Candle Body */}
                      <rect
                        x={x - 3.5}
                        y={cTop}
                        width={7}
                        height={cHeight}
                        fill={candleColor}
                        rx={0.5}
                      />
                    </g>
                  );
                })
              )}

              {chartType === "hollow" && (
                candleData.map((candle, i) => {
                  const isUp = candle.close >= candle.open;
                  const candleColor = isUp ? '#00b060' : '#ff3b30';
                  const x = getX(i);
                  const yOpen = getY(candle.open);
                  const yClose = getY(candle.close);
                  const yHigh = getY(candle.high);
                  const yLow = getY(candle.low);
                  
                  const cTop = Math.min(yOpen, yClose);
                  const cBottom = Math.max(yOpen, yClose);
                  const cHeight = Math.max(1, cBottom - cTop);

                  return (
                    <g key={`hollow-${i}`}>
                      {/* Wick Line */}
                      <line
                        x1={x}
                        y1={yHigh}
                        x2={x}
                        y2={yLow}
                        stroke={candleColor}
                        strokeWidth={1.2}
                      />
                      {/* Candle Body */}
                      <circle cx={x} cy={yHigh} r={0.2} fill={candleColor} />
                      <rect
                        x={x - 3.5}
                        y={cTop}
                        width={7}
                        height={cHeight}
                        fill={isUp ? "transparent" : candleColor}
                        stroke={candleColor}
                        strokeWidth={1.3}
                        rx={0.5}
                      />
                    </g>
                  );
                })
              )}

              {chartType === "heikin" && (
                getHeikinAshiData().map((candle, i) => {
                  const isUp = candle.close >= candle.open;
                  const candleColor = isUp ? '#00b060' : '#ff3b30';
                  const x = getX(i);
                  const yOpen = getY(candle.open);
                  const yClose = getY(candle.close);
                  const yHigh = getY(candle.high);
                  const yLow = getY(candle.low);
                  
                  const cTop = Math.min(yOpen, yClose);
                  const cBottom = Math.max(yOpen, yClose);
                  const cHeight = Math.max(1, cBottom - cTop);

                  return (
                    <g key={`heikin-${i}`}>
                      {/* Wick Line */}
                      <line
                        x1={x}
                        y1={yHigh}
                        x2={x}
                        y2={yLow}
                        stroke={candleColor}
                        strokeWidth={1.2}
                      />
                      {/* Candle Body */}
                      <rect
                        x={x - 3.5}
                        y={cTop}
                        width={7}
                        height={cHeight}
                        fill={candleColor}
                        rx={0.5}
                      />
                    </g>
                  );
                })
              )}

              {/* EMA Indicator Line */}
              {showEMA && (
                <path
                  d={getEMAPathString()}
                  fill="none"
                  stroke="#FFB11A"
                  strokeWidth={1.5}
                  className="opacity-75"
                />
              )}

              {/* SMA (15) Indicator line */}
              {showMA20 && showDrawings && (
                <path
                  d={getMAPathString()}
                  fill="none"
                  stroke="#00E5FF"
                  strokeWidth={1.5}
                  className="opacity-80"
                />
              )}

              {/* Freeform Brush sketch paths layer */}
              {showDrawings && brushStrokes.map((stroke, sIdx) => {
                if (stroke.length < 2) return null;
                const pathStr = stroke.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                return (
                  <path
                    key={`brush-stroke-${sIdx}`}
                    d={pathStr}
                    fill="none"
                    stroke="#FF5252"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.8}
                  />
                );
              })}

              {/* Active current drawing stroke */}
              {showDrawings && activeTool === "brush" && isDrawingBrush && currentStroke && currentStroke.length > 1 && (
                <path
                  d={currentStroke.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                  fill="none"
                  stroke="#FF5252"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.9}
                />
              )}

              {/* Text comment list drops */}
              {showDrawings && textAnnotations.map((t, idx) => (
                <g key={`text-label-${idx}`} className="group cursor-pointer">
                  {/* small radar peg beacon style */}
                  <circle cx={t.x} cy={t.y} r={3} fill="#FFB11A" className="animate-ping text-amber-400" />
                  <circle cx={t.x} cy={t.y} r={2.5} fill="#FFB11A" stroke="#000" strokeWidth={0.5} />
                  
                  {/* comment pill bubble layout */}
                  <g transform={`translate(${t.x - 6}, ${t.y - 20})`}>
                    <rect
                      x={0}
                      y={0}
                      width={t.text.length * 5.6 + 10}
                      height={15}
                      rx={3.5}
                      fill="#1E232F"
                      stroke="#FFB11A"
                      strokeWidth={0.7}
                      opacity={0.95}
                    />
                    <text
                      x={t.text.length * 2.8 + 5}
                      y={10.5}
                      fill="#FFFFFF"
                      textAnchor="middle"
                      className="text-[8.5px] font-mono font-bold select-none"
                    >
                      {t.text}
                    </text>
                  </g>
                </g>
              ))}

              {/* Locked measurements box list */}
              {showDrawings && drawings.filter(d => d.type === "measure").map((d, idx) => {
                const barsSpan = Math.round(Math.abs(d.x2 - d.x1) / 14);
                const priceDiffPct = ((d.y1 - d.y2) / d.y1) * 100;
                return (
                  <g key={`locked-measure-${idx}`}>
                    <rect
                      x={Math.min(d.x1, d.x2)}
                      y={Math.min(d.y1, d.y2)}
                      width={Math.abs(d.x2 - d.x1)}
                      height={Math.abs(d.y2 - d.y1)}
                      fill="#FFDD33"
                      fillOpacity={0.06}
                      stroke="#FFB11A"
                      strokeWidth={1}
                      strokeDasharray="2,2"
                    />
                    <g transform={`translate(${(d.x1 + d.x2)/2 - 40}, ${(d.y1 + d.y2)/2 - 12})`}>
                      <rect width={80} height={24} rx={4} fill="#FFDD33" opacity={0.9} />
                      <text x={40} y={10} fill="#000000" textAnchor="middle" className="text-[8px] font-mono font-bold">
                        {priceDiffPct >= 0 ? "+" : ""}{priceDiffPct.toFixed(2)}%
                      </text>
                      <text x={40} y={18} fill="#4E5D73" textAnchor="middle" className="text-[7px] font-mono font-bold">
                        {barsSpan} columns
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Dynamic interactive Ruler gauge measurement drag preview */}
              {showDrawings && activeTool === "measure" && measureStart && mouseCoords && (
                <g>
                  <rect
                    x={Math.min(measureStart.x, mouseCoords.x)}
                    y={Math.min(measureStart.y, mouseCoords.y)}
                    width={Math.abs(mouseCoords.x - measureStart.x)}
                    height={Math.abs(mouseCoords.y - measureStart.y)}
                    fill="#FFDD33"
                    fillOpacity={0.08}
                    stroke="#FFDD33"
                    strokeWidth={1}
                    strokeDasharray="3,3"
                  />
                  {(() => {
                    const barsSpan = Math.round(Math.abs(mouseCoords.x - measureStart.x) / 14);
                    const priceDiffPct = ((measureStart.y - mouseCoords.y) / measureStart.y) * 100;
                    return (
                      <g transform={`translate(${(measureStart.x + mouseCoords.x)/2 - 45}, ${(measureStart.y + mouseCoords.y)/2 - 14})`}>
                        <rect width={90} height={28} rx={4} fill="#FFB11A" stroke="#000000" strokeWidth={0.5} />
                        <text x={45} y={11} fill="#12161C" textAnchor="middle" className="text-[8.5px] font-extrabold font-mono">
                          {priceDiffPct >= 0 ? "+" : ""}{priceDiffPct.toFixed(2)}%
                        </text>
                        <text x={45} y={21} fill="#2B3139" textAnchor="middle" className="text-[7px] font-bold font-mono">
                          {barsSpan} cols range
                        </text>
                      </g>
                    );
                  })()}
                </g>
              )}

              {/* Live Ticker Price Horizontal Guideline */}
              {(() => {
                const yActive = getY(realtimePrice);
                return (
                  <g>
                    <line
                      x1={5}
                      y1={yActive}
                      x2={905}
                      y2={yActive}
                      stroke="#00b060"
                      strokeWidth={1}
                      strokeDasharray="2,2"
                    />
                    {/* Price indicator Tag label on Right Margin */}
                    <rect
                      x={908}
                      y={yActive - 9}
                      width={82}
                      height={18}
                      rx={2}
                      fill="#00b060"
                    />
                    <text
                      x={949}
                      y={yActive + 4}
                      fill="#FFFFFF"
                      textAnchor="middle"
                      className="text-[9.5px] font-mono font-bold"
                    >
                      {realtimePrice.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                    </text>
                  </g>
                );
              })()}

              {/* User drawings overlay layer */}
              {showDrawings && drawings.map((dw, idx) => {
                if (dw.type === "line") {
                  return (
                    <line
                      key={`dw-l-${idx}`}
                      x1={dw.x1}
                      y1={dw.y1}
                      x2={dw.x2}
                      y2={dw.y2}
                      stroke="#FFB11A"
                      strokeWidth={1.5}
                      strokeDasharray="4,3"
                    />
                  );
                } else if (dw.type === "fib") {
                  const dy = dw.y2 - dw.y1;
                  const fibLvls = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
                  return (
                    <g key={`dw-f-${idx}`}>
                      <line x1={dw.x1} y1={dw.y1} x2={dw.x2} y2={dw.y1} stroke="#E2E8F0" strokeWidth={1} opacity={0.4} />
                      {fibLvls.map((lvl) => {
                        const ly = dw.y1 + dy * lvl;
                        return (
                          <g key={`fib-lvl-sub-${lvl}`}>
                            <line x1={dw.x1} y1={ly} x2={dw.x2} y2={ly} stroke="#FFB11A" strokeWidth={0.8} opacity={0.6} strokeDasharray="2,2" />
                            <text x={dw.x1 + 6} y={ly - 2} fill="#FFB11A" opacity={0.8} className="text-[8px] font-mono font-bold">{(lvl * 100).toFixed(1)}%</text>
                          </g>
                        );
                      })}
                    </g>
                  );
                }
                return null;
              })}

              {/* Preview active drawing line template */}
              {showDrawings && drawingStart && mouseCoords && (activeTool === "line" || activeTool === "fib") && (
                <line
                  x1={drawingStart.x}
                  y1={drawingStart.y}
                  x2={mouseCoords.x}
                  y2={mouseCoords.y}
                  stroke="#FFB11A"
                  strokeWidth={1.5}
                  strokeDasharray="2,2"
                  opacity={0.85}
                />
              )}

              {/* Interactive cursor and tooltip tracking crosshairs overlay */}
              {mouseCoords && hoverIdx !== null && (
                <g>
                  {/* Vertical coordinate indicator */}
                  <line
                    x1={getX(hoverIdx)}
                    y1={20}
                    x2={getX(hoverIdx)}
                    y2={430}
                    stroke="#4E5D73"
                    strokeWidth={0.8}
                    strokeDasharray="2,2"
                  />
                  {/* Horizontal coordinate indicator */}
                  <line
                    x1={5}
                    y1={mouseCoords.y}
                    x2={905}
                    y2={mouseCoords.y}
                    stroke="#4E5D73"
                    strokeWidth={0.8}
                    strokeDasharray="2,2"
                  />

                  {/* Date indicator tag popover */}
                  <rect
                    x={getX(hoverIdx) - 45}
                    y={435}
                    width={90}
                    height={13}
                    rx={2}
                    fill="#1E232F"
                    stroke="#FFB11A"
                    strokeWidth={0.5}
                  />
                  <text
                    x={getX(hoverIdx)}
                    y={445}
                    fill="#E2E8F0"
                    textAnchor="middle"
                    className="text-[9px] font-mono font-bold"
                  >
                    {candleData[hoverIdx].time}
                  </text>

                  {/* Price Scale indicators tag */}
                  {(() => {
                    const boundsHeight = 450 - 40 - 120;
                    const priceAtHover = minPrice + ((450 - 120 - mouseCoords.y) / boundsHeight) * (maxPrice - minPrice);
                    if (priceAtHover >= minPrice && priceAtHover <= maxPrice) {
                      return (
                        <g>
                          <rect
                            x={908}
                            y={mouseCoords.y - 9}
                            width={82}
                            height={18}
                            rx={2}
                            fill="#1E232F"
                            stroke="#FFB11A"
                            strokeWidth={0.5}
                          />
                          <text
                            x={949}
                            y={mouseCoords.y + 4}
                            fill="#E2E8F0"
                            textAnchor="middle"
                            className="text-[9.5px] font-mono font-bold"
                          >
                            {priceAtHover.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                          </text>
                        </g>
                      );
                    }
                    return null;
                  })()}

                  {/* Dynamic circle tracking hover position close */}
                  <circle
                    cx={getX(hoverIdx)}
                    cy={getY(candleData[hoverIdx].close)}
                    r={3.5}
                    fill="#FFB11A"
                    stroke="#11161d"
                    strokeWidth={1}
                  />
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
  );
};

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
export const WhyOrbitrio = () => {
  const stats = [
    { value: "6,000+", label: "Active Investors", icon: Users, colorClass: "text-indigo-400 bg-indigo-500/5 border-indigo-500/10" },
    { value: "$600M+", label: "Profits Generated", icon: TrendingUp, colorClass: "text-emerald-400 bg-emerald-500/5 border-emerald-500/10" },
    { value: "99%", label: "Client Satisfaction", icon: ThumbsUp, colorClass: "text-pink-400 bg-pink-500/5 border-pink-500/10" },
    { value: "24/7", label: "Expert Support", icon: Headset, colorClass: "text-blue-400 bg-blue-500/5 border-blue-500/10" }
  ];

  const trustItems = [
    { icon: Lock, title: "SSL Secured", desc: "256-bit Encryption", colorClass: "text-indigo-400 bg-indigo-500/5 border-indigo-500/10 fill-indigo-500/10" },
    { icon: Shield, title: "Regulated", desc: "Licensed Platform", colorClass: "text-emerald-400 bg-emerald-500/5 border-emerald-500/10 fill-emerald-500/10" },
    { icon: Zap, title: "Fast Withdrawals", desc: "Within 24 Hours", colorClass: "text-[#FFB11A] bg-amber-500/5 border-amber-500/10 fill-amber-500/10" },
    { icon: Globe, title: "Data Privacy", desc: "GDPR Compliant", colorClass: "text-sky-400 bg-sky-500/5 border-sky-500/10 fill-sky-500/10" }
  ];

  const brands = ["Bloomberg", "Forbes", "Reuters", "CoinDesk", "TechCrunch"];

  return (
    <section className="pt-10 pb-12 px-4 bg-[#0B0E11]/20 border-t border-[#2B3139]/5 overflow-hidden" id="why-orbitrio">
      <div className="max-w-7xl mx-auto">
        
        {/* Header content with TRUSTED WORLDWIDE badge */}
        <div className="text-center mb-10 space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-amber-500/15 bg-amber-500/5 text-[10px] md:text-xs text-amber-500 font-bold tracking-[0.2em] font-bybit uppercase mb-1"
          >
            <Shield className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10" />
            TRUSTED WORLDWIDE
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 60, damping: 14 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-semibold text-white tracking-tight leading-tight max-w-4xl mx-auto font-bybit"
          >
            A Platform Traders Rely On
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 60, damping: 14, delay: 0.1 }}
            className="text-neutral-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-bybit"
          >
            Backed by Consensys infrastructure, global regulatory compliance, and the trust of thousands of active digital asset investors.
          </motion.p>
        </div>

        {/* Big 4 Stat cards (Container-less, border-less, springing animations on scroll) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 text-center">
          {stats.map((stat, idx) => {
            const StatIcon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 70, scale: 0.85 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.05 }}
                transition={{ type: "spring", stiffness: 65, damping: 12, delay: idx * 0.08 }}
                className="flex flex-col items-center justify-center p-2 relative group transform-gpu"
              >
                {/* Visual Icon with colorful styling */}
                <div className={`p-3 rounded-2xl border mb-3.5 group-hover:scale-110 transition-transform duration-300 ${stat.colorClass}`}>
                  <StatIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                
                <div className="font-bybit font-black text-3xl min-[380px]:text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-[#FFB11A] via-[#FF9900] to-amber-600 select-none group-hover:scale-105 transition-transform duration-300">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm font-bold text-neutral-400 tracking-widest uppercase mt-3.5 font-bybit">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mini Trust items below (Container-less, scroll-animated, premium colorful icons) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mt-10 md:mt-12 border-t border-neutral-900/40 pt-8">
          {trustItems.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 60, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.05 }}
              transition={{ type: "spring", stiffness: 70, damping: 13, delay: idx * 0.09 }}
              className="flex items-center gap-4.5 p-2 transform-gpu"
            >
              <div className={`flex-shrink-0 p-3.5 rounded-2xl border hover:scale-110 hover:-rotate-6 transition-all duration-300 ${item.colorClass}`}>
                <item.icon className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-white text-base font-bybit tracking-tight">
                  {item.title}
                </h4>
                <p className="text-neutral-400 text-xs sm:text-sm font-bybit">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Corporate AS SEEN IN marquee/logos strip */}
        <div className="mt-8 border-t border-[#2B3139]/5 pt-6 text-center">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.7 }}
            viewport={{ once: true }}
            className="text-[10px] sm:text-xs font-mono tracking-[0.35em] text-neutral-500 uppercase font-semibold"
          >
            AS SEEN IN
          </motion.span>
          <div className="flex flex-wrap items-center justify-center gap-x-12 sm:gap-x-16 md:gap-x-20 gap-y-7 mt-5 px-4">
            {brands.map((brand, bIdx) => (
              <motion.span
                key={bIdx}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 0.55 }}
                whileHover={{ opacity: 0.95, scale: 1.05 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 90, damping: 15, delay: bIdx * 0.05 }}
                className="font-serif text-xl sm:text-2xl md:text-3xl font-black text-neutral-400 tracking-tight cursor-default select-none"
              >
                {brand}
              </motion.span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

// Section 3: Confidence
export const Confidence = () => (
    <section className="pt-10 pb-12 px-4 bg-gradient-to-b from-[#0B0E11]/80 to-black relative overflow-hidden" id="confidence">
      {/* Absolute positioned huge dimming security icon behind */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-0">
        <Shield className="w-[320px] h-[320px] sm:w-[450px] sm:h-[450px] md:w-[580px] md:h-[580px] text-[#FFB11A]/[0.025] animate-pulse" style={{ animationDuration: '6s' }} />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
           <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FFB11A]/10 border border-[#FFB11A]/30 text-[#FFB11A] mb-4 shadow-[0_0_15px_rgba(255,177,26,0.15)]">
             <ShieldCheck className="w-6 h-6 animate-pulse" style={{ animationDuration: '3s' }} />
           </div>
           <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-semibold text-white tracking-tight leading-tight mb-4 font-bybit">Trade With Confidence</h2>
           <p className="text-neutral-400 text-sm sm:text-base max-w-xl mx-auto mb-10">Security and transparency are at the center of everything we build.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {[ { title: "Account Security", desc: "Advanced authentication and encryption technologies keep your account protected.", icon: Fingerprint, colorClass: "text-indigo-400 hover:border-indigo-500/20" },
                 { title: "Transparent Transactions", desc: "Monitor your balances and transaction history anytime.", icon: BarChart3, colorClass: "text-emerald-400 hover:border-emerald-500/20" },
                 { title: "Reliable Infrastructure", desc: "Built on modern cloud technology for speed and stability.", icon: Database, colorClass: "text-amber-400 hover:border-amber-500/20" } ].map((item, i) => {
                    const ItemIcon = item.icon;
                    return (
                      <div key={i} className={`flex flex-col gap-5 p-6 sm:p-7 rounded-2xl bg-neutral-900/10 border border-neutral-800/15 backdrop-blur-sm transition-all duration-300 ${item.colorClass}`}>
                          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-neutral-900/40 border border-neutral-800/80 flex items-center justify-center">
                              <ItemIcon className="w-5 h-5" />
                          </div>
                          <div>
                               <h4 className="font-bold text-white text-base mb-2 font-bybit">{item.title}</h4>
                               <p className="text-neutral-400 text-xs leading-relaxed">{item.desc}</p>
                          </div>
                      </div>
                    );
                 })}
            </div>
      </div>
    </section>
);

// Section 4: About Us
export const AboutUs = () => (
    <section className="pt-12 pb-16 px-4 bg-[#0B0E11]/30 text-center flex flex-col items-center justify-center" id="about-us">
        {/* Brand Logo Icon on Top */}
        <div className="mb-6 relative group inline-block">
            <svg className="w-16 h-16 transform group-hover:rotate-12 transition-transform duration-500 filter drop-shadow-[0_4px_12px_rgba(247,147,26,0.3)]" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="aboutGoldGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#E05B00" />
                  <stop offset="45%" stopColor="#F7931A" />
                  <stop offset="100%" stopColor="#FFBA3B" />
                </linearGradient>
                <linearGradient id="aboutSilverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="50%" stopColor="#E6E8EF" />
                  <stop offset="100%" stopColor="#A3AABF" />
                </linearGradient>
              </defs>
              
              {/* Top-left Orange Crescent loop */}
              <path 
                d="M 18,50 A 30,30 0 0,1 78,28 L 71,35 A 20,20 0 0,0 26,50 Z" 
                fill="url(#aboutGoldGrad)" 
              />
              
              {/* Diagonal premium sweeping logo slash */}
              <path 
                d="M 18,50 C 23,48 45,38 78,28 C 65,37 40,45 18,50" 
                fill="url(#aboutGoldGrad)" 
              />

              {/* Bottom-right Silver/White Crescent loop */}
              <path 
                d="M 23,55 A 30,30 0 0,0 82,50 A 30,30 0 0,0 78,28 L 71,35 A 20,20 0 0,1 74,50 A 20,20 0 0,1 28,54 Z" 
                fill="url(#aboutSilverGrad)" 
              />

              {/* Top right orange brand accent satellite dot */}
              <circle cx="85" cy="22" r="5.5" fill="#F7931A" />
            </svg>
        </div>

        {/* Brand styled heading: lowercase 'orbitrio' with white/orange split, using the Bybit font layout */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-semibold text-white tracking-tight leading-tight font-bybit mb-4">
            About <span className="lowercase text-white">orbit<span className="text-[#FFB11A]">rio</span></span>
        </h2>
        <p className="text-neutral-400 text-base md:text-lg max-w-2xl mx-auto mb-6 leading-relaxed font-sans">
            <span className="lowercase text-white font-medium">orbit<span className="text-[#FFB11A]">rio</span></span> is a modern digital trading platform built to provide users with a secure, transparent, and efficient trading experience.
        </p>
        <p className="text-neutral-400 text-sm sm:text-base max-w-3xl mx-auto mb-2 leading-relaxed font-sans">
            Our mission is to make trading accessible and straightforward for everyone. By combining innovative technology with an intuitive interface, <span className="lowercase text-white font-medium">orbit<span className="text-[#FFB11A]">rio</span></span> empowers users to manage their investments confidently and stay connected to global financial markets. We focus on security, simplicity, and continuous innovation to create a platform that traders can rely on every day.
        </p>
    </section>
);

// Section 5: Get Started
export const GetStarted = () => (
    <section className="py-16 md:py-24 px-4 max-w-6xl mx-auto" id="get-started">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-semibold text-white tracking-tight leading-tight max-w-3xl mx-auto font-bybit text-center mb-16">
            Get Started In Minutes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {[ 
                { step: "01", title: "Create Account", desc: "Register securely using email or Google." },
                { step: "02", title: "Fund Your Wallet", desc: "Deposit funds safely into your account." },
                { step: "03", title: "Start Trading", desc: "Access the market and monitor your portfolio in real time." } 
            ].map((step, i) => (
                <div 
                    key={i} 
                    className="flex flex-col items-center justify-center p-8 sm:p-10 rounded-2xl bg-[#0F1216]/60 border border-[#2B3139]/40 hover:border-[#F7931A]/30 hover:bg-[#12161B]/80 transition-all duration-300 shadow-xl group text-center relative overflow-hidden"
                >
                    <div className="text-5xl sm:text-6xl font-extrabold text-white/5 font-bybit tracking-tighter mb-4 group-hover:text-[#F7931A]/15 transition-colors duration-300">
                        {step.step}
                    </div>
                    <h3 className="font-bold text-lg sm:text-xl text-white mb-3 tracking-tight font-bybit">
                        {step.title}
                    </h3>
                    <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed max-w-[240px] mx-auto font-sans">
                        {step.desc}
                    </p>
                </div>
            ))}
        </div>
    </section>
);

// Section 6: Contact Us
export const ContactUs = () => (
    <section className="py-24 px-4 bg-[#0B0E11]/30" id="contact">
        <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
        >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Contact Us</h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto mb-12">Need help or have questions? Our support team is ready to assist you.</p>
            
            <div className="bg-[#161A1E] border border-[#2B3139] p-8 rounded-2xl inline-block shadow-lg hover:border-amber-500/30 transition-all">
                <Mail className="w-12 h-12 text-amber-500 mx-auto mb-6 animate-pulse" />
                <h3 className="font-bold text-xl text-white mb-2">Email Support</h3>
                <a href="mailto:support@orbitriotrades.com" className="text-amber-500 hover:text-amber-400 text-lg transition-colors hover:underline">support@orbitriotrades.com</a>
                <p className="text-neutral-500 mt-6">24 Hours / 7 Days</p>
            </div>
        </motion.div>
    </section>
);

// Footer
export const Footer = () => (
    <footer className="py-24 px-4 bg-black border-t border-[#2B3139]/30">
        <motion.div 
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 1 }}
            className="h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mb-16"
        />
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12 font-mono text-sm">
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
                        <path 
                            d="M 18,50 A 30,30 0 0,1 78,28 L 71,35 A 20,20 0 0,0 26,50 Z" 
                            fill="url(#footerGoldGrad)" 
                        />
                        <path 
                            d="M 18,50 C 23,48 45,38 78,28 C 65,37 40,45 18,50" 
                            fill="url(#footerGoldGrad)" 
                        />
                        <path 
                            d="M 23,55 A 30,30 0 0,0 82,50 A 30,30 0 0,0 78,28 L 71,35 A 20,20 0 0,1 74,50 A 20,20 0 0,1 28,54 Z" 
                            fill="url(#footerSilverGrad)" 
                        />
                        <circle cx="85" cy="22" r="5.5" fill="#F7931A" />
                    </svg>
                    <h4 className="font-bold text-white text-brand font-brand text-lg tracking-tight lowercase">
                        orbit<span className="text-[#FFB11A]">rio</span>
                    </h4>
                </div>
                <p className="text-neutral-400 mb-4">Trade smarter with confidence.</p>
                <p className="text-neutral-500"><span className="lowercase text-white font-medium">orbit<span className="text-[#FFB11A]">rio</span></span> is committed to delivering a secure and seamless trading experience through innovation, transparency, and reliability.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {['About Us', 'Markets', 'Security', 'Contact', 'Terms of Service', 'Privacy Policy'].map(link => (
                    <a key={link} href={`#${link.toLowerCase().replace(' ', '-')}`} className="text-neutral-400 hover:text-amber-500 transition-colors">{link}</a>
                ))}
            </div>
            <div>
                <h4 className="font-bold text-white mb-4">Contact Us</h4>
                <p className="text-neutral-400 mb-2">Need help? Our support team is here for you.</p>
                <a href="mailto:support@orbitriotrades.com" className="text-amber-500 hover:text-amber-400 hover:underline transition-colors flex items-center gap-2">
                    support@orbitriotrades.com
                </a>
            </div>
        </div>
    </footer>
);
