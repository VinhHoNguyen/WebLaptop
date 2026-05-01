CREATE TABLE IF NOT EXISTS cart_items (
  id CHAR(24) NOT NULL PRIMARY KEY,
  userId CHAR(24) NOT NULL,
  productId CHAR(24) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cart_user_product (userId, productId),
  INDEX idx_cart_user (userId),
  INDEX idx_cart_product (productId)
);

CREATE TABLE IF NOT EXISTS orders (
  id CHAR(24) NOT NULL PRIMARY KEY,
  id_user CHAR(24) NULL,
  id_payment VARCHAR(100) NULL,
  address TEXT NULL,
  total BIGINT NOT NULL DEFAULT 0,
  status VARCHAR(50) NULL,
  pay TINYINT(1) NOT NULL DEFAULT 0,
  feeship BIGINT NOT NULL DEFAULT 0,
  id_coupon VARCHAR(100) NULL,
  create_time VARCHAR(100) NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_user (id_user),
  INDEX idx_orders_payment (id_payment)
);

CREATE TABLE IF NOT EXISTS order_details (
  id CHAR(24) NOT NULL PRIMARY KEY,
  id_order CHAR(24) NULL,
  id_product CHAR(24) NULL,
  name_product VARCHAR(255) NULL,
  price_product VARCHAR(50) NULL,
  count INT NOT NULL DEFAULT 0,
  size VARCHAR(50) NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_order_details_order (id_order),
  INDEX idx_order_details_product (id_product)
);