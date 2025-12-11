-- =====================================================
-- Fix Seller Product Creation - RLS Policies
-- Run this in Supabase SQL Editor if products aren't being saved
-- =====================================================

-- 1. Check current RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'product';

-- 2. Check existing INSERT policies
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'product'
  AND cmd = 'INSERT';

-- 3. Drop any conflicting INSERT policies
DROP POLICY IF EXISTS "Anyone can add products" ON "product";
DROP POLICY IF EXISTS "Users can insert products" ON "product";
DROP POLICY IF EXISTS "Sellers can add products" ON "product";
DROP POLICY IF EXISTS "Temporary: Allow authenticated inserts" ON "product";
DROP POLICY IF EXISTS "sellers_can_insert_products" ON "product";

-- 4. Create policy to allow sellers to insert their own products
-- IMPORTANT: This policy allows authenticated users to insert products where seller_id matches their user ID
-- The WITH CHECK ensures seller_id can be set during insert
DROP POLICY IF EXISTS "Sellers can insert own products" ON "product";
CREATE POLICY "Sellers can insert own products"
  ON "product" 
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

-- 5. Also create a more permissive policy for testing (if needed)
-- WARNING: This allows any authenticated user to insert products
-- Remove this after confirming the above policy works
DROP POLICY IF EXISTS "Authenticated users can insert products (temporary)" ON "product";
CREATE POLICY "Authenticated users can insert products (temporary)"
  ON "product"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 6. Verify SELECT policies allow sellers to see their products
DROP POLICY IF EXISTS "Sellers can view own products" ON "product";
CREATE POLICY "Sellers can view own products"
  ON "product"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

-- 7. Ensure public can view all products (for shop page)
DROP POLICY IF EXISTS "Public can view products" ON "product";
CREATE POLICY "Public can view products"
  ON "product"
  FOR SELECT
  TO public
  USING (true);

-- 8. Verify the policies were created
SELECT 
    policyname,
    cmd,
    roles,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'product'
ORDER BY cmd, policyname;

-- 9. Test query - should show all products
SELECT 
    COUNT(*) as total_products,
    COUNT(CASE WHEN seller_id IS NOT NULL THEN 1 END) as seller_products
FROM product;

-- 10. View recent products with seller info
SELECT 
    id,
    name,
    price,
    seller_id,
    created_at,
    CASE 
        WHEN seller_id IS NOT NULL THEN '✅ Seller Product'
        ELSE 'Admin Product'
    END as product_type
FROM product 
ORDER BY created_at DESC 
LIMIT 10;

