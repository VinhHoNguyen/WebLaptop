const crypto = require('crypto');
const pool = require('../config/db_conn');

const generateId = () => crypto.randomBytes(12).toString('hex');

const normalizeOrder = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    id_user: row.id_user,
    id_payment: row.id_payment,
    address: row.address,
    total: Number(row.total || 0),
    status: row.status,
    pay: Boolean(row.pay),
    feeship: Number(row.feeship || 0),
    id_coupon: row.id_coupon,
    create_time: row.create_time,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

const normalizeDetailOrder = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    id_order: row.id_order,
    id_product: row.id_product,
    name_product: row.name_product,
    price_product: row.price_product,
    count: Number(row.count || 0),
    size: row.size,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

const createOrder = async (payload) => {
  const id = payload.id || generateId();
  const values = [
    id,
    payload.id_user || null,
    payload.id_payment || null,
    payload.address || null,
    Number(payload.total || 0),
    payload.status || 'Pending',
    payload.pay ? 1 : 0,
    Number(payload.feeship || 0),
    payload.id_coupon || null,
    payload.create_time || new Date().toISOString(),
  ];

  await pool.query(
    `INSERT INTO orders (id, id_user, id_payment, address, total, status, pay, feeship, id_coupon, create_time)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    values
  );

  const [rows] = await pool.query(`SELECT * FROM orders WHERE id = ? LIMIT 1`, [id]);
  return normalizeOrder(rows[0]);
};

const getOrdersByUserId = async (userId) => {
  const [rows] = await pool.query(
    `SELECT * FROM orders WHERE id_user = ? ORDER BY create_time DESC, createdAt DESC`,
    [userId]
  );
  return rows.map(normalizeOrder);
};

const getOrderById = async (id) => {
  const [rows] = await pool.query(`SELECT * FROM orders WHERE id = ? LIMIT 1`, [id]);
  return normalizeOrder(rows[0]);
};

const getOrderDetailsByOrderId = async (idOrder) => {
  const [rows] = await pool.query(
    `SELECT * FROM order_details WHERE id_order = ? ORDER BY createdAt DESC`,
    [idOrder]
  );
  return rows.map(normalizeDetailOrder);
};

const createDetailOrder = async (payload) => {
  const id = payload.id || generateId();
  await pool.query(
    `INSERT INTO order_details (id, id_order, id_product, name_product, price_product, count, size)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      payload.id_order || null,
      payload.id_product || null,
      payload.name_product || null,
      payload.price_product || null,
      Number(payload.count || 0),
      payload.size || null,
    ]
  );

  const [rows] = await pool.query(`SELECT * FROM order_details WHERE id = ? LIMIT 1`, [id]);
  return normalizeDetailOrder(rows[0]);
};

module.exports = {
  createOrder,
  getOrdersByUserId,
  getOrderById,
  getOrderDetailsByOrderId,
  createDetailOrder,
};