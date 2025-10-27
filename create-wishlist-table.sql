-- Create wishlist table for persistent wishlist storage
CREATE TABLE IF NOT EXISTS "wishlist" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES auth.users("id") ON DELETE CASCADE,
  "product_id" UUID NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("user_id", "product_id")
);

-- Enable RLS on wishlist table
ALTER TABLE "wishlist" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for wishlist
CREATE POLICY "Users can view own wishlist"
  ON "wishlist" FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into own wishlist"
  ON "wishlist" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own wishlist"
  ON "wishlist" FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX "idx_wishlist_user_id" ON "wishlist" ("user_id");
CREATE INDEX "idx_wishlist_product_id" ON "wishlist" ("product_id");
CREATE INDEX "idx_wishlist_created_at" ON "wishlist" ("created_at" DESC);
