-- =====================================================
-- Fix Storage INSERT Policy Condition
-- The policy exists but the condition might be too strict
-- =====================================================

-- First, check the current policy condition
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname = 'Authenticated users can upload product images';

-- Drop and recreate with simpler condition
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;

-- Create a simple policy that just checks bucket_id
-- This allows any authenticated user to upload to product-images bucket
CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

-- Verify the new policy
SELECT 
    policyname,
    cmd,
    roles,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname = 'Authenticated users can upload product images';

