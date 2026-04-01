-- =========================================
-- Shopee Viral Studio — Neon PostgreSQL Schema
-- =========================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  category      TEXT NOT NULL,
  price         TEXT,
  shopee_link   TEXT,
  affiliate_link TEXT,
  rank          INT,
  is_top10      BOOLEAN NOT NULL DEFAULT false,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('photo', 'video')),
  url             TEXT NOT NULL,
  thumbnail_url   TEXT,
  original_source TEXT,
  file_size       TEXT,
  duration        TEXT,
  downloads       INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS downloads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id      UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  user_agent    TEXT,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_top10 ON products (is_top10, rank);
CREATE INDEX IF NOT EXISTS idx_products_active ON products (is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_product ON media (product_id);
CREATE INDEX IF NOT EXISTS idx_downloads_date ON downloads (downloaded_at);
