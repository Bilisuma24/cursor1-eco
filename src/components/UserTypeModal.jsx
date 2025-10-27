import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function UserTypeModal({ user, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSelectType = async (userType) => {
    console.log('Creating profile for user type:', userType);
    setLoading(true);
    setError('');

    try {
      console.log('Creating profile in database...');
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile creation timeout')), 10000)
      );

      const profilePromise = supabase
        .from('profile')
        .upsert({
          user_id: user.id,
          username: user.email?.split('@')[0] || 'user',
          full_name: user.user_metadata?.name || 'User',
          user_type: userType, // 'buyer' or 'seller'
        }, {
          onConflict: 'user_id'
        });

      const { error: profileError } = await Promise.race([profilePromise, timeoutPromise]);

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      console.log('Profile created successfully, updating user metadata...');
      
      // Update user metadata with user type (this might fail, but that's okay)
      try {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { user_type: userType }
        });

        if (updateError) {
          console.warn('User metadata update error (non-critical):', updateError);
          // Don't throw error for metadata update failure
        }
      } catch (metadataError) {
        console.warn('User metadata update failed (non-critical):', metadataError);
        // Continue anyway
      }

      console.log('Profile setup completed successfully');
      onComplete(userType);
    } catch (err) {
      console.error('Error saving user type:', err);
      
      // If it's a timeout or database error, show a helpful message
      if (err.message.includes('timeout') || err.message.includes('network') || err.message.includes('connection')) {
        setError('Database connection issue. Please check your internet connection and try again.');
      } else {
        setError(err.message || 'Failed to save your selection. Please try again.');
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
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
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
            className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
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
