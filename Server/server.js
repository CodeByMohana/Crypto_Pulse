const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const memoryCache = require("memory-cache");

dotenv.config();

const app = express();
const PORT = 3000;
const CACHE_DURATION = 60000; // 1 minute

// CORS config
app.use(cors({
  origin: "https://crypto-pulse-psi.vercel.app", // ✅ No trailing slash
}));

// Serve frontend
app.use(express.static(path.join(__dirname, "../dist")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

// In-memory cache
let coinDataCache = new memoryCache.Cache();

// ✅ Unified endpoint to fetch and filter real-time coin data
app.get("/fetch-data", async (req, res) => {
  const coin = req.query.coin || "dogecoin";
  const minMarketCap = parseFloat(req.query.minMarketCap) || 0;
  const maxMarketCap = parseFloat(req.query.maxMarketCap) || Infinity;
  const minPrice = parseFloat(req.query.minPrice) || 0;
  const maxPrice = parseFloat(req.query.maxPrice) || Infinity;

  try {
    let cachedData = coinDataCache.get(coin);
    if (!cachedData) {
      console.log("Fetching new data...");
      const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coin}`, {
        headers: {
          "x-cg-demo-api-key": process.env.API_KEY,
        },
      });

      cachedData = {
        name: response.data.name,
        market_data: response.data.market_data,
        sentiments: {
          positive: Math.random() * 100, // Simulated sentiment
        },
      };

      coinDataCache.put(coin, cachedData, CACHE_DURATION);
    } else {
      console.log("Serving data from cache...");
    }

    const marketCap = cachedData.market_data.market_cap.usd / 1e6;
    const price = cachedData.market_data.current_price.usd;

    if (
      marketCap >= minMarketCap &&
      marketCap <= maxMarketCap &&
      price >= minPrice &&
      price <= maxPrice
    ) {
      res.status(200).json(cachedData);
    } else {
      res.status(404).json({ message: "No data matches the selected filters." });
    }
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// ✅ New endpoint to proxy CoinGecko's candlestick API
app.get("/proxy/candlestick", async (req, res) => {
  const coin = req.query.coin || "dogecoin";
  const days = req.query.days || "30";

  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${coin}/market_chart`,
      {
        params: {
          vs_currency: "usd",
          days,
        },
        headers: {
          "x-cg-demo-api-key": process.env.API_KEY,
        },
      }
    );

    res.status(200).json(response.data);
  } catch (err) {
    console.error("CoinGecko proxy error:", err.message);
    res.status(500).json({ error: "Failed to fetch data from CoinGecko" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});