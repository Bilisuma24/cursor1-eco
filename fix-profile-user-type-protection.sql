-- =====================================================
-- Fix Profile user_type Protection - Prevent Overwriting
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create a function to protect user_type from being changed to 'buyer' if it's already 'seller'
CREATE OR REPLACE FUNCTION protect_seller_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- If profile already exists and is a seller, prevent changing to buyer
  IF OLD.user_type = 'seller' AND NEW.user_type = 'buyer' THEN
    RAISE WARNING 'Cannot change seller profile to buyer. Keeping seller type.';
    NEW.user_type := 'seller';
  END IF;
  
  -- If profile already exists and has a user_type, don't allow changing it to buyer
  IF OLD.user_type IS NOT NULL AND OLD.user_type != 'buyer' AND NEW.user_type = 'buyer' THEN
    RAISE WARNING 'Cannot change existing user_type from % to buyer. Keeping original type.', OLD.user_type;
    NEW.user_type := OLD.user_type;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create trigger to protect seller profiles
DROP TRIGGER IF EXISTS protect_seller_profile_trigger ON profile;
CREATE TRIGGER protect_seller_profile_trigger
  BEFORE UPDATE ON profile
  FOR EACH ROW
  WHEN (OLD.user_type IS DISTINCT FROM NEW.user_type)
  EXECUTE FUNCTION protect_seller_profile();

-- 3. Verify RLS policies allow profile updates
-- Note: The trigger will handle protecting user_type, not the RLS policy
DROP POLICY IF EXISTS "Users can update own profile" ON "profile";
CREATE POLICY "Users can update own profile"
  ON "profile" FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Verify the trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'profile'
  AND trigger_name = 'protect_seller_profile_trigger';

-- 5. Check current profiles and their user_type
SELECT 
    user_id,
    username,
    full_name,
    user_type,
    created_at
FROM profile
ORDER BY created_at DESC
LIMIT 20;

