import React, { useState } from 'react';
import { Store, Users, Package, Truck, ShoppingBag, Settings as GearIcon } from 'lucide-react';
import Stores from './Stores';
import Managers from './Managers';
import RawMaterials from './RawMaterials';
import Vendors from './Vendors';
import Products from './Products';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stores' | 'managers' | 'raw-materials' | 'vendors' | 'products'>('stores');

  const tabs = [
    { id: 'stores' as const, label: 'Stores', icon: Store },
    { id: 'managers' as const, label: 'Managers', icon: Users },
    { id: 'raw-materials' as const, label: 'Raw Materials', icon: Package },
    { id: 'vendors' as const, label: 'Vendors', icon: Truck },
    { id: 'products' as const, label: 'Products', icon: ShoppingBag },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'stores':
        return <Stores />;
      case 'managers':
        return <Managers />;
      case 'raw-materials':
        return <RawMaterials />;
      case 'vendors':
        return <Vendors />;
      case 'products':
        return <Products />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar Navigation */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage your restaurant configuration and resources</p>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="p-[16px]">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;