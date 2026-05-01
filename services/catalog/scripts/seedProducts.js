const fs = require('fs/promises');
const path = require('path');
const pool = require('../config/db_conn');

const normalizeSeedRow = (item) => ({
  id: item?._id?.$oid || item.id,
  name: item.name,
  price: item.price,
  description: item.description || '',
  category: item.category || '',
  image: item.image || '',
  stock: item.stock ?? 0,
  specs: item.specs ? JSON.stringify(item.specs) : null,
});

const ensureSeedProducts = async () => {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM products');
  if (rows[0].total > 0) {
    return;
  }

  const candidatePaths = [
    process.env.PRODUCTS_JSON_PATH,
    path.resolve(__dirname, '../../../products.json'),
    path.resolve(process.cwd(), 'products.json'),
  ].filter(Boolean);

  let raw = null;
  for (const seedPath of candidatePaths) {
    try {
      raw = await fs.readFile(seedPath, 'utf8');
      break;
    } catch (_error) {
      raw = null;
    }
  }

  if (!raw) {
    throw new Error('Unable to locate products.json for catalog seed data');
  }

  const products = JSON.parse(raw).map(normalizeSeedRow);

  for (const product of products) {
    await pool.query(
      `INSERT INTO products (id, name, price, description, category, image, stock, specs)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.id,
        product.name,
        product.price,
        product.description,
        product.category,
        product.image,
        product.stock,
        product.specs,
      ]
    );
  }

  console.log(`Seeded ${products.length} catalog products from products.json`);
};

module.exports = {
  ensureSeedProducts,
};