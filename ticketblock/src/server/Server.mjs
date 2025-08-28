import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { Buffer } from 'buffer';

const app = express();
const PORT = 5000;

// Pinata API credentials (keep secret in env vars for production)
const PINATA_API_KEY = '4bce14e547816620ae32';
const PINATA_SECRET_API_KEY = '484ae53e7ccd7d0a4bd992a3e57d16e753585d468996389aebe1834fccb3ce09';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // support large base64 payloads


let cachedEthRate = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 60 * 1000; // 1 minute

app.get('/api/eth-rate', async (req, res) => {
  const now = Date.now();

  if (cachedEthRate && now - lastFetchTime < CACHE_DURATION_MS) {
    // Serve cached rate
    return res.json({ ethereum: { mxn: cachedEthRate } });
  }

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=mxn'
    );
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch ETH rate from CoinGecko' });
    }
    const data = await response.json();

    cachedEthRate = data.ethereum.mxn;
    lastFetchTime = now;

    res.json(data);
  } catch (error) {
    console.error('Error fetching ETH rate:', error);
    res.status(500).json({ error: 'Internal server error fetching ETH rate' });
  }
});

// Upload base64 image to Pinata
app.post('/api/upload-image', async (req, res) => {
  const { imageBase64 } = req.body;

  if (!imageBase64 || !imageBase64.startsWith('data:image')) {
    return res.status(400).json({ error: 'Invalid base64 image string' });
  }

  try {
    const base64Data = imageBase64.split(',')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const form = new FormData();
    form.append('file', imageBuffer, {
      filename: 'qrcode.png',
      contentType: 'image/png',
    });

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
        ...form.getHeaders(),
      },
      body: form,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata error: ${errorText}`);
    }

    const data = await response.json();
    const imageUrl = `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;

    res.json({ imageUrl });
  } catch (error) {
    console.error('Error uploading image to Pinata:', error.message);
    res.status(500).json({ error: 'Failed to upload image to Pinata' });
  }
});

// Upload metadata JSON to Pinata
app.post('/api/metadata', async (req, res) => {
  const metadata = req.body;

  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata error: ${errorText}`);
    }

    const data = await response.json();
    const metadataUrl = `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;

    res.json({ metadataUrl });
  } catch (error) {
    console.error('Error uploading metadata to Pinata:', error.message);
    res.status(500).json({ error: 'Failed to upload metadata to Pinata' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT} or http://<your-local-ip>:${PORT}`);
});