import { jest } from '@jest/globals';

jest.unstable_mockModule('mysql2/promise', () => {
  const mockExecute = jest.fn().mockResolvedValue([{ affectedRows: 1, insertId: 1 }]);

  const mockQuery = jest.fn((sql, params) => {
    if (sql.includes('FROM orders') && params?.length === 1) {
      // Mock for GET /orders/:id
      return Promise.resolve([[
        {
          id: params[0],
          customer_id: 1,
          order_date: '2025-07-13',
          status: 'pending',
          total_price: 59.98
        }
      ]]);
    } else if (sql.includes('FROM order_items') && params?.length === 1) {
      // Mock for order items of a specific order
      return Promise.resolve([[
        {
          game_id: 101,
          game_name: 'Sample Game',
          quantity: 2,
          price_per_item: 29.99
        }
      ]]);
    } else {
      // Default mock for GET /orders
      return Promise.resolve([[]]);
    }
  });

  const mockGetConnection = jest.fn().mockResolvedValue({
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn(),
    execute: mockExecute,
    release: jest.fn()
  });

  return {
    createPool: () => ({
      query: mockQuery,
      execute: mockExecute,
      getConnection: mockGetConnection
    })
  };
});

import request from 'supertest';
const { default: app } = await import('../index.js');

describe('Order Service API (Mock DB)', () => {

  it('POST /orders should create a new order', async () => {
    const res = await request(app)
      .post('/orders')
      .send({
        customer_id: 1,
        items: [
          {
            game_id: 101,
            game_name: 'Sample Game',
            quantity: 2,
            price_per_item: 29.99
          }
        ]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('orderId');
    expect(res.body).toHaveProperty('total_price');
  });

  it('GET /orders should return an array of orders', async () => {
    const res = await request(app).get('/orders');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /orders/:id should return an order with items', async () => {
    const res = await request(app).get('/orders/1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('PUT /orders/:id/status should update status', async () => {
    const res = await request(app)
      .put(`/orders/1/status`)
      .send({ status: 'shipped' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/updated successfully/i);
  });

});
