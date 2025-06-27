import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { Buffer } from 'buffer'; // (optional if you need Buffer)

const app = express();
const PORT = 5000;

// Define Pinata credentials here
const PINATA_API_KEY = '4bce14e547816620ae32';
const PINATA_SECRET_API_KEY = '484ae53e7ccd7d0a4bd992a3e57d16e753585d468996389aebe1834fccb3ce09';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow large base64 payloads

// 🔹 New route to upload base64 image to IPFS
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

// 🔹 Existing route to upload metadata to IPFS
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
