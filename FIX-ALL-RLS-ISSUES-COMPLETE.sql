-- =====================================================
-- COMPLETE FIX: All RLS Issues - Profile, Products, Storage
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: Fix Profile Table RLS (CRITICAL for Signup!)
-- =====================================================

-- Drop ALL existing profile policies
DROP POLICY IF EXISTS "Users can insert own profile" ON "profile";
DROP POLICY IF EXISTS "Users can update own profile" ON "profile";
DROP POLICY IF EXISTS "Users can view own profile" ON "profile";
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON "profile";
DROP POLICY IF EXISTS "Users can read own profile" ON "profile";
DROP POLICY IF EXISTS "Public can view profiles" ON "profile";

-- 1. Allow users to INSERT their own profile (CRITICAL for signup)
CREATE POLICY "Users can insert own profile"
  ON "profile"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2. Allow users to SELECT their own profile
CREATE POLICY "Users can view own profile"
  ON "profile"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Allow public to view profiles (for public seller profiles)
CREATE POLICY "Public can view profiles"
  ON "profile"
  FOR SELECT
  TO public
  USING (true);

-- 4. Allow users to UPDATE their own profile (user_type protected by trigger)
CREATE POLICY "Users can update own profile"
  ON "profile"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- PART 2: Fix Product Table RLS (Products Not Showing)
-- =====================================================

-- Drop existing product SELECT policies
DROP POLICY IF EXISTS "Public can view products" ON "product";
DROP POLICY IF EXISTS "public_read_products" ON "product";
DROP POLICY IF EXISTS "Products are viewable by everyone" ON "product";
DROP POLICY IF EXISTS "Authenticated users can view products" ON "product";
DROP POLICY IF EXISTS "Public can view all products" ON "product";
DROP POLICY IF EXISTS "Authenticated can view all products" ON "product";

-- Allow public to view ALL products
CREATE POLICY "Public can view all products"
  ON "product"
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to view ALL products
CREATE POLICY "Authenticated can view all products"
  ON "product"
  FOR SELECT
  TO authenticated
  USING (true);

-- Drop existing product INSERT policies
DROP POLICY IF EXISTS "Sellers can insert own products" ON "product";
DROP POLICY IF EXISTS "Authenticated users can insert products (temporary)" ON "product";
DROP POLICY IF EXISTS "Sellers can add products" ON "product";
DROP POLICY IF EXISTS "Authenticated users can insert products" ON "product";

-- Allow authenticated users to insert products (seller_id auto-set by trigger)
CREATE POLICY "Authenticated users can insert products"
  ON "product"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure trigger exists to auto-set seller_id
CREATE OR REPLACE FUNCTION set_seller_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.seller_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.seller_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_seller_id ON product;
CREATE TRIGGER trigger_set_seller_id
  BEFORE INSERT ON product
  FOR EACH ROW
  EXECUTE FUNCTION set_seller_id_on_insert();

-- =====================================================
-- PART 3: Fix Storage Bucket RLS (Image Uploads)
-- =====================================================

-- 1. Ensure the product-images bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true, -- Make bucket public so images can be viewed
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Drop existing storage policies
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can view product images" ON storage.objects;

-- 3. Allow authenticated users to upload to product-images bucket
-- Users can upload to their own folder (user_id folder)
CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Allow authenticated users to update their own images
CREATE POLICY "Users can update own product images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5. Allow authenticated users to delete their own images
CREATE POLICY "Users can delete own product images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 6. Allow public to view product images (since bucket is public)
CREATE POLICY "Public can view product images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- 7. Allow authenticated users to view product images
CREATE POLICY "Authenticated can view product images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'product-images');

-- =====================================================
-- PART 4: Protect User Type (Prevent Seller -> Buyer)
-- =====================================================

-- Protect seller profiles from being changed to buyer
CREATE OR REPLACE FUNCTION protect_seller_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.user_type = 'seller' AND NEW.user_type = 'buyer' THEN
    NEW.user_type := 'seller';
  END IF;
  IF OLD.user_type IS NOT NULL AND OLD.user_type != 'buyer' AND NEW.user_type = 'buyer' THEN
    NEW.user_type := OLD.user_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS protect_seller_profile_trigger ON profile;
CREATE TRIGGER protect_seller_profile_trigger
  BEFORE UPDATE ON profile
  FOR EACH ROW
  WHEN (OLD.user_type IS DISTINCT FROM NEW.user_type)
  EXECUTE FUNCTION protect_seller_profile();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check profile policies
SELECT policyname, cmd, roles FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profile'
ORDER BY cmd, policyname;

-- Check product policies
SELECT policyname, cmd, roles FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'product'
ORDER BY cmd, policyname;

-- Check storage policies
SELECT policyname, cmd, roles FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY cmd, policyname;

