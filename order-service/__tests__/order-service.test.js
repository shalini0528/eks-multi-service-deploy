import request from 'supertest';
import app from '../index.js';

describe('Order Service API', () => {
  // Health Check
  it('GET / should return healthy message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Order Service is healthy!');
  });

  // Create Order
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

  // Get All Orders
  it('GET /orders should return an array of orders', async () => {
    const res = await request(app).get('/orders');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // Get Specific Order
  it('GET /orders/:id should return an order with items', async () => {
    const newOrder = await request(app)
      .post('/orders')
      .send({
        customer_id: 1,
        items: [
          {
            game_id: 999,
            game_name: 'Test Game',
            quantity: 1,
            price_per_item: 19.99
          }
        ]
      });

    const orderId = newOrder.body.orderId;

    const res = await request(app).get(`/orders/${orderId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  // Update Order Status
  it('PUT /orders/:id/status should update status', async () => {
    const newOrder = await request(app)
      .post('/orders')
      .send({
        customer_id: 2,
        items: [
          {
            game_id: 202,
            game_name: 'Another Game',
            quantity: 1,
            price_per_item: 39.99
          }
        ]
      });

    const orderId = newOrder.body.orderId;

    const res = await request(app)
      .put(`/orders/${orderId}/status`)
      .send({ status: 'shipped' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/updated successfully/i);
  });
});
