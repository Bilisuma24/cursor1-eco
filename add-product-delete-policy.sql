-- Add DELETE policy for products table
-- Run this in Supabase SQL Editor to allow product deletion

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Users can delete products" ON "product";

-- Create DELETE policy - allows authenticated users to delete products
-- For admin-only deletion, you can change this to check user role
CREATE POLICY "Users can delete products"
  ON "product" FOR DELETE
  USING (true);

-- Alternative: If you want only admins to delete, use this instead:
-- (You'll need to have a user_type or role column in your profile table)
-- CREATE POLICY "Admins can delete products"
--   ON "product" FOR DELETE
--   USING (
--     EXISTS (
--       SELECT 1 FROM profile
--       WHERE profile.user_id = auth.uid()
--       AND profile.user_type = 'admin'
--     )
--   );



