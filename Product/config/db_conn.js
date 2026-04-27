const mongoose = require('mongoose');
const redis = require('redis');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), override: true });

const redisClient = redis.createClient();

// Promisify Redis functions for async/await usage
// const getAsync = promisify(redisClient.get).bind(redisClient);
// const setAsync = promisify(redisClient.set).bind(redisClient);

const mongo_username = process.env.MONGO_USERNAME;
const mongo_password = process.env.MONGO_PASSWORD;
const mongo_cluster = process.env.MONGO_CLUSTER;
const mongo_database = process.env.PRODUCT_MONGO_DBNAME || process.env.MONGO_DBNAME || 'product_db';
const mongo_uri = process.env.PRODUCT_MONGO_URI || process.env.MONGO_URI;

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



// async function getDataFromDatabase(id) {
//     // Check if the data is already cached
//     const cachedData = await getAsync(id);
//     if (cachedData) {
//       console.log('Fetching data from cache');
//       return JSON.parse(cachedData);
//     }
  
//     // If not cached, fetch data from the database
//     console.log('Fetching data from the database');
//     const data = await MyModel.findById(id).exec();
  
//     // Cache the fetched data
//     await setAsync(id, JSON.stringify(data));
  
//     return data;
//   }



//   async function main() {
//     const data1 = await getDataFromDatabase();
//     console.log(data1);
  
//     // Fetch the same data again to demonstrate caching
//     const data2 = await getDataFromDatabase();
//     console.log(data2);
//   }
  
//   main().catch(console.error);


// mongoose.connect(`mongodb://localhost:27017`
// , { useNewUrlParser: true, useUnifiedTopology: true })
// .then(() => console.log(`Connected to: DB`))
// .catch(err => console.log(err));


module.exports = mongoose;