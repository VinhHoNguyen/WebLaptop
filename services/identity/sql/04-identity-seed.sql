-- Seed admin user (created by dev script)
-- Uses bcrypt hash for password 'Admin@123'

CREATE DATABASE IF NOT EXISTS identity_db
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE identity_db;

INSERT IGNORE INTO users (id, email, password, firstName, lastName, age, phone, gender, role, status, createdAt, updatedAt)
VALUES (
  'a1b2c3d4e5f60123456789ab',
  'admin@local',
  '$2b$10$7sfIEjLFQDs8BsfeJVL0V.XljY7FltIrkhBPxgWD1aVyqt6kXZA52',
  'Quản trị',
  'Hệ thống',
  30,
  '0123456789',
  NULL,
  'Admin',
  'Active',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
