import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Receipt, Users, Store, User, Sun, Moon, Settings as SettingsIcon } from 'lucide-react';

interface NavigationProps {
  currentView: 'dashboard' | 'orders' | 'customers' | 'new-order' | 'settings';
  onViewChange: (view: 'dashboard' | 'orders' | 'customers' | 'new-order' | 'settings') => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = savedTheme || systemTheme;
    
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (newTheme: 'light' | 'dark') => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    applyTheme(newTheme);
    setShowThemeDropdown(false);
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors">
      <div className="w-full px-6 sm:px-8 flex justify-between items-center h-16">
        <div className="flex items-center space-x-3">
          <img 
            src="https://ik.imagekit.io/8aj6efzgu/Kunafa%20Kingdom/logo.png?updatedAt=1749638296917" 
            alt="Kunafa Kingdom Logo" 
            className="h-10 w-10 object-contain"
            onError={(e) => {
              // Fallback to Store icon if image fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <Store className="h-8 w-8 text-blue-600 dark:text-blue-400 hidden" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Kunafa Kingdom POS</h1>
        </div>
        <div className="flex items-center space-x-1">
          {/* Theme Selector */}
          <div className="relative ml-4">
            <button
              onClick={() => setShowThemeDropdown(!showThemeDropdown)}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <User className="h-5 w-5" />
            </button>
            {showThemeDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="py-2">
                  <div className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                    Theme
                  </div>
                  <button
                    onClick={() => toggleTheme('light')}
                    className={`w-full flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      theme === 'light' 
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Sun className="h-4 w-4 mr-3" />
                    Light
                  </button>
                  <button
                    onClick={() => toggleTheme('dark')}
                    className={`w-full flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      theme === 'dark' 
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/50' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Moon className="h-4 w-4 mr-3" />
                    Dark
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Click outside to close dropdown */}
      {showThemeDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowThemeDropdown(false)}
        />
      )}
    </nav>
  );
};

export default Navigation;