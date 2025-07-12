import express from 'express';
import { createClient } from '@clickhouse/client';
import { randomUUID } from 'crypto';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;

// Temporarily allow all origins (for debugging)
app.use(cors({
  origin: true, // Reflects the Origin header
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Handle preflight OPTIONS
app.options('*', cors());

// Parse JSON bodies
app.use(express.json());

// ClickHouse client setup
const clickhouse = createClient({
  url: process.env.CH_URL || 'https://gofyug2nof.us-west-2.aws.clickhouse.cloud:8443',
  username: process.env.CH_USERNAME || 'default',
  password: process.env.CH_PASSWORD || '2NJh7XE.eUV2U',
  database: process.env.CH_DB || 'lugxanalytics',
});

// Health check
app.get('/', (req, res) => {
  res.send('Analytics Service is healthy');
});

// /track endpoint
app.post('/track', async (req, res) => {
  const { event_type, page_url } = req.body;

  if (!event_type || !page_url) {
    return res.status(400).json({ error: 'Missing event_type or page_url' });
  }

  try {
    await clickhouse.insert({
      table: 'web_events',
      values: [{
        id: randomUUID(),
        event_type,
        page_url,
        timestamp: new Date(),
      }],
      format: 'JSONEachRow',
    });

    res.status(200).json({ message: 'Event captured' });
  } catch (error) {
    console.error('ClickHouse insert error:', error.message);
    res.status(500).json({ error: 'Failed to log event' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Analytics Service running on port ${PORT}`);
});
