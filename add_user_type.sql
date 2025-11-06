-- Add user_type column to profile table
ALTER TABLE "profile" 
ADD COLUMN IF NOT EXISTS "user_type" TEXT DEFAULT 'buyer' 
CHECK (user_type IN ('buyer', 'seller'));
