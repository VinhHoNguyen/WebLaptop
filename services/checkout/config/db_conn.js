const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.CHECKOUT_MYSQL_USER || process.env.MYSQL_USER || 'root',
  password: process.env.CHECKOUT_MYSQL_PASSWORD || process.env.MYSQL_PASSWORD || '',
  database: process.env.CHECKOUT_MYSQL_DATABASE || process.env.MYSQL_DATABASE || 'checkout_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
});

module.exports = pool;