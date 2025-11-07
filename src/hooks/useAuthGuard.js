import { useAuth } from '../contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

export const useAuthGuard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const requireAuth = useCallback((action, redirectTo = '/login') => {
    return (callback) => {
      return async (...args) => {
        if (loading) {
          // Still loading, wait
          return;
        }
        
        if (!user) {
          // User not authenticated, redirect to login
          const currentPath = window.location.pathname;
          const searchParams = window.location.search;
          const fullPath = currentPath + searchParams;
          
          // Store the intended action and current path for after login
          sessionStorage.setItem('authRedirect', fullPath);
          sessionStorage.setItem('authAction', action);
          
          navigate(redirectTo);
          return;
        }
        
        // User is authenticated, proceed with the action
        return callback(...args);
      };
    };
  }, [user, loading, navigate]);

  const requireAuthForCart = useCallback(() => {
    return requireAuth('add_to_cart');
  }, [requireAuth]);

  const requireAuthForWishlist = useCallback(() => {
    return requireAuth('add_to_wishlist');
  }, [requireAuth]);

  return {
    requireAuth,
    requireAuthForCart,
    requireAuthForWishlist,
    isAuthenticated: !!user,
    isLoading: loading
  };
};













