const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'identity_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
});

module.exports = pool;const mongoose = require('mongoose');
const redis = require('redis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), override: true });

const redisClient = redis.createClient();

const mongo_username = process.env.MONGO_USERNAME;
const mongo_password = process.env.MONGO_PASSWORD;
const mongo_cluster = process.env.MONGO_CLUSTER;
const mongo_database = process.env.USER_MONGO_DBNAME || process.env.MONGO_DBNAME || 'user_db';
const mongo_uri = process.env.USER_MONGO_URI || process.env.MONGO_URI;

const withDbName = (uri, dbName) => {
        try {
                const parsed = new URL(uri);
                parsed.pathname = `/${dbName}`;
                return parsed.toString();
        } catch (_error) {
                return uri;
        }
};

const connectionUri =
        (mongo_uri ? withDbName(mongo_uri, mongo_database) : null) ||
        `mongodb+srv://${mongo_username}:${mongo_password}@${mongo_cluster}/${mongo_database}?retryWrites=true&w=majority`;

mongoose.connect(connectionUri
, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log(`Connected to: ${mongoose.connection.name}`))
.catch(err => console.log(err));

module.exports = mongoose;