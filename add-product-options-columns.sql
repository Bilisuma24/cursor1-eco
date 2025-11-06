-- =====================================================
-- Add Product Options Columns (Colors, Sizes, Gender)
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

-- Add shipping_cost column if it doesn't exist (in case it's missing)
ALTER TABLE "product" 
ADD COLUMN IF NOT EXISTS "shipping_cost" DECIMAL(10, 2);

-- Add free_shipping column if it doesn't exist
ALTER TABLE "product" 
ADD COLUMN IF NOT EXISTS "free_shipping" BOOLEAN DEFAULT false;

-- Add express_shipping column if it doesn't exist
ALTER TABLE "product" 
ADD COLUMN IF NOT EXISTS "express_shipping" BOOLEAN DEFAULT false;

-- Verify the columns were added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'product' 
  AND column_name IN ('colors', 'sizes', 'gender', 'shipping_cost', 'free_shipping', 'express_shipping')
ORDER BY column_name;

-- =====================================================
-- DONE!
-- =====================================================
-- After running this, products can include:
-- - colors: Array of color names (e.g., ['Red', 'Blue', 'Green'])
-- - sizes: Array of sizes (e.g., ['S', 'M', 'L', 'XL'])
-- - gender: Single value (e.g., 'Male', 'Female', 'Unisex', 'Kids')
-- =====================================================

