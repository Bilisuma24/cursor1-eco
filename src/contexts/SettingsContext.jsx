import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    // Theme Settings
    theme: 'system', // 'light', 'dark', 'system'
    fontSize: 'medium', // 'small', 'medium', 'large'
    compactMode: false,
    showAnimations: true,
    
    // General Settings
    language: 'en',
    timezone: 'UTC',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    autoSave: false,
    showTooltips: true,
    keyboardShortcuts: true,
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    orderUpdates: true,
    marketingEmails: false,
    securityAlerts: true,
    
    // Privacy Settings
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    dataSharing: false,
    
    // Security Settings
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: 30,
    
    // Seller-specific Settings
    storeNotifications: true,
    lowStockAlerts: true,
    newOrderAlerts: true,
    reviewNotifications: true,
    analyticsTracking: true,
    
    // UI Preferences
    sidebarCollapsed: false,
    dashboardLayout: 'grid', // 'grid', 'list'
    productViewMode: 'grid', // 'grid', 'list'
    itemsPerPage: 12,
  });

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsedSettings }));
        }
        
        // Load theme preference
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
          setIsDarkMode(true);
          document.documentElement.classList.add('dark');
        } else {
          setIsDarkMode(false);
          document.documentElement.classList.remove('dark');
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings to localStorage whenever settings change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('userSettings', JSON.stringify(settings));
    }
  }, [settings, isLoading]);

  // Handle theme changes
  const updateTheme = (theme) => {
    setSettings(prev => ({ ...prev, theme }));
    
    if (theme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else if (theme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
      }
      localStorage.removeItem('theme');
    }
  };

  // Toggle dark mode directly
  const toggleDarkMode = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    updateTheme(newTheme);
  };

  // Update a specific setting
  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Update multiple settings at once
  const updateSettings = (newSettings) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  // Reset settings to default
  const resetSettings = () => {
    const defaultSettings = {
      theme: 'system',
      fontSize: 'medium',
      compactMode: false,
      showAnimations: true,
      language: 'en',
      timezone: 'UTC',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      autoSave: false,
      showTooltips: true,
      keyboardShortcuts: true,
      emailNotifications: true,
      pushNotifications: true,
      orderUpdates: true,
      marketingEmails: false,
      securityAlerts: true,
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false,
      dataSharing: false,
      twoFactorAuth: false,
      loginAlerts: true,
      sessionTimeout: 30,
      storeNotifications: true,
      lowStockAlerts: true,
      newOrderAlerts: true,
      reviewNotifications: true,
      analyticsTracking: true,
      sidebarCollapsed: false,
      dashboardLayout: 'grid',
      productViewMode: 'grid',
      itemsPerPage: 12,
    };
    
    setSettings(defaultSettings);
    updateTheme('system');
  };

  // Export settings
  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ecoshop-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import settings
  const importSettings = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          setSettings(prev => ({ ...prev, ...importedSettings }));
          
          // Apply theme if it was imported
          if (importedSettings.theme) {
            updateTheme(importedSettings.theme);
          }
          
          resolve(importedSettings);
        } catch (error) {
          reject(new Error('Invalid settings file format.'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file.'));
      reader.readAsText(file);
    });
  };

  const value = {
    settings,
    isDarkMode,
    isLoading,
    updateSetting,
    updateSettings,
    updateTheme,
    toggleDarkMode,
    resetSettings,
    exportSettings,
    importSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;
