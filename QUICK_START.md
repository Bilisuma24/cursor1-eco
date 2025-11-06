# Quick Start Guide - Supabase Integration

## 🚀 Get Started in 5 Minutes

### Step 1: Set Up Database (2 minutes)

1. Open your Supabase dashboard
2. Go to **SQL Editor**
3. Copy and paste the entire contents of `supabase-migrations.sql`
4. Click **Run**

✅ Done! Your database is ready with tables, RLS policies, and sample data.

### Step 2: Deploy Edge Function (2 minutes)

**Install Supabase CLI on Windows:**
```powershell
# Using Scoop (recommended)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# OR using PowerShell directly
irm https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.zip -OutFile supabase.zip
Expand-Archive supabase.zip -DestinationPath .
# Add to PATH or use directly
```

**Use npx (no installation needed):**
```bash
# Login
npx supabase login

# Link your project (get PROJECT_REF from Supabase settings)
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
npx supabase functions deploy create_order
```

**Alternative - Install via Scoop:**
```powershell
# First install Scoop if you don't have it
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Then install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

✅ Your Edge Function is deployed!

### Step 3: Add Environment Variables (1 minute)

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Find these in: Supabase Dashboard → Settings → API

✅ Environment variables configured!

### Step 4: Test It! (30 seconds)

```bash
npm run dev
```

Navigate to your app and test:
1. ✅ Products load from Supabase
2. ✅ Sign up/Sign in works
3. ✅ Add to cart works
4. ✅ Checkout works

## 📝 Usage Example

```javascript
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { useCart } from './hooks/useCart';

function MyComponent() {
  const { user, signIn, signOut } = useSupabaseAuth();
  const { addToCart, checkout, cartItems } = useCart(user?.id);
  
  return (
    <div>
      {user ? (
        <div>
          <p>Welcome {user.email}!</p>
          <button onClick={signOut}>Sign Out</button>
          <button onClick={() => addToCart(product, 1)}>Add to Cart</button>
          <button onClick={checkout}>Checkout</button>
        </div>
      ) : (
        <button onClick={() => signIn(email, password)}>Sign In</button>
      )}
    </div>
  );
}
```

## 🎯 What You Get

✅ **Secure Authentication** - Email/password, OAuth  
✅ **Cart Management** - Add, remove, update quantities  
✅ **Order Processing** - Complete checkout with edge function  
✅ **Row Level Security** - Users can only access their own data  
✅ **Real-time Updates** - Automatic cart synchronization  
✅ **Type-safe** - Full TypeScript/JavaScript support  

## 📚 Full Documentation

- See `SUPABASE_SETUP.md` for detailed setup
- See `INTEGRATION_SUMMARY.md` for architecture overview

## 🆘 Need Help?

Common Issues:
- **RLS errors** → Make sure you're signed in
- **Function not found** → Check the function is deployed
- **No products** → Run the sample data INSERT in SQL Editor

Happy coding! 🚀
