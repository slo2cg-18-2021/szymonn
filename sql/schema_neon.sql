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
  priceNet NUMERIC(10,2),
  priceGross NUMERIC(10,2),
  vatRate INTEGER DEFAULT 23,
  salePrice NUMERIC(10,2),
  quantity INTEGER DEFAULT 1,
  purchaseDate TEXT,
  statuses JSONB,
  statusChangedAt JSONB,
  discounts JSONB,
  notes TEXT,
  updatedAt TEXT
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products (barcode);

-- Migrations for existing installations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='brand') THEN
    ALTER TABLE products ADD COLUMN brand TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='gamma') THEN
    ALTER TABLE products ADD COLUMN gamma TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='statuschangedat') THEN
    ALTER TABLE products ADD COLUMN statusChangedAt JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='pricenet') THEN
    ALTER TABLE products ADD COLUMN priceNet NUMERIC(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='pricegross') THEN
    ALTER TABLE products ADD COLUMN priceGross NUMERIC(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='vatrate') THEN
    ALTER TABLE products ADD COLUMN vatRate INTEGER DEFAULT 23;
  END IF;

  UPDATE products
  SET
    vatRate = COALESCE(vatRate, 23),
    priceGross = COALESCE(
      priceGross,
      price,
      (salePrice / 1.8) * (1 + COALESCE(vatRate, 23) / 100.0)
    ),
    priceNet = COALESCE(
      priceNet,
      COALESCE(
        priceGross,
        price,
        (salePrice / 1.8) * (1 + COALESCE(vatRate, 23) / 100.0)
      ) / (1 + COALESCE(vatRate, 23) / 100.0)
    );
END $$;

-- Budget planner tables
CREATE TABLE IF NOT EXISTS budget_months (
  month_key TEXT PRIMARY KEY,         -- e.g. "2026-07"
  incomes   JSONB NOT NULL DEFAULT '[]',
  costs     JSONB NOT NULL DEFAULT '[]',
  note      TEXT  NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budget_limits (
  id        INT  PRIMARY KEY DEFAULT 1,
  limits    JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
