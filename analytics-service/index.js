import express from 'express';
import { createClient } from '@clickhouse/client';
import { randomUUID } from 'crypto';
import cors from 'cors';
import client from 'prom-client'; 

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4000;

// ClickHouse client setup
const clickhouse = createClient({
  url: process.env.CH_URL || 'https://zo9pss9xqb.us-west-2.aws.clickhouse.cloud:8443',
  username: process.env.CH_USERNAME || 'default',
  password: process.env.CH_PASSWORD || '9.klykVF496EZ',
  database: process.env.CH_DB || 'lugxanalytics',
});

const register = new client.Registry();
client.collectDefaultMetrics({ register });

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Check Analytics service helath
app.get('/', (req, res) => {
  res.send('Analytics Service is healthy!!!');
});

// Track endpoint
app.post('/track', async (req, res) => {
  const {
    event_type,
    page_url,
    session_id,
    click_target = null,
    scroll_depth = null,
    page_time_seconds = null,
    session_duration = null,
    user_agent = null,
    timestamp
  } = req.body;

  try {
    await clickhouse.insert({
      table: 'web_events',
      values: [{
        id: randomUUID(),
        event_type,
        page_url,
        session_id,
        click_target,
        scroll_depth,
        page_time_seconds,
        session_duration,
        user_agent,
        timestamp: new Date(timestamp)
      }],
      format: 'JSONEachRow'
    });

    res.status(200).json({ message: 'Event captured' });
  } catch (error) {
    console.error('ClickHouse insert error:', error.message);
    res.status(500).json({ error: 'Failed to log event' });
  }
});

export default app;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Analytics Service running at http://localhost:${PORT}`);
  });
}
