import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import { supabase } from "../lib/supabaseClient";
import UserTypeModal from "../components/UserTypeModal";

export default function Profile() {
  const { user, signOut, loading: authLoading } = useSupabaseAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.name || '',
    email: user?.email || '',
    phone: user?.user_metadata?.phone || ''
  });
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);

  useEffect(() => {
    if (profileData?.user_type === null && loadingProfile === false && user) {
      setShowUserTypeModal(true);
    } else {
      setShowUserTypeModal(false);
    }
  }, [profileData, loadingProfile, user]);
  // Fetch profile data when user is available
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoadingProfile(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profile')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
        }

        if (data) {
          setProfileData(data);
        } else {
          // No profile found
          setProfileData(null);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Debug logging
  useEffect(() => {
    console.log('Profile page - User:', user);
    console.log('Profile page - Auth Loading:', authLoading);
    console.log('Profile page - Loading Profile:', loadingProfile);
    console.log('Profile page - Profile Data:', profileData);
    console.log('Profile page - Should Show Modal:', !loadingProfile && !profileData && user);
  }, [user, authLoading, loadingProfile, profileData]);

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: profileData?.full_name || user.user_metadata?.name || '',
        email: user.email || '',
        phone: profileData?.phone || ''
      });
    }
  }, [user, profileData]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: Update profile in Supabase profile table
      // For now, just update local state
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserTypeSelected = async (userType) => {
    // Refresh profile data after user type is selected
    setLoadingProfile(true);
    try {
      const { data } = await supabase
        .from('profile')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setProfileData(data);
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Show loading state while checking auth or profile
  if (authLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <h2 className="text-3xl font-bold mb-4">Loading...</h2>
      </div>
    );
  }

  // Show not logged in message if no user
  if (!user) {
    console.log('No user found, showing login prompt');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <h2 className="text-3xl font-bold mb-4">You are not logged in</h2>
        <p className="mb-6 text-gray-700">Please <span className="text-emerald-600 font-semibold cursor-pointer hover:underline" onClick={() => navigate("/login")}>Login</span> or <span className="text-emerald-600 font-semibold cursor-pointer hover:underline" onClick={() => navigate("/signup")}>Sign Up</span> to see your profile.</p>
      </div>
    );
  }

  return (
    <>
      {  showUserTypeModal && (
        <UserTypeModal user={user} onComplete={handleUserTypeSelected} />
      )}

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
                {profileData?.user_type && (
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                    profileData.user_type === 'seller' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {profileData.user_type === 'seller' ? '🏪 Seller' : '👤 Buyer'}
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Profile Info */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
              
              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="text-gray-900">{profileData?.full_name || user.user_metadata?.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <p className="text-gray-900">{profileData?.username || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-gray-900">{profileData?.phone || user.user_metadata?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="text-gray-900">{profileData?.address || 'Not provided'}</p>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>

            {/* Account Stats */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Member since</span>
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email verified</span>
                  <span className={`font-medium ${user.email_confirmed_at ? 'text-green-600' : 'text-red-600'}`}>
                    {user.email_confirmed_at ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last seen</span>
                  <span className="font-medium">
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </>
  );
}
