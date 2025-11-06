-- Quick Profile Table Setup
-- Run this in your Supabase Dashboard SQL Editor

-- Create profile table if it doesn't exist
CREATE TABLE IF NOT EXISTS "profile" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES auth.users("id") ON DELETE CASCADE,
  "username" TEXT,
  "full_name" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "user_type" TEXT CHECK (user_type IN ('buyer', 'seller')),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("user_id")
);

-- Enable RLS on profile table
ALTER TABLE "profile" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profile
DROP POLICY IF EXISTS "Users can view own profile" ON "profile";
CREATE POLICY "Users can view own profile"
  ON "profile" FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON "profile";
CREATE POLICY "Users can insert own profile"
  ON "profile" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON "profile";
CREATE POLICY "Users can update own profile"
  ON "profile" FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own profile" ON "profile";
CREATE POLICY "Users can delete own profile"
  ON "profile" FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "idx_profile_user_id" ON "profile" ("user_id");

-- Verify the setup
SELECT 'Profile table setup completed successfully!' as status;
