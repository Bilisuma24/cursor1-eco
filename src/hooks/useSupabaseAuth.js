import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useSupabaseAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debug logging
  useEffect(() => {
    console.log('useSupabaseAuth: Current state - user:', user, 'loading:', loading, 'error:', error);
  }, [user, loading, error]);

  // Get initial session
  useEffect(() => {
    console.log('useSupabaseAuth: Getting initial session...');
    
    const initializeAuth = async () => {
      try {
        console.log('useSupabaseAuth: Starting session check...');
        
        // First try to get session with a shorter timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 3000)
        );

        const sessionPromise = supabase.auth.getSession();
        
        try {
          const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);
          
          console.log('useSupabaseAuth: Initial session:', session);
          console.log('useSupabaseAuth: User from session:', session?.user);
          console.log('useSupabaseAuth: Session error:', error);
          
          if (session?.user) {
            console.log('useSupabaseAuth: Setting user from session');
            setUser(session.user);
          } else {
            console.log('useSupabaseAuth: No user in session, checking localStorage');
            // Check localStorage as fallback
            const localUser = localStorage.getItem('supabase_user');
            if (localUser) {
              try {
                const parsedUser = JSON.parse(localUser);
                console.log('useSupabaseAuth: Found user in localStorage:', parsedUser);
                setUser(parsedUser);
              } catch (parseErr) {
                console.error('useSupabaseAuth: Error parsing localStorage user:', parseErr);
                setUser(null);
              }
            } else {
              setUser(null);
            }
          }
        } catch (timeoutErr) {
          console.warn('useSupabaseAuth: Session check timed out, checking localStorage');
          // Session check timed out, try localStorage
          const localUser = localStorage.getItem('supabase_user');
          if (localUser) {
            try {
              const parsedUser = JSON.parse(localUser);
              console.log('useSupabaseAuth: Using localStorage user as fallback:', parsedUser);
              setUser(parsedUser);
            } catch (parseErr) {
              console.error('useSupabaseAuth: Error parsing localStorage user:', parseErr);
              setUser(null);
            }
          } else {
            console.log('useSupabaseAuth: No localStorage user found');
            setUser(null);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('useSupabaseAuth: Error getting initial session:', err);
        // Even on error, try localStorage as last resort
        const localUser = localStorage.getItem('supabase_user');
        if (localUser) {
          try {
            const parsedUser = JSON.parse(localUser);
            console.log('useSupabaseAuth: Using localStorage user after error:', parsedUser);
            setUser(parsedUser);
          } catch (parseErr) {
            console.error('useSupabaseAuth: Error parsing localStorage user:', parseErr);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    };

    initializeAuth();

    // Fallback timeout to ensure loading is set to false
    const fallbackTimeout = setTimeout(() => {
      console.log('useSupabaseAuth: Fallback timeout - setting loading to false');
      setLoading(false);
    }, 10000); // 10 second fallback

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('useSupabaseAuth: Auth state changed:', event);
      console.log('useSupabaseAuth: New session:', session);
      console.log('useSupabaseAuth: User:', session?.user);
      console.log('useSupabaseAuth: Event type:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('useSupabaseAuth: User signed in successfully');
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        console.log('useSupabaseAuth: User signed out');
        setUser(null);
      } else if (session?.user) {
        console.log('useSupabaseAuth: Session updated with user');
        setUser(session.user);
      } else {
        console.log('useSupabaseAuth: No user in session');
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => {
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      setError(null);
      console.log('useSupabaseAuth: Attempting to sign in...');
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        console.error('useSupabaseAuth: Sign in error:', signInError);
        setError(signInError.message);
        throw signInError;
      }
      
      console.log('useSupabaseAuth: Sign in successful, user:', data.user);
      console.log('useSupabaseAuth: Sign in session:', data.session);
      
      // Set user immediately
      setUser(data.user);
      
      // Save user to localStorage as backup
      try {
        localStorage.setItem('supabase_user', JSON.stringify(data.user));
        console.log('useSupabaseAuth: User saved to localStorage');
      } catch (storageErr) {
        console.error('useSupabaseAuth: Error saving user to localStorage:', storageErr);
      }
      
      // Wait for session to be stored and refresh it
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force refresh the session to ensure it's properly stored
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('useSupabaseAuth: Session refresh after sign in:', sessionData.session);
        if (sessionError) {
          console.error('useSupabaseAuth: Session refresh error:', sessionError);
        }
      } catch (sessionErr) {
        console.error('useSupabaseAuth: Session refresh exception:', sessionErr);
      }
      
      return { user: data.user };
    } catch (err) {
      console.error('useSupabaseAuth: Sign in exception:', err);
      throw err;
    }
  };

  // Sign up with email and password
  const signUp = async (email, password, userData = {}) => {
    try {
      setError(null);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData, // Additional user metadata
        },
      });
      
      if (signUpError) {
        setError(signUpError.message);
        throw signUpError;
      }
      
      setUser(data.user);
      return { user: data.user };
    } catch (err) {
      throw err;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setError(null);
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        setError(signOutError.message);
        throw signOutError;
      }
      
      setUser(null);
      
      // Clear localStorage backup
      try {
        localStorage.removeItem('supabase_user');
        console.log('useSupabaseAuth: User removed from localStorage');
      } catch (storageErr) {
        console.error('useSupabaseAuth: Error removing user from localStorage:', storageErr);
      }
    } catch (err) {
      throw err;
    }
  };

  // Sign in with OAuth provider (e.g., Google, GitHub)
  const signInWithOAuth = async (provider) => {
    try {
      setError(null);
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (oauthError) {
        setError(oauthError.message);
        throw oauthError;
      }
      
      return data;
    } catch (err) {
      throw err;
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      setError(null);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      
      if (resetError) {
        setError(resetError.message);
        throw resetError;
      }
      
      return { success: true };
    } catch (err) {
      throw err;
    }
  };

  // Update password
  const updatePassword = async (newPassword) => {
    try {
      setError(null);
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (updateError) {
        setError(updateError.message);
        throw updateError;
      }
      
      return { success: true };
    } catch (err) {
      throw err;
    }
  };

  // Resend confirmation email
  const resendConfirmation = async (email) => {
    try {
      setError(null);
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      
      if (resendError) {
        setError(resendError.message);
        throw resendError;
      }
      
      return { success: true };
    } catch (err) {
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    resetPassword,
    updatePassword,
    resendConfirmation,
  };
}
