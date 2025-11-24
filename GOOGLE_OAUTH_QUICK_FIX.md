# Quick Fix for Google OAuth 400 Error

## The Problem
You're getting a 400 error when trying to sign in with Google. This means Google's consent screen cannot be loaded.

## Solution: Complete OAuth Consent Screen Setup

### Step-by-Step Fix:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project

2. **Open OAuth Consent Screen**
   - Navigate to: **APIs & Services** → **OAuth consent screen**
   - Click **Edit App** or **Configure Consent Screen**

3. **Fill Required Fields (Step 1 - App Information)**
   - **App name**: Enter any name (e.g., "Kush Deals" or "My App")
   - **User support email**: Your email address
   - **App logo**: Optional (can skip)
   - **Application home page**: 
     - For testing: `https://example.com` or `http://localhost:5173`
     - For production: Your actual website URL
   - **Application privacy policy link**: 
     - For testing: `https://example.com/privacy`
     - For production: Your actual privacy policy URL
   - **Application terms of service link**: 
     - For testing: `https://example.com/terms`
     - For production: Your actual terms URL
   - **Authorized domains**: 
     - Add: `localhost` (for local testing)
     - Add: Your production domain (if you have one)
   - **Developer contact information**: Your email address
   - Click **Save and Continue**

4. **Scopes (Step 2)**
   - Click **Save and Continue** (no scopes needed for basic auth)

5. **Test Users (Step 3) - CRITICAL!**
   - **Add your email address** (the one you'll use to sign in)
   - Click **Add** button
   - Click **Save and Continue**

6. **Review (Step 4)**
   - Review the summary
   - Click **Back to Dashboard**

### Verify Configuration:

After saving, check:
- ✅ Status shows "Testing" or "In production"
- ✅ Your email is in the "Test users" list
- ✅ All required fields are filled

### Important Notes:

- **If app is in "Testing" mode**: Only emails in the test users list can sign in
- **Privacy Policy & Terms**: You can use placeholder URLs like `https://example.com/privacy` for testing
- **Authorized domains**: Must include `localhost` for local development

### After Configuration:

1. Wait 1-2 minutes for changes to propagate
2. Try signing in with Google again
3. The 400 error should be resolved

### Still Getting 400 Error?

Check these:
1. Did you complete ALL steps and click "Save and Continue" on each?
2. Is your email in the test users list?
3. Did you wait a few minutes after saving?
4. Try clearing browser cache and cookies
5. Try using an incognito/private window

