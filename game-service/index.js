import express from 'express';
import mysql from 'mysql2/promise';

const app = express();
app.use(express.json());

const PORT = 3000;

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'lugxdbGame'
});

//Check Game service health
app.get('/', (req, res) => {
  res.send('Game Service is healthy');
});

//get all games
app.get('/games', async (req,res)=>{
   const [rows] = await pool.query('SELECT * FROM games');
   res.json(rows);
});


// Create a new game
app.post('/games', async (req, res) => {
    await pool.execute('Insert into games (name,category,release_date,price) values (?,?,?,?)', [req.body.name, req.body.category, req.body.release_date, req.body.price]);
    res.status(200).json({ message: 'Game has been created successfully' });
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


// Start server
app.listen(PORT, () => {
  console.log(`Game Service running at http://localhost:${PORT}`);
});
