# How to Disable Email Confirmation in Supabase

## Step-by-Step Instructions

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Log in with your account

2. **Select Your Project**
   - Click on your project: `azvslusinlvnjymaufhw`

3. **Navigate to Authentication Settings**
   - In the left sidebar, click on **"Authentication"** 
   - Then click on **"Settings"** (or look for "Configuration" or "Email")

4. **Find Email Confirmation Settings**
   - Look for a section called **"Email Auth"** or **"Email Signup"**
   - There should be checkboxes or toggles for various email settings

5. **Common Locations for Email Confirmation Setting:**
   
   **Option A - In Email Auth section:**
   - Look for checkbox/toggle: "Confirm email" or "Enable email confirmations"
   - **Uncheck** or turn **OFF** this option
   
   **Option B - In Site URL section:**
   - Sometimes it's under "Redirect URLs" or "Site Configuration"
   - Look for "Confirm email" or "Email verification"
   - Turn it **OFF**

   **Option C - If you don't see it:**
   - The setting might be called: "Disable email confirmations"
   - Or "Skip email verification"
   - Or in "Auth Providers" → "Email" → "Email Confirmation"

6. **Save Changes**
   - Click the **"Save"** button at the bottom of the page

7. **Wait a moment**
   - Changes may take a few seconds to apply

## Alternative: Create Test User in Dashboard

If you can't find the email confirmation setting, create a user directly in the dashboard:

1. Go to **Authentication** → **Users**
2. Click **"Add user"** button (usually in the top right)
3. Enter:
   - **Email**: `test@example.com`
   - **Password**: `password123`
   - **Auto Confirm User**: Make sure this is checked ✅
4. Click **"Create user"**
5. Use these credentials to login

## Still Can't Find It?

The interface might have changed. Try these:

1. Look for **"Providers"** tab in Authentication settings
2. Click on **"Email"** provider
3. Look for confirmation/verification settings there

## Quick Test

After disabling email confirmation:
1. Go to http://localhost:5176/signup
2. Create a new account
3. Try logging in immediately (should work without email confirmation)
