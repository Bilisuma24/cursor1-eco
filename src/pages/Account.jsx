import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, ShoppingBag, Settings, LogOut, Heart, Package, Home, BellRing, CreditCard, MapPin, Globe, Shield, Lock, Mail, Trash2, Plus, Edit, Check, X, Eye, EyeOff, Share2, Download, ShoppingCart, Truck, CheckCircle, ChevronRight, Wallet, Ticket, FileCheck, DollarSign } from "lucide-react";
import LevelBadge from "../components/achievements/LevelBadge";
import LevelProgress from "../components/achievements/LevelProgress";
import AchievementList from "../components/achievements/AchievementList";
import { getUserLevel, getUserAchievements } from "../services/achievementService";
import { useAuth } from "../contexts/SupabaseAuthContext";
import { useUserRole } from "../hooks/useUserRole";
import { supabase } from "../lib/supabaseClient";
import Login from "./Login";

export default function Account() {
  const { user, signOut, loading: authLoading, updatePassword, updateUserMetadata } = useAuth();
  const { userRole, isSeller, isBuyer, isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

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

      timeoutId = setTimeout(() => {
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
          setLoadingProfile(false);
        }
      }, 2000);

      try {
        const { data, error } = await supabase
          .from("profile")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (timeoutId) clearTimeout(timeoutId);

        if (!mounted) return;

        if (error) {
          if (error.code === "PGRST116") {
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
            console.error("Error fetching profile:", error.code, error.message);
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
  }, [user]);

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
        if (import.meta.env.DEV) {
          console.warn('[Account] Could not load achievements:', err);
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

      await updateUserMetadata({
        name: formData.full_name.trim(),
      });

      setProfileData(data);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
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
      setLoading(true);
      await signOut();
      await new Promise(resolve => setTimeout(resolve, 100));
      window.location.replace("/");
    } catch (err) {
      console.error("Logout error:", err);
      try {
        localStorage.clear();
      } catch (e) {}
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

  // Show loading state while checking auth
  if (authLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated (after loading is complete)
  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-md mx-auto px-4 py-4">
        {/* User Profile Summary Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <div className="flex items-center justify-between">
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
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-2xl font-semibold">
                    {(user?.user_metadata?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </div>
                )}
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile</h1>
                <div className="flex items-center gap-2">
                  {(userRole || profileData?.user_type) && (
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        (isSeller || profileData?.user_type === 'seller')
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      <User className="w-3 h-3" />
                      {(isSeller || profileData?.user_type === 'seller') ? "Seller" : "Buyer"}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Profile Menu - Horizontal */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between gap-2 overflow-x-auto">
            <Link
              to="/account"
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-orange-50 text-orange-600 font-medium min-w-[60px]"
            >
              <User className="w-5 h-5" />
              <span className="text-xs">Profile</span>
            </Link>
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
              to="/price-alerts"
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors min-w-[60px]"
            >
              <BellRing className="w-5 h-5" />
              <span className="text-xs">Price Alerts</span>
            </Link>
            <Link
              to="/profile"
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors min-w-[60px]"
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs">Settings</span>
            </Link>
            <Link
              to="/"
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors min-w-[60px]"
            >
              <Home className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </Link>
          </div>
        </div>
      </div>

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
                  <div className="font-medium">{profileData?.full_name || user?.user_metadata?.name || "Not provided"}</div>
                </div>
                <div>
                  <div className="text-gray-600">Username</div>
                  <div className="font-medium">{profileData?.username || "Not set"}</div>
                </div>
                <div>
                  <div className="text-gray-600">Email</div>
                  <div className="font-medium">{user?.email}</div>
                </div>
                <div>
                  <div className="text-gray-600">Phone</div>
                  <div className="font-medium">{profileData?.phone || "Not provided"}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-600">Address</div>
                  <div className="font-medium">{profileData?.address || "Not provided"}</div>
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

