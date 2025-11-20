import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useUserRole } from '../hooks/useUserRole';

/**
 * Protected Route - Requires authentication
 * Redirects to login if not authenticated
 */
export function ProtectedRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { loading: roleLoading } = useUserRole();
  const [fallbackTimeout, setFallbackTimeout] = useState(false);

  // Fallback timeout - if loading takes more than 5 seconds, proceed anyway
  useEffect(() => {
    if (authLoading || roleLoading) {
      const timeout = setTimeout(() => {
        if (import.meta.env.DEV) {
          console.warn('[ProtectedRoute] Loading timeout, proceeding with current state');
        }
        setFallbackTimeout(true);
      }, 5000);

      return () => clearTimeout(timeout);
    } else {
      setFallbackTimeout(false);
    }
  }, [authLoading, roleLoading]);

  // Show loading only if still loading AND timeout hasn't expired
  if ((authLoading || roleLoading) && !fallbackTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signup" replace />;
  }

  return children;
}

/**
 * Buyer Route - Requires buyer role
 * Redirects to login if not authenticated, shows access denied if not buyer
 */
export function BuyerRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { userRole, isBuyer, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signup" replace />;
  }

  if (!isBuyer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            This page is only accessible to buyers.
            {userRole === 'seller' 
              ? ' You are registered as a seller. Please use the seller dashboard instead.' 
              : ' Please complete your profile setup to continue.'}
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/profile"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Profile
            </a>
            <a
              href="/"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

/**
 * Seller Route - Requires seller role
 * Redirects to login if not authenticated, shows access denied if not seller
 */
export function SellerRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { userRole, isSeller, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signup" replace />;
  }

  if (!isSeller) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            This page is only accessible to sellers.
            {userRole === 'buyer' 
              ? ' You are registered as a buyer. Please use buyer pages instead.' 
              : ' Please complete your profile setup and select seller role to continue.'}
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/profile"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Go to Profile
            </a>
            <a
              href="/"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

/**
 * Admin Route - Requires admin role
 * Redirects to login if not authenticated, shows access denied if not admin
 */
export function AdminRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { userRole, isAdmin, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signup" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            This page is only accessible to administrators.
            {userRole
              ? ' You are logged in but lack admin privileges.'
              : ' Please contact support if you believe this is an error.'}
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

/**
 * Public Route - Redirects to role-based dashboard if already logged in
 */
export function PublicRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { userRole, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If logged in, redirect based on role
  if (user && userRole) {
    if (userRole === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (userRole === 'seller') {
      return <Navigate to="/seller-dashboard" replace />;
    } else if (userRole === 'buyer') {
      return <Navigate to="/profile" replace />;
    }
  }

  return children;
}

