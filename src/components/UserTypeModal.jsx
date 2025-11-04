import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabaseClient';

export default function UserTypeModal({ user, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const modalRef = useRef(null);
  
  // Swipe gesture handlers
  const minSwipeDistance = 50;
  
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };
  
  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchEnd - touchStart;
    if (distance > minSwipeDistance) {
      // Can't swipe to close this modal - it's required
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

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

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm mobile-modal-backdrop z-50 sm:flex sm:items-center sm:justify-center sm:p-4"
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl p-6 sm:p-8 max-w-md w-full mx-auto bottom-sheet animate-bottom-sheet-up absolute bottom-0 left-0 right-0 sm:relative sm:bottom-auto sm:left-auto sm:right-auto"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Swipe indicator */}
        <div className="flex justify-center pt-2 pb-4 sm:hidden">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full bottom-sheet-handle"></div>
        </div>
        
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center text-gray-900 dark:text-white">Welcome! Choose Your Role</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center text-sm sm:text-base">Are you a buyer or a seller?</p>
        
        <div className="space-y-3 sm:space-y-4">
          <button
            onClick={() => handleSelectType('buyer')}
            disabled={loading}
            className="w-full min-h-[48px] bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center touch-manipulation active:scale-95 shadow-lg"
          >
            {loading && selectedType === 'buyer' ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Profile...
              </>
            ) : (
              <>
                <span className="text-xl mr-2">👤</span>
                <span>I'm a Buyer</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => handleSelectType('seller')}
            disabled={loading}
            className="w-full min-h-[48px] bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center touch-manipulation active:scale-95 shadow-lg"
          >
            {loading && selectedType === 'seller' ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Profile...
              </>
            ) : (
              <>
                <span className="text-xl mr-2">🏪</span>
                <span>I'm a Seller</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 sm:mt-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4 text-sm break-words">
              {error}
            </div>
            <div className="text-center">
              <button
                onClick={() => {
                  console.log('Skipping database, using local storage');
                  const mockProfile = {
                    user_id: user.id,
                    username: user.email?.split('@')[0] || 'user',
                    full_name: user.user_metadata?.name || 'User',
                    user_type: 'buyer',
                  };
                  localStorage.setItem('user_profile', JSON.stringify(mockProfile));
                  onComplete('buyer');
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline touch-manipulation min-h-[44px] flex items-center justify-center"
              >
                Skip database and continue as buyer
              </button>
            </div>
          </div>
        )}

        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-4 sm:mt-6 text-center">
          Don't worry, you can change this later in your profile settings.
        </p>
      </div>
    </div>,
    document.body
  );
}
