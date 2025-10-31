import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useSettings } from '../contexts/SettingsContext';
// import { useToast } from '../contexts/ToastContext';
import DarkModeToggle from '../components/DarkModeToggle';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Save,
  Eye,
  EyeOff,
  Trash2,
  Download,
  Upload
} from 'lucide-react';

const Settings = () => {
  const { user, updateUser } = useAuth();
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
  // const { push: pushToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('general');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  const SettingCard = ({ title, description, children }) => (
    <div className="glass rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );

  const ToggleSwitch = ({ checked, onChange, disabled = false }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked 
          ? 'bg-blue-600 dark:bg-blue-500' 
          : 'bg-gray-200 dark:bg-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const SelectInput = ({ value, onChange, options, className = '' }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`form-select ${className}`}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your account preferences and application settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <nav className="space-y-2">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* General Settings */}
              {activeTab === 'general' && (
                <>
                  <SettingCard title="Account Information" description="Basic account and profile settings">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 gradient-bg-1 text-white rounded-full flex items-center justify-center text-xl font-semibold shadow-lg">
                          {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {user?.user_metadata?.full_name || user?.email || 'User'}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Member since {new Date(user?.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </SettingCard>

                  <SettingCard title="Language & Region" description="Set your preferred language and regional settings">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Language
                        </label>
                        <SelectInput
                          value={settings.language}
                          onChange={(value) => handleSettingChange('language', value)}
                          options={[
                            { value: 'en', label: 'English' },
                            { value: 'es', label: 'Español' },
                            { value: 'fr', label: 'Français' },
                            { value: 'de', label: 'Deutsch' },
                            { value: 'it', label: 'Italiano' },
                            { value: 'pt', label: 'Português' },
                            { value: 'zh', label: '中文' },
                            { value: 'ja', label: '日本語' }
                          ]}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Timezone
                        </label>
                        <SelectInput
                          value={settings.timezone}
                          onChange={(value) => handleSettingChange('timezone', value)}
                          options={[
                            { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
                            { value: 'EST', label: 'EST (Eastern Standard Time)' },
                            { value: 'PST', label: 'PST (Pacific Standard Time)' },
                            { value: 'GMT', label: 'GMT (Greenwich Mean Time)' },
                            { value: 'CET', label: 'CET (Central European Time)' },
                            { value: 'JST', label: 'JST (Japan Standard Time)' }
                          ]}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Currency
                        </label>
                        <SelectInput
                          value={settings.currency}
                          onChange={(value) => handleSettingChange('currency', value)}
                          options={[
                            { value: 'USD', label: 'US Dollar ($)' },
                            { value: 'EUR', label: 'Euro (€)' },
                            { value: 'GBP', label: 'British Pound (£)' },
                            { value: 'JPY', label: 'Japanese Yen (¥)' },
                            { value: 'CAD', label: 'Canadian Dollar (C$)' },
                            { value: 'AUD', label: 'Australian Dollar (A$)' },
                            { value: 'CHF', label: 'Swiss Franc (CHF)' },
                            { value: 'CNY', label: 'Chinese Yuan (¥)' }
                          ]}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Date Format
                        </label>
                        <SelectInput
                          value={settings.dateFormat}
                          onChange={(value) => handleSettingChange('dateFormat', value)}
                          options={[
                            { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US Format)' },
                            { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (European Format)' },
                            { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO Format)' },
                            { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (Alternative)' }
                          ]}
                        />
                      </div>
                    </div>
                  </SettingCard>

                  <SettingCard title="Application Preferences" description="Customize your application experience">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Auto-save Settings
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Automatically save changes as you make them
                          </p>
                        </div>
                        <ToggleSwitch
                          checked={settings.autoSave || false}
                          onChange={(value) => handleSettingChange('autoSave', value)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Show Tooltips
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Display helpful tooltips and hints
                          </p>
                        </div>
                        <ToggleSwitch
                          checked={settings.showTooltips !== false}
                          onChange={(value) => handleSettingChange('showTooltips', value)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Keyboard Shortcuts
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Enable keyboard shortcuts for faster navigation
                          </p>
                        </div>
                        <ToggleSwitch
                          checked={settings.keyboardShortcuts !== false}
                          onChange={(value) => handleSettingChange('keyboardShortcuts', value)}
                        />
                      </div>
                    </div>
                  </SettingCard>
                </>
              )}

              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                <>
                  <SettingCard title="Theme" description="Customize the appearance of your interface">
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
                        <SelectInput
                          value={settings.theme}
                          onChange={(value) => {
                            updateTheme(value);
                            setIsEditing(true);
                          }}
                          options={[
                            { value: 'light', label: 'Light Mode' },
                            { value: 'dark', label: 'Dark Mode' },
                            { value: 'system', label: 'System Default' }
                          ]}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {settings.theme === 'system' 
                            ? 'Follows your system preference' 
                            : `Uses ${settings.theme} mode`}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Font Size
                          </label>
                          <SelectInput
                            value={settings.fontSize}
                            onChange={(value) => handleSettingChange('fontSize', value)}
                            options={[
                              { value: 'small', label: 'Small' },
                              { value: 'medium', label: 'Medium' },
                              { value: 'large', label: 'Large' }
                            ]}
                          />
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
                          <ToggleSwitch
                            checked={settings.compactMode}
                            onChange={(value) => handleSettingChange('compactMode', value)}
                          />
                        </div>
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
                        <ToggleSwitch
                          checked={settings.showAnimations}
                          onChange={(value) => handleSettingChange('showAnimations', value)}
                        />
                      </div>
                    </div>
                  </SettingCard>
                </>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <>
                  <SettingCard title="Email Notifications" description="Choose what email notifications you want to receive">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            All Email Notifications
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Master switch for all email notifications
                          </p>
                        </div>
                        <ToggleSwitch
                          checked={settings.emailNotifications}
                          onChange={(value) => handleSettingChange('emailNotifications', value)}
                        />
                      </div>
                      
                      <div className="space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Order Updates
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Get notified about order status changes
                            </p>
                          </div>
                          <ToggleSwitch
                            checked={settings.orderUpdates}
                            onChange={(value) => handleSettingChange('orderUpdates', value)}
                            disabled={!settings.emailNotifications}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Marketing Emails
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Receive promotional offers and updates
                            </p>
                          </div>
                          <ToggleSwitch
                            checked={settings.marketingEmails}
                            onChange={(value) => handleSettingChange('marketingEmails', value)}
                            disabled={!settings.emailNotifications}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Security Alerts
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Important security notifications
                            </p>
                          </div>
                          <ToggleSwitch
                            checked={settings.securityAlerts}
                            onChange={(value) => handleSettingChange('securityAlerts', value)}
                            disabled={!settings.emailNotifications}
                          />
                        </div>
                      </div>
                    </div>
                  </SettingCard>
                </>
              )}

              {/* Privacy Settings */}
              {activeTab === 'privacy' && (
                <>
                  <SettingCard title="Profile Visibility" description="Control who can see your profile information">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Profile Visibility
                        </label>
                        <SelectInput
                          value={settings.profileVisibility}
                          onChange={(value) => handleSettingChange('profileVisibility', value)}
                          options={[
                            { value: 'public', label: 'Public - Anyone can see your profile' },
                            { value: 'friends', label: 'Friends Only - Only your connections' },
                            { value: 'private', label: 'Private - Only you can see your profile' }
                          ]}
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Show Email Address
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Display your email on your public profile
                            </p>
                          </div>
                          <ToggleSwitch
                            checked={settings.showEmail}
                            onChange={(value) => handleSettingChange('showEmail', value)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Show Phone Number
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Display your phone on your public profile
                            </p>
                          </div>
                          <ToggleSwitch
                            checked={settings.showPhone}
                            onChange={(value) => handleSettingChange('showPhone', value)}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Data Sharing
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Allow data sharing for improved experience
                            </p>
                          </div>
                          <ToggleSwitch
                            checked={settings.dataSharing}
                            onChange={(value) => handleSettingChange('dataSharing', value)}
                          />
                        </div>
                      </div>
                    </div>
                  </SettingCard>
                </>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <>
                  <SettingCard title="Account Security" description="Manage your account security settings">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Two-Factor Authentication
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <ToggleSwitch
                          checked={settings.twoFactorAuth}
                          onChange={(value) => handleSettingChange('twoFactorAuth', value)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Login Alerts
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Get notified of new login attempts
                          </p>
                        </div>
                        <ToggleSwitch
                          checked={settings.loginAlerts}
                          onChange={(value) => handleSettingChange('loginAlerts', value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Session Timeout (minutes)
                        </label>
                        <SelectInput
                          value={settings.sessionTimeout}
                          onChange={(value) => handleSettingChange('sessionTimeout', parseInt(value))}
                          options={[
                            { value: 15, label: '15 minutes' },
                            { value: 30, label: '30 minutes' },
                            { value: 60, label: '1 hour' },
                            { value: 120, label: '2 hours' }
                          ]}
                        />
                      </div>
                    </div>
                  </SettingCard>
                </>
              )}
            </div>

            {/* Messages */}
            {successMessage && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                {errorMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={handleExportSettings}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
                
                <label className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer">
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
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Reset</span>
                </button>
              </div>
              
              <div className="flex gap-2">
                {isEditing && (
                  <button
                    onClick={saveSettings}
                    className="btn-modern flex items-center space-x-2 px-6 py-2 hover-scale ripple"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
