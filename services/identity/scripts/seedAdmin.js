const pool = require('../config/db_conn');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

(async () => {
  try {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@local';
    const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
    const firstName = process.env.SEED_ADMIN_FIRSTNAME || 'Quản trị';
    const lastName = process.env.SEED_ADMIN_LASTNAME || 'Hệ thống';
    const age = Number(process.env.SEED_ADMIN_AGE || 30);
    const phone = process.env.SEED_ADMIN_PHONE || '0123456789';
    const role = process.env.SEED_ADMIN_ROLE || 'Admin';

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existing.length) {
      console.log('Admin already exists:', existing[0].id);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(password, 10);
    const id = crypto.randomBytes(12).toString('hex');

    await pool.query(
      'INSERT INTO users (id, email, password, firstName, lastName, age, phone, gender, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, email, hashed, firstName, lastName, age, phone, null, role, 'Active']
    );

    console.log('Admin created:', email);
    process.exit(0);
  } catch (err) {
    console.error('Seed admin failed:', err);
    process.exit(1);
  }
})();
