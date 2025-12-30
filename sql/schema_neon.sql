-- PostgreSQL / Neon schema for salon inventory app
-- Run on your Neon database (via psql or dashboard SQL editor)

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  barcode TEXT,
  name TEXT,
  category TEXT,
  price NUMERIC(10,2),
  purchaseDate TEXT,
  statuses JSONB,
  notes TEXT,
  updatedAt TEXT
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products (barcode);
