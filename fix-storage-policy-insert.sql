-- =====================================================
-- FIX: Storage INSERT Policy - More Flexible Condition
-- This fixes the "new row violates row-level security policy" for image uploads
-- =====================================================

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;

-- Create a more flexible INSERT policy
-- Allow authenticated users to upload to product-images bucket
-- The path should start with their user_id (format: user_id/filename.ext)
CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images' AND
    -- Path starts with user_id followed by a slash
    name LIKE auth.uid()::text || '/%'
  );

-- Verify the policy was created
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname = 'Authenticated users can upload product images';

