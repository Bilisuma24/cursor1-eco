import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function UserTypeModal({ user, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSelectType = async (userType) => {
    setLoading(true);
    setError('');

    try {
      // Create profile in Supabase
      const { error: profileError } = await supabase
        .from('profile')
        .upsert({
          user_id: user.id,
          username: user.email?.split('@')[0] || 'user',
          full_name: user.user_metadata?.name || 'User',
          user_type: userType, // 'buyer' or 'seller'
        }, {
          onConflict: 'user_id'
        });

      if (profileError) throw profileError;

      // Update user metadata with user type
      const { error: updateError } = await supabase.auth.updateUser({
        data: { user_type: userType }
      });

      if (updateError) throw updateError;

      onComplete(userType);
    } catch (err) {
      console.error('Error saving user type:', err);
      setError(err.message || 'Failed to save your selection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4 text-center">Welcome! Choose Your Role</h2>
        <p className="text-gray-600 mb-6 text-center">Are you a buyer or a seller?</p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => handleSelectType('buyer')}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
          >
            👤 I'm a Buyer
          </button>
          
          <button
            onClick={() => handleSelectType('seller')}
            disabled={loading}
            className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
          >
            🏪 I'm a Seller
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-4 text-center">
          Don't worry, you can change this later in your profile settings.
        </p>
      </div>
    </div>
  );
}
