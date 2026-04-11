const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), override: true });

const mongo_username = process.env.MONGO_USERNAME;
const mongo_password = process.env.MONGO_PASSWORD;
const mongo_cluster = process.env.MONGO_CLUSTER;
const mongo_database = process.env.MONGO_DBNAME;
const mongo_uri = process.env.MONGO_URI || process.env.MONGODB_URI;

const connectionUri =
  mongo_uri ||
  (mongo_username && mongo_password && mongo_cluster && mongo_database
    ? `mongodb+srv://${mongo_username}:${mongo_password}@${mongo_cluster}/${mongo_database}?retryWrites=true&w=majority`
    : "");

if (!connectionUri) {
  console.warn("Missing MongoDB connection info. Set MONGO_URI or MONGO_* env vars.");
} else {
  mongoose
    .connect(connectionUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log(`Connected to: ${mongoose.connection.name}`))
    .catch((err) => console.log(err));
}

module.exports = mongoose;
