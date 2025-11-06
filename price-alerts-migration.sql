-- =====================================================
-- Price Drop Alerts Feature - Database Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create price_alerts table
CREATE TABLE IF NOT EXISTS "price_alerts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES auth.users("id") ON DELETE CASCADE,
  "product_id" UUID NOT NULL REFERENCES "product"("id") ON DELETE CASCADE,
  "target_price" DECIMAL(10, 2) NOT NULL CHECK (target_price >= 0),
  "current_price" DECIMAL(10, 2) NOT NULL CHECK (current_price >= 0),
  "is_active" BOOLEAN DEFAULT true,
  "is_notified" BOOLEAN DEFAULT false,
  "notified_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("user_id", "product_id")
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS "idx_price_alerts_user_id" ON "price_alerts" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_price_alerts_product_id" ON "price_alerts" ("product_id");
CREATE INDEX IF NOT EXISTS "idx_price_alerts_active" ON "price_alerts" ("is_active") WHERE "is_active" = true;

-- Enable RLS on price_alerts table
ALTER TABLE "price_alerts" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for price_alerts
DROP POLICY IF EXISTS "Users can view own price alerts" ON "price_alerts";
CREATE POLICY "Users can view own price alerts"
  ON "price_alerts" FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own price alerts" ON "price_alerts";
CREATE POLICY "Users can insert own price alerts"
  ON "price_alerts" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own price alerts" ON "price_alerts";
CREATE POLICY "Users can update own price alerts"
  ON "price_alerts" FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own price alerts" ON "price_alerts";
CREATE POLICY "Users can delete own price alerts"
  ON "price_alerts" FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_price_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_price_alerts_updated_at ON "price_alerts";
CREATE TRIGGER update_price_alerts_updated_at 
  BEFORE UPDATE ON "price_alerts"
  FOR EACH ROW 
  EXECUTE FUNCTION update_price_alerts_updated_at();

-- =====================================================
-- Function to check for price drops and notify users
-- This should be run periodically (via cron job or edge function)
-- =====================================================

CREATE OR REPLACE FUNCTION check_price_drops()
RETURNS TABLE (
  alert_id UUID,
  user_id UUID,
  product_id UUID,
  product_name TEXT,
  old_price DECIMAL,
  new_price DECIMAL,
  target_price DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  UPDATE price_alerts pa
  SET 
    is_notified = true,
    notified_at = NOW(),
    current_price = p.price
  FROM product p
  WHERE 
    pa.product_id = p.id
    AND pa.is_active = true
    AND pa.is_notified = false
    AND p.price <= pa.target_price
    AND p.price < pa.current_price
  RETURNING 
    pa.id,
    pa.user_id,
    pa.product_id,
    p.name,
    pa.current_price,
    p.price,
    pa.target_price;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the setup
SELECT 'Price alerts table setup completed successfully!' as status;

