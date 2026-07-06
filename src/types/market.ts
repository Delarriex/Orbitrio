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
