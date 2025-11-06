# Add user_type Column to Profile Table

## Quick Fix

The error "Could not find the 'user_type' column" means the database hasn't been updated yet.

### Steps:

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/azvslusinlvnjymaufhw

2. **Open SQL Editor** (left sidebar → SQL Editor)

3. **Paste this SQL**:
   ```sql
   ALTER TABLE "profile" 
   ADD COLUMN IF NOT EXISTS "user_type" TEXT DEFAULT 'buyer' 
   CHECK (user_type IN ('buyer', 'seller'));
   ```

4. **Click "Run"** (bottom right)

5. **Refresh your browser** - Try the Buyer/Seller buttons again!

---

### Alternative: If you want to recreate the entire database

If you want to start fresh with all tables, you can run the entire `supabase-migrations.sql` file in the Supabase Dashboard SQL Editor.
