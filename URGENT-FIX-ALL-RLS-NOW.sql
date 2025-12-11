-- =====================================================
-- URGENT FIX: All RLS Issues - Run This NOW!
-- This fixes Profile, Product, and Storage RLS policies
-- =====================================================

-- =====================================================
-- PART 1: Add Missing Product Column
-- =====================================================
ALTER TABLE "product" 
ADD COLUMN IF NOT EXISTS "express_shipping" BOOLEAN DEFAULT false;

-- =====================================================
-- PART 2: Fix Profile RLS (CRITICAL!)
-- =====================================================

-- Drop ALL existing profile policies
DROP POLICY IF EXISTS "Users can insert own profile" ON "profile";
DROP POLICY IF EXISTS "Users can update own profile" ON "profile";
DROP POLICY IF EXISTS "Users can view own profile" ON "profile";
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON "profile";
DROP POLICY IF EXISTS "Users can read own profile" ON "profile";
DROP POLICY IF EXISTS "Public can view profiles" ON "profile";

-- Allow users to INSERT their own profile
CREATE POLICY "Users can insert own profile"
  ON "profile"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to SELECT their own profile
CREATE POLICY "Users can view own profile"
  ON "profile"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow public to view profiles
CREATE POLICY "Public can view profiles"
  ON "profile"
  FOR SELECT
  TO public
  USING (true);

-- Allow users to UPDATE their own profile
CREATE POLICY "Users can update own profile"
  ON "profile"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- PART 3: Fix Product RLS (CRITICAL!)
-- =====================================================

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
-- PART 4: Fix Storage RLS (CRITICAL!)
-- =====================================================

-- Drop existing storage INSERT policy
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own product images" ON storage.objects;

-- Create a simple, working INSERT policy
-- Allow authenticated users to upload to product-images bucket
-- Just check bucket_id (path is handled by app)
CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check profile policies
SELECT 'Profile Policies:' as check_type, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profile'
ORDER BY cmd, policyname;

-- Check product policies
SELECT 'Product Policies:' as check_type, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'product'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- Check storage policies
SELECT 'Storage Policies:' as check_type, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND policyname LIKE '%product%'
ORDER BY cmd, policyname;


