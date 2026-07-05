import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import sendEmailHandler from "./api/send-email";
import resetPasswordHandler from "./api/reset-password";

dotenv.config();

const PORT = 5000;

// Lazy initialize Gemini client to prevent startup crash if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it via AI Studio Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Route: Send Transactional Email using Resend
  app.post("/api/send-email", sendEmailHandler as any);

  // API Route: Reset Password
  app.post("/api/reset-password", resetPasswordHandler as any);

  // API Route: Live Market Data Feed
  app.get("/api/markets", async (req, res) => {
    try {
      // Mock data fallback and stocks
      const fallbackData = {
        crypto: [
          { symbol: "BTC/USD", name: "Bitcoin", price: 89432.50, change: 2.45, high: 90200.00, low: 87100.00, volume: "24.1B" },
          { symbol: "ETH/USD", name: "Ethereum", price: 3412.80, change: -1.22, high: 3520.00, low: 3380.00, volume: "12.8B" },
          { symbol: "SOL/USD", name: "Solana", price: 187.65, change: 5.82, high: 191.00, low: 175.20, volume: "4.5B" },
          { symbol: "XRP/USD", name: "Ripple", price: 1.14, change: 10.15, high: 1.22, low: 1.02, volume: "3.2B" },
          { symbol: "ADA/USD", name: "Cardano", price: 0.62, change: -0.45, high: 0.65, low: 0.61, volume: "850M" },
          { symbol: "BNB/USD", name: "Binance Coin", price: 580.40, change: 1.15, high: 590.00, low: 572.00, volume: "1.2B" },
          { symbol: "DOT/USD", name: "Polkadot", price: 6.35, change: -2.31, high: 6.60, low: 6.25, volume: "180M" },
          { symbol: "DOGE/USD", name: "Dogecoin", price: 0.154, change: 4.82, high: 0.162, low: 0.145, volume: "950M" },
          { symbol: "SHIB/USD", name: "Shiba Inu", price: 0.000018, change: 3.12, high: 0.000019, low: 0.000017, volume: "420M" },
          { symbol: "LTC/USD", name: "Litecoin", price: 82.40, change: -0.85, high: 84.10, low: 81.50, volume: "350M" },
        ],
        stocks: [
          { symbol: "AAPL", name: "Apple Inc.", price: 182.30, change: 0.85, high: 183.50, low: 180.80, volume: "52.4M" },
          { symbol: "TSLA", name: "Tesla Inc.", price: 214.50, change: -3.42, high: 221.00, low: 212.30, volume: "83.1M" },
          { symbol: "NVDA", name: "NVIDIA Corp.", price: 924.80, change: 4.12, high: 935.00, low: 885.00, volume: "41.6M" },
          { symbol: "MSFT", name: "Microsoft Corp.", price: 415.60, change: 0.42, high: 418.00, low: 412.50, volume: "22.8M" },
          { symbol: "AMZN", name: "Amazon.com Inc.", price: 178.90, change: -1.15, high: 181.20, low: 177.50, volume: "32.1M" },
          { symbol: "GOOGL", name: "Alphabet Inc.", price: 172.50, change: 1.22, high: 174.10, low: 170.80, volume: "25.4M" },
          { symbol: "META", name: "Meta Platforms Inc.", price: 475.20, change: 2.15, high: 480.50, low: 468.20, volume: "18.2M" },
        ]
      };

      let liveCrypto = fallbackData.crypto;
      try {
        // Fetch accurate live pricing from Binance free API
        const symbolsMap: Record<string, any> = {
          "BTCUSDT": { symbol: "BTC/USD", name: "Bitcoin" },
          "ETHUSDT": { symbol: "ETH/USD", name: "Ethereum" },
          "SOLUSDT": { symbol: "SOL/USD", name: "Solana" },
          "XRPUSDT": { symbol: "XRP/USD", name: "Ripple" },
          "ADAUSDT": { symbol: "ADA/USD", name: "Cardano" },
          "BNBUSDT": { symbol: "BNB/USD", name: "Binance Coin" },
          "DOTUSDT": { symbol: "DOT/USD", name: "Polkadot" },
          "DOGEUSDT": { symbol: "DOGE/USD", name: "Dogecoin" },
          "SHIBUSDT": { symbol: "SHIB/USD", name: "Shiba Inu" },
          "LTCUSDT": { symbol: "LTC/USD", name: "Litecoin" },
        };
        const symbolsArray = Object.keys(symbolsMap);
        const binanceUrl = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbolsArray))}`;
        
        const binanceRes = await fetch(binanceUrl);
        if (binanceRes.ok) {
          const binanceData = await binanceRes.json();
          liveCrypto = binanceData.map((item: any) => ({
            symbol: symbolsMap[item.symbol].symbol,
            name: symbolsMap[item.symbol].name,
            price: parseFloat(item.lastPrice),
            change: parseFloat(item.priceChangePercent),
            high: parseFloat(item.highPrice),
            low: parseFloat(item.lowPrice),
            volume: (parseFloat(item.quoteVolume) / 1000000).toFixed(1) + "M",
          }));
          
          // Sort to keep BTC first, ETH second, etc based on our map order
          liveCrypto.sort((a, b) => {
             const keys = Object.values(symbolsMap).map(s => s.symbol);
             return keys.indexOf(a.symbol) - keys.indexOf(b.symbol);
          });
        }
      } catch (err) {
        console.error("Failed to fetch live crypto from Binance, using fallback", err);
      }

      return res.json({
        crypto: liveCrypto,
        stocks: fallbackData.stocks
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Dev server using Vite middleware
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Orbitrio institutional platform listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server bootstrap error:", err);
});
