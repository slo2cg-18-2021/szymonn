-- PostgreSQL / Neon schema for salon inventory app
-- Run on your Neon database (via psql or dashboard SQL editor)

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Brands table - lista marek produktów
CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Gammas table - lista linii produktowych (gamma/gamme)
CREATE TABLE IF NOT EXISTS gammas (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  barcode TEXT,
  name TEXT,
  brand TEXT,
  mainCategory TEXT DEFAULT 'resale',
  category TEXT,
  gamma TEXT,
  price NUMERIC(10,2),
  salePrice NUMERIC(10,2),
  quantity INTEGER DEFAULT 1,
  purchaseDate TEXT,
  statuses JSONB,
  discounts JSONB,
  notes TEXT,
  updatedAt TEXT
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products (barcode);

-- Migration: dodaj kolumny brand i gamma jeśli nie istnieją
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='brand') THEN
    ALTER TABLE products ADD COLUMN brand TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='gamma') THEN
    ALTER TABLE products ADD COLUMN gamma TEXT;
  END IF;
END $$;
