import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { User, ShoppingBag, Settings, LogOut, Heart, Package, Home, BellRing, CreditCard, MapPin, Globe, Shield, Lock, Mail, Trash2, Plus, Edit, Check, X, Eye, EyeOff, Share2, Download } from "lucide-react";
import LevelBadge from "../components/achievements/LevelBadge";
import LevelProgress from "../components/achievements/LevelProgress";
import AchievementList from "../components/achievements/AchievementList";
import { getUserLevel, getUserAchievements } from "../services/achievementService";
import { useAuth } from "../contexts/SupabaseAuthContext";
import { useUserRole } from "../hooks/useUserRole";
import { supabase } from "../lib/supabaseClient";

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
  
  // New features state
  const [shippingAddresses, setShippingAddresses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    orderUpdates: true,
    promotions: true,
    newsletters: false,
  });
  const [preferences, setPreferences] = useState({
    language: 'en',
    currency: 'ETB',
    theme: 'light',
  });
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newAddress, setNewAddress] = useState({ name: '', address: '', city: '', zip: '', country: '', phone: '', isDefault: false });
  const [newPayment, setNewPayment] = useState({ cardNumber: '', expiryDate: '', cvv: '', name: '', isDefault: false });
  const [orderStats, setOrderStats] = useState({ total: 0, pending: 0, completed: 0 });

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

        // Handle different error types gracefully
        if (error) {
          // PGRST116 = no rows returned (profile doesn't exist) - this is OK
          // PGRST205 = table doesn't exist - use fallback
          // 404/500 = server error - use fallback
          if (error.code === "PGRST116") {
            // Profile doesn't exist yet - create minimal one
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
          } else {
            // Other errors (including 500) - log and use fallback
            console.error("Error fetching profile:", error.code, error.message);
            if (import.meta.env.DEV) {
              console.warn('[Profile] Using fallback profile due to error');
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
          }
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
      } catch (err) {
        // Silently fail - achievements are optional
        if (import.meta.env.DEV) {
          console.warn('[Profile] Could not load achievements:', err);
        }
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  // Fetch order statistics
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data: orders } = await supabase
          .from('order')
          .select('status')
          .eq('user_id', user.id);
        
        if (orders) {
          setOrderStats({
            total: orders.length,
            pending: orders.filter(o => ['pending', 'confirmed'].includes(o.status)).length,
            completed: orders.filter(o => o.status === 'delivered').length,
          });
        }
      } catch (err) {
        console.warn('Could not load order stats:', err);
      }
    })();
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

  const handleDeleteAddress = (id) => {
    setShippingAddresses(shippingAddresses.filter(addr => addr.id !== id));
    setSuccess('Address deleted successfully!');
    setTimeout(() => setSuccess(""), 2500);
  };

  const handleDeletePayment = (id) => {
    setPaymentMethods(paymentMethods.filter(method => method.id !== id));
    setSuccess('Payment method deleted successfully!');
    setTimeout(() => setSuccess(""), 2500);
  };

  // Show loading state only if still actively loading profile data
  if (loadingProfile || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show AliExpress-style sign-in section when user is not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto px-4 py-6">
          {/* Profile Section - AliExpress Style */}
          <div className="bg-white mb-4 p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sign In / Register</h1>
              </div>
            </div>
          </div>

          {/* Sign In Form */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <p className="mb-4 text-center text-sm text-gray-600">
              Please sign in to access your account
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to="/login"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg text-center transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-3 px-4 rounded-lg text-center transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Show loading state only if still actively loading profile data */}
      {user ? (
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
                    <Link
                      to="/price-alerts"
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        location.pathname === '/price-alerts'
                          ? 'bg-orange-50 text-orange-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <BellRing className="w-5 h-5" />
                      <span>Price Alerts</span>
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

                  {/* Order Statistics */}
                  <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5" />
                      Order Statistics
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{orderStats.total}</div>
                        <div className="text-sm text-gray-600 mt-1">Total Orders</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-600">{orderStats.pending}</div>
                        <div className="text-sm text-gray-600 mt-1">Pending</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{orderStats.completed}</div>
                        <div className="text-sm text-gray-600 mt-1">Completed</div>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Addresses */}
                  <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Shipping Addresses
                      </h2>
                      <button
                        onClick={() => setShowAddAddress(!showAddAddress)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Add Address
                      </button>
                    </div>
                    {showAddAddress && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={newAddress.name}
                          onChange={(e) => setNewAddress({...newAddress, name: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                        <textarea
                          placeholder="Street Address"
                          value={newAddress.address}
                          onChange={(e) => setNewAddress({...newAddress, address: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          rows={2}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="City"
                            value={newAddress.city}
                            onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                            className="border border-gray-300 rounded-lg px-3 py-2"
                          />
                          <input
                            type="text"
                            placeholder="ZIP Code"
                            value={newAddress.zip}
                            onChange={(e) => setNewAddress({...newAddress, zip: e.target.value})}
                            className="border border-gray-300 rounded-lg px-3 py-2"
                          />
                        </div>
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={newAddress.isDefault}
                            onChange={(e) => setNewAddress({...newAddress, isDefault: e.target.checked})}
                            className="rounded"
                          />
                          <label className="text-sm text-gray-700">Set as default address</label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (newAddress.name && newAddress.address) {
                                setShippingAddresses([...shippingAddresses, {...newAddress, id: Date.now()}]);
                                setNewAddress({ name: '', address: '', city: '', zip: '', country: '', phone: '', isDefault: false });
                                setShowAddAddress(false);
                                setSuccess('Address added successfully!');
                              }
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setShowAddAddress(false)}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="space-y-3">
                      {shippingAddresses.length === 0 ? (
                        <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
                          No shipping addresses saved yet
                        </div>
                      ) : (
                        shippingAddresses.map((addr) => (
                          <div key={addr.id} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-start">
                            <div>
                              <div className="font-medium text-gray-900">{addr.name}</div>
                              <div className="text-sm text-gray-600 mt-1">{addr.address}</div>
                              {addr.city && <div className="text-sm text-gray-600">{addr.city}, {addr.zip}</div>}
                              {addr.isDefault && <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Default</span>}
                            </div>
                            <button 
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Payment Methods
                      </h2>
                      <button
                        onClick={() => setShowAddPayment(!showAddPayment)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Add Card
                      </button>
                    </div>
                    {showAddPayment && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                        <input
                          type="text"
                          placeholder="Cardholder Name"
                          value={newPayment.name}
                          onChange={(e) => setNewPayment({...newPayment, name: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        />
                        <input
                          type="text"
                          placeholder="Card Number"
                          value={newPayment.cardNumber}
                          onChange={(e) => setNewPayment({...newPayment, cardNumber: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          maxLength={19}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={newPayment.expiryDate}
                            onChange={(e) => setNewPayment({...newPayment, expiryDate: e.target.value})}
                            className="border border-gray-300 rounded-lg px-3 py-2"
                          />
                          <input
                            type="text"
                            placeholder="CVV"
                            value={newPayment.cvv}
                            onChange={(e) => setNewPayment({...newPayment, cvv: e.target.value})}
                            className="border border-gray-300 rounded-lg px-3 py-2"
                            maxLength={4}
                          />
                        </div>
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={newPayment.isDefault}
                            onChange={(e) => setNewPayment({...newPayment, isDefault: e.target.checked})}
                            className="rounded"
                          />
                          <label className="text-sm text-gray-700">Set as default payment method</label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (newPayment.name && newPayment.cardNumber) {
                                setPaymentMethods([...paymentMethods, {...newPayment, id: Date.now()}]);
                                setNewPayment({ cardNumber: '', expiryDate: '', cvv: '', name: '', isDefault: false });
                                setShowAddPayment(false);
                                setSuccess('Payment method added successfully!');
                              }
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setShowAddPayment(false)}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="space-y-3">
                      {paymentMethods.length === 0 ? (
                        <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
                          No payment methods saved yet
                        </div>
                      ) : (
                        paymentMethods.map((method) => (
                          <div key={method.id} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <CreditCard className="w-8 h-8 text-gray-400" />
                              <div>
                                <div className="font-medium text-gray-900">**** **** **** {method.cardNumber.slice(-4)}</div>
                                <div className="text-sm text-gray-600">{method.name} • Expires {method.expiryDate}</div>
                                {method.isDefault && <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Default</span>}
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDeletePayment(method.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Notification Preferences */}
                  <div className="mt-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <BellRing className="w-5 h-5" />
                      Notification Preferences
                    </h2>
                    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">Email Notifications</div>
                          <div className="text-sm text-gray-600">Receive updates via email</div>
                        </div>
                        <button
                          onClick={() => setNotifications({...notifications, email: !notifications.email})}
                          className={`relative w-12 h-6 rounded-full transition-colors ${notifications.email ? 'bg-blue-600' : 'bg-gray-300'}`}
                        >
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications.email ? 'translate-x-6' : ''}`}></div>
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">SMS Notifications</div>
                          <div className="text-sm text-gray-600">Receive updates via SMS</div>
                        </div>
                        <button
                          onClick={() => setNotifications({...notifications, sms: !notifications.sms})}
                          className={`relative w-12 h-6 rounded-full transition-colors ${notifications.sms ? 'bg-blue-600' : 'bg-gray-300'}`}
                        >
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications.sms ? 'translate-x-6' : ''}`}></div>
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">Order Updates</div>
                          <div className="text-sm text-gray-600">Get notified about order status changes</div>
                        </div>
                        <button
                          onClick={() => setNotifications({...notifications, orderUpdates: !notifications.orderUpdates})}
                          className={`relative w-12 h-6 rounded-full transition-colors ${notifications.orderUpdates ? 'bg-blue-600' : 'bg-gray-300'}`}
                        >
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications.orderUpdates ? 'translate-x-6' : ''}`}></div>
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">Promotions & Offers</div>
                          <div className="text-sm text-gray-600">Receive special offers and discounts</div>
                        </div>
                        <button
                          onClick={() => setNotifications({...notifications, promotions: !notifications.promotions})}
                          className={`relative w-12 h-6 rounded-full transition-colors ${notifications.promotions ? 'bg-blue-600' : 'bg-gray-300'}`}
                        >
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications.promotions ? 'translate-x-6' : ''}`}></div>
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">Newsletters</div>
                          <div className="text-sm text-gray-600">Subscribe to our monthly newsletter</div>
                        </div>
                        <button
                          onClick={() => setNotifications({...notifications, newsletters: !notifications.newsletters})}
                          className={`relative w-12 h-6 rounded-full transition-colors ${notifications.newsletters ? 'bg-blue-600' : 'bg-gray-300'}`}
                        >
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications.newsletters ? 'translate-x-6' : ''}`}></div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Language & Preferences */}
                  <div className="mt-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Language & Preferences
                    </h2>
                    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                        <select
                          value={preferences.language}
                          onChange={(e) => setPreferences({...preferences, language: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="en">English</option>
                          <option value="am">አማርኛ</option>
                          <option value="fr">Français</option>
                          <option value="es">Español</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                        <select
                          value={preferences.currency}
                          onChange={(e) => setPreferences({...preferences, currency: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="ETB">ETB - Ethiopian Birr</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                        <select
                          value={preferences.theme}
                          onChange={(e) => setPreferences({...preferences, theme: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="auto">Auto</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Security & Privacy */}
                  <div className="mt-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Security & Privacy
                    </h2>
                    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">Two-Factor Authentication</div>
                          <div className="text-sm text-gray-600">Add an extra layer of security</div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700 font-medium">Enable</button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">Login Activity</div>
                          <div className="text-sm text-gray-600">View your recent login history</div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700 font-medium">View</button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">Download Your Data</div>
                          <div className="text-sm text-gray-600">Export all your account data</div>
                        </div>
                        <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                      <div className="border-t pt-4">
                        <button className="text-red-600 hover:text-red-700 font-medium">Delete Account</button>
                        <div className="text-sm text-gray-600 mt-1">Permanently delete your account and all data</div>
                      </div>
                    </div>
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
    </div>
  );
}
