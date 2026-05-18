const { Pool } = require('pg');
const pool = new Pool({
user: 'postgres',
host: 'localhost',
database: 'realtime_orders',
password: 'tejas',
port: 5432,
});
module.exports = pool;