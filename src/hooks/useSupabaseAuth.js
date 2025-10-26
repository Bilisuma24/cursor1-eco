import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useSupabaseAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get initial session
  useEffect(() => {
    console.log('useSupabaseAuth: Getting initial session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('useSupabaseAuth: Initial session:', session);
      console.log('useSupabaseAuth: User from session:', session?.user);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('useSupabaseAuth: Auth state changed:', event);
      console.log('useSupabaseAuth: New session:', session);
      console.log('useSupabaseAuth: User:', session?.user);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
      setUser(data.user);
      
      // Wait for session to be stored
      await new Promise(resolve => setTimeout(resolve, 200));
      
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
        redirectTo: `${window.location.origin}/auth/reset-password`,
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
