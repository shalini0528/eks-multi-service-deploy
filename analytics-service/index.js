import express from 'express';
import { createClient } from '@clickhouse/client';
import { randomUUID } from 'crypto';
import cors from 'cors';

const app = express();
const PORT = 4000;

// Replace this with static website's public IP (from EC2)
const allowedOrigin = 'http://35.170.54.198';

// CORS setup to allow only static website
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin === allowedOrigin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  optionsSuccessStatus: 200
}));

// Enable JSON parsing
app.use(express.json());

// Preflight handler for any route
app.options('*', cors());

// ClickHouse client config
const clickhouse = createClient({
  url: process.env.CH_URL || 'https://gofyug2nof.us-west-2.aws.clickhouse.cloud:8443',
  username: process.env.CH_USERNAME || 'default',
  password: process.env.CH_PASSWORD || '2NJh7XE.eUV2U',
  database: process.env.CH_DB || 'lugxanalytics',
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Analytics Service is healthy');
});

// Analytics tracking endpoint
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
  console.log(`Analytics Service running at http://localhost:${PORT}`);
});
