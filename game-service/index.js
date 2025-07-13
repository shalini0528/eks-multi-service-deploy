import express from 'express';
import { createPool } from 'mysql2/promise';

const app = express();
app.use(express.json());

const PORT = 3000;

// MySQL connection pool
const pool = createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'lugxdbGame'
});

app.set('db', pool);

//Check Game service health
app.get('/', (req, res) => {
  res.send('Game Service is healthy!!!');
});

//get all games
app.get('/games', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM games');
    res.json(rows);
  } catch (error) {
    console.error('GET /games failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new game
app.post('/games', async (req, res) => {
  try {
    await pool.execute(
      'INSERT INTO games (name, category, release_date, price) VALUES (?, ?, ?, ?)',
      [req.body.name, req.body.category, req.body.release_date, req.body.price]
    );
    res.status(200).json({ message: 'Game has been created successfully' });
  } catch (error) {
    console.error('POST /games failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/games/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category, release_date, price } = req.body;
  const [result] = await pool.execute('UPDATE games SET name = ?, category = ?, release_date = ?, price = ? WHERE id = ?', [name, category, release_date, price, id]);

  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Game not found' });
  }

  res.status(200).json({ message: 'Game updated successfully' });
});

export default app;

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Game Service running at http://localhost:${PORT}`);
  });
}

