import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const DarkModeToggle = () => {
  const { isDarkMode, toggleDarkMode } = useSettings();
  const [isDark, setIsDark] = useState(isDarkMode);

  useEffect(() => {
    setIsDark(isDarkMode);
  }, [isDarkMode]);

  const handleToggle = () => {
    toggleDarkMode();
  };

  return (
    <button
      onClick={handleToggle}
      className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 hover-scale ripple"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-5 h-5">
        <Sun 
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            isDark ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'
          }`} 
        />
        <Moon 
          className={`absolute inset-0 w-5 h-5 transition-all duration-300 ${
            isDark ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'
          }`} 
        />
      </div>
    </button>
  );
};

export default DarkModeToggle;


