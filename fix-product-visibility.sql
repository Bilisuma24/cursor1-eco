-- Fix Product Visibility for Shop Page
-- Run this in Supabase SQL Editor to ensure products are viewable by everyone

-- 1. Check current RLS policies
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
WHERE schemaname = 'public' AND tablename = 'product'
ORDER BY policyname;

-- 2. Drop existing SELECT policies that might be too restrictive
DROP POLICY IF EXISTS "Products are viewable by everyone" ON "product";
DROP POLICY IF EXISTS "Authenticated users can view products" ON "product";
DROP POLICY IF EXISTS "Public can view products" ON "product";

-- 3. Create a policy that allows EVERYONE (including anonymous users) to view products
CREATE POLICY "Products are viewable by everyone"
  ON "product" 
  FOR SELECT
  TO public
  USING (true);

-- 4. Also explicitly allow authenticated users (for redundancy)
CREATE POLICY "Authenticated users can view products"
  ON "product"
  FOR SELECT
  TO authenticated
  USING (true);

-- 5. Verify the policy was created
SELECT 
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'product' 
  AND cmd = 'SELECT';

-- 6. Test query - should return all products
SELECT 
    id, 
    name, 
    price, 
    category, 
    seller_id,
    created_at,
    CASE 
        WHEN seller_id IS NOT NULL THEN 'Seller Product'
        ELSE 'Admin Product'
    END as product_type
FROM product 
ORDER BY created_at DESC 
LIMIT 10;

-- 7. Count products by type
SELECT 
    CASE 
        WHEN seller_id IS NOT NULL THEN 'Seller Product'
        ELSE 'Admin/Other Product'
    END as product_type,
    COUNT(*) as count
FROM product 
GROUP BY 
    CASE 
        WHEN seller_id IS NOT NULL THEN 'Seller Product'
        ELSE 'Admin/Other Product'
    END;






