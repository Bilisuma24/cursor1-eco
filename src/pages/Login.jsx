import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, ShoppingBag, Heart, BellRing, Settings, Home, BarChart3 } from "lucide-react";
import { useAuth } from "../contexts/SupabaseAuthContext";
import { useUserRole } from "../hooks/useUserRole";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const { user } = useAuth();
  const { userRole, isSeller, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [creatingProfile, setCreatingProfile] = useState(false);

  // Automatically create profile with "buyer" role ONLY if user has no role AND no profile exists
  useEffect(() => {
    const autoCreateProfile = async () => {
      if (user && !roleLoading && !userRole && !creatingProfile) {
        console.log('User has no role, checking if profile exists...');
        setCreatingProfile(true);
        
        try {
          // First, check if profile exists in database
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profile')
            .select('user_type, user_id')
            .eq('user_id', user.id)
            .single();

          // If profile exists, use its user_type (NEVER override existing profiles)
          if (existingProfile) {
            console.log('✅ Profile exists with user_type:', existingProfile.user_type);
            // NEVER update existing profile - just redirect based on user_type
            if (existingProfile.user_type === "seller") {
              navigate("/seller-dashboard", { replace: true });
            } else {
              navigate("/profile", { replace: true });
            }
            setCreatingProfile(false);
            return;
          }

          // Check localStorage for profile data (from signup)
          const localProfile = localStorage.getItem('user_profile');
          let userType = 'buyer'; // Default fallback
          
          if (localProfile) {
            try {
              const parsed = JSON.parse(localProfile);
              if (parsed.user_type && parsed.user_id === user.id) {
                userType = parsed.user_type;
                console.log('Found user_type in localStorage:', userType);
              }
            } catch (e) {
              console.warn('Error parsing localStorage profile:', e);
            }
          }

          // Check user metadata for user_type (set during signup)
          if (user.user_metadata?.user_type) {
            userType = user.user_metadata.user_type;
            console.log('Found user_type in user metadata:', userType);
          }

          console.log('Creating NEW profile with user_type:', userType);
          
          const profileData = {
            user_id: user.id,
            username: user.email?.split('@')[0] || 'user',
            full_name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            user_type: userType, // Use detected user_type, not always 'buyer'
          };

          // CRITICAL: Use INSERT, not UPSERT - only create if doesn't exist
          // This prevents overwriting existing profiles
          const { data: insertData, error: insertError } = await supabase
            .from('profile')
            .insert(profileData)
            .select()
            .single();

          // If insert fails because profile exists, fetch existing profile and use its user_type
          if (insertError && (insertError.code === '23505' || insertError.message?.includes('duplicate'))) {
            console.log('⚠️ Profile already exists, fetching existing profile...');
            const { data: fetchedProfile, error: fetchErr } = await supabase
              .from('profile')
              .select('user_type, user_id')
              .eq('user_id', user.id)
              .single();
            
            if (fetchErr) {
              console.error('Error fetching existing profile:', fetchErr);
            } else if (fetchedProfile) {
              userType = fetchedProfile.user_type || userType;
              console.log('✅ Using EXISTING profile user_type (NOT overwriting):', userType);
              // CRITICAL: Do NOT update the profile - just use what exists
            }
          } else if (insertError) {
            console.warn('Profile creation error:', insertError);
            // Save to localStorage as fallback
            localStorage.setItem('user_profile', JSON.stringify({
              ...profileData,
              created_at: new Date().toISOString(),
            }));
          } else if (insertData) {
            console.log('✅ NEW Profile created with user_type:', insertData.user_type || userType);
          }

          // Update user metadata (optional, non-critical)
          try {
            await supabase.auth.updateUser({
              data: { user_type: userType }
            });
          } catch (e) {
            console.warn('User metadata update error (non-critical):', e);
          }

          // Redirect based on user_type
          if (userType === "seller") {
            navigate("/seller-dashboard", { replace: true });
          } else {
            navigate("/profile", { replace: true });
          }
        } catch (error) {
          console.error('Error auto-creating profile:', error);
          // Still redirect to profile - don't block the user
          navigate("/profile", { replace: true });
        } finally {
          setCreatingProfile(false);
        }
      } else if (user && !roleLoading && userRole) {
        // User has a role - redirect based on role
        if (userRole === "seller") {
          navigate("/seller-dashboard", { replace: true });
        } else if (userRole === "buyer") {
          navigate("/profile", { replace: true });
        }
      }
    };

    autoCreateProfile();
  }, [user, userRole, roleLoading, navigate, creatingProfile]);

  // Show loading while checking auth state, role, or creating profile
  if (user && (roleLoading || creatingProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{creatingProfile ? 'Setting up your account...' : 'Checking your account...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-md mx-auto px-4 py-4">
        {/* Profile Section - Matching Account Page Design */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-2xl font-semibold">
              <User className="w-10 h-10 text-gray-500" />
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
                >
                  Login
                </button>
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        <RegisterModal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} />

        {/* Profile Menu - Horizontal - Same as Account Page */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between gap-2 overflow-x-auto">
            <Link
              to="/login"
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-orange-50 text-orange-600 font-medium min-w-[60px]"
            >
              <User className="w-5 h-5" />
              <span className="text-xs">Profile</span>
            </Link>
            {isSeller && (
              <Link
                to="/seller-dashboard"
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors min-w-[60px]"
              >
                <BarChart3 className="w-5 h-5" />
                <span className="text-xs">Dashboard</span>
              </Link>
            )}
            <Link
              to="/orders"
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors min-w-[60px]"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-xs">Orders</span>
            </Link>
            <Link
              to="/wishlist"
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors min-w-[60px]"
            >
              <Heart className="w-5 h-5" />
              <span className="text-xs">Wishlist</span>
            </Link>
            <Link
              to="/settings"
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors min-w-[60px]"
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs">Settings</span>
            </Link>
            <Link
              to="/price-alerts"
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors min-w-[60px]"
            >
              <BellRing className="w-5 h-5" />
              <span className="text-xs">Price Alerts</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
