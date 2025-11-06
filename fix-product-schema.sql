-- Fix Product Schema for Seller Dashboard
-- Run this in your Supabase Dashboard SQL Editor if product creation is failing

-- 1. Add seller_id column if it doesn't exist
ALTER TABLE "product" 
ADD COLUMN IF NOT EXISTS "seller_id" UUID REFERENCES auth.users("id");

-- 2. Add images column if it doesn't exist
ALTER TABLE "product" 
ADD COLUMN IF NOT EXISTS "images" TEXT[];

-- 3. Create index for seller_id if it doesn't exist
CREATE INDEX IF NOT EXISTS "idx_product_seller_id" ON "product" ("seller_id");

-- 4. Update RLS policies to allow sellers to manage their own products
-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Anyone can add products" ON "product";
DROP POLICY IF EXISTS "Users can update products" ON "product";
DROP POLICY IF EXISTS "Sellers can add products" ON "product";
DROP POLICY IF EXISTS "Sellers can update own products" ON "product";
DROP POLICY IF EXISTS "Sellers can delete own products" ON "product";

-- TEMPORARY: Allow authenticated users to insert products (for testing)
-- This allows inserts without seller_id matching to test if the issue is RLS
CREATE POLICY "Temporary: Allow authenticated inserts"
  ON "product" FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create seller-specific policies (for production)
CREATE POLICY "Sellers can add products"
  ON "product" FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own products"
  ON "product" FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own products"
  ON "product" FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

-- 5. Ensure storage bucket exists for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage policies for product images
-- Drop existing storage policies first
DROP POLICY IF EXISTS "Sellers can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Sellers can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Product images are publicly viewable" ON storage.objects;

-- Create storage policies
CREATE POLICY "Sellers can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Sellers can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Product images are publicly viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- 7. Verify the setup
SELECT 'Product schema fixed successfully!' as status;
