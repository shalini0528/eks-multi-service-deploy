import express from 'express';
import {createPool} from 'mysql2/promise';

const app = express();
app.use(express.json());

const PORT = 5000;

// MySQL connection pool
const pool = createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'lugxdbOrder'
});

app.set('db', pool);

//Check Order service health
app.get('/', (req, res) => {
    res.send('Order Service is healthy!');
});

// Create a new order
app.post('/orders', async (req, res) => {
    const { customer_id, items } = req.body; // items should be an array of { game_id, game_name, quantity, price_per_item }

    if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Customer ID and at least one item are required.' });
    }

    let connection;
    try {
        connection = await pool.getConnection(); // Get a connection from the pool
        await connection.beginTransaction(); // Start a transaction

        let total_price = 0;
        for (const item of items) {
            if (!item.game_id || !item.game_name || !item.quantity || !item.price_per_item) {
                await connection.rollback(); // Rollback if any item data is invalid
                return res.status(400).json({ message: 'Invalid item data in the cart. Each item must have game_id, game_name, quantity, and price_per_item.' });
            }
            item.subtotal = item.quantity * item.price_per_item;
            total_price += item.subtotal;
        }

        // Insert into orders table
        const [orderResult] = await connection.execute(
            'INSERT INTO orders (customer_id, total_price) VALUES (?, ?)',
            [customer_id, total_price]
        );
        const orderId = orderResult.insertId;

        // Insert into cart_items table for each item
        for (const item of items) {
            await connection.execute(
                'INSERT INTO cart_items (order_id, game_id, game_name, quantity, price_per_item, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
                [orderId, item.game_id, item.game_name, item.quantity, item.price_per_item, item.subtotal]
            );
        }

        await connection.commit(); // Commit the transaction if all operations are successful
        res.status(201).json({ message: 'Order created successfully', orderId: orderId, total_price: total_price });

    } catch (error) {
        if (connection) {
            await connection.rollback(); // Rollback the transaction on error
        }
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Failed to create order', error: error.message });
    } finally {
        if (connection) {
            connection.release(); // Release the connection back to the pool
        }
    }
});

// Get all orders (with aggregated total price for simplicity, or could fetch items separately)
app.get('/orders', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM orders ORDER BY order_date DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Failed to retrieve orders', error: error.message });
    }
});

// Get a specific order by ID, including its items
app.get('/orders/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);

        if (orders.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = orders[0];
        const [items] = await pool.query('SELECT * FROM cart_items WHERE order_id = ?', [id]);

        order.items = items; // Attach items to the order object

        res.json(order);
    } catch (error) {
        console.error('Error fetching order by ID:', error);
        res.status(500).json({ message: 'Failed to retrieve order', error: error.message });
    }
});

// Update Order Status
app.put('/orders/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: 'Status is required for update.' });
    }

    const allowedStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled', 'refunded']; // Define your valid statuses
    if (!allowedStatuses.includes(status.toLowerCase())) {
        return res.status(400).json({ message: `Invalid status. Allowed values are: ${allowedStatuses.join(', ')}` });
    }

    try {
        const [result] = await pool.execute(
            'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status.toLowerCase(), id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ message: 'Failed to update order status', error: error.message });
    }
});

export default app;

// Start server
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Order Service running at http://localhost:${PORT}`);
    });
}
