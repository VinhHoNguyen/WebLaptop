const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Product = require('./models/productModel');

const mongo_username = process.env.MONGO_USERNAME;
const mongo_password = process.env.MONGO_PASSWORD;
const mongo_cluster = process.env.MONGO_CLUSTER;
const mongo_database = process.env.MONGO_DBNAME;

async function seedProducts() {
    try {
        await mongoose.connect(
            `mongodb+srv://${mongo_username}:${mongo_password}@${mongo_cluster}/${mongo_database}?retryWrites=true&w=majority`,
            { useNewUrlParser: true, useUnifiedTopology: true }
        );

        const sourcePath = path.join(__dirname, '..', 'products.json');
        const raw = fs.readFileSync(sourcePath, 'utf8');
        const parsed = JSON.parse(raw);

        const normalized = parsed.map((item) => {
            const mapped = { ...item };
            if (mapped._id && mapped._id.$oid) {
                mapped._id = new mongoose.Types.ObjectId(mapped._id.$oid);
            }
            return mapped;
        });

        await Product.deleteMany({});
        await Product.insertMany(normalized, { ordered: false });

        console.log(`Seeded ${normalized.length} products successfully.`);
        process.exit(0);
    } catch (error) {
        console.error('Failed to seed products:', error.message);
        process.exit(1);
    }
}

seedProducts();
