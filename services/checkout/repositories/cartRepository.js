const crypto = require('crypto');
const pool = require('../config/db_conn');

const generateId = () => crypto.randomBytes(12).toString('hex');

const normalizeCartItem = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.userId,
    productId: row.productId,
    quantity: Number(row.quantity || 0),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

const getCartItemsByUserId = async (userId) => {
  const [rows] = await pool.query(
    `SELECT id, userId, productId, quantity, createdAt, updatedAt
     FROM cart_items
     WHERE userId = ?
     ORDER BY createdAt DESC`,
    [userId]
  );
  return rows.map(normalizeCartItem);
};

const findCartItem = async (userId, productId) => {
  const [rows] = await pool.query(
    `SELECT id, userId, productId, quantity, createdAt, updatedAt
     FROM cart_items
     WHERE userId = ? AND productId = ?
     LIMIT 1`,
    [userId, productId]
  );
  return normalizeCartItem(rows[0]);
};

const upsertCartItem = async (userId, productId, quantity = 1) => {
  const existing = await findCartItem(userId, productId);
  if (existing) {
    const nextQuantity = existing.quantity + quantity;
    await pool.query(
      `UPDATE cart_items SET quantity = ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ? AND productId = ?`,
      [nextQuantity, userId, productId]
    );
    return { ...existing, quantity: nextQuantity };
  }

  const id = generateId();
  await pool.query(
    `INSERT INTO cart_items (id, userId, productId, quantity)
     VALUES (?, ?, ?, ?)`,
    [id, userId, productId, quantity]
  );

  return { id, userId, productId, quantity };
};

const setCartQuantity = async (userId, productId, quantity) => {
  const [result] = await pool.query(
    `UPDATE cart_items SET quantity = ?, updatedAt = CURRENT_TIMESTAMP
     WHERE userId = ? AND productId = ?`,
    [quantity, userId, productId]
  );
  return result.affectedRows > 0;
};

const removeCartItem = async (userId, productId) => {
  const [result] = await pool.query(
    `DELETE FROM cart_items WHERE userId = ? AND productId = ?`,
    [userId, productId]
  );
  return result.affectedRows > 0;
};

const decrementOrDeleteCartItem = async (userId, productId) => {
  const item = await findCartItem(userId, productId);
  if (!item) {
    return null;
  }

  if (item.quantity > 1) {
    const nextQuantity = item.quantity - 1;
    await setCartQuantity(userId, productId, nextQuantity);
    return { ...item, quantity: nextQuantity };
  }

  await removeCartItem(userId, productId);
  return { ...item, quantity: 0 };
};

const clearCart = async (userId) => {
  const [result] = await pool.query(`DELETE FROM cart_items WHERE userId = ?`, [userId]);
  return result.affectedRows;
};

module.exports = {
  getCartItemsByUserId,
  findCartItem,
  upsertCartItem,
  setCartQuantity,
  removeCartItem,
  decrementOrDeleteCartItem,
  clearCart,
};