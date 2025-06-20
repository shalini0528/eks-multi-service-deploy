import express from 'express';
import { createClient } from '@clickhouse/client';
import { randomUUID } from 'crypto';
import cors from 'cors';

const app = express();
app.use(cors()); 
app.use(express.json());

const PORT = 4000;

// ClickHouse client
const clickhouse = createClient({
  host: "https://z5rbcna629.ap-southeast-1.aws.clickhouse.cloud:8443",
  username: "default",
  password: "j4JMDKnteD.Hu",
  database: "lugxanalytics",
});

// POST /track - Capture analytics
app.post('/track', async (req, res) => {
  const { event_type, page_url } = req.body;

  try {
    await clickhouse.insert({
      table: 'web_events',
      values: [{
        id: randomUUID(),
        event_type,
        page_url,
        timestamp: new Date(),
      }],
      format: 'JSONEachRow'
    });

    res.status(200).json({ message: 'Event captured' });
  } catch (error) {
    console.error('ClickHouse insert error:', error.message);
    res.status(500).json({ error: 'Failed to log event' });
  }
});

app.listen(PORT, () => {
  console.log(`Analytics Service running at http://localhost:${PORT}`);
});