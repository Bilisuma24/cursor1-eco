-- =====================================================
-- Diagnostic Queries to Check Why seller_id is NULL
-- Run these in Supabase SQL Editor to diagnose the issue
-- =====================================================

-- 1. Check if there's a default value or trigger setting seller_id to NULL
SELECT 
    column_name,
    column_default,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'product' 
  AND column_name = 'seller_id';

-- 2. Check for any triggers on the product table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'product';

-- 3. Check current RLS policies on product table
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'product'
ORDER BY cmd, policyname;

-- 4. Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'product';

-- 5. Test insert with explicit seller_id (replace 'YOUR_USER_ID' with actual user ID)
-- This will help determine if the issue is with RLS or the application code
-- First, get your user ID:
SELECT id, email FROM auth.users LIMIT 5;

-- Then test insert (replace the UUID with one from above):
/*
INSERT INTO product (name, description, price, stock, category, seller_id)
VALUES ('Test Product', 'Test Description', 10.00, 1, 'Test', 'YOUR_USER_ID_HERE')
RETURNING id, name, seller_id;
*/

-- 6. Check recent products and their seller_id values
SELECT 
    id,
    name,
    price,
    seller_id,
    created_at,
    CASE 
        WHEN seller_id IS NULL THEN '❌ NULL seller_id'
        ELSE '✅ Has seller_id'
    END as status
FROM product 
ORDER BY created_at DESC 
LIMIT 10;

