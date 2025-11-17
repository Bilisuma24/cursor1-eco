-- ⚠️ URGENT FIX: Make Seller Products Visible in Shop
-- Run this COMPLETE script in Supabase SQL Editor

-- =====================================================
-- STEP 1: Check current RLS status
-- =====================================================
SELECT 
    tablename, 
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'product';

-- =====================================================
-- STEP 2: View ALL current policies (to see what's blocking)
-- =====================================================
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'product';

-- =====================================================
-- STEP 3: TEMPORARILY DISABLE RLS (for testing only)
-- This allows us to verify products exist
-- =====================================================
-- ALTER TABLE product DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: Remove ALL existing SELECT policies
-- =====================================================
DO $$ 
BEGIN
    -- Drop all existing SELECT policies
    DROP POLICY IF EXISTS "Products are viewable by everyone" ON "product";
    DROP POLICY IF EXISTS "Authenticated users can view products" ON "product";
    DROP POLICY IF EXISTS "Public can view products" ON "product";
    DROP POLICY IF EXISTS "Anyone can view products" ON "product";
    DROP POLICY IF EXISTS "View products" ON "product";
    DROP POLICY IF EXISTS "Products are publicly viewable" ON "product";
    DROP POLICY IF EXISTS "Enable read access for all users" ON "product";
    DROP POLICY IF EXISTS "Public read access" ON "product";
END $$;

-- =====================================================
-- STEP 5: Create NEW policy - CRITICAL FOR SHOP PAGE
-- This allows EVERYONE (including anonymous users) to view products
-- =====================================================
CREATE POLICY "public_read_products"
  ON "product"
  FOR SELECT
  TO public
  USING (true);

-- =====================================================
-- STEP 6: Also create for authenticated users (redundancy)
-- =====================================================
CREATE POLICY "authenticated_read_products"
  ON "product"
  FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- STEP 7: Re-enable RLS (if you disabled it)
-- =====================================================
-- ALTER TABLE product ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 8: Verify policies were created
-- =====================================================
SELECT 
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'product' 
  AND cmd = 'SELECT';

-- =====================================================
-- STEP 9: Test query - should return ALL products
-- =====================================================
SELECT 
    COUNT(*) as total_products,
    COUNT(CASE WHEN seller_id IS NOT NULL THEN 1 END) as seller_products,
    COUNT(CASE WHEN seller_id IS NULL THEN 1 END) as admin_products
FROM product;

-- =====================================================
-- STEP 10: View actual products (including seller products)
-- =====================================================
SELECT 
    id,
    name,
    price,
    category,
    seller_id,
    created_at,
    CASE 
        WHEN seller_id IS NOT NULL THEN '✅ Seller Product'
        ELSE 'Admin Product'
    END as product_type
FROM product 
ORDER BY created_at DESC;

-- =====================================================
-- STEP 11: If still not working, try disabling RLS temporarily
-- (Only for testing - re-enable after fixing)
-- =====================================================
-- To disable: ALTER TABLE product DISABLE ROW LEVEL SECURITY;
-- To re-enable: ALTER TABLE product ENABLE ROW LEVEL SECURITY;





















