CREATE DATABASE IF NOT EXISTS product_db
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE product_db;

CREATE TABLE IF NOT EXISTS products (
  id CHAR(24) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price BIGINT NOT NULL DEFAULT 0,
  description TEXT NULL,
  category VARCHAR(100) NULL,
  image TEXT NULL,
  stock INT NOT NULL DEFAULT 0,
  specs JSON NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_name (name),
  INDEX idx_products_category (category),
  INDEX idx_products_price (price)
);