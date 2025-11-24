# Google OAuth Setup Guide

The error 556 you're seeing means Google OAuth is not properly configured in your Supabase project. Follow these steps to fix it:

## Step 1: Configure OAuth Consent Screen (IMPORTANT - Do this first!)

**This is critical!** The 400 error usually means the OAuth consent screen isn't configured:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Choose **External** user type (unless you have a Google Workspace)
5. Fill in the **required fields**:
   - **App name**: Your app name (e.g., "Kush Deals")
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
6. Click **Save and Continue**
7. On **Scopes** screen: Click **Save and Continue** (no need to add scopes)
8. On **Test users** screen: 
   - **Add your email address** as a test user (this is important!)
   - Click **Save and Continue**
9. Review and click **Back to Dashboard**

**Note**: If your app is in "Testing" mode, only test users can sign in. To allow everyone, you'll need to publish the app later.

## Step 2: Get Google OAuth Credentials

1. In Google Cloud Console, navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application** as the application type
4. Give it a name (e.g., "Supabase Auth")
5. **Add Authorized redirect URIs**:
   - `https://azvslusinlvnjymaufhw.supabase.co/auth/v1/callback`
   - (Replace `azvslusinlvnjymaufhw` with your actual Supabase project reference)
   - **Important**: This must match exactly, including `https://` and the path
6. Click **Create**
7. **Copy the Client ID** (looks like: `123456789-abc123def456.apps.googleusercontent.com`)
8. **Copy the Client Secret** (looks like: `GOCSPX-abc123def456ghi789`)

## Step 2: Configure Google OAuth in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** in the list and click on it
5. In the Google provider settings panel:

   **Required Fields:**
   - **Enable Sign in with Google**: Toggle this **ON** (switch to the right)
   - **Client IDs**: Paste your **Client ID** from Google Cloud Console
     - Example: `123456789-abc123def456.apps.googleusercontent.com`
   - **Client Secret (for OAuth)**: Paste your **Client Secret** from Google Cloud Console
     - Click the eye icon to show/hide the secret
     - Example: `GOCSPX-abc123def456ghi789`

   **Optional Settings:**
   - **Skip nonce checks**: Leave this **OFF** (default) for better security
   - **Allow users without an email**: Leave this **OFF** (default) unless you need it

6. Click **Save** button (green button at the bottom)

## Step 3: Add Redirect URLs (Important!)

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Add these to **Redirect URLs**:
   - `http://localhost:5173/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)
3. Click **Save**

## Step 4: Test

After configuration, try signing in with Google again. The OAuth flow should work properly.

## Troubleshooting

### Error 400 from Google OAuth Consent Page

This error means Google cannot load the consent screen. Here's how to fix it:

**Step 1: Check OAuth Consent Screen Status**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Check the status at the top:
   - If it says "Not configured" → You need to complete the setup
   - If it says "Testing" → Make sure your email is in the test users list
   - If it says "In production" → Should work for everyone

**Step 2: Complete OAuth Consent Screen (if not done)**
1. Click **Edit App** or **Configure Consent Screen**
2. Fill in **ALL required fields** (marked with red asterisk *):
   - **App name** (required)
   - **User support email** (required) - Must be your email or a Google Group
   - **App logo** (optional but recommended)
   - **Application home page** (required) - Can be your website or `https://example.com`
   - **Application privacy policy link** (required) - Can be `https://example.com/privacy`
   - **Application terms of service link** (required) - Can be `https://example.com/terms`
   - **Authorized domains** (required) - Add your domain or `localhost` for testing
   - **Developer contact information** (required) - Your email address
3. Click **Save and Continue**
4. On **Scopes** page: Click **Save and Continue** (no scopes needed for basic auth)
5. On **Test users** page:
   - **Add your email address** (the one you'll use to sign in)
   - Click **Add** then **Save and Continue**
6. Review and **Back to Dashboard**

**Step 3: Verify Test Users (if in Testing mode)**
- If your app is in "Testing" mode, **only test users can sign in**
- Go to **OAuth consent screen** → **Test users**
- Make sure the email you're using to sign in is in the list
- If not, click **Add Users** and add your email

**Step 4: Check Redirect URI**
- In **Credentials** → Your OAuth client
- Make sure you have: `https://azvslusinlvnjymaufhw.supabase.co/auth/v1/callback`
- Must be **exactly** this format (no trailing slashes, correct path)

**Common Issues:**
- ❌ Missing required fields in consent screen → Complete all fields
- ❌ App in Testing mode but email not in test users → Add your email
- ❌ Privacy policy or Terms of Service links invalid → Use valid URLs
- ❌ Authorized domains not set → Add your domain

- **Error 556**: Usually means:
  - Google OAuth toggle is not enabled in Supabase
  - Client ID or Client Secret is missing or incorrect
  - Redirect URI mismatch between Google Cloud Console and Supabase
  
- **"Invalid client" error**: 
  - Double-check that you copied the Client ID correctly (no extra spaces)
  - Make sure the Client Secret is correct (click the eye icon to verify)
  - Verify the Client ID matches the one in Google Cloud Console
  
- **Redirect mismatch**: 
  - In Google Cloud Console, make sure you added: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
  - Must be exactly: `https://` (not `http://`) and include `/auth/v1/callback` at the end
  - In Supabase, make sure you added: `http://localhost:5173/auth/callback` (and your production URL)
  
- **"Access blocked" or "This app isn't verified"**:
  - Make sure you configured the OAuth consent screen in Google Cloud Console
  - Add your email as a test user if the app is in testing mode
  - If in testing mode, only test users can sign in
  - To allow everyone, you need to publish the app (requires verification for sensitive scopes)

- **"redirect_uri_mismatch" error**:
  - The redirect URI in Google Cloud Console must exactly match: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
  - Check for typos, extra spaces, or missing parts
  - Make sure you're using `https://` not `http://`

## Current Configuration

- Redirect URL in code: `${window.location.origin}/auth/callback`
- For localhost: `http://localhost:5173/auth/callback`
- Supabase callback URL: `https://azvslusinlvnjymaufhw.supabase.co/auth/v1/callback`

Make sure both URLs are configured correctly!

