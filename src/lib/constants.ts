export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CoinInfo {
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

export const SUPPORTED_COINS: CoinInfo[] = [
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
