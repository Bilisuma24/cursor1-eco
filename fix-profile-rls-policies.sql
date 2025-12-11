-- =====================================================
-- FIX: Profile RLS Policies - Allow Profile Creation
-- This fixes the "new row violates row-level security policy" error
-- =====================================================

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can insert own profile" ON "profile";
DROP POLICY IF EXISTS "Users can update own profile" ON "profile";
DROP POLICY IF EXISTS "Users can view own profile" ON "profile";
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON "profile";
DROP POLICY IF EXISTS "Users can read own profile" ON "profile";

-- 1. Allow users to INSERT their own profile
-- This is critical for signup - user must be able to create their profile
CREATE POLICY "Users can insert own profile"
  ON "profile"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- CRITICAL: Allow if user_id matches the authenticated user
    -- This is the main check - user can only create profile for themselves
    auth.uid() = user_id
  );

-- 2. Allow users to SELECT their own profile
CREATE POLICY "Users can view own profile"
  ON "profile"
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
  );

-- 3. Allow public/anonymous users to view profiles (for public profile pages)
-- This is optional but useful for public seller profiles
CREATE POLICY "Public can view profiles"
  ON "profile"
  FOR SELECT
  TO public
  USING (true);

-- 4. Allow users to UPDATE their own profile (but protect user_type via trigger)
CREATE POLICY "Users can update own profile"
  ON "profile"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Verify the policies were created
-- =====================================================
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profile'
ORDER BY cmd, policyname;

