-- =====================================================
-- Fix Missing Images Column in Product Table
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add images column if it doesn't exist
ALTER TABLE "product" 
ADD COLUMN IF NOT EXISTS "images" TEXT[];

-- Also ensure image_url is a valid type (should already exist)
DO $$ 
BEGIN
  -- Check if image_url exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product' AND column_name = 'image_url'
  ) THEN
    -- Make sure it's TEXT type
    ALTER TABLE "product" 
    ALTER COLUMN "image_url" TYPE TEXT;
  END IF;
END $$;

-- Verify the schema
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'product' 
  AND column_name IN ('images', 'image_url', 'seller_id')
ORDER BY column_name;

-- =====================================================
-- DONE!
-- =====================================================

























