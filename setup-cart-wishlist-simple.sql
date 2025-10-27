-- Simplified Database Setup for Cart and Wishlist (Static Product Data)
-- Run this in your Supabase Dashboard SQL Editor

-- 1. Add missing columns to cart table
ALTER TABLE "cart" 
ADD COLUMN IF NOT EXISTS "selected_color" TEXT,
ADD COLUMN IF NOT EXISTS "selected_size" TEXT;

-- 2. Create wishlist table if it doesn't exist
CREATE TABLE IF NOT EXISTS "wishlist" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES auth.users("id") ON DELETE CASCADE,
  "product_id" INTEGER NOT NULL, -- Using INTEGER since products are static data with numeric IDs
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("user_id", "product_id")
);

-- 3. Enable RLS on wishlist table
ALTER TABLE "wishlist" ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for wishlist
DROP POLICY IF EXISTS "Users can view own wishlist" ON "wishlist";
CREATE POLICY "Users can view own wishlist"
  ON "wishlist" FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert into own wishlist" ON "wishlist";
CREATE POLICY "Users can insert into own wishlist"
  ON "wishlist" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete from own wishlist" ON "wishlist";
CREATE POLICY "Users can delete from own wishlist"
  ON "wishlist" FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Update cart table RLS policies
DROP POLICY IF EXISTS "Users can view own cart" ON "cart";
CREATE POLICY "Users can view own cart"
  ON "cart" FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert into own cart" ON "cart";
CREATE POLICY "Users can insert into own cart"
  ON "cart" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own cart" ON "cart";
CREATE POLICY "Users can update own cart"
  ON "cart" FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete from own cart" ON "cart";
CREATE POLICY "Users can delete from own cart"
  ON "cart" FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_wishlist_user_id" ON "wishlist" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_wishlist_product_id" ON "wishlist" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_cart_user_id" ON "cart" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_cart_product_id" ON "cart" ("product_id");

-- 7. Verify the setup
SELECT 'Cart and Wishlist setup completed successfully!' as status;
SELECT 'Note: Products are static data, no product table needed' as info;
