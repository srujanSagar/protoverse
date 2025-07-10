import React, { useState, useMemo } from 'react';
import { Search, Users, Phone, Calendar, ShoppingBag, Store } from 'lucide-react';
import { Order } from '../types';
import Dropdown from './ui/Dropdown';

interface CustomersProps {
  orders: Order[];
}

interface CustomerData {
  name: string;
  mobile: string;
  totalOrders: number;
  lastOrdered: Date | null;
  totalSpent: number;
  outlets: string[];
}

const Customers: React.FC<CustomersProps> = ({ orders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState<string>('All Stores');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Updated to match actual CSV data
  const stores = ['All Stores', 'Kondapur', 'Kompally'];
  
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

  // Filter orders based on selected criteria
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Month filter
      const orderDate = new Date(order.timestamp);
      const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Store filter - normalize outlet names for comparison
      const normalizeOutletName = (name: string) => {
        return name.replace(/\s+/g, ' ').trim().toLowerCase();
      };
      
      const normalizedOrderOutlet = normalizeOutletName(order.outlet || '');
      const normalizedSelectedStore = normalizeOutletName(selectedStore);
      
      const matchesStore = selectedStore === 'All Stores' || 
        normalizedOrderOutlet === normalizedSelectedStore;
      
      return orderMonth === selectedMonth && matchesStore;
    });
  }, [orders, selectedMonth, selectedStore]);

  // Process orders to get unique customers with their data
  const customers = useMemo(() => {
    const customerMap = new Map<string, CustomerData>();

    filteredOrders.forEach(order => {
      const key = order.customer.mobile;
      const existing = customerMap.get(key);

      if (existing) {
        customerMap.set(key, {
          ...existing,
          totalOrders: existing.totalOrders + 1,
          lastOrdered: order.timestamp > (existing.lastOrdered || new Date(0)) 
            ? order.timestamp 
            : existing.lastOrdered,
          totalSpent: existing.totalSpent + order.total,
          outlets: order.outlet && !existing.outlets.includes(order.outlet) 
            ? [...existing.outlets, order.outlet]
            : existing.outlets
        });
      } else {
        customerMap.set(key, {
          name: order.customer.name,
          mobile: order.customer.mobile,
          totalOrders: 1,
          lastOrdered: order.timestamp,
          totalSpent: order.total,
          outlets: order.outlet ? [order.outlet] : []
        });
      }
    });

    return Array.from(customerMap.values()).sort((a, b) => 
      (b.lastOrdered?.getTime() || 0) - (a.lastOrdered?.getTime() || 0)
    );
  }, [filteredOrders]);

  // Filter customers based on search term
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.mobile.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  const getSelectedMonthLabel = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getSelectedStoreLabel = () => {
    return selectedStore === 'All Stores' ? 'all stores' : selectedStore;
  };

  return (
    <div className="p-[16px]">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Customers</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage customer information and order history</p>
        </div>
        
        {/* Global Filters */}
        <div className="flex items-center space-x-3">
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
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search customers by name or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            {customers.length === 0 ? (
              <>
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
                    <Users className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No customers yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No customers found for <strong>{getSelectedMonthLabel()}</strong> at <strong>{getSelectedStoreLabel()}</strong>
                </p>
                <p className="text-gray-500 dark:text-gray-400">Customers will appear here after their first order</p>
              </>
            ) : (
              <>
                <p className="text-gray-500 dark:text-gray-400 text-lg">No customers found</p>
                <p className="text-gray-400 dark:text-gray-500">Try adjusting your search term</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Outlets Visited
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Ordered
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCustomers.map((customer, index) => (
                  <tr key={customer.mobile} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{customer.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Customer #{index + 1}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900 dark:text-white">
                        <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                        {customer.mobile}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{customer.totalOrders}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {customer.totalOrders === 1 ? 'order' : 'orders'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">₹{customer.totalSpent.toFixed(0)}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Avg: ₹{(customer.totalSpent / customer.totalOrders).toFixed(0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {customer.outlets.map((outlet, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300"
                          >
                            {outlet}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.lastOrdered ? (
                        <div>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {customer.lastOrdered.toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {customer.lastOrdered.toLocaleTimeString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">Never</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;