-- Fix Profile 500 Error
-- Run this in Supabase SQL Editor to ensure profile table exists and has proper RLS

-- =====================================================
-- STEP 1: Create profile table if it doesn't exist
-- =====================================================
CREATE TABLE IF NOT EXISTS "profile" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL UNIQUE REFERENCES auth.users("id") ON DELETE CASCADE,
  "full_name" TEXT,
  "username" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "user_type" TEXT CHECK (user_type IN ('buyer', 'seller', 'admin')),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 2: Enable RLS on profile table
-- =====================================================
ALTER TABLE "profile" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 3: Remove existing policies (if any) and create new ones
-- =====================================================
DROP POLICY IF EXISTS "Users can view own profile" ON "profile";
DROP POLICY IF EXISTS "Users can insert own profile" ON "profile";
DROP POLICY IF EXISTS "Users can update own profile" ON "profile";
DROP POLICY IF EXISTS "Users can view own profile by id" ON "profile";

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
  ON "profile" FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON "profile" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON "profile" FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- STEP 4: Create index for faster queries
-- =====================================================
CREATE INDEX IF NOT EXISTS "idx_profile_user_id" ON "profile" ("user_id");

-- =====================================================
-- STEP 5: Verify table exists
-- =====================================================
SELECT 
    tablename, 
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profile';

-- =====================================================
-- STEP 6: Verify policies exist
-- =====================================================
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profile';

-- =====================================================
-- STEP 7: Test query (should work if user is authenticated)
-- =====================================================
-- This will show you if the table and policies are working
SELECT COUNT(*) as profile_count FROM "profile";

