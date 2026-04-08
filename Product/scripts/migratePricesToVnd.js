const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const Product = require("../models/productModel");

const RATE = 26000;

const buildMongoUri = () => {
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  }

  const { MONGO_USERNAME, MONGO_PASSWORD, MONGO_CLUSTER, MONGO_DBNAME } = process.env;

  if (!MONGO_USERNAME || !MONGO_PASSWORD || !MONGO_CLUSTER || !MONGO_DBNAME) {
    throw new Error("Missing MongoDB environment variables. Provide MONGO_URI or MONGO_* values.");
  }

  return `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_CLUSTER}/${MONGO_DBNAME}?retryWrites=true&w=majority`;
};

const roundVnd = (value) => Math.round(value);

const migrate = async () => {
  const mongoUri = buildMongoUri();
  await mongoose.connect(mongoUri);

  // Only migrate records likely still in USD to avoid double conversion.
  const products = await Product.find({ price: { $gt: 0, $lt: 1000 } });

  if (!products.length) {
    console.log("No USD-priced products found. Nothing to migrate.");
    await mongoose.disconnect();
    return;
  }

  const bulkOps = products.map((product) => ({
    updateOne: {
      filter: { _id: product._id },
      update: { $set: { price: roundVnd(product.price * RATE) } },
    },
  }));

  const result = await Product.bulkWrite(bulkOps);

  console.log(`Migrated ${result.modifiedCount} products from USD to VND at rate ${RATE}.`);

  await mongoose.disconnect();
};

migrate().catch(async (error) => {
  console.error("Price migration failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
