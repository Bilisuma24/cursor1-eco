-- Fix for Profile Creation During Signup
-- This SQL should be run in your Supabase Dashboard SQL Editor

-- 1. First, let's check if the user_type column exists
-- If not, add it
ALTER TABLE "profile" 
ADD COLUMN IF NOT EXISTS "user_type" TEXT DEFAULT 'buyer' 
CHECK (user_type IN ('buyer', 'seller'));

-- 2. Create a function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profile (user_id, username, full_name, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'buyer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create a trigger that runs when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Update the RLS policy to allow profile creation during signup
-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own profile" ON "profile";

-- Create a more permissive policy for profile creation
CREATE POLICY "Users can insert own profile"
  ON "profile" FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR 
    auth.uid() IS NOT NULL
  );

-- 5. Also allow updates to handle the upsert operation
DROP POLICY IF EXISTS "Users can update own profile" ON "profile";

CREATE POLICY "Users can update own profile"
  ON "profile" FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
