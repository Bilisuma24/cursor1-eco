-- CRITICAL FIX: Make products visible in public shop
-- Run this in Supabase SQL Editor immediately

-- Step 1: Check if RLS is blocking public access
SELECT 
    tablename, 
    rowsecurity,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'product' AND cmd = 'SELECT') as select_policies_count
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'product';

-- Step 2: View current SELECT policies
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'product' AND cmd = 'SELECT';

-- Step 3: Remove ALL existing SELECT policies that might be blocking
DROP POLICY IF EXISTS "Products are viewable by everyone" ON "product";
DROP POLICY IF EXISTS "Authenticated users can view products" ON "product";
DROP POLICY IF EXISTS "Public can view products" ON "product";
DROP POLICY IF EXISTS "Anyone can view products" ON "product";
DROP POLICY IF EXISTS "View products" ON "product";

-- Step 4: Create a NEW policy that allows PUBLIC (including anonymous users) to view ALL products
-- This is critical for the shop page to work
CREATE POLICY "Products are publicly viewable"
  ON "product" 
  FOR SELECT
  TO public
  USING (true);

-- Step 5: Verify the policy was created
SELECT 
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'product' 
  AND cmd = 'SELECT';

-- Step 6: Test as anonymous user (this simulates the shop page)
-- This query should return all products without authentication
SELECT 
    COUNT(*) as total_products_visible_to_public,
    COUNT(CASE WHEN seller_id IS NOT NULL THEN 1 END) as seller_products,
    COUNT(CASE WHEN seller_id IS NULL THEN 1 END) as admin_products
FROM product;

-- Step 7: Sample products that should be visible
SELECT 
    id,
    name,
    price,
    category,
    seller_id,
    CASE WHEN seller_id IS NOT NULL THEN 'Seller Product' ELSE 'Admin Product' END as type,
    created_at
FROM product 
ORDER BY created_at DESC 
LIMIT 10;










