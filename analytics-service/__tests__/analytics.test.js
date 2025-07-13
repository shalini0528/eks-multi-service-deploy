import request from 'supertest';
import app from '../index.js';

describe('Analytics Service', () => {
  
  it('POST /track should log event successfully', async () => {
    const res = await request(app)
      .post('/track')
      .send({
        event_type: 'page_view',
        page_url: 'https://example.com',
        session_id: 'session-1234',
        timestamp: new Date().toISOString(),
        user_agent: 'Mozilla/5.0',
        scroll_depth: 80,
        page_time_seconds: 15,
        session_duration: 60
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Event captured');
  }, 50000);

});
