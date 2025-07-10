import React, { useState } from 'react';
// Remove lucide-react imports and add react-icons imports
import { 
  MdDashboard, 
  MdReceipt, 
  MdPeople, 
  MdStore, 
  MdSettings, 
  MdExpandMore, 
  MdExpandLess, 
  MdLocalOffer, 
  MdInventory, 
  MdPerson, 
  MdBusiness, 
  MdChevronLeft, 
  MdChevronRight, 
  MdLightMode, 
  MdDarkMode 
} from 'react-icons/md';
import { 
  FaUsers, 
  FaStore, 
  FaCog, 
  FaTag, 
  FaBox, 
  FaUser, 
  FaBuilding 
} from 'react-icons/fa';
import { 
  BiSolidDashboard, 
  BiSolidReceipt, 
  BiSolidUser 
} from 'react-icons/bi';

const sidebarLinks = [
  { 
    key: 'dashboard', 
    label: 'Dashboard', 
    icon: <BiSolidDashboard className="h-5 w-5" /> 
  },
  { 
    key: 'orders', 
    label: 'Orders', 
    icon: <BiSolidReceipt className="h-5 w-5" /> 
  },
  { 
    key: 'customers', 
    label: 'Customers', 
    icon: <FaUsers className="h-5 w-5" /> 
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: <FaCog className="h-5 w-5" />,
    children: [
      { key: 'products', label: 'Products', icon: <FaBox className="h-4 w-4" /> },
      { key: 'stores', label: 'Stores', icon: <FaStore className="h-4 w-4" /> },
      { key: 'vendors', label: 'Vendors', icon: <FaBuilding className="h-4 w-4" /> },
      { key: 'managers', label: 'Managers', icon: <BiSolidUser className="h-4 w-4" /> },
      { key: 'raw-materials', label: 'Raw Materials', icon: <FaTag className="h-4 w-4" /> },
    ],
  },
];

interface SidebarProps {
  activeKey: string;
  onNavigate: (key: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeKey, onNavigate }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

  React.useEffect(() => {
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

  const handleAccordion = (key: string) => {
    setOpenAccordion(openAccordion === key ? null : key);
  };

  return (
    <aside
      className={`h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col ${collapsed ? 'w-16' : 'w-[20vw]'} py-4 relative`}
    >
      {/* Brand Header */}
      <div className={`flex items-center px-6 pb-6 ${collapsed ? 'justify-center' : ''}`}>
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">C</span>
          </div>
          {!collapsed && (
            <span className="text-xl font-bold text-gray-900 dark:text-white">Corelytix</span>
          )}
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 pr-2">
        <ul className="space-y-1">
          {sidebarLinks.map((item) => (
            <li key={item.key}>
              {item.children ? (
                <>
                  <button
                    className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none ${
                      activeKey.startsWith(item.key)
                        ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    } ${collapsed ? 'justify-center px-2' : ''}`}
                    onClick={() => handleAccordion(item.key)}
                  >
                    {item.icon}
                    {!collapsed && <span>{item.label}</span>}
                    {!collapsed && (
                      <span className="ml-auto">
                        {openAccordion === item.key ? <MdExpandMore className="h-4 w-4" /> : <MdExpandLess className="h-4 w-4" />}
                      </span>
                    )}
                  </button>
                  {/* Accordion Children */}
                  {openAccordion === item.key && !collapsed && (
                    <ul className="pl-8 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.key}>
                          <button
                            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none ${
                              activeKey === child.key
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            onClick={() => onNavigate(child.key)}
                          >
                            {child.icon}
                            <span>{child.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <button
                  className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none ${
                    activeKey === item.key
                      ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 m-[2px]'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  } ${collapsed ? 'justify-center px-2' : ''}`}
                  onClick={() => onNavigate(item.key)}
                >
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </button>
              )}
            </li>
          ))}
        </ul>
      </nav>
      {/* User Icon & Theme Switcher */}
      <div className={`px-6 pb-4 ${collapsed ? 'justify-center flex' : ''} relative`}>
        <div className="relative">
          <button
            onClick={() => setShowThemeDropdown(!showThemeDropdown)}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <BiSolidUser className="h-5 w-5" />
          </button>
          {showThemeDropdown && (
            <div className="absolute right-0 bottom-12 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
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
                  <MdLightMode className="h-4 w-4 mr-3" />
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
                  <MdDarkMode className="h-4 w-4 mr-3" />
                  Dark
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Floating Collapse/Expand Button - on sidebar edge */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute right-[-18px] bottom-8 z-30 p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <MdChevronRight className="h-5 w-5" /> : <MdChevronLeft className="h-5 w-5" />}
      </button>
      {/* Click outside to close theme dropdown */}
      {showThemeDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowThemeDropdown(false)}
        />
      )}
    </aside>
  );
};

export default Sidebar; 