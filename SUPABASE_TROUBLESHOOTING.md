# Supabase Connection Troubleshooting Guide

## Current Issue
Your Supabase project at `https://azvslusinlvnjymaufhw.supabase.co` is returning `ERR_NAME_NOT_RESOLVED`.

## Most Likely Cause
**Your Supabase project is paused** (free tier projects pause after 7 days of inactivity).

## How to Fix

### Step 1: Check Project Status
1. Go to **https://supabase.com/dashboard**
2. Log in with your credentials
3. Look for your project with reference: `azvslusinlvnjymaufhw`

### Step 2: Restore the Project
If you see a "**Paused**" status:
1. Click the "**Restore project**" button
2. Wait 1-2 minutes for the project to become active
3. The status should change to "**Active**"

### Step 3: Verify Connection
Once restored, refresh your application at `http://localhost:5173`

The error messages should disappear and products should load from the database.

## Alternative: Use a Different Project

If you want to use a different Supabase project:

1. Create a new project at https://supabase.com/dashboard
2. Get your new project URL and anon key from: **Project Settings > API**
3. Update your `.env` file:
   ```
   VITE_SUPABASE_URL=https://your-new-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-new-anon-key
   ```
4. Restart your dev server: `npm run dev`

## What's Already Working

Your application is designed to work even when Supabase is down:
- ✅ Static products from `products.js` are displayed as fallback
- ✅ All UI functionality works normally
- ✅ You can browse, add to cart, and checkout with static data

## Database Setup (When Project is Active)

Once your project is restored, you'll need to ensure these tables exist:
- `product` - for storing products
- `category` - for categories
- `wishlist` - for user wishlists
- `cart` - for shopping carts

Check the database schema in your Supabase dashboard under **Table Editor**.

## Need Help?

If the project cannot be restored:
1. The project might have been deleted
2. You may need to create a new Supabase project
3. Contact Supabase support if you believe this is an error

---

**Note**: The duplicate key warnings in your console have been fixed in the latest code update.
