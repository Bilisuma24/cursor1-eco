# Supabase Integration Setup Guide

This guide will help you set up Supabase backend with Row Level Security (RLS) for your e-commerce application.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Row Level Security (RLS)](#row-level-security-rls)
4. [Supabase Edge Functions](#supabase-edge-functions)
5. [React Hooks Integration](#react-hooks-integration)
6. [Environment Variables](#environment-variables)
7. [Testing](#testing)

---

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. A Supabase project created
3. Node.js and npm installed

---

## Database Setup

### 1. Run SQL Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase-migrations.sql`
4. Click **Run** to execute the SQL

This will create:
- `product` table
- `profile` table
- `cart` table
- `order` table
- `order_items` table
- All necessary indexes and triggers
- Row Level Security policies

### 2. Verify Tables

Go to **Table Editor** to verify all tables were created successfully.

---

## Row Level Security (RLS)

RLS has been automatically enabled with the following policies:

### Product Table
- **View**: Anyone can view products
- **Insert/Update**: Authenticated users can add/update products

### Profile Table
- Users can only view/edit their own profile

### Cart Table
- Users can only access their own cart items

### Order Table
- Users can only view their own orders

### Order Items Table
- Users can only view order items from their own orders

---

## Supabase Edge Functions

### Deploy the Create Order Function

**Option 1: Using npx (no installation needed):**
```bash
# Login to Supabase
npx supabase login

# Link your project
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
npx supabase functions deploy create_order
```

**Option 2: Install Supabase CLI (Windows):**
```powershell
# Using Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# OR download directly from GitHub releases
```

**Option 3: Use Supabase Dashboard:**
- Go to your Supabase project
- Navigate to Edge Functions
- Upload the function manually

The function will:
- Read all items from the user's cart
- Calculate total price
- Create an order with order items
- Clear the cart after successful order creation

---

## React Hooks Integration

### Available Hooks

#### 1. `useSupabaseAuth()`
Handles authentication with Supabase.

**Features:**
- Sign in/Sign up
- Sign out
- OAuth login (Google, GitHub, etc.)
- Password reset
- Session management

**Usage:**
```javascript
import { useSupabaseAuth } from './hooks/useSupabaseAuth';

function MyComponent() {
  const { user, signIn, signUp, signOut, loading, error } = useSupabaseAuth();
  
  // Use the auth functions
  await signIn(email, password);
  await signUp(email, password);
  await signOut();
}
```

#### 2. `useCart(userId)`
Manages cart operations with Supabase.

**Features:**
- Add to cart
- Remove from cart
- Update quantity
- Clear cart
- Get cart total
- Checkout (creates order)

**Usage:**
```javascript
import { useCart } from './hooks/useCart';

function CartComponent() {
  const { user } = useSupabaseAuth();
  const {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    checkout,
    loading,
    error
  } = useCart(user?.id);
  
  // Use cart functions
  await addToCart(product, 1);
  await checkout();
}
```

---

## Environment Variables

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in:
1. Supabase Dashboard
2. Go to **Settings** → **API**
3. Copy **URL** and **anon/public key**

---

## Testing

### 1. Test Database Tables

Run this query in SQL Editor to insert test products:

```sql
INSERT INTO "product" ("name", "description", "price", "image_url", "category", "stock") VALUES
  ('Test Product 1', 'This is a test product', 29.99, 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500', 'Electronics', 50),
  ('Test Product 2', 'Another test product', 49.99, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500', 'Electronics', 30);
```

### 2. Test Authentication

1. Create a test user account using the `signUp` function
2. Sign in with the credentials
3. Verify the user session is active

### 3. Test Cart Functionality

1. Login as a user
2. Add products to cart
3. View cart items
4. Update quantities
5. Remove items

### 4. Test Order Creation

1. Add items to cart
2. Call the `checkout()` function
3. Verify order is created
4. Verify cart is cleared
5. Check `order` and `order_items` tables in Supabase

### 5. Test RLS

Try accessing different user's carts/orders - you should get permission errors.

---

## Example Integration

See `src/pages/ShopWithSupabase.jsx` for a complete example of:
- Loading products from Supabase
- Using authentication hook
- Using cart hook
- Handling loading and error states

---

## Troubleshooting

### Issue: "RLS policy violation"
**Solution:** Make sure you're authenticated and using the correct user ID.

### Issue: "Edge Function not found"
**Solution:** Make sure the function is deployed and the URL is correct.

### Issue: "Products not loading"
**Solution:** 
1. Check if products exist in the database
2. Verify RLS policies allow reading
3. Check browser console for errors

### Issue: "Cart not working"
**Solution:**
1. Verify user is authenticated
2. Check RLS policies for cart table
3. Ensure user_id is being passed correctly

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [React Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs)

---

## Next Steps

1. ✅ Set up database schema
2. ✅ Configure RLS policies
3. ✅ Deploy Edge Functions
4. ✅ Integrate React hooks
5. ⏳ Add image upload functionality (optional)
6. ⏳ Add payment integration (optional)
7. ⏳ Add email notifications (optional)
