import { useState, useEffect } from 'react';
import { useSupabaseAuth } from './useSupabaseAuth';
import { supabase } from '../lib/supabaseClient';

export function useUserRole() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profile')
          .select('user_type')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user role:', error);
          setUserRole(null);
        } else if (data) {
          setUserRole(data.user_type);
        } else {
          // No profile found
          setUserRole(null);
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return {
    userRole,
    loading: authLoading || loading,
    isSeller: userRole === 'seller',
    isBuyer: userRole === 'buyer',
    hasRole: !!userRole
  };
}
