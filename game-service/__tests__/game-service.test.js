import { jest } from '@jest/globals';

jest.unstable_mockModule('mysql2/promise', () => ({
  createPool: () => ({
    query: jest.fn().mockResolvedValue([
      [
        { id: 1, name: 'Mock Game', category: 'Action', release_date: '2023-01-01', price: 59.99 }
      ]
    ]),
    execute: jest.fn().mockResolvedValue([{ affectedRows: 1 }])
  })
}));

import request from 'supertest';
const { default: app } = await import('../index.js'); // ESM-compatible import

describe('Game Service API', () => {
  it('GET / should return healthy status', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('Game Service is healthy!');
  });

  it('GET /games should return list of games', async () => {
    const response = await request(app).get('/games');
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('POST /games should create a game', async () => {
    const response = await request(app).post('/games').send({
      name: 'Test Game',
      category: 'Adventure',
      release_date: '2025-01-01',
      price: 49.99
    });
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toMatch(/created successfully/i);
  });
});
