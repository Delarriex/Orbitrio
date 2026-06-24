import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

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

  // API Route: AI Advisor Chat Integration
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, marketContext } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid array of messages provided." });
      }

      const client = getGeminiClient();

      // We extract the last user message and set up the professional advisory context in system instructions
      const systemInstruction = `
You are the Orbitrio AI Trading Advisor, an institutional-grade crypto, stock, and portfolio management intelligence. 
Your goal is to provide insightful, math-backed, structural, and professional answers about financial markets, trading strategies, technical indicators, and investment tiers.
Keep answers structured, elegant, and action-oriented. Emphasize that you are an AI advisor and recommend risk assessment.
Current context:
- Brand Name: Orbitrio (TRADE. ELEVATE. ORBIT.)
- Investment tiers offered: 
  * Starter Plan: Min $100 / Max $999 | Duration: 7 Days | ROI: 10%
  * Professional Plan: Min $1,000 / Max $9,999 | Duration: 14 Days | ROI: 18%
  * VIP Plan: Min $10,000 / Max Unlimited | Duration: 30 Days | ROI: 35%
- Professional Copy Trading feature exists enabling followers to mimic experienced traders automatically.
- Live assets tracked inside user portfolio.
- Use currency USD ($).
${marketContext ? `Real-time Asset State: ${JSON.stringify(marketContext)}` : ""}
`;

      const formattedMessages = messages.map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content || "" }],
      }));

      // Generate content using gemini-3.5-flash as mandated for conversational Q&A
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedMessages,
        config: {
          systemInstruction,
          temperature: 0.75,
        },
      });

      const replyText = response.text || "I apologize, but I am unable to generate a response at this time. Please try again soon.";
      return res.json({ message: replyText });

    } catch (err: any) {
      console.error("Gemini API Error:", err);
      // Let's check if the error is due to missing API Key and return a detailed, helpful guide
      const errorMessage = err.message || "";
      if (errorMessage.includes("GEMINI_API_KEY")) {
        return res.status(403).json({
          error: "API_KEY_MISSING",
          message: "The Gemini API Key is missing. Please add your GEMINI_API_KEY in the Settings > Secrets panel of your Google AI Studio UI to activate the AI advisor module immediately.",
        });
      }
      return res.status(500).json({
        error: "INTERNAL_ERROR",
        message: "An error occurred while generating a response from the AI advisor. Details: " + (err.message || err),
      });
    }
  });

  // API Route: Live/Mock Market Data Feed Proxy
  app.get("/api/markets", async (req, res) => {
    try {
      // Simulate real-time stock/crypto prices to display live variations on the client side
      // In a real production setup with a Polygon.io key, requests would be proxied here.
      const simulatedData = {
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
          { symbol: "LINK/USD", name: "Chainlink", price: 15.20, change: 1.74, high: 15.60, low: 14.80, volume: "210M" },
          { symbol: "UNI/USD", name: "Uniswap", price: 7.85, change: -1.45, high: 8.10, low: 7.70, volume: "160M" },
          { symbol: "AVAX/USD", name: "Avalanche", price: 34.60, change: 2.11, high: 35.80, low: 33.20, volume: "280M" },
          { symbol: "MATIC/USD", name: "Polygon", price: 0.58, change: -0.92, high: 0.61, low: 0.56, volume: "110M" },
          { symbol: "TON/USD", name: "Toncoin", price: 7.15, change: 6.25, high: 7.35, low: 6.65, volume: "340M" },
          { symbol: "TRX/USD", name: "TRON", price: 0.118, change: 0.45, high: 0.122, low: 0.115, volume: "250M" },
          { symbol: "XLM/USD", name: "Stellar", price: 0.124, change: 1.25, high: 0.128, low: 0.121, volume: "90M" },
          { symbol: "ATOM/USD", name: "Cosmos", price: 8.45, change: -2.15, high: 8.80, low: 8.35, volume: "130M" },
          { symbol: "NEAR/USD", name: "NEAR Protocol", price: 5.65, change: 3.42, high: 5.85, low: 5.40, volume: "220M" },
          { symbol: "ALGO/USD", name: "Algorand", price: 0.185, change: -1.12, high: 0.192, low: 0.181, volume: "65M" },
          { symbol: "FTM/USD", name: "Fantom", price: 0.82, change: 5.14, high: 0.85, low: 0.77, volume: "105M" },
          { symbol: "ICP/USD", name: "Internet Computer", price: 11.40, change: -1.82, high: 11.90, low: 11.20, volume: "95M" },
          { symbol: "HBAR/USD", name: "Hedera", price: 0.082, change: -0.42, high: 0.086, low: 0.080, volume: "75M" },
          { symbol: "APT/USD", name: "Aptos", price: 9.15, change: 2.85, high: 9.45, low: 8.80, volume: "155M" },
          { symbol: "SUI/USD", name: "Sui", price: 1.25, change: 4.15, high: 1.32, low: 1.18, volume: "185M" },
          { symbol: "OP/USD", name: "Optimism", price: 2.15, change: -2.44, high: 2.25, low: 2.10, volume: "140M" },
          { symbol: "ARB/USD", name: "Arbitrum", price: 0.95, change: -1.85, high: 0.99, low: 0.92, volume: "125M" },
          { symbol: "FIL/USD", name: "Filecoin", price: 5.40, change: 1.12, high: 5.60, low: 5.25, volume: "80M" },
          { symbol: "VET/USD", name: "VeChain", price: 0.034, change: -0.58, high: 0.036, low: 0.033, volume: "55M" },
          { symbol: "LDO/USD", name: "Lido DAO", price: 1.85, change: 2.20, high: 1.92, low: 1.78, volume: "115M" },
          { symbol: "GRT/USD", name: "The Graph", price: 0.28, change: 3.14, high: 0.30, low: 0.27, volume: "90M" },
          { symbol: "RNDR/USD", name: "Render Token", price: 8.85, change: 7.42, high: 9.15, low: 8.10, volume: "260M" },
          { symbol: "AAVE/USD", name: "Aave", price: 110.15, change: 1.25, high: 115.00, low: 108.30, volume: "145M" },
          { symbol: "MKR/USD", name: "Maker", price: 2320.00, change: -1.18, high: 2390.00, low: 2280.00, volume: "85M" },
          { symbol: "INJ/USD", name: "Injective", price: 22.40, change: 4.85, high: 23.50, low: 21.05, volume: "120M" },
          { symbol: "RUNE/USD", name: "THORChain", price: 5.15, change: -3.12, high: 5.40, low: 5.02, volume: "95M" },
          { symbol: "IMX/USD", name: "Immutable", price: 1.45, change: 2.11, high: 1.52, low: 1.38, volume: "75M" },
          { symbol: "FET/USD", name: "Fetch.ai", price: 1.62, change: 8.42, high: 1.70, low: 1.48, volume: "190M" },
          { symbol: "FLOW/USD", name: "Flow", price: 0.65, change: -0.45, high: 0.68, low: 0.61, volume: "45M" },
          { symbol: "WIF/USD", name: "dogwifhat", price: 2.15, change: 12.14, high: 2.30, low: 1.85, volume: "210M" },
          { symbol: "PEPE/USD", name: "Pepe", price: 0.000012, change: 9.25, high: 0.000013, low: 0.000011, volume: "320M" },
          { symbol: "STX/USD", name: "Stacks", price: 1.82, change: -1.75, high: 1.90, low: 1.76, volume: "110M" },
          { symbol: "THETA/USD", name: "Theta Network", price: 2.35, change: 3.12, high: 2.45, low: 2.22, volume: "80M" },
          { symbol: "EGLD/USD", name: "MultiversX", price: 34.50, change: -1.82, high: 35.90, low: 33.80, volume: "50M" },
          { symbol: "SAND/USD", name: "The Sandbox", price: 0.38, change: -0.42, high: 0.40, low: 0.36, volume: "60M" },
          { symbol: "MANA/USD", name: "Decentraland", price: 0.42, change: 1.15, high: 0.44, low: 0.40, volume: "55M" },
          { symbol: "FIDA/USD", name: "Bonfida", price: 0.28, change: 0.95, high: 0.30, low: 0.26, volume: "15M" },
          { symbol: "CHZ/USD", name: "Chiliz", price: 0.095, change: 2.85, high: 0.098, low: 0.091, volume: "40M" },
          { symbol: "ENS/USD", name: "Ethereum Name Service", price: 16.40, change: 5.12, high: 17.20, low: 15.80, volume: "65M" },
          { symbol: "CRV/USD", name: "Curve DAO Token", price: 0.32, change: -1.45, high: 0.34, low: 0.31, volume: "35M" },
          { symbol: "GALA/USD", name: "Gala", price: 0.038, change: 4.25, high: 0.040, low: 0.036, volume: "75M" },
          { symbol: "JUP/USD", name: "Jupiter", price: 0.98, change: 6.82, high: 1.05, low: 0.92, volume: "125M" }
        ],
        stocks: [
          { symbol: "AAPL", name: "Apple Inc.", price: 182.30, change: 0.85, high: 183.50, low: 180.80, volume: "52.4M" },
          { symbol: "TSLA", name: "Tesla Inc.", price: 214.50, change: -3.42, high: 221.00, low: 212.30, volume: "83.1M" },
          { symbol: "NVDA", name: "NVIDIA Corp.", price: 924.80, change: 4.12, high: 935.00, low: 885.00, volume: "41.6M" },
          { symbol: "MSFT", name: "Microsoft Corp.", price: 415.60, change: 0.42, high: 418.00, low: 412.50, volume: "22.8M" },
          { symbol: "AMZN", name: "Amazon.com Inc.", price: 178.90, change: -1.15, high: 181.20, low: 177.50, volume: "32.1M" },
          { symbol: "GOOGL", name: "Alphabet Inc.", price: 172.50, change: 1.22, high: 174.10, low: 170.80, volume: "25.4M" },
          { symbol: "META", name: "Meta Platforms Inc.", price: 475.20, change: 2.15, high: 480.50, low: 468.20, volume: "18.2M" },
          { symbol: "NFLX", name: "Netflix Inc.", price: 610.40, change: -1.82, high: 622.00, low: 605.50, volume: "8.5M" },
          { symbol: "AMD", name: "Advanced Micro Devices", price: 164.80, change: -2.45, high: 170.10, low: 162.30, volume: "42.1M" },
          { symbol: "INTC", name: "Intel Corp.", price: 30.15, change: -0.85, high: 30.90, low: 29.80, volume: "35.2M" },
          { symbol: "PYPL", name: "PayPal Holdings", price: 62.40, change: 0.45, high: 63.20, low: 61.80, volume: "12.4M" },
          { symbol: "ADBE", name: "Adobe Inc.", price: 482.60, change: 1.05, high: 488.50, low: 477.15, volume: "4.8M" },
          { symbol: "CRM", name: "Salesforce Inc.", price: 278.40, change: -1.15, high: 282.00, low: 275.50, volume: "7.2M" },
          { symbol: "COIN", name: "Coinbase Global", price: 232.10, change: 6.85, high: 240.50, low: 221.80, volume: "15.6M" },
          { symbol: "QCOM", name: "QUALCOMM Inc.", price: 173.20, change: 0.95, high: 175.50, low: 171.10, volume: "9.2M" },
          { symbol: "AVGO", name: "Broadcom Inc.", price: 1350.20, change: 1.82, high: 1370.00, low: 1335.50, volume: "3.1M" },
          { symbol: "ASML", name: "ASML Holding", price: 915.40, change: -1.12, high: 928.00, low: 902.50, volume: "2.4M" },
          { symbol: "MU", name: "Micron Technology", price: 112.50, change: 3.42, high: 115.20, low: 108.40, volume: "21.5M" },
          { symbol: "AMAT", name: "Applied Materials", price: 205.80, change: 0.65, high: 208.90, low: 203.10, volume: "6.8M" },
          { symbol: "TXN", name: "Texas Instruments", price: 168.40, change: -0.35, high: 170.20, low: 166.80, volume: "5.1M" },
          { symbol: "COST", name: "Costco Wholesale", price: 725.60, change: 0.82, high: 730.50, low: 720.10, volume: "4.2M" },
          { symbol: "PEP", name: "PepsiCo Inc.", price: 171.20, change: -0.22, high: 173.00, low: 169.80, volume: "5.5M" },
          { symbol: "SBUX", name: "Starbucks Corp.", price: 82.40, change: -1.45, high: 84.00, low: 81.50, volume: "7.8M" },
          { symbol: "NKE", name: "Nike Inc.", price: 95.15, change: 0.15, high: 96.50, low: 94.20, volume: "8.1M" },
          { symbol: "DIS", name: "Walt Disney Co.", price: 114.30, change: -0.85, high: 116.00, low: 113.10, volume: "9.6M" },
          { symbol: "CMG", name: "Chipotle Mexican Grill", price: 298.50, change: 1.55, high: 301.00, low: 295.00, volume: "1.1M" },
          { symbol: "LULU", name: "Lululemon Athletica", price: 345.20, change: -4.12, high: 362.00, low: 341.00, volume: "2.8M" },
          { symbol: "MSTR", name: "MicroStrategy Inc.", price: 1420.50, change: 11.22, high: 1480.00, low: 1310.00, volume: "6.2M" },
          { symbol: "PANW", name: "Palo Alto Networks", price: 292.80, change: -1.35, high: 298.00, low: 289.50, volume: "3.5M" },
          { symbol: "FTNT", name: "Fortinet Inc.", price: 61.20, change: 0.75, high: 62.10, low: 60.50, volume: "4.4M" },
          { symbol: "ZS", name: "Zscaler Inc.", price: 182.40, change: -2.15, high: 188.00, low: 179.50, volume: "2.9M" },
          { symbol: "DDOG", name: "Datadog Inc.", price: 118.50, change: 1.15, high: 121.20, low: 116.40, volume: "3.8M" },
          { symbol: "ORCL", name: "Oracle Corp.", price: 124.50, change: 1.15, high: 126.00, low: 123.20, volume: "10.4M" },
          { symbol: "CSCO", name: "Cisco Systems Inc.", price: 47.80, change: -0.42, high: 48.30, low: 47.10, volume: "15.2M" },
          { symbol: "ABNB", name: "Airbnb Inc.", price: 148.60, change: 2.15, high: 151.20, low: 145.80, volume: "4.8M" },
          { symbol: "UBER", name: "Uber Technologies", price: 68.40, change: 3.22, high: 69.50, low: 66.85, volume: "18.5M" },
          { symbol: "SNOW", name: "Snowflake Inc.", price: 152.30, change: -4.15, high: 158.40, low: 150.10, volume: "6.2M" },
          { symbol: "PLTR", name: "Palantir Technologies", price: 24.50, change: 8.12, high: 25.40, low: 22.80, volume: "38.4M" },
          { symbol: "NET", name: "Cloudflare Inc.", price: 92.15, change: -1.85, high: 95.00, low: 90.80, volume: "5.1M" },
          { symbol: "SHOP", name: "Shopify Inc.", price: 74.80, change: 0.95, high: 76.20, low: 73.10, volume: "9.6M" },
          { symbol: "MDB", name: "MongoDB Inc.", price: 365.40, change: -3.42, high: 375.00, low: 360.50, volume: "2.1M" },
          { symbol: "NOW", name: "ServiceNow Inc.", price: 742.60, change: 1.12, high: 748.50, low: 735.00, volume: "1.8M" },
          { symbol: "SQ", name: "Block Inc.", price: 65.15, change: 2.45, high: 66.80, low: 63.90, volume: "11.2M" },
          { symbol: "TEAM", name: "Atlassian Corp.", price: 185.30, change: -1.75, high: 191.00, low: 183.20, volume: "3.2M" },
          { symbol: "WDAY", name: "Workday Inc.", price: 262.40, change: 0.15, high: 265.80, low: 259.10, volume: "2.5M" },
          { symbol: "OKTA", name: "Okta Inc.", price: 92.40, change: -1.18, high: 95.20, low: 91.00, volume: "3.4M" },
          { symbol: "SPLK", name: "Splunk Inc.", price: 156.20, change: 0.05, high: 157.00, low: 155.80, volume: "1.5M" },
          { symbol: "MRVL", name: "Marvell Technology", price: 68.15, change: 4.12, high: 69.80, low: 65.10, volume: "12.8M" },
          { symbol: "CRWD", name: "CrowdStrike Holdings", price: 315.40, change: 5.82, high: 322.00, low: 308.50, volume: "6.5M" },
          { symbol: "ALNY", name: "Alnylam Pharmaceuticals", price: 154.20, change: -0.45, high: 156.80, low: 152.10, volume: "1.2M" },
          { symbol: "GILD", name: "Gilead Sciences Inc.", price: 66.80, change: 0.25, high: 67.50, low: 65.90, volume: "7.4M" },
          { symbol: "SIRI", name: "Sirius XM Holdings", price: 3.85, change: -1.12, high: 3.98, low: 3.75, volume: "21.2M" }
        ]
      };
      
      // If the user has a real polygon.io API key, we could optionally integrate it here:
      // if (process.env.POLYGON_API_KEY) { ... }

      return res.json(simulatedData);
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
