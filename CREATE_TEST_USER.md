# How to Create a Test User in Supabase

## Option 1: Create User in Supabase Dashboard (Recommended for Testing)

1. Go to https://supabase.com/dashboard
2. Select your project: `azvslusinlvnjymaufhw`
3. Navigate to **Authentication** → **Users**
4. Click **"Add user"** button
5. Enter:
   - **Email**: `test@example.com` (or any email)
   - **Password**: `password123` (or any password, min 6 characters)
6. Click **"Create user"**
7. The user will be created automatically and confirmed

## Option 2: Disable Email Confirmation (For Development)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Settings**
4. Find **"Email Auth"** section
5. Look for **"Confirm email"** option
6. **Uncheck** "Enable email confirmations" 
7. Click **"Save"**

**Note**: This is only recommended for development. Re-enable it for production!

## Option 3: Use the CLI to Create User

If you have Supabase CLI installed:

```bash
npx supabase db insert --table auth.users --data '{"email":"test@example.com","encrypted_password":"hashed_password_here"}'
```

## After Creating User

Once you've created a user using any method above, you can login at:
- URL: http://localhost:5176/login
- Email: `test@example.com`
- Password: `password123` (or whatever you set)

## Troubleshooting

If you still get "Email not confirmed" error after creating user in dashboard:
1. Make sure you unchecked "Enable email confirmations" in settings
2. Or verify the user was created correctly in the Users list
3. The user should show as "Confirmed" in the dashboard
