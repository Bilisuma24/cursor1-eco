import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { User, ShoppingBag, Settings, LogOut, Heart, Package, Home } from "lucide-react";
import LevelBadge from "../components/achievements/LevelBadge";
import LevelProgress from "../components/achievements/LevelProgress";
import AchievementList from "../components/achievements/AchievementList";
import { getUserLevel, getUserAchievements } from "../services/achievementService";
import { useAuth } from "../contexts/SupabaseAuthContext";
import { useUserRole } from "../hooks/useUserRole";
import { supabase } from "../lib/supabaseClient";
import { ProtectedRoute } from "../components/ProtectedRoute";

export default function Profile() {
  const { user, signOut, loading: authLoading, updatePassword, updateUserMetadata } = useAuth();
  const { userRole, isSeller, isBuyer, isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    phone: "",
    address: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [level, setLevel] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch profile data
  useEffect(() => {
    let mounted = true;
    let timeoutId = null;

    const fetchProfile = async () => {
      if (!user) {
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);

      // Set timeout to prevent infinite loading - use shorter timeout
      timeoutId = setTimeout(() => {
        if (mounted) {
          if (import.meta.env.DEV) {
            console.warn('[Profile] Profile fetch timed out, using minimal profile');
          }
          const minimalProfile = {
            user_id: user.id,
            username: user.email?.split("@")[0] || "user",
            full_name: user.user_metadata?.name || "",
            phone: "",
            address: "",
            user_type: userRole || null,
          };
          setProfileData(minimalProfile);
          setFormData({
            full_name: minimalProfile.full_name,
            username: minimalProfile.username,
            phone: "",
            address: "",
          });
          setLoadingProfile(false);
        }
      }, 2000); // 2 second timeout - faster fallback

      try {
        const { data, error } = await supabase
          .from("profile")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (timeoutId) clearTimeout(timeoutId);

        if (!mounted) return;

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching profile:", error);
          // Create a minimal profile if none exists
          const minimalProfile = {
            user_id: user.id,
            username: user.email?.split("@")[0] || "user",
            full_name: user.user_metadata?.name || "",
            phone: "",
            address: "",
            user_type: userRole || null,
          };
          setProfileData(minimalProfile);
          setFormData({
            full_name: minimalProfile.full_name,
            username: minimalProfile.username,
            phone: "",
            address: "",
          });
        } else if (data) {
          setProfileData(data);
          setFormData({
            full_name: data.full_name || user.user_metadata?.name || "",
            username: data.username || user.email?.split("@")[0] || "",
            phone: data.phone || "",
            address: data.address || "",
          });
        } else {
          // No profile found - create minimal one
          const minimalProfile = {
            user_id: user.id,
            username: user.email?.split("@")[0] || "user",
            full_name: user.user_metadata?.name || "",
            phone: "",
            address: "",
            user_type: userRole || null,
          };
          setProfileData(minimalProfile);
          setFormData({
            full_name: minimalProfile.full_name,
            username: minimalProfile.username,
            phone: "",
            address: "",
          });
        }
      } catch (err) {
        if (timeoutId) clearTimeout(timeoutId);
        console.error("Exception fetching profile:", err);
        if (mounted) {
          const minimalProfile = {
            user_id: user.id,
            username: user.email?.split("@")[0] || "user",
            full_name: user.user_metadata?.name || "",
            phone: "",
            address: "",
            user_type: userRole || null,
          };
          setProfileData(minimalProfile);
          setFormData({
            full_name: minimalProfile.full_name,
            username: minimalProfile.username,
            phone: "",
            address: "",
          });
        }
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    };

    if (user) {
      fetchProfile();
    } else {
      setLoadingProfile(false);
    }

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user]); // Remove userRole dependency to avoid waiting for it

  // Fetch achievements/level (buyer)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user) return;
        const lvl = await getUserLevel(user.id, 'buyer');
        const ach = await getUserAchievements(user.id, 'buyer');
        if (mounted) { setLevel(lvl); setAchievements(ach); }
      } catch {}
    })();
    return () => { mounted = false; };
  }, [user]);

  const validateProfileForm = () => {
    const errors = {};

    if (!formData.full_name.trim()) {
      errors.full_name = "Full name is required";
    }

    if (!formData.username.trim()) {
      errors.username = "Username is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateProfileForm()) {
      return;
    }

    setLoading(true);

    try {
      // Update profile in database
      const { data, error: profileError } = await supabase
        .from("profile")
        .upsert(
          {
            user_id: user.id,
            full_name: formData.full_name.trim(),
            username: formData.username.trim(),
            phone: formData.phone.trim() || null,
            address: formData.address.trim() || null,
            user_type: profileData?.user_type || userRole,
          },
          { onConflict: "user_id" }
        )
        .select()
        .single();

      if (profileError) {
        throw profileError;
      }

      // Update user metadata
      await updateUserMetadata({
        name: formData.full_name.trim(),
      });

      setProfileData(data);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Update profile error:", err);
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validatePasswordForm()) {
      return;
    }

    // Note: Supabase doesn't verify current password before updating
    // In production, you'd want to verify it first
    setLoading(true);

    try {
      await updatePassword(passwordData.newPassword);
      setSuccess("Password updated successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordChange(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Update password error:", err);
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Add loading state
      setLoading(true);
      
      // Sign out
      await signOut();
      
      // Small delay to ensure state clears
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force full page reload to clear all React state
      window.location.replace("/");
    } catch (err) {
      console.error("Logout error:", err);
      // Even if signOut fails, clear everything and redirect
      try {
        localStorage.clear();
      } catch (e) {
        // Ignore localStorage errors
      }
      // Force redirect
      window.location.replace("/");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const getAvatarUrl = () => user?.user_metadata?.avatar_url || "";

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      setUploadingAvatar(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `avatars/${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      await updateUserMetadata({ avatar_url: publicUrl });
      setSuccess("Profile picture updated!");
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      console.error('Avatar upload error:', err);
      setError(err.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <ProtectedRoute>
      {/* Show loading state only if still actively loading profile data */}
      {loadingProfile ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      ) : user ? (
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar Menu */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg p-4 sticky top-4">
                  <div className="space-y-2">
                    <Link
                      to="/profile"
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        location.pathname === '/profile'
                          ? 'bg-orange-50 text-orange-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <User className="w-5 h-5" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/orders"
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        location.pathname === '/orders'
                          ? 'bg-orange-50 text-orange-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ShoppingBag className="w-5 h-5" />
                      <span>Orders</span>
                    </Link>
                    <Link
                      to="/wishlist"
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        location.pathname === '/wishlist'
                          ? 'bg-orange-50 text-orange-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Heart className="w-5 h-5" />
                      <span>Wishlist</span>
                    </Link>
                    {(isSeller || profileData?.user_type === 'seller') && (
                      <Link
                        to="/seller-dashboard"
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                          location.pathname?.startsWith('/seller-dashboard')
                            ? 'bg-orange-50 text-orange-600 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Package className="w-5 h-5" />
                        <span>Seller Dashboard</span>
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                          location.pathname?.startsWith('/admin')
                            ? 'bg-orange-50 text-orange-600 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Settings className="w-5 h-5" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}
                    <Link
                      to="/settings"
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        location.pathname === '/settings'
                          ? 'bg-orange-50 text-orange-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Settings className="w-5 h-5" />
                      <span>Settings</span>
                    </Link>
                    <Link
                      to="/"
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Home className="w-5 h-5" />
                      <span>Home</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setAvatarModalOpen(true)}
                  className="relative group"
                  title="View profile picture"
                >
                  {getAvatarUrl() ? (
                    <img
                      src={getAvatarUrl()}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-orange-500 text-white flex items-center justify-center text-xl font-semibold">
                      {(user?.user_metadata?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                  {(userRole || profileData?.user_type) && (
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        (isSeller || profileData?.user_type === 'seller')
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {(isSeller || profileData?.user_type === 'seller') ? "🏪 Seller" : "👤 Buyer"}
                    </span>
                  )}
                  {level && (
                    <LevelBadge
                      levelName={level?.badge?.split('/')?.pop()?.replace('.svg','')}
                      badge={level?.badge}
                    />
                  )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>

            {/* Avatar controls */}
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={openFileDialog}
                  disabled={uploadingAvatar}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 disabled:opacity-50"
                >
                  {uploadingAvatar ? 'Uploading...' : (getAvatarUrl() ? 'Change Picture' : 'Add Picture')}
                </button>
                {getAvatarUrl() && (
                  <button
                    type="button"
                    onClick={() => setAvatarModalOpen(true)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    View Picture
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {/* Achievements section */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <LevelBadge levelName={level?.badge?.split('/').pop()?.replace('.svg','')} badge={level?.badge} />
              </div>
              <div className="mt-3">
                <LevelProgress xp={level?.xp || 0} next={level?.next_level_xp || 100} />
              </div>
              <div className="mt-4">
                <AchievementList items={achievements} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Profile Information */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                          validationErrors.full_name
                            ? "border-red-300 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                        }`}
                        required
                      />
                      {validationErrors.full_name && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.full_name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username *
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                          validationErrors.username
                            ? "border-red-300 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                        }`}
                        required
                      />
                      {validationErrors.username && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.username}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={user?.email || ""}
                        disabled
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex space-x-4 pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setValidationErrors({});
                          setError("");
                        }}
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
                      <p className="text-gray-900">
                        {profileData?.full_name || user?.user_metadata?.name || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Username</label>
                      <p className="text-gray-900">{profileData?.username || "Not set"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{user?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-gray-900">{profileData?.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <p className="text-gray-900">{profileData?.address || "Not provided"}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Account Information & Password */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>

                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member since</span>
                    <span className="font-medium">
                      {user?.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email verified</span>
                    <span
                      className={`font-medium ${
                        user?.email_confirmed_at ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {user?.email_confirmed_at ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last seen</span>
                    <span className="font-medium">
                      {user?.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString()
                        : "Never"}
                    </span>
                  </div>
                </div>

                {/* Password Change Section */}
                {!showPasswordChange ? (
                  <div>
                    <button
                      onClick={() => setShowPasswordChange(true)}
                      className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                    >
                      Change Password
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-4 border-t pt-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Change Password</h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                          validationErrors.currentPassword
                            ? "border-red-300 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                        }`}
                      />
                      {validationErrors.currentPassword && (
                        <p className="mt-1 text-sm text-red-600">
                          {validationErrors.currentPassword}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                          validationErrors.newPassword
                            ? "border-red-300 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                        }`}
                      />
                      {validationErrors.newPassword && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.newPassword}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                          validationErrors.confirmPassword
                            ? "border-red-300 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                        }`}
                      />
                      {validationErrors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">
                          {validationErrors.confirmPassword}
                        </p>
                      )}
                    </div>

                    <div className="flex space-x-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {loading ? "Updating..." : "Update Password"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordChange(false);
                          setPasswordData({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: "",
                          });
                          setValidationErrors({});
                        }}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-gray-600">No profile data available</p>
          </div>
        </div>
      )}

      {/* Avatar Modal */}
      {avatarModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setAvatarModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Profile Picture</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setAvatarModalOpen(false)}>✕</button>
            </div>
            <div className="p-4 space-y-4">
              {getAvatarUrl() ? (
                <img src={getAvatarUrl()} alt="Avatar large" className="w-full max-h-[60vh] object-contain rounded-lg border" />
              ) : (
                <div className="w-full h-64 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">No picture</div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Full Name</div>
                  <div className="font-medium">{profileData?.full_name || user?.user_metadata?.name || 'Not provided'}</div>
                </div>
                <div>
                  <div className="text-gray-600">Username</div>
                  <div className="font-medium">{profileData?.username || 'Not set'}</div>
                </div>
                <div>
                  <div className="text-gray-600">Email</div>
                  <div className="font-medium">{user?.email}</div>
                </div>
                <div>
                  <div className="text-gray-600">Phone</div>
                  <div className="font-medium">{profileData?.phone || 'Not provided'}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-600">Address</div>
                  <div className="font-medium">{profileData?.address || 'Not provided'}</div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button className="px-4 py-2 rounded-lg bg-gray-800 text-white" onClick={() => setAvatarModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
