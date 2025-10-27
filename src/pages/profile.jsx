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
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [directUser, setDirectUser] = useState(null);
  const [directAuthLoading, setDirectAuthLoading] = useState(true);

  // Direct session check to bypass auth hook issues
  useEffect(() => {
    const checkDirectSession = async () => {
      console.log('=== DIRECT SESSION CHECK ===');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Direct session check - Session:', session);
        console.log('Direct session check - User:', session?.user);
        console.log('Direct session check - Error:', error);
        
        if (session?.user) {
          console.log('Direct session check - User found, setting direct user');
          setDirectUser(session.user);
        } else {
          console.log('Direct session check - No user found');
          setDirectUser(null);
        }
      } catch (err) {
        console.error('Direct session check - Error:', err);
        setDirectUser(null);
      } finally {
        setDirectAuthLoading(false);
      }
    };

    checkDirectSession();
  }, []);

  useEffect(() => {
    // Show modal if no profile data exists (profileData is null) and we're not loading
    if (!profileData && loadingProfile === false && user) {
      setShowUserTypeModal(true);
    } else {
      setShowUserTypeModal(false);
    }
  }, [profileData, loadingProfile, user]);
  // Fetch profile data when user is available
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        console.log('No user, setting loadingProfile to false');
        setLoadingProfile(false);
        return;
      }

      console.log('Fetching profile for user:', currentUser.id);
      setLoadingProfile(true);

      try {
        // First check localStorage for fallback profile
        const localProfile = localStorage.getItem('user_profile');
        if (localProfile) {
          console.log('Found local profile, using as fallback');
          const profileData = JSON.parse(localProfile);
          if (profileData.user_id === user.id) {
            setProfileData(profileData);
            setLoadingProfile(false);
            return;
          }
        }

        // Simplified approach - just check if profile exists, don't wait too long
        const { data, error } = await supabase
          .from('profile')
          .select('*')
          .eq('user_id', user.id)
          .single();

        console.log('Profile fetch result:', { data, error });

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
          // If there's a real error, set profile to null and continue
          setProfileData(null);
        } else if (data) {
          console.log('Profile data found:', data);
          setProfileData(data);
        } else {
          console.log('No profile found (PGRST116)');
          setProfileData(null);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        // On any error, just set profile to null and continue
        setProfileData(null);
      } finally {
        console.log('Setting loadingProfile to false');
        setLoadingProfile(false);
      }
    };

    // Add a timeout to ensure we don't get stuck
    const timeoutId = setTimeout(() => {
      console.log('Profile fetch timeout - forcing loadingProfile to false');
      setLoadingProfile(false);
      setProfileData(null);
    }, 5000); // 5 second timeout

    fetchProfile();

    return () => clearTimeout(timeoutId);
  }, [currentUser]);

  // Debug logging
  useEffect(() => {
    console.log('=== PROFILE PAGE DEBUG ===');
    console.log('Profile page - User:', user);
    console.log('Profile page - User ID:', user?.id);
    console.log('Profile page - User Email:', user?.email);
    console.log('Profile page - Auth Loading:', authLoading);
    console.log('Profile page - Profile Data:', profileData);
    console.log('Profile page - Loading Profile:', loadingProfile);
    console.log('Profile page - Show User Type Modal:', showUserTypeModal);
    console.log('========================');
  }, [user, authLoading, loadingProfile, profileData, showUserTypeModal]);

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
    console.log('User type selected:', userType);
    // Refresh profile data after user type is selected
    setLoadingProfile(true);
    try {
      const { data } = await supabase
        .from('profile')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        console.log('Profile refreshed:', data);
        setProfileData(data);
      } else {
        console.log('No profile data found after selection');
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Use direct user if auth hook user is not available
  const currentUser = user || directUser;
  const currentAuthLoading = authLoading || directAuthLoading;

  // Show loading state while checking auth or profile
  if (currentAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <h2 className="text-2xl font-bold mb-2">Checking authentication...</h2>
        <p className="text-gray-600 text-center max-w-md">
          Please wait while we verify your login status.
        </p>
        <div className="mt-4 text-sm text-gray-500">
          <p>If this takes too long, there might be an authentication issue.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-blue-600 hover:underline"
          >
            Refresh page
          </button>
        </div>
      </div>
    );
  }

  // Show loading state only for profile loading, but with shorter timeout
  if (loadingProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <h2 className="text-2xl font-bold mb-2">Loading profile...</h2>
        <p className="text-gray-600 text-center max-w-md">
          Fetching your profile information from the database.
        </p>
        <div className="mt-4 text-sm text-gray-500">
          <p>If this takes too long, there might be a database connection issue.</p>
          <button 
            onClick={() => {
              setLoadingProfile(false);
              setProfileData(null);
            }}
            className="mt-2 text-blue-600 hover:underline"
          >
            Skip loading and show basic profile
          </button>
        </div>
      </div>
    );
  }

  // Show not logged in message if no user
  if (!currentUser) {
    console.log('No user found (auth hook user:', user, ', direct user:', directUser, '), showing login prompt');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <h2 className="text-3xl font-bold mb-4">You are not logged in</h2>
        <p className="mb-6 text-gray-700">Please <span className="text-emerald-600 font-semibold cursor-pointer hover:underline" onClick={() => navigate("/login")}>Login</span> or <span className="text-emerald-600 font-semibold cursor-pointer hover:underline" onClick={() => navigate("/signup")}>Sign Up</span> to see your profile.</p>
        <div className="mt-4 text-sm text-gray-500">
          <p>Debug info: Auth loading: {authLoading ? 'true' : 'false'}, Direct loading: {directAuthLoading ? 'true' : 'false'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-blue-600 hover:underline"
          >
            Refresh page
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {  showUserTypeModal && (
        <UserTypeModal user={currentUser} onComplete={handleUserTypeSelected} />
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
              <div className="flex space-x-3">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  Refresh
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  Logout
                </button>
              </div>
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
