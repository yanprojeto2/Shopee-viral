-- =========================================
-- Shopee Viral Studio — Initial Schema
-- =========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- Table: products
-- =========================================
CREATE TABLE IF NOT EXISTS public.products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Index for top 10 queries
CREATE INDEX idx_products_is_top10 ON public.products (is_top10, rank);
CREATE INDEX idx_products_active ON public.products (is_active, created_at DESC);

-- =========================================
-- Table: media
-- =========================================
CREATE TABLE IF NOT EXISTS public.media (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('photo', 'video')),
  url             TEXT NOT NULL,
  thumbnail_url   TEXT,
  original_source TEXT,
  file_size       TEXT,
  duration        TEXT,
  downloads       INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_product_id ON public.media (product_id);
CREATE INDEX idx_media_type ON public.media (type);

-- =========================================
-- Table: downloads (log)
-- =========================================
CREATE TABLE IF NOT EXISTS public.downloads (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id      UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  user_agent    TEXT,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_downloads_media_id ON public.downloads (media_id);
CREATE INDEX idx_downloads_date ON public.downloads (downloaded_at);

-- =========================================
-- Row Level Security
-- =========================================

-- Products: anyone can read active products; only authenticated can write
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active products"
  ON public.products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage products"
  ON public.products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Media: anyone can read; only authenticated can write
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read media"
  ON public.media FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage media"
  ON public.media FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Downloads log: service_role only (via admin client)
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages downloads"
  ON public.downloads FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anonymous increment of downloads counter via service role
-- (handled in API route with admin client)

-- =========================================
-- Storage Buckets
-- =========================================

-- Create public bucket for product photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-photos',
  'product-photos',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create public bucket for product videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-videos',
  'product-videos',
  true,
  524288000, -- 500MB
  ARRAY['video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for photos bucket
CREATE POLICY "Public read product photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-photos');

CREATE POLICY "Authenticated upload product photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-photos');

CREATE POLICY "Authenticated delete product photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-photos');

-- Storage policies for videos bucket
CREATE POLICY "Public read product videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-videos');

CREATE POLICY "Authenticated upload product videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-videos');

CREATE POLICY "Authenticated delete product videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-videos');
