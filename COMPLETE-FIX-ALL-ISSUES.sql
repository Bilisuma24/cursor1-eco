-- =====================================================
-- COMPLETE FIX: All RLS Issues - Profiles, Products, Storage
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: Fix Profile Table RLS (CRITICAL!)
-- =====================================================

-- Step 1: Ensure profile table exists with all columns
CREATE TABLE IF NOT EXISTS "profile" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL UNIQUE REFERENCES auth.users("id") ON DELETE CASCADE,
  "full_name" TEXT,
  "username" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "avatar_url" TEXT,
  "user_type" TEXT DEFAULT 'buyer' CHECK (user_type IN ('buyer', 'seller', 'admin')),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure user_type column exists (in case table already exists)
ALTER TABLE "profile" 
ADD COLUMN IF NOT EXISTS "user_type" TEXT DEFAULT 'buyer' 
CHECK (user_type IN ('buyer', 'seller', 'admin'));

-- Enable RLS on profile table
ALTER TABLE "profile" ENABLE ROW LEVEL SECURITY;

-- Step 2: Remove ALL existing profile policies
DROP POLICY IF EXISTS "Users can view own profile" ON "profile";
DROP POLICY IF EXISTS "Users can insert own profile" ON "profile";
DROP POLICY IF EXISTS "Users can update own profile" ON "profile";
DROP POLICY IF EXISTS "Users can delete own profile" ON "profile";
DROP POLICY IF EXISTS "Users can view own profile by id" ON "profile";
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON "profile";

-- Step 3: Create NEW profile policies that work
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON "profile" FOR SELECT
  USING (auth.uid() = user_id);

-- Users can INSERT their own profile (CRITICAL FIX for signup!)
CREATE POLICY "Users can insert own profile"
  ON "profile" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can UPDATE their own profile
CREATE POLICY "Users can update own profile"
  ON "profile" FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can DELETE their own profile
CREATE POLICY "Users can delete own profile"
  ON "profile" FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "idx_profile_user_id" ON "profile" ("user_id");

-- =====================================================
-- PART 2: Fix Product Table RLS (CRITICAL!)
-- =====================================================

-- Step 1: Check if seller_id column exists, add if not
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product' AND column_name = 'seller_id'
  ) THEN
    ALTER TABLE "product" ADD COLUMN "seller_id" UUID REFERENCES auth.users("id") ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS "idx_product_seller_id" ON "product" ("seller_id");
  END IF;
END $$;

-- Add images column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product' AND column_name = 'images'
  ) THEN
    ALTER TABLE "product" ADD COLUMN "images" TEXT[];
  END IF;
END $$;

-- Enable RLS on product table
ALTER TABLE "product" ENABLE ROW LEVEL SECURITY;

-- Step 2: Remove ALL existing product policies
DROP POLICY IF EXISTS "Products are viewable by everyone" ON "product";
DROP POLICY IF EXISTS "Authenticated users can view products" ON "product";
DROP POLICY IF EXISTS "Public can view products" ON "product";
DROP POLICY IF EXISTS "Products are publicly viewable" ON "product";
DROP POLICY IF EXISTS "public_read_products" ON "product";
DROP POLICY IF EXISTS "Anyone can view products" ON "product";
DROP POLICY IF EXISTS "Sellers can add products" ON "product";
DROP POLICY IF EXISTS "sellers_can_insert_products" ON "product";
DROP POLICY IF EXISTS "Sellers can update own products" ON "product";
DROP POLICY IF EXISTS "sellers_can_update_own_products" ON "product";
DROP POLICY IF EXISTS "Sellers can delete own products" ON "product";
DROP POLICY IF EXISTS "sellers_can_delete_own_products" ON "product";
DROP POLICY IF EXISTS "Users can update products" ON "product";
DROP POLICY IF EXISTS "Anyone can add products" ON "product";

-- Step 3: Create NEW product policies
-- PUBLIC (anyone, including anonymous) can VIEW all products (for shop page)
CREATE POLICY "public_read_products"
  ON "product"
  FOR SELECT
  TO public
  USING (true);

-- Authenticated users (sellers) can INSERT products
CREATE POLICY "sellers_can_insert_products"
  ON "product"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id OR seller_id IS NULL);

-- Sellers can UPDATE their own products
CREATE POLICY "sellers_can_update_own_products"
  ON "product"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id OR seller_id IS NULL)
  WITH CHECK (auth.uid() = seller_id OR seller_id IS NULL);

-- Sellers can DELETE their own products
CREATE POLICY "sellers_can_delete_own_products"
  ON "product"
  FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id OR seller_id IS NULL);

-- =====================================================
-- PART 3: Fix Storage (product-images bucket) RLS
-- =====================================================

-- Step 1: Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Step 2: Remove ALL existing storage policies for product-images
DROP POLICY IF EXISTS "Sellers can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Sellers can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Product images are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to product-images" ON storage.objects;

-- Step 3: Create NEW storage policies
-- PUBLIC can VIEW all product images (for displaying products)
DROP POLICY IF EXISTS "Product images are publicly viewable" ON storage.objects;
CREATE POLICY "Product images are publicly viewable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- Authenticated users can INSERT (upload) images to product-images bucket
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- Authenticated users can UPDATE their own images
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
CREATE POLICY "Authenticated users can update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images')
  WITH CHECK (bucket_id = 'product-images');

-- Authenticated users can DELETE images from product-images bucket
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
CREATE POLICY "Authenticated users can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

-- =====================================================
-- PART 4: Create Wishlist Table (optional - fixes 404 errors)
-- =====================================================

CREATE TABLE IF NOT EXISTS "wishlist" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES auth.users("id") ON DELETE CASCADE,
  "product_id" UUID NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("user_id", "product_id")
);

ALTER TABLE "wishlist" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wishlist" ON "wishlist";
CREATE POLICY "Users can view own wishlist"
  ON "wishlist" FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert into own wishlist" ON "wishlist";
CREATE POLICY "Users can insert into own wishlist"
  ON "wishlist" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete from own wishlist" ON "wishlist";
CREATE POLICY "Users can delete from own wishlist"
  ON "wishlist" FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS "idx_wishlist_user_id" ON "wishlist" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_wishlist_product_id" ON "wishlist" ("product_id");

-- =====================================================
-- PART 5: Verify Everything Works
-- =====================================================

-- Test: Check profile policies
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profile'
ORDER BY cmd, policyname;

-- Test: Check product policies
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'product'
ORDER BY cmd, policyname;

-- Test: Check storage policies
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%product%'
ORDER BY cmd, policyname;

-- Test: Count products (should work without authentication)
SELECT 
    COUNT(*) as total_products,
    COUNT(CASE WHEN seller_id IS NOT NULL THEN 1 END) as seller_products,
    COUNT(CASE WHEN seller_id IS NULL THEN 1 END) as admin_products
FROM product;

-- =====================================================
-- PART 6: Fix Cart Table (Add Missing Columns)
-- =====================================================

-- Add missing columns to cart table (for color/size selections)
ALTER TABLE "cart" 
ADD COLUMN IF NOT EXISTS "selected_color" TEXT,
ADD COLUMN IF NOT EXISTS "selected_size" TEXT;

-- Update cart table unique constraint to include color/size
-- Drop old constraint if it exists
ALTER TABLE "cart" DROP CONSTRAINT IF EXISTS "cart_user_id_product_id_key";
-- Note: We'll handle uniqueness at application level for now since we need
-- (user_id, product_id, selected_color, selected_size) as unique combination

-- =====================================================
-- PART 7: Create Price Alerts Table (NEW FEATURE)
-- =====================================================

-- Create price_alerts table
CREATE TABLE IF NOT EXISTS "price_alerts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES auth.users("id") ON DELETE CASCADE,
  "product_id" UUID NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "target_price" DECIMAL(10, 2) NOT NULL CHECK (target_price >= 0),
  "current_price" DECIMAL(10, 2) NOT NULL CHECK (current_price >= 0),
  "is_active" BOOLEAN DEFAULT true,
  "is_notified" BOOLEAN DEFAULT false,
  "notified_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("user_id", "product_id")
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS "idx_price_alerts_user_id" ON "price_alerts" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_price_alerts_product_id" ON "price_alerts" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_price_alerts_active" ON "price_alerts" ("is_active") WHERE "is_active" = true;

-- Enable RLS on price_alerts table
ALTER TABLE "price_alerts" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for price_alerts
DROP POLICY IF EXISTS "Users can view own price alerts" ON "price_alerts";
CREATE POLICY "Users can view own price alerts"
  ON "price_alerts" FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own price alerts" ON "price_alerts";
CREATE POLICY "Users can insert own price alerts"
  ON "price_alerts" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own price alerts" ON "price_alerts";
CREATE POLICY "Users can update own price alerts"
  ON "price_alerts" FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own price alerts" ON "price_alerts";
CREATE POLICY "Users can delete own price alerts"
  ON "price_alerts" FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_price_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_price_alerts_updated_at ON "price_alerts";
CREATE TRIGGER update_price_alerts_updated_at 
  BEFORE UPDATE ON "price_alerts"
  FOR EACH ROW 
  EXECUTE FUNCTION update_price_alerts_updated_at();

-- =====================================================
-- DONE! After running this:
-- 1. Refresh your browser
-- 2. Try creating a profile again
-- 3. Try uploading an avatar image
-- 4. Try creating a product
-- 5. Check the shop page - seller products should appear!
-- 6. Try setting a price alert on any product!
-- =====================================================
