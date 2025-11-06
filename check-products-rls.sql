-- Check if products are viewable by everyone
-- Run this in Supabase SQL Editor to diagnose RLS issues

-- 1. Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'product';

-- 2. Check existing RLS policies on product table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'product';

-- 3. Check if there are any products in the table
SELECT COUNT(*) as total_products FROM product;

-- 4. Sample products (if accessible)
SELECT id, name, price, category, seller_id, created_at 
FROM product 
LIMIT 5;

-- 5. If RLS policy is missing, create one to allow public viewing
-- This ensures products are viewable by everyone (including anonymous users)
DROP POLICY IF EXISTS "Products are viewable by everyone" ON "product";
CREATE POLICY "Products are viewable by everyone"
  ON "product" 
  FOR SELECT
  TO public
  USING (true);

-- 6. Also ensure authenticated users can view
CREATE POLICY IF NOT EXISTS "Authenticated users can view products"
  ON "product"
  FOR SELECT
  TO authenticated
  USING (true);

