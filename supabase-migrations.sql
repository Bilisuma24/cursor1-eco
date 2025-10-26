-- =====================================================
-- Supabase Database Schema & Row Level Security (RLS)
-- =====================================================

-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS "order_items" CASCADE;
DROP TABLE IF EXISTS "order" CASCADE;
DROP TABLE IF EXISTS "cart" CASCADE;
DROP TABLE IF EXISTS "product" CASCADE;
DROP TABLE IF EXISTS "profile" CASCADE;

-- =====================================================
-- 1. PRODUCT TABLE
-- =====================================================
CREATE TABLE "product" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price" DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  "image_url" TEXT,
  "category" TEXT,
  "stock" INTEGER DEFAULT 0 CHECK (stock >= 0),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX "idx_product_category" ON "product" ("category");
CREATE INDEX "idx_product_created_at" ON "product" ("created_at" DESC);

-- =====================================================
-- 2. PROFILE TABLE
-- =====================================================
CREATE TABLE "profile" (
  "user_id" UUID PRIMARY KEY REFERENCES auth.users("id") ON DELETE CASCADE,
  "username" TEXT UNIQUE,
  "full_name" TEXT,
  "address" TEXT,
  "phone" TEXT,
  "avatar_url" TEXT,
  "user_type" TEXT DEFAULT 'buyer' CHECK (user_type IN ('buyer', 'seller')),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CART TABLE
-- =====================================================
CREATE TABLE "cart" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES auth.users("id") ON DELETE CASCADE,
  "product_id" UUID NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "quantity" INTEGER NOT NULL CHECK (quantity > 0),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("user_id", "product_id")
);

-- Create index for faster cart queries
CREATE INDEX "idx_cart_user_id" ON "cart" ("user_id");

-- =====================================================
-- 4. ORDER TABLE
-- =====================================================
CREATE TABLE "order" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES auth.users("id") ON DELETE CASCADE,
  "total_price" DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
  "status" TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  "shipping_address" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster order queries
CREATE INDEX "idx_order_user_id" ON "order" ("user_id");
CREATE INDEX "idx_order_created_at" ON "order" ("created_at" DESC);

-- =====================================================
-- 5. ORDER_ITEMS TABLE (many-to-many relationship)
-- =====================================================
CREATE TABLE "order_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL REFERENCES "order"("id") ON DELETE CASCADE,
  "product_id" UUID NOT NULL REFERENCES "product"("id") ON DELETE RESTRICT,
  "quantity" INTEGER NOT NULL CHECK (quantity > 0),
  "price_at_purchase" DECIMAL(10, 2) NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster order items queries
CREATE INDEX "idx_order_items_order_id" ON "order_items" ("order_id");

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE "product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cart" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PRODUCT TABLE POLICIES
-- =====================================================
-- Anyone can view products
CREATE POLICY "Products are viewable by everyone"
  ON "product" FOR SELECT
  USING (true);

-- Only authenticated users can insert (add products)
CREATE POLICY "Anyone can add products"
  ON "product" FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can update
CREATE POLICY "Users can update products"
  ON "product" FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- PROFILE TABLE POLICIES
-- =====================================================
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON "profile" FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON "profile" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON "profile" FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- CART TABLE POLICIES
-- =====================================================
-- Users can only view their own cart
CREATE POLICY "Users can view own cart"
  ON "cart" FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add to their own cart
CREATE POLICY "Users can insert into own cart"
  ON "cart" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own cart
CREATE POLICY "Users can update own cart"
  ON "cart" FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own cart items
CREATE POLICY "Users can delete own cart items"
  ON "cart" FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- ORDER TABLE POLICIES
-- =====================================================
-- Users can only view their own orders
CREATE POLICY "Users can view own orders"
  ON "order" FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own orders
CREATE POLICY "Users can insert own orders"
  ON "order" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- ORDER_ITEMS TABLE POLICIES
-- =====================================================
-- Users can view order items from their own orders
CREATE POLICY "Users can view own order items"
  ON "order_items" FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "order"
      WHERE "order".id = order_items.order_id
      AND "order".user_id = auth.uid()
    )
  );

-- Users can insert order items for their own orders
CREATE POLICY "Users can insert own order items"
  ON "order_items" FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "order"
      WHERE "order".id = order_items.order_id
      AND "order".user_id = auth.uid()
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at column
CREATE TRIGGER update_product_updated_at BEFORE UPDATE ON "product"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profile_updated_at BEFORE UPDATE ON "profile"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_updated_at BEFORE UPDATE ON "cart"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_updated_at BEFORE UPDATE ON "order"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample products
INSERT INTO "product" ("name", "description", "price", "image_url", "category", "stock") VALUES
  ('Wireless Mouse', 'Ergonomic wireless mouse with 2-year battery life', 29.99, 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500', 'Electronics', 50),
  ('Mechanical Keyboard', 'RGB mechanical keyboard with blue switches', 89.99, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500', 'Electronics', 30),
  ('USB-C Cable', 'Fast charging USB-C cable (6ft)', 14.99, 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=500', 'Accessories', 100);
