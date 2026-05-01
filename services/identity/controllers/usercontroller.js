const bcrypt = require("bcrypt");
const crypto = require('crypto');
const jwt = require("jsonwebtoken");
const pool = require("../config/db_conn");
require("dotenv").config();

const updateFields = ["firstName", "lastName", "email", "age", "phone", "gender", "role", "status"];

const pickAllowedFields = (payload) => {
  return updateFields.reduce((acc, field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      acc[field] = payload[field];
    }
    return acc;
  }, {});
};

const normalizeUser = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    _id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    age: row.age,
    phone: row.phone,
    gender: row.gender,
    role: row.role || "User",
    status: row.status || "Active",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

const getUsers = async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, email, firstName, lastName, age, phone, gender, role, status, createdAt, updatedAt
       FROM users
       ORDER BY createdAt DESC`
    );

    res.status(200).json(rows.map(normalizeUser));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
};

const getUser = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, email, firstName, lastName, age, phone, gender, role, status, createdAt, updatedAt
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(normalizeUser(rows[0]));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user profile", error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, email, firstName, lastName, age, phone, gender, role, status, createdAt, updatedAt
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(normalizeUser(rows[0]));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch user", error: error.message });
  }
};

const updateUserById = async (req, res) => {
  try {
    const payload = pickAllowedFields(req.body || {});
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: "No updatable fields were provided" });
    }

    const setClause = Object.keys(payload).map((field) => `${field} = ?`).join(', ');
    const values = [...Object.values(payload), req.params.id];
    const [result] = await pool.query(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const [rows] = await pool.query(
      `SELECT id, email, firstName, lastName, age, phone, gender, role, status, createdAt, updatedAt
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.params.id]
    );

    return res.status(200).json(normalizeUser(rows[0]));
  } catch (error) {
    return res.status(500).json({ message: "Failed to update user", error: error.message });
  }
};

const deleteUserById = async (req, res) => {
  try {
    const [result] = await pool.query(`DELETE FROM users WHERE id = ?`, [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User deleted", id: req.params.id });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete user", error: error.message });
  }
};

const userRegister = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const [existingRows] = await pool.query(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
    if (existingRows.length > 0) {
      return res.status(400).json({ message: "user already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = crypto.randomBytes(12).toString('hex');

    await pool.query(
      `INSERT INTO users (id, email, password, firstName, lastName, age, phone, gender, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        email,
        hashedPassword,
        req.body.firstName || null,
        req.body.lastName || null,
        req.body.age || null,
        req.body.phone || null,
        req.body.gender || null,
        req.body.role || 'User',
        req.body.status || 'Active',
      ]
    );

    return res.status(201).json({
      id,
      role: req.body.role || 'User',
      status: req.body.status || 'Active',
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to register user", error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query(
      `SELECT id, email, password, firstName, lastName, age, phone, gender, role, status
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    const user = rows[0];
    if (user && (await bcrypt.compare(password, user.password))) {
      const accessToken = jwt.sign(
        {
          user: {
            email: user.email,
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            age: user.age,
            phone: user.phone,
            gender: user.gender,
            role: user.role || "User",
            status: user.status || "Active",
          },
        },
        process.env.ACCESS_TOKEN,
        { expiresIn: "8h" }
      );
      res.status(200).json(accessToken);
    } else {
      res.status(401).json({ message: "Wrong email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

module.exports = {
  getUsers,
  getUser,
  getUserById,
  updateUserById,
  deleteUserById,
  userRegister,
  loginUser,
};