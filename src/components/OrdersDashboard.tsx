import React, { useState, useMemo } from 'react';
import { Search, Download, Eye, Trash2, Receipt as ReceiptIcon } from 'lucide-react';
import { Order } from '../types';
import Receipt from './Receipt';
import Dropdown from './ui/Dropdown';

interface OrdersDashboardProps {
  orders: Order[];
  onDeleteOrder: (orderDbId: string) => Promise<boolean>;
  selectedWeek: string;
  onWeekChange: (week: string) => void;
  weekOptions: string[];
}

const OrdersDashboard: React.FC<OrdersDashboardProps> = ({ 
  orders, 
  onDeleteOrder, 
  selectedWeek, 
  onWeekChange, 
  weekOptions 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Search filter
      const matchesSearch = 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.mobile.includes(searchTerm);

      return matchesSearch;
    });
  }, [orders, searchTerm]);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowReceipt(true);
  };

  const handleDeleteOrder = async (order: Order) => {
    if (!order.dbId) {
      alert('Cannot delete order: Missing database ID');
      return;
    }

    if (!confirm(`Are you sure you want to delete order ${order.id}?`)) {
      return;
    }

    setDeletingOrderId(order.dbId);
    
    try {
      const success = await onDeleteOrder(order.dbId);
      if (!success) {
        alert('Failed to delete order. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order. Please try again.');
    } finally {
      setDeletingOrderId(null);
    }
  };

  const exportOrders = () => {
    // Export only the filtered orders
    const csvContent = [
      ['Order ID', 'Date', 'Customer Name', 'Customer Mobile', 'Items', 'Payment Type', 'Total'].join(','),
      ...filteredOrders.map(order => [
        order.id,
        order.timestamp.toLocaleString(),
        order.customer.name,
        order.customer.mobile,
        order.items.length,
        order.paymentType,
        order.total.toFixed(0)
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (showReceipt && selectedOrder) {
    return (
      <Receipt
        order={selectedOrder}
        onClose={() => {
          setShowReceipt(false);
          setSelectedOrder(null);
        }}
        onNewOrder={() => {
          setShowReceipt(false);
          setSelectedOrder(null);
        }}
      />
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between gap-4">
          {/* Search - Extreme Left */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search orders by ID, customer name, or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Week Filter & Export - Extreme Right */}
          <div className="flex items-center space-x-3">
            {/* Week Filter */}
            <div className="w-44">
              <Dropdown
                value={selectedWeek}
                onChange={onWeekChange}
                options={weekOptions}
                optionLabels={{
                  'all-weeks': 'All Weeks',
                  'week-1': '1st Week',
                  'week-2': '2nd Week',
                  'week-3': '3rd Week',
                  'week-4': '4th Week'
                }}
                icon={<ReceiptIcon className="h-4 w-4 text-gray-400" />}
                className="w-full"
              />
            </div>

            {/* Export Button */}
            <button
              onClick={exportOrders}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
            >
              <Download className="h-4 w-4 mr-2" />
              Export ({filteredOrders.length})
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No orders found</p>
            <p className="text-gray-400 dark:text-gray-500">Try adjusting your search term</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Order Details ({filteredOrders.length})
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{order.id}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {order.timestamp.toLocaleDateString()} {order.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{order.customer.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{order.customer.mobile}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">{order.items.length} items</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {order.items.slice(0, 2).map(item => item.menuItem.name).join(', ')}
                          {order.items.length > 2 && '...'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {order.paymentType === 'cash' && '💵'}
                          {order.paymentType === 'card' && '💳'}
                          {order.paymentType === 'upi' && '📱'}
                        </span>
                        <span className="ml-2 text-sm text-gray-900 dark:text-white capitalize">{order.paymentType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">₹{order.total.toFixed(0)}</p>
                      {order.discountAmount > 0 && (
                        <p className="text-sm text-green-600 dark:text-green-400">-₹{order.discountAmount.toFixed(0)} discount</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="flex items-center px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order)}
                          disabled={deletingOrderId === order.dbId}
                          className="flex items-center px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingOrderId === order.dbId ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 dark:border-red-400 mr-1"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </>
                          )}
                        </button>
                      </div>
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

export default OrdersDashboard;