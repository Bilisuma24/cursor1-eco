-- =====================================================
-- Fix seller_id Being NULL - Automatic Assignment
-- This creates a trigger to automatically set seller_id from auth.uid()
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create a function that automatically sets seller_id if it's NULL
CREATE OR REPLACE FUNCTION set_seller_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- If seller_id is NULL or not set, use the authenticated user's ID
  IF NEW.seller_id IS NULL THEN
    NEW.seller_id := auth.uid();
    RAISE NOTICE 'Automatically set seller_id to: %', NEW.seller_id;
  END IF;
  
  -- Also ensure seller_id matches the authenticated user (security check)
  IF NEW.seller_id IS NOT NULL AND auth.uid() IS NOT NULL AND NEW.seller_id != auth.uid() THEN
    RAISE WARNING 'seller_id (%) does not match authenticated user (%). Setting to authenticated user.', NEW.seller_id, auth.uid();
    NEW.seller_id := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_set_seller_id ON product;

-- 3. Create trigger that runs BEFORE INSERT
CREATE TRIGGER trigger_set_seller_id
  BEFORE INSERT ON product
  FOR EACH ROW
  EXECUTE FUNCTION set_seller_id_on_insert();

-- 4. Verify the trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'product'
  AND trigger_name = 'trigger_set_seller_id';

-- 5. Test the trigger (this will show a notice if seller_id is auto-set)
-- Replace 'YOUR_USER_ID' with an actual user ID from auth.users
/*
INSERT INTO product (name, description, price, stock, category)
VALUES ('Trigger Test Product', 'Testing auto seller_id', 99.99, 1, 'Test')
RETURNING id, name, seller_id;
*/

-- 6. Also ensure RLS policies allow inserts (run fix-seller-product-creation.sql first)
-- The temporary permissive policy should allow this to work

