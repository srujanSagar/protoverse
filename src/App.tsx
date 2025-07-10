import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import Customers from './components/Customers';
import NewOrder from './components/NewOrder';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import ErrorBoundary from './components/ErrorBoundary';
import { useSupabaseData } from './hooks/useSupabaseData';
import Products from './components/settings/Products';
import Stores from './components/settings/Stores';
import Vendors from './components/settings/Vendors';
import Managers from './components/settings/Managers';
import RawMaterials from './components/settings/RawMaterials';

const MAIN_VIEWS = ['dashboard', 'orders', 'customers', 'new-order'];
const SETTINGS_VIEWS = ['products', 'stores', 'vendors', 'managers', 'raw-materials'];

function App() {
  const [activeKey, setActiveKey] = useState('dashboard');

  const {
    menuItems,
    discountCodes,
    orders,
    loading,
    error,
    createOrder,
    deleteOrder,
    refreshData
  } = useSupabaseData();

  const handleOrderComplete = async (order: any) => {
    if (!order) {
      setActiveKey('orders');
      return;
    }
    const success = await createOrder(order);
    if (success) {
      setActiveKey('orders');
    }
  };

  const handleDeleteOrder = async (orderDbId: string) => {
    return await deleteOrder(orderDbId);
  };

  const handleNewOrder = () => {
    setActiveKey('new-order');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={refreshData} />;
  }

  // Render the correct view based on activeKey
  const renderCurrentView = () => {
    if (MAIN_VIEWS.includes(activeKey)) {
      switch (activeKey) {
        case 'dashboard':
          return <Dashboard orders={orders} />;
        case 'orders':
          return (
            <Orders
              orders={orders}
              onDeleteOrder={handleDeleteOrder}
              onNewOrder={handleNewOrder}
            />
          );
        case 'customers':
          return <Customers orders={orders} />;
        case 'new-order':
          return (
            <NewOrder
              discountCodes={discountCodes}
              onOrderComplete={handleOrderComplete}
            />
          );
        default:
          return <Dashboard orders={orders} />;
      }
    } else if (SETTINGS_VIEWS.includes(activeKey)) {
      switch (activeKey) {
        case 'products':
          return <Products />;
        case 'stores':
          return <Stores />;
        case 'vendors':
          return <Vendors />;
        case 'managers':
          return <Managers />;
        case 'raw-materials':
          return <RawMaterials />;
        default:
          return null;
      }
    }
    return <Dashboard orders={orders} />;
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex flex-col">
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          {activeKey !== 'new-order' && (
            <Sidebar activeKey={activeKey} onNavigate={setActiveKey} />
          )}
          {/* Main Content */}
          <main className="flex-1 min-w-0 p-6 md:p-8">
            {renderCurrentView()}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;