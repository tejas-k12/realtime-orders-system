const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const pool = require('./db');

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));


// FETCH ALL ORDERS
app.get('/orders', async (req, res) => {

    try {

        const result = await pool.query(
            'SELECT * FROM orders ORDER BY id DESC'
        );

        res.json(result.rows);

    }
    catch (err) {

        console.log(err);

        res.status(500).json({
            error: 'Failed to fetch orders'
        });
    }
});


const PORT = 5000;


// SOCKET CONNECTION
io.on('connection', (socket) => {

    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {

        console.log('Client disconnected');
    });
});


// LISTEN FOR POSTGRESQL NOTIFICATIONS
async function startListening() {

    const client = await pool.connect();

    await client.query('LISTEN order_changes');

    console.log('Listening for PostgreSQL notifications...');

    client.on('notification', (msg) => {

        const payload = JSON.parse(msg.payload);

        console.log('Database Change:', payload);

        io.emit('order_update', payload);
    });
}


startListening();


// START SERVER
server.listen(PORT, () => {

    console.log(`Server running on http://localhost:${PORT}`);
});