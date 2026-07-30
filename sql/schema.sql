-- Schema for salon inventory app
-- Run this in phpMyAdmin or via mysql CLI against the target database (e.g. ahph3z_salon)

-- Users table (for login)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products table
CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(80) NOT NULL,
  `barcode` VARCHAR(255) DEFAULT NULL,
  `name` VARCHAR(255) DEFAULT NULL,
  `brand` VARCHAR(255) DEFAULT NULL,
  `mainCategory` VARCHAR(50) DEFAULT 'resale',
  `category` VARCHAR(100) DEFAULT NULL,
  `gamma` VARCHAR(255) DEFAULT NULL,
  `price` DECIMAL(10,2) DEFAULT NULL,
  `priceNet` DECIMAL(10,2) DEFAULT NULL,
  `priceGross` DECIMAL(10,2) DEFAULT NULL,
  `vatRate` INT DEFAULT 23,
  `salePrice` DECIMAL(10,2) DEFAULT NULL,
  `quantity` INT DEFAULT 1,
  `purchaseDate` VARCHAR(50) DEFAULT NULL,
  `statuses` TEXT DEFAULT NULL, -- JSON encoded array
  `statusChangedAt` TEXT DEFAULT NULL, -- JSON encoded dates for individual units
  `discounts` TEXT DEFAULT NULL, -- JSON encoded array
  `notes` TEXT DEFAULT NULL,
  `updatedAt` VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional index to quickly find by barcode
CREATE INDEX IF NOT EXISTS idx_products_barcode ON `products` (`barcode`(50));
