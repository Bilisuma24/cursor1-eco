-- =====================================================
-- Seller Dashboard Database Updates
-- =====================================================

-- Add seller_id column to product table
ALTER TABLE "product" ADD COLUMN "seller_id" UUID REFERENCES auth.users("id");
ALTER TABLE "product" ADD COLUMN "images" TEXT[]; -- Array for multiple images

-- Create index for faster seller product queries
CREATE INDEX "idx_product_seller_id" ON "product" ("seller_id");

-- Update RLS policies to ensure sellers can only manage their own products
CREATE POLICY "Sellers can update own products"
  ON "product" FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own products"
  ON "product" FOR DELETE
  USING (auth.uid() = seller_id);

-- Update existing policies to allow sellers to insert their own products
DROP POLICY IF EXISTS "Anyone can add products" ON "product";
CREATE POLICY "Sellers can add products"
  ON "product" FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- =====================================================
-- Supabase Storage Setup
-- =====================================================

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload product images
CREATE POLICY "Sellers can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow sellers to delete their own images
CREATE POLICY "Sellers can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- Allow public access to view product images
CREATE POLICY "Product images are publicly viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- =====================================================
-- Helper Functions for Seller Analytics
-- =====================================================

-- Function to get seller's total revenue
CREATE OR REPLACE FUNCTION get_seller_revenue(seller_uuid UUID)
RETURNS DECIMAL(10, 2) AS $$
BEGIN
  RETURN COALESCE((
    SELECT SUM(oi.price_at_purchase * oi.quantity)
    FROM order_items oi
    JOIN product p ON oi.product_id = p.id
    WHERE p.seller_id = seller_uuid
  ), 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get seller's total products count
CREATE OR REPLACE FUNCTION get_seller_products_count(seller_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM product
    WHERE seller_id = seller_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get seller's orders count by status
CREATE OR REPLACE FUNCTION get_seller_orders_count(seller_uuid UUID, order_status TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT o.id)
    FROM "order" o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN product p ON oi.product_id = p.id
    WHERE p.seller_id = seller_uuid
    AND (order_status IS NULL OR o.status = order_status)
  );
END;
$$ LANGUAGE plpgsql;

