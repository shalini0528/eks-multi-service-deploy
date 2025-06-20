import express from 'express';
import mysql from 'mysql2/promise';

const app = express();
app.use(express.json());

const PORT = 5000;

// MySQL connection pool
const pool = mysql.createPool({
  host:  'localhost',
  user:  'root',
  password: 'root',
  database: 'lugxordersdb'
});


// 1. Create a new order
app.post('/orders', async (req, res) => {
    const {  user_id, total_price, status, created_at } = req.body;
    await pool.execute(
        'INSERT INTO orders (user_id, total_price, status, created_at) VALUES (?, ?, ?, ?, ?)',
        [user_id, total_price, status, created_at]
    );
    res.status(200).json({ message: 'Order created successfully' });
});




// Start server
app.listen(PORT, () => {
  console.log(`Order Service running at http://localhost:${PORT}`);
});