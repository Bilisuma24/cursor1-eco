import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { supabase } from '../../lib/supabaseClient';
import DarkModeToggle from '../../components/DarkModeToggle';
import { 
  Store, 
  User, 
  Bell, 
  CreditCard, 
  Shield,
  Save,
  Edit,
  X,
  Palette,
  Settings as SettingsIcon,
  Download,
  Upload,
  Trash2
} from 'lucide-react';

const Settings = () => {
  const { user, updatePassword, updateUserMetadata, signOut } = useAuth();
  const { 
    settings, 
    isDarkMode, 
    isLoading, 
    updateSetting, 
    updateSettings, 
    updateTheme, 
    toggleDarkMode, 
    resetSettings, 
    exportSettings, 
    importSettings 
  } = useSettings();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('store');
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Store Information
  const [storeData, setStoreData] = useState({
    store_name: '',
    store_description: '',
    store_address: '',
    store_phone: '',
    store_email: user?.email || '',
    store_website: '',
  });
  const [isEditingStore, setIsEditingStore] = useState(false);
  
  // Account Settings
  const [profileData, setProfileData] = useState({
    full_name: '',
    username: '',
    phone: '',
    address: '',
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Password Change
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Notifications
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    order_notifications: true,
    product_notifications: true,
    marketing_emails: false,
  });
  
  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    bank_name: '',
    account_number: '',
    account_holder: '',
    routing_number: '',
  });
  const [isEditingPayment, setIsEditingPayment] = useState(false);

  useEffect(() => {
    if (user) {
      loadStoreData();
      loadProfileData();
      loadSavedPreferences();
    }
  }, [user]);

  const loadSavedPreferences = () => {
    try {
      // Load notification preferences
      const savedNotifications = localStorage.getItem('seller_notifications');
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }

      // Load payment settings
      const savedPayment = localStorage.getItem('seller_payment_settings');
      if (savedPayment) {
        setPaymentSettings(JSON.parse(savedPayment));
      }
    } catch (err) {
      console.error('Error loading saved preferences:', err);
    }
  };

  const loadStoreData = async () => {
    try {
      // Try to load store data from profile or create defaults
      const storeName = user?.user_metadata?.store_name || user?.email?.split('@')[0] || 'My Store';
      setStoreData({
        store_name: storeName,
        store_description: '',
        store_address: '',
        store_phone: '',
        store_email: user?.email || '',
        store_website: '',
      });
    } catch (err) {
      console.error('Error loading store data:', err);
    }
  };

  const loadProfileData = async () => {
    try {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('profile')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
      }

      if (data) {
        setProfileData({
          full_name: data.full_name || '',
          username: data.username || '',
          phone: data.phone || '',
          address: data.address || '',
        });
      } else {
        setProfileData({
          full_name: user.user_metadata?.name || '',
          username: user.email?.split('@')[0] || '',
          phone: '',
          address: '',
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const handleSaveStore = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Update user metadata with store info
      await updateUserMetadata({
        store_name: storeData.store_name,
        store_description: storeData.store_description,
      });

      setSuccess('Store information updated successfully!');
      setIsEditingStore(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating store:', err);
      setError('Failed to update store information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { error: profileError } = await supabase
        .from('profile')
        .upsert(
          {
            user_id: user.id,
            full_name: profileData.full_name.trim(),
            username: profileData.username.trim(),
            phone: profileData.phone.trim() || null,
            address: profileData.address.trim() || null,
          },
          { onConflict: 'user_id' }
        );

      if (profileError) throw profileError;

      await updateUserMetadata({
        name: profileData.full_name.trim(),
      });

      setSuccess('Profile updated successfully!');
      setIsEditingProfile(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await updatePassword(passwordData.newPassword);
      setSuccess('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordChange(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating password:', err);
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Save notification preferences to localStorage or user metadata
      await updateUserMetadata({
        notifications: notifications,
      });

      localStorage.setItem('seller_notifications', JSON.stringify(notifications));
      setSuccess('Notification preferences saved!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving notifications:', err);
      setError('Failed to save notification preferences.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Save payment settings (encrypted in production)
      localStorage.setItem('seller_payment_settings', JSON.stringify(paymentSettings));
      setSuccess('Payment settings saved!');
      setIsEditingPayment(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving payment settings:', err);
      setError('Failed to save payment settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOut();
      window.location.replace('/');
    } catch (err) {
      console.error('Logout error:', err);
      window.location.replace('/');
    }
  };

  const tabs = [
    { id: 'store', label: 'Store Information', icon: Store },
    { id: 'account', label: 'Account', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  // Settings management functions
  const handleSettingChange = (key, value) => {
    updateSetting(key, value);
    setIsEditing(true);
  };

  const saveSettings = () => {
    setIsEditing(false);
    setSuccessMessage('Settings saved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleResetSettings = () => {
    resetSettings();
    setIsEditing(true);
    setSuccessMessage('Settings reset to default values!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleExportSettings = () => {
    exportSettings();
    setSuccessMessage('Settings exported successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleImportSettings = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        await importSettings(file);
        setIsEditing(true);
        setSuccessMessage('Settings imported successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        setErrorMessage(error.message);
        setTimeout(() => setErrorMessage(''), 5000);
      }
    }
  };

  const renderStoreSettings = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Store Information</h2>
          <p className="text-gray-600 text-sm">Manage your store details and branding</p>
        </div>
        {!isEditingStore && (
          <button
            onClick={() => setIsEditingStore(true)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </button>
        )}
      </div>

      {isEditingStore ? (
        <form onSubmit={handleSaveStore} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Store Name *
            </label>
            <input
              type="text"
              value={storeData.store_name}
              onChange={(e) => setStoreData({ ...storeData, store_name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Store Description
            </label>
            <textarea
              value={storeData.store_description}
              onChange={(e) => setStoreData({ ...storeData, store_description: e.target.value })}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your store..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Store Email
            </label>
            <input
              type="email"
              value={storeData.store_email}
              onChange={(e) => setStoreData({ ...storeData, store_email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Store Phone
            </label>
            <input
              type="tel"
              value={storeData.store_phone}
              onChange={(e) => setStoreData({ ...storeData, store_phone: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Store Address
            </label>
            <textarea
              value={storeData.store_address}
              onChange={(e) => setStoreData({ ...storeData, store_address: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Store address..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              value={storeData.store_website}
              onChange={(e) => setStoreData({ ...storeData, store_website: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditingStore(false);
                loadStoreData();
              }}
              className="flex items-center space-x-2 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Store Name</label>
            <p className="text-gray-900 mt-1">{storeData.store_name || 'Not set'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Store Description</label>
            <p className="text-gray-900 mt-1">{storeData.store_description || 'Not set'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Store Email</label>
            <p className="text-gray-900 mt-1">{storeData.store_email || 'Not set'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Store Phone</label>
            <p className="text-gray-900 mt-1">{storeData.store_phone || 'Not set'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Store Address</label>
            <p className="text-gray-900 mt-1">{storeData.store_address || 'Not set'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Website</label>
            <p className="text-gray-900 mt-1">{storeData.store_website || 'Not set'}</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderAccountSettings = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Settings</h2>
          <p className="text-gray-600 text-sm">Manage your personal information</p>
        </div>
        {!isEditingProfile && (
          <button
            onClick={() => setIsEditingProfile(true)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </button>
        )}
      </div>

      {isEditingProfile ? (
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={profileData.full_name}
              onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username *
            </label>
            <input
              type="text"
              value={profileData.username}
              onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <textarea
              value={profileData.address}
              onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditingProfile(false);
                loadProfileData();
              }}
              className="flex items-center space-x-2 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <p className="text-gray-900 mt-1">{profileData.full_name || 'Not set'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Username</label>
            <p className="text-gray-900 mt-1">{profileData.username || 'Not set'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <p className="text-gray-900 mt-1">{user?.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <p className="text-gray-900 mt-1">{profileData.phone || 'Not set'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Address</label>
            <p className="text-gray-900 mt-1">{profileData.address || 'Not set'}</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Appearance Settings</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Customize the appearance of your seller dashboard</p>
      </div>

      <div className="space-y-6">
        {/* Theme Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Theme</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Dark Mode Toggle
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Quick toggle between light and dark themes
                </p>
              </div>
              <DarkModeToggle />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme Preference
              </label>
              <select
                value={settings.theme}
                onChange={(e) => {
                  updateTheme(e.target.value);
                  setIsEditing(true);
                }}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
                <option value="system">System Default</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {settings.theme === 'system' 
                  ? 'Follows your system preference' 
                  : `Uses ${settings.theme} mode`}
              </p>
            </div>
          </div>
        </div>

        {/* UI Preferences */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">UI Preferences</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Font Size
                </label>
                <select
                  value={settings.fontSize}
                  onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dashboard Layout
                </label>
                <select
                  value={settings.dashboardLayout}
                  onChange={(e) => handleSettingChange('dashboardLayout', e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="grid">Grid View</option>
                  <option value="list">List View</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Compact Mode
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Reduce spacing for more content
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSettingChange('compactMode', !settings.compactMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.compactMode 
                    ? 'bg-blue-600 dark:bg-blue-500' 
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.compactMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Animations
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enable smooth transitions and animations
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSettingChange('showAnimations', !settings.showAnimations)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  settings.showAnimations 
                    ? 'bg-blue-600 dark:bg-blue-500' 
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.showAnimations ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Notification Preferences</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Choose how you want to be notified</p>
      </div>

      <div className="space-y-4">
        <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Receive general email notifications</p>
          </div>
          <input
            type="checkbox"
            checked={settings.emailNotifications}
            onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
          />
        </label>

        <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Order Notifications</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Get notified about new orders</p>
          </div>
          <input
            type="checkbox"
            checked={settings.newOrderAlerts}
            onChange={(e) => handleSettingChange('newOrderAlerts', e.target.checked)}
            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
          />
        </label>

        <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Low Stock Alerts</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Get notified when inventory is low</p>
          </div>
          <input
            type="checkbox"
            checked={settings.lowStockAlerts}
            onChange={(e) => handleSettingChange('lowStockAlerts', e.target.checked)}
            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
          />
        </label>

        <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Review Notifications</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Get notified about new product reviews</p>
          </div>
          <input
            type="checkbox"
            checked={settings.reviewNotifications}
            onChange={(e) => handleSettingChange('reviewNotifications', e.target.checked)}
            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
          />
        </label>

        <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Marketing Emails</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Receive marketing and promotional emails</p>
          </div>
          <input
            type="checkbox"
            checked={settings.marketingEmails}
            onChange={(e) => handleSettingChange('marketingEmails', e.target.checked)}
            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
          />
        </label>
      </div>

      <button
        onClick={saveSettings}
        disabled={loading}
        className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        <span>{loading ? 'Saving...' : 'Save Preferences'}</span>
      </button>
    </div>
  );

  const renderPayment = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Payment Settings</h2>
          <p className="text-gray-600 mt-1">Manage your payment and payout information</p>
        </div>
        {!isEditingPayment && (
          <button
            onClick={() => setIsEditingPayment(true)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </button>
        )}
      </div>

      {isEditingPayment ? (
        <form onSubmit={handleSavePayment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank Name
            </label>
            <input
              type="text"
              value={paymentSettings.bank_name}
              onChange={(e) => setPaymentSettings({ ...paymentSettings, bank_name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Holder Name
            </label>
            <input
              type="text"
              value={paymentSettings.account_holder}
              onChange={(e) => setPaymentSettings({ ...paymentSettings, account_holder: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Number
            </label>
            <input
              type="text"
              value={paymentSettings.account_number}
              onChange={(e) => setPaymentSettings({ ...paymentSettings, account_number: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="**** **** ****"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Routing Number
            </label>
            <input
              type="text"
              value={paymentSettings.routing_number}
              onChange={(e) => setPaymentSettings({ ...paymentSettings, routing_number: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="****"
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ Note: In production, payment information should be encrypted and stored securely. 
              This is a demo implementation.
            </p>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Saving...' : 'Save Settings'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditingPayment(false)}
              className="flex items-center space-x-2 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Bank Name</label>
            <p className="text-gray-900 mt-1">{paymentSettings.bank_name || 'Not set'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Account Holder</label>
            <p className="text-gray-900 mt-1">{paymentSettings.account_holder || 'Not set'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Account Number</label>
            <p className="text-gray-900 mt-1">{paymentSettings.account_number ? '****' : 'Not set'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Routing Number</label>
            <p className="text-gray-900 mt-1">{paymentSettings.routing_number ? '****' : 'Not set'}</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Security Settings</h2>
        <p className="text-gray-600 mt-1">Manage your account security</p>
      </div>

      {!showPasswordChange ? (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-gray-900">Password</h3>
              <p className="text-sm text-gray-600 mt-1">Change your account password</p>
            </div>
            <button
              onClick={() => setShowPasswordChange(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Change Password
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleChangePassword} className="space-y-4 bg-gray-50 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-4">Change Password</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPasswordChange(false);
                setPasswordData({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                });
              }}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="border-t pt-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-medium text-red-900 mb-2">Danger Zone</h3>
          <p className="text-sm text-red-700 mb-4">
            Once you log out, you'll need to sign in again to access your seller dashboard.
          </p>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Settings
          </h1>
          <p className="text-sm text-gray-500">Manage your store and account preferences</p>
        </div>
      </div>

      {/* Messages */}
      {(error || success) && (
        <div className="space-y-3">
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-xl shadow-lg">
              <p className="font-semibold">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-800 px-6 py-4 rounded-xl shadow-lg">
              <p className="font-semibold">{success}</p>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
        <nav className="flex space-x-1 overflow-x-auto px-5 border-b border-gray-200" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'store' && renderStoreSettings()}
          {activeTab === 'account' && renderAccountSettings()}
          {activeTab === 'appearance' && renderAppearanceSettings()}
          {activeTab === 'notifications' && renderNotifications()}
          {activeTab === 'payment' && renderPayment()}
          {activeTab === 'security' && renderSecurity()}
        </div>
      </div>

      {/* Messages */}
      {(successMessage || errorMessage) && (
        <div className="space-y-3">
          {successMessage && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-800 px-6 py-4 rounded-xl shadow-lg">
              <p className="font-semibold">{successMessage}</p>
            </div>
          )}
          {errorMessage && (
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-xl shadow-lg">
              <p className="font-semibold">{errorMessage}</p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
        <div className="flex gap-3">
          <button
            onClick={handleExportSettings}
            className="flex items-center space-x-2 px-5 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          <label className="flex items-center space-x-2 px-5 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Import</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportSettings}
              className="hidden"
            />
          </label>
          
          <button
            onClick={handleResetSettings}
            className="flex items-center space-x-2 px-5 py-2.5 text-red-700 bg-red-50 rounded-xl hover:bg-red-100 transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-md"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
        
        <div className="flex gap-2">
          {isEditing && (
            <button
              onClick={saveSettings}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white px-6 py-2.5 rounded-xl hover:from-blue-700 hover:via-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 font-semibold text-sm transform hover:scale-[1.02]"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

