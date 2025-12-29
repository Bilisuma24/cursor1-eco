import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { supabase } from '../lib/supabaseClient';

export function useUserRole() {
  const { user, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let timeoutId = null;

    const fetchUserRole = async () => {
      // If auth is still loading, wait for it to complete
      if (authLoading) {
        return;
      }

      if (!user) {
        if (mounted) {
          setUserRole(null);
          setLoading(false);
        }
        return;
      }

      // First, allow overriding role via auth metadata without DB changes (for admins)
      if (user?.user_metadata?.is_admin === true || user?.user_metadata?.role === 'admin') {
        setUserRole('admin');
        setLoading(false);
        return;
      }

      // Set a timeout to ensure loading doesn't hang forever
      timeoutId = setTimeout(() => {
        if (mounted) {
          // Only log timeout in development mode
          if (import.meta.env.DEV) {
            console.warn('[useUserRole] Role fetch timed out, checking localStorage');
          }
          // Check localStorage as fallback before giving up
          try {
            const localProfile = localStorage.getItem('user_profile');
            if (localProfile) {
              const parsed = JSON.parse(localProfile);
              if (parsed.user_id === user.id && parsed.user_type) {
                if (import.meta.env.DEV) {
                  console.log('[useUserRole] Found role in localStorage after timeout:', parsed.user_type);
                }
                setUserRole(parsed.user_type);
                setLoading(false);
                return;
              }
            }
          } catch (e) {
            // Ignore localStorage errors
          }
          if (import.meta.env.DEV) {
            console.warn('[useUserRole] No role found, proceeding without role');
          }
          setUserRole(null);
          setLoading(false);
        }
      }, 8000); // 8 second timeout to prevent hanging on slow network or 401s

      try {
        const { data, error } = await supabase
          .from('profile')
          .select('user_type')
          .eq('user_id', user.id)
          .single();

        if (timeoutId) clearTimeout(timeoutId);

        if (mounted) {
          if (error) {
            // PGRST116 = no rows returned (no profile found) - check localStorage as fallback
            if (error.code === 'PGRST116') {
              if (import.meta.env.DEV) {
                console.log('[useUserRole] No profile found in database - checking localStorage');
              }
              // Check localStorage for fallback profile
              try {
                const localProfile = localStorage.getItem('user_profile');
                if (localProfile) {
                  const parsed = JSON.parse(localProfile);
                  if (parsed.user_id === user.id && parsed.user_type) {
                    if (import.meta.env.DEV) {
                      console.log('[useUserRole] Found profile in localStorage:', parsed.user_type);
                    }
                    setUserRole(parsed.user_type);
                    setLoading(false);
                    return;
                  }
                }
              } catch (e) {
                // Ignore localStorage errors
              }
              setUserRole(null);
            } else {
              console.error('Error fetching user role:', error);
              // Try localStorage as fallback
              try {
                const localProfile = localStorage.getItem('user_profile');
                if (localProfile) {
                  const parsed = JSON.parse(localProfile);
                  if (parsed.user_id === user.id && parsed.user_type) {
                    if (import.meta.env.DEV) {
                      console.log('[useUserRole] Using localStorage fallback:', parsed.user_type);
                    }
                    setUserRole(parsed.user_type);
                    setLoading(false);
                    return;
                  }
                }
              } catch (e) {
                // Ignore localStorage errors
              }
              setUserRole(null);
            }
          } else if (data && data.user_type) {
            setUserRole(data.user_type);
          } else {
            // No profile found or no user_type in data - check localStorage
            try {
              const localProfile = localStorage.getItem('user_profile');
              if (localProfile) {
                const parsed = JSON.parse(localProfile);
                if (parsed.user_id === user.id && parsed.user_type) {
                  if (import.meta.env.DEV) {
                    console.log('[useUserRole] Using localStorage fallback (no data):', parsed.user_type);
                  }
                  setUserRole(parsed.user_type);
                  setLoading(false);
                  return;
                }
              }
            } catch (e) {
              // Ignore localStorage errors
            }
            setUserRole(null);
          }
          setLoading(false);
        }
      } catch (err) {
        if (timeoutId) clearTimeout(timeoutId);
        console.error('Error fetching user role:', err);
        if (mounted) {
          // Try localStorage as fallback
          try {
            const localProfile = localStorage.getItem('user_profile');
            if (localProfile) {
              const parsed = JSON.parse(localProfile);
              if (parsed.user_id === user.id && parsed.user_type) {
                if (import.meta.env.DEV) {
                  console.log('[useUserRole] Using localStorage fallback (catch):', parsed.user_type);
                }
                setUserRole(parsed.user_type);
                setLoading(false);
                return;
              }
            }
          } catch (e) {
            // Ignore localStorage errors
          }
          setUserRole(null);
          setLoading(false);
        }
      }
    };

    fetchUserRole();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, authLoading]);

  // Only return loading as true if auth is loading OR role is loading (and auth is done)
  return {
    userRole,
    loading: authLoading || loading,
    isAdmin: userRole === 'admin',
    isSeller: userRole === 'seller',
    isBuyer: userRole === 'buyer',
    hasRole: !!userRole
  };
}
