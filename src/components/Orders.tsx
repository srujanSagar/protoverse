import React, { useState, useMemo } from 'react';
import { Plus, Receipt, Store, Calendar, FileX } from 'lucide-react';
import OrdersDashboard from './OrdersDashboard';
import { Order } from '../types';
import Dropdown from './ui/Dropdown';

interface OrdersProps {
  orders: Order[];
  onDeleteOrder: (orderDbId: string) => Promise<boolean>;
  onNewOrder: () => void;
}

const Orders: React.FC<OrdersProps> = ({ orders, onDeleteOrder, onNewOrder }) => {
  const [selectedStore, setSelectedStore] = useState<string>('All Stores');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedWeek, setSelectedWeek] = useState<string>('all-weeks');

  // Updated to match actual CSV data
  const stores = ['All Stores', 'Kondapur', 'Kompally'];
  
  // Week options
  const weekOptions = [
    'all-weeks',
    'week-1',
    'week-2', 
    'week-3',
    'week-4'
  ];
  
  // Generate month options (last 12 months)
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    
    return options;
  }, []);

  // Helper function to get week number within a month
  const getWeekOfMonth = (date: Date): number => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate which week of the month this date falls into
    const dayOfMonth = date.getDate();
    const adjustedDay = dayOfMonth + firstDayOfWeek - 1;
    
    return Math.ceil(adjustedDay / 7);
  };

  // Filter orders based on selected month, store, and week
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Month filter
      const orderDate = new Date(order.timestamp);
      const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (orderMonth !== selectedMonth) return false;
      
      // Store filter - normalize outlet names for comparison
      const normalizeOutletName = (name: string) => {
        return name.replace(/\s+/g, ' ').trim().toLowerCase();
      };
      
      const normalizedOrderOutlet = normalizeOutletName(order.outlet || '');
      const normalizedSelectedStore = normalizeOutletName(selectedStore);
      
      const matchesStore = selectedStore === 'All Stores' || 
        normalizedOrderOutlet === normalizedSelectedStore;
      
      if (!matchesStore) return false;
      
      // Week filter
      if (selectedWeek === 'all-weeks') return true;
      
      const weekNumber = getWeekOfMonth(orderDate);
      const selectedWeekNumber = parseInt(selectedWeek.split('-')[1]);
      
      return weekNumber === selectedWeekNumber;
    });
  }, [orders, selectedMonth, selectedStore, selectedWeek]);

  const getSelectedMonthLabel = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getSelectedStoreLabel = () => {
    return selectedStore === 'All Stores' ? 'all stores' : selectedStore;
  };

  const getSelectedWeekLabel = () => {
    if (selectedWeek === 'all-weeks') return 'all weeks';
    const weekNumber = selectedWeek.split('-')[1];
    return `${weekNumber}${getOrdinalSuffix(parseInt(weekNumber))} week`;
  };

  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  // Check if month has no data
  const hasNoData = filteredOrders.length === 0;

  return (
    <div className="p-[16px]">
      {/* Header with Store & Month Dropdowns and CTA */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Orders</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and view all restaurant orders</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Store Dropdown */}
          <div className="min-w-[140px]">
            <Dropdown
              value={selectedStore}
              onChange={setSelectedStore}
              options={stores}
              icon={<Store className="h-4 w-4 text-gray-400" />}
            />
          </div>

          {/* Month Dropdown */}
          <div className="min-w-[160px]">
            <Dropdown
              value={selectedMonth}
              onChange={setSelectedMonth}
              options={monthOptions.map(opt => opt.value)}
              optionLabels={monthOptions.reduce((acc, opt) => ({ ...acc, [opt.value]: opt.label }), {})}
              icon={<Calendar className="h-4 w-4 text-gray-400" />}
            />
          </div>

          {/* New Order CTA */}
          <button
            onClick={onNewOrder}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Order
          </button>
        </div>
      </div>

      {/* Orders Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {hasNoData ? (
          /* Empty State for Periods with No Orders */
          <div className="text-center py-16">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
                <FileX className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Orders Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              No orders found for the <strong>{getSelectedWeekLabel()}</strong> of <strong>{getSelectedMonthLabel()}</strong> at <strong>{getSelectedStoreLabel()}</strong>. 
              Try selecting a different time period or store, or create your first order.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={onNewOrder}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors mx-auto"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create First Order
              </button>
              <button
                onClick={() => setSelectedWeek('all-weeks')}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors mx-auto"
              >
                View All Weeks
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
                }}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors mx-auto"
              >
                View Current Month
              </button>
            </div>
          </div>
        ) : (
          /* Orders Dashboard with Filtered Data */
          <OrdersDashboard 
            orders={filteredOrders} 
            onDeleteOrder={onDeleteOrder}
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
            weekOptions={weekOptions}
          />
        )}
      </div>
    </div>
  );
};

export default Orders;