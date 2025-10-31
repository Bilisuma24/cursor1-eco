# Complete Authentication System Documentation

## Overview

This ecommerce website now has a complete, production-ready authentication system built with Supabase Auth and React. The system includes signup, login, profile management, role-based access control, and password reset functionality.

## Features Implemented

### ✅ Signup Flow
- **Location**: `src/pages/Signup.jsx`
- **Features**:
  - Creates new user accounts with name, email, password, and role (buyer/seller)
  - Validates all inputs with real-time error messages
  - Saves user details to Supabase Auth and profile table
  - Automatically logs in user after successful signup (if email confirmation disabled)
  - Redirects based on role:
    - Buyer → `/profile`
    - Seller → `/seller-dashboard`
  - Password confirmation validation
  - Beautiful, modern UI with gradient backgrounds

### ✅ Login Flow
- **Location**: `src/pages/Login.jsx`
- **Features**:
  - Email and password authentication
  - Role detection and automatic redirect:
    - Buyer → `/profile`
    - Seller → `/seller-dashboard`
  - "Remember me" functionality (saves email to localStorage)
  - Persistent session (users stay logged in after page refresh)
  - Forgot password link
  - Email confirmation resend option
  - Comprehensive validation and error handling

### ✅ Profile Page
- **Location**: `src/pages/profile.jsx`
- **Features**:
  - Displays logged-in user's information (name, email, role, phone, address)
  - Edit mode for updating profile details
  - Real-time form validation
  - Password change functionality
  - Shows account statistics (member since, email verified, last seen)
  - Role badge display (Buyer/Seller)
  - Logout button that clears session and redirects to homepage
  - Protected route (requires authentication)

### ✅ Auth Management
- **Location**: `src/contexts/SupabaseAuthContext.jsx`
- **Features**:
  - Global Auth Context managing login state across the app
  - Handles loading state with timeout (prevents infinite loading)
  - Session persistence
  - Methods provided:
    - `signIn(email, password)` - Login user
    - `signUp(email, password, userData)` - Create new account
    - `signOut()` - Logout user
    - `resetPassword(email)` - Send password reset email
    - `updatePassword(newPassword)` - Update user password
    - `updateUserMetadata(metadata)` - Update user metadata
    - `resendConfirmation(email)` - Resend email confirmation

### ✅ Protected Routes
- **Location**: `src/components/ProtectedRoute.jsx`
- **Components**:
  1. **`ProtectedRoute`** - Requires authentication (any logged-in user)
  2. **`BuyerRoute`** - Requires buyer role
  3. **`SellerRoute`** - Requires seller role  
  4. **`PublicRoute`** - Redirects logged-in users to their dashboard
- **Features**:
  - Loading states while checking authentication
  - Access denied messages for unauthorized users
  - Automatic redirects for unauthenticated users

### ✅ Password Reset
- **Forgot Password**: `src/pages/ForgotPassword.jsx`
  - Request password reset via email
  - Success confirmation message
- **Reset Password**: `src/pages/ResetPassword.jsx`
  - Create new password after clicking email link
  - Password confirmation validation
  - Protected route (requires authentication)

### ✅ User Role Management
- **Location**: `src/hooks/useUserRole.js`
- **Features**:
  - Fetches user role from database
- **Returns**:
  - `userRole` - 'buyer' or 'seller'
  - `isSeller` - boolean
  - `isBuyer` - boolean
  - `hasRole` - boolean
  - `loading` - loading state

## File Structure

```
src/
├── contexts/
│   └── SupabaseAuthContext.jsx    # Main auth context
├── components/
│   └── ProtectedRoute.jsx          # Protected route components
├── hooks/
│   └── useUserRole.js              # User role hook
├── pages/
│   ├── Signup.jsx                  # Signup page
│   ├── Login.jsx                   # Login page
│   ├── profile.jsx                 # Profile page
│   ├── ForgotPassword.jsx          # Forgot password page
│   ├── ResetPassword.jsx           # Reset password page
│   └── SellerDashboard.jsx         # Seller dashboard (uses SellerRoute)
└── App.jsx                         # Main app with routes
```

## Database Schema

The system uses the `profile` table with the following structure:

```sql
CREATE TABLE "profile" (
  "id" UUID PRIMARY KEY,
  "user_id" UUID REFERENCES auth.users("id"),
  "username" TEXT,
  "full_name" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "user_type" TEXT CHECK (user_type IN ('buyer', 'seller')),
  "created_at" TIMESTAMP,
  "updated_at" TIMESTAMP,
  UNIQUE("user_id")
);
```

## Usage Examples

### Using Protected Routes

```jsx
import { ProtectedRoute, BuyerRoute, SellerRoute } from './components/ProtectedRoute';

// Any authenticated user
<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>

// Only buyers
<BuyerRoute>
  <BuyerOnlyComponent />
</BuyerRoute>

// Only sellers
<SellerRoute>
  <SellerOnlyComponent />
</SellerRoute>
```

### Using Auth Context

```jsx
import { useAuth } from './contexts/SupabaseAuthContext';

function MyComponent() {
  const { user, signIn, signOut, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please log in</div>;
  
  return <div>Welcome, {user.email}!</div>;
}
```

### Using User Role Hook

```jsx
import { useUserRole } from './hooks/useUserRole';

function MyComponent() {
  const { userRole, isSeller, isBuyer, loading } = useUserRole();
  
  if (loading) return <div>Loading...</div>;
  
  if (isSeller) {
    return <div>Seller Dashboard</div>;
  }
  
  if (isBuyer) {
    return <div>Buyer Profile</div>;
  }
  
  return <div>No role assigned</div>;
}
```

## Security Features

1. **Row Level Security (RLS)**: Profile table has RLS policies ensuring users can only access their own data
2. **Password Validation**: Minimum 6 characters required
3. **Email Validation**: Proper email format checking
4. **Session Management**: Secure session handling via Supabase
5. **Protected Routes**: Route-level access control
6. **Auto-logout**: Session cleared on logout

## Error Handling

- Comprehensive validation on all forms
- User-friendly error messages
- Network error handling
- Database error handling
- Timeout protection to prevent infinite loading

## UI/UX Features

- Modern, clean design with gradient backgrounds
- Responsive layouts for mobile and desktop
- Loading states for all async operations
- Success/error message notifications
- Smooth transitions and hover effects
- Form validation feedback
- Remember me functionality
- Role-based visual indicators (badges)

## Testing the System

1. **Signup**:
   - Go to `/signup`
   - Fill in name, email, password, confirm password
   - Select buyer or seller
   - Submit and verify auto-login and redirect

2. **Login**:
   - Go to `/login`
   - Enter credentials
   - Check "Remember me" to save email
   - Verify role-based redirect after login

3. **Profile**:
   - After login, go to `/profile`
   - Edit profile information
   - Change password
   - Verify updates persist

4. **Protected Routes**:
   - Try accessing `/seller-dashboard` as a buyer (should show access denied)
   - Try accessing `/profile` without logging in (should redirect to login)

5. **Password Reset**:
   - Go to `/forgot-password`
   - Enter email
   - Check email for reset link
   - Click link and reset password

## Route Configuration

All routes are configured in `src/App.jsx`:

- **Public Routes**: `/`, `/shop`, `/about`, `/contact`, `/product/:id`
- **Auth Routes** (redirect if logged in): `/signup`, `/login`, `/forgot-password`
- **Protected Routes**: `/profile`, `/cart`, `/orders`, `/wishlist`, `/seller-dashboard/*`
- **Password Reset**: `/reset-password`

## Notes

- Email confirmation is optional (can be disabled in Supabase settings)
- If email confirmation is enabled, users need to confirm before auto-login works
- Profile creation happens automatically during signup
- User role is set during signup and stored in the profile table
- Session persists across page refreshes via Supabase session storage

## Future Enhancements (Optional)

- Two-factor authentication
- Social login (Google, GitHub, etc.)
- Profile picture upload
- Email change functionality
- Account deletion
- Activity log
- Enhanced password strength requirements
- Session timeout warning

