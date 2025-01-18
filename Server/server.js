const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const memoryCache = require('memory-cache');  // Add this for caching

dotenv.config();

const app = express();
const PORT = 3000;

const CACHE_DURATION = 60000; // Cache duration: 1 minute

app.use(cors());
app.use(express.static(path.join(__dirname, '../dist')));

// Serve your HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// Cache to hold the coin data
let coinDataCache = new memoryCache.Cache();

app.get('/fetch-data', async (req, res) => {
    const coin = req.query.coin || 'dogecoin'; 

    // Check cache first
    let cachedData = coinDataCache.get(coin);
    if (cachedData) {
        console.log('Serving data from cache...');
        return res.status(200).json(cachedData); // Send cached data if available
    }

    try {
        // Fetch data from external API
        const response = await axios.get(`https://api.coingecko.com/api/v3/coins/${coin}`, {
            headers: {
                'x-cg-demo-api-key': process.env.API_KEY
            }
        });

        const data = {
            name: response.data.name,
            market_data: response.data.market_data,
            sentiments: {
                positive: Math.random() * 100 // Simulating sentiment as an example
            }
        };

        // Cache the fetched data
        coinDataCache.put(coin, data, CACHE_DURATION);

        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});