-- =====================================================
-- COMPLETE FIX: Products Not Showing + User Type Issues
-- Run this ENTIRE script in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: Fix Product Visibility (Products Not Showing)
-- =====================================================

-- 1. Ensure public can view ALL products (including seller products)
DROP POLICY IF EXISTS "Public can view products" ON "product";
DROP POLICY IF EXISTS "public_read_products" ON "product";
DROP POLICY IF EXISTS "Products are viewable by everyone" ON "product";
DROP POLICY IF EXISTS "Authenticated users can view products" ON "product";

CREATE POLICY "Public can view all products"
  ON "product"
  FOR SELECT
  TO public
  USING (true);

-- Also allow authenticated users
CREATE POLICY "Authenticated can view all products"
  ON "product"
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Fix seller product creation (ensure seller_id is saved)
-- This trigger was already created, but let's make sure it exists
CREATE OR REPLACE FUNCTION set_seller_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- If seller_id is NULL or not set, use the authenticated user's ID
  IF NEW.seller_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.seller_id := auth.uid();
    RAISE NOTICE 'Automatically set seller_id to: %', NEW.seller_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_seller_id ON product;
CREATE TRIGGER trigger_set_seller_id
  BEFORE INSERT ON product
  FOR EACH ROW
  EXECUTE FUNCTION set_seller_id_on_insert();

-- 3. Ensure sellers can insert products
DROP POLICY IF EXISTS "Sellers can insert own products" ON "product";
DROP POLICY IF EXISTS "Authenticated users can insert products (temporary)" ON "product";
DROP POLICY IF EXISTS "Sellers can add products" ON "product";

-- Allow authenticated users to insert (seller_id will be auto-set by trigger)
CREATE POLICY "Authenticated users can insert products"
  ON "product"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- PART 2: Fix User Type (Prevent Changing Seller to Buyer)
-- =====================================================

-- 1. Protect seller profiles from being changed to buyer
CREATE OR REPLACE FUNCTION protect_seller_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- If profile already exists and is a seller, prevent changing to buyer
  IF OLD.user_type = 'seller' AND NEW.user_type = 'buyer' THEN
    RAISE WARNING 'Cannot change seller profile to buyer. Keeping seller type.';
    NEW.user_type := 'seller';
  END IF;
  
  -- If profile already exists and has a user_type, don't allow changing it to buyer
  IF OLD.user_type IS NOT NULL AND OLD.user_type != 'buyer' AND NEW.user_type = 'buyer' THEN
    RAISE WARNING 'Cannot change existing user_type from % to buyer. Keeping original type.', OLD.user_type;
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

-- 2. Ensure profile RLS allows inserts and updates
DROP POLICY IF EXISTS "Users can insert own profile" ON "profile";
CREATE POLICY "Users can insert own profile"
  ON "profile" FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own profile" ON "profile";
CREATE POLICY "Users can update own profile"
  ON "profile" FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- PART 3: Verification Queries
-- =====================================================

-- Check products (should show all, including seller products)
SELECT 
    COUNT(*) as total_products,
    COUNT(CASE WHEN seller_id IS NOT NULL THEN 1 END) as seller_products,
    COUNT(CASE WHEN seller_id IS NULL THEN 1 END) as admin_products
FROM product;

-- Check profiles and their user_type
SELECT 
    user_id,
    username,
    full_name,
    user_type,
    created_at
FROM profile
ORDER BY created_at DESC
LIMIT 20;

-- Check RLS policies on product table
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'product'
  AND cmd = 'SELECT';

