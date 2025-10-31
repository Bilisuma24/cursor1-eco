import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function UserTypeModal({ user, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState(null);

  const handleSelectType = async (userType) => {
    // Prevent multiple clicks
    if (loading) return;
    
    console.log('[UserTypeModal] Creating profile for user type:', userType);
    setSelectedType(userType);
    setLoading(true);
    setError('');

    try {
      console.log('[UserTypeModal] Creating profile in database...');
      
      // Create profile data object
      const profileDataToSave = {
        user_id: user.id,
        username: user.email?.split('@')[0] || 'user',
        full_name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        user_type: userType, // 'buyer' or 'seller'
      };

      // Try to upsert profile with timeout (increased to 10 seconds)
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile creation timeout')), 10000)
        );

        const profilePromise = supabase
          .from('profile')
          .upsert(profileDataToSave, {
            onConflict: 'user_id'
          })
          .select()
          .single();

        const { data, error: profileError } = await Promise.race([
          profilePromise,
          timeoutPromise
        ]);

        if (profileError) {
          console.error('[UserTypeModal] Profile creation error:', profileError);
          // Check if it's a constraint/conflict error (profile might already exist)
          if (profileError.code === '23505' || profileError.message?.includes('duplicate')) {
            console.log('[UserTypeModal] Profile already exists, continuing...');
          } else {
            throw profileError;
          }
        } else {
          console.log('[UserTypeModal] Profile created/updated successfully:', data);
        }
      } catch (dbError) {
        console.error('[UserTypeModal] Database error:', dbError);
        // If database fails, save to localStorage and continue anyway
        console.log('[UserTypeModal] Falling back to localStorage');
        try {
          localStorage.setItem('user_profile', JSON.stringify({
            ...profileDataToSave,
            created_at: new Date().toISOString(),
          }));
          console.log('[UserTypeModal] Saved to localStorage as fallback');
        } catch (localError) {
          console.error('[UserTypeModal] Failed to save to localStorage:', localError);
        }
        
        // Still continue - don't block the user, call onComplete immediately
        console.log('[UserTypeModal] Profile setup completed (localStorage), calling onComplete');
        onComplete(userType);
        setLoading(false);
        return; // Exit early to prevent duplicate onComplete calls
      }

      // Update user metadata with user type (this might fail, but that's okay)
      try {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { user_type: userType }
        });

        if (updateError) {
          console.warn('[UserTypeModal] User metadata update error (non-critical):', updateError);
        }
      } catch (metadataError) {
        console.warn('[UserTypeModal] User metadata update failed (non-critical):', metadataError);
      }

      console.log('[UserTypeModal] Profile setup completed, calling onComplete');
      onComplete(userType);
    } catch (err) {
      console.error('[UserTypeModal] Error saving user type:', err);
      
      // Even on error, save to localStorage and continue
      try {
        const fallbackProfile = {
          user_id: user.id,
          username: user.email?.split('@')[0] || 'user',
          full_name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          user_type: userType,
          created_at: new Date().toISOString(),
        };
        localStorage.setItem('user_profile', JSON.stringify(fallbackProfile));
        console.log('[UserTypeModal] Saved fallback profile to localStorage');
      } catch (localError) {
        console.error('[UserTypeModal] Failed to save fallback:', localError);
      }
      
      // Show error but still allow user to continue
      if (err.message?.includes('timeout') || err.message?.includes('network') || err.message?.includes('connection')) {
        setError('Database connection issue. Your profile will be saved locally. Please try refreshing the page later.');
        // Still call onComplete immediately to allow user to continue
        console.log('[UserTypeModal] Continuing despite timeout error');
        onComplete(userType);
      } else {
        setError(err.message || 'Failed to save to database, but continuing with local profile.');
        // Still call onComplete immediately
        onComplete(userType);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4 text-center">Welcome! Choose Your Role</h2>
        <p className="text-gray-600 mb-6 text-center">Are you a buyer or a seller?</p>
        
        <div className="space-y-4">
          <button
            onClick={() => handleSelectType('buyer')}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading && selectedType === 'buyer' ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Profile...
              </>
            ) : (
              '👤 I\'m a Buyer'
            )}
          </button>
          
          <button
            onClick={() => handleSelectType('seller')}
            disabled={loading}
            className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading && selectedType === 'seller' ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Profile...
              </>
            ) : (
              '🏪 I\'m a Seller'
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
            <div className="text-center">
              <button
                onClick={() => {
                  console.log('Skipping database, using local storage');
                  // Create a mock profile data and call onComplete
                  const mockProfile = {
                    user_id: user.id,
                    username: user.email?.split('@')[0] || 'user',
                    full_name: user.user_metadata?.name || 'User',
                    user_type: 'buyer', // Default to buyer
                  };
                  
                  // Store in localStorage as fallback
                  localStorage.setItem('user_profile', JSON.stringify(mockProfile));
                  onComplete('buyer');
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                Skip database and continue as buyer
              </button>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-500 mt-4 text-center">
          Don't worry, you can change this later in your profile settings.
        </p>
      </div>
    </div>
  );
}
