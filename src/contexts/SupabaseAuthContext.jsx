import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const SupabaseAuthContext = createContext({});

export function SupabaseAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get initial session with aggressive timeout
    let mounted = true;
    
    const initSession = async () => {
      try {
        const timeoutId = setTimeout(() => {
          if (mounted && loading) {
            // Only log timeout in development mode
            if (import.meta.env.DEV) {
              console.warn('[Auth Context] Session check timed out, proceeding with no user');
            }
            setLoading(false);
          }
        }, 3000); // 3 second timeout

        const { data: { session }, error } = await supabase.auth.getSession();
        clearTimeout(timeoutId);
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('[Auth Context] Session check error:', error);
        if (mounted) {
          setUser(null);
          setSession(null);
          setLoading(false);
        }
      }
    };

    initSession();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (import.meta.env.DEV) {
          console.log('[Auth Context] Auth state changed:', _event);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false); // Ensure loading ends on any auth event
        
        // If user signed out, clear everything
        if (_event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setSession(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debug logging removed to reduce console noise

  const signOut = async () => {
    try {
      // Clear state first to ensure UI updates
      setUser(null);
      setSession(null);
      setLoading(false);
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[Auth Context] Sign out error:', error);
        // Continue anyway - we already cleared local state
      }
      
      // Clear any localStorage items
      try {
        localStorage.removeItem('user_profile');
        localStorage.removeItem('remembered_email');
        localStorage.removeItem('cart');
        localStorage.removeItem('wishlist');
      } catch (e) {
        console.warn('[Auth Context] Error clearing localStorage:', e);
      }
      
      return { success: true };
    } catch (error) {
      console.error('[Auth Context] Sign out error:', error);
      // Ensure state is cleared even on error
      setUser(null);
      setSession(null);
      setLoading(false);
      
      // Still try to clear localStorage
      try {
        localStorage.clear();
      } catch (e) {
        // Ignore localStorage errors
      }
      
      return { success: true }; // Return success anyway since we cleared state
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // User will be set via onAuthStateChange
      return { user: data.user };
    } catch (error) {
      console.error('[Auth Context] Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email, password, userData = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData, // Additional user metadata (name, user_type, etc.)
        },
      });
      
      if (error) throw error;
      
      // User will be set via onAuthStateChange after email confirmation
      // But for auto-login, we can set it immediately if session exists
      if (data.user) {
        setUser(data.user);
      }
      
      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('[Auth Context] Sign up error:', error);
      throw error;
    }
  };

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('[Auth Context] Reset password error:', error);
      throw error;
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('[Auth Context] Update password error:', error);
      throw error;
    }
  };

  const updateUserMetadata = async (metadata) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: metadata,
      });
      
      if (error) throw error;
      
      // Update local user state
      if (data.user) {
        setUser(data.user);
      }
      
      return { user: data.user };
    } catch (error) {
      console.error('[Auth Context] Update user metadata error:', error);
      throw error;
    }
  };

  const resendConfirmation = async (email) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('[Auth Context] Resend confirmation error:', error);
      throw error;
    }
  };

  const signInWithOAuth = async (provider) => {
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          // Remove queryParams that might cause issues
        },
      });
      
      if (error) {
        console.error('[Auth Context] OAuth sign in error:', error);
        throw new Error(error.message || `Failed to sign in with ${provider}. Please check your Supabase configuration.`);
      }
      
      // OAuth will redirect, so we don't need to return anything
      return data;
    } catch (error) {
      console.error('[Auth Context] OAuth sign in error:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    signIn,
    signUp,
    resetPassword,
    updatePassword,
    updateUserMetadata,
    resendConfirmation,
    signInWithOAuth,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useAuth must be used within SupabaseAuthProvider');
  }
  return context;
};

