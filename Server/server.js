const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

const cors = require('cors');
app.use(cors());


dotenv.config();

const app = express();
const PORT = 3000;

app.get('/fetch-data', async (req, res) => {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/ping', {
            headers: {
                'x-cg-demo-api-key': process.env.API_KEY
            }
        });

        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
