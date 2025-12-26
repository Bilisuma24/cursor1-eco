-- Add seller_id and images columns to product table
-- Run this in Supabase SQL Editor if the columns don't exist

-- Add seller_id column if it doesn't exist
ALTER TABLE "product" 
ADD COLUMN IF NOT EXISTS "seller_id" UUID REFERENCES auth.users("id") ON DELETE SET NULL;

-- Add images column if it doesn't exist
ALTER TABLE "product" 
ADD COLUMN IF NOT EXISTS "images" TEXT[];

-- Create index for seller_id if it doesn't exist
CREATE INDEX IF NOT EXISTS "idx_product_seller_id" ON "product" ("seller_id");












