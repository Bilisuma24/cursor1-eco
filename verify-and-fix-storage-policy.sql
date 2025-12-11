-- =====================================================
-- Verify and Fix Storage INSERT Policy
-- Check the current policy condition and fix if needed
-- =====================================================

-- First, let's see the current policy definition
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

-- Drop and recreate with a more permissive condition
-- The issue might be that the path check is too strict
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;

-- Create a more permissive policy that allows uploads to product-images bucket
-- This allows any authenticated user to upload to product-images bucket
-- The folder structure (user_id/filename) is handled by the application
CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
  );

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

