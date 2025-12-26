-- =====================================================
-- Add Missing Product Columns (colors, sizes, gender)
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add colors column (TEXT array for multiple colors)
ALTER TABLE "product" 
ADD COLUMN IF NOT EXISTS "colors" TEXT[];

-- Add sizes column (TEXT array for multiple sizes)
ALTER TABLE "product" 
ADD COLUMN IF NOT EXISTS "sizes" TEXT[];

-- Add gender column (TEXT for gender selection)
ALTER TABLE "product" 
ADD COLUMN IF NOT EXISTS "gender" TEXT;

-- Add subcategory column if it doesn't exist
ALTER TABLE "product" 
ADD COLUMN IF NOT EXISTS "subcategory" TEXT;

-- Verify the columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'product' 
  AND column_name IN ('colors', 'sizes', 'gender', 'subcategory', 'express_shipping', 'free_shipping', 'shipping_cost')
ORDER BY column_name;

-- =====================================================
-- DONE!
-- =====================================================
-- After running this, products can include:
-- - colors: Array of color names (e.g., ['Red', 'Blue', 'Green'])
-- - sizes: Array of sizes (e.g., ['S', 'M', 'L', 'XL'])
-- - gender: Single value (e.g., 'Male', 'Female', 'Unisex', 'Kids')
-- =====================================================

