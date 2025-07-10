import React from 'react';
import { X, Printer, Download, ShoppingBag } from 'lucide-react';
import { Order } from '../types';

interface ReceiptProps {
  order: Order;
  onClose: () => void;
  onNewOrder: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({ order, onClose, onNewOrder }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a simple text receipt for download
    const receiptText = `
RESTAURANT POS - RECEIPT
========================
Order ID: ${order.id}
Date: ${order.timestamp.toLocaleString()}

Customer Details:
Name: ${order.customer.name}
Mobile: ${order.customer.mobile}

Items:
${order.items.map(item => 
  `${item.menuItem.name} x${item.quantity} - ₹${(item.menuItem.price * item.quantity).toFixed(0)}`
).join('\n')}

------------------------
Subtotal: ₹${order.subtotal.toFixed(0)}
${order.discountAmount > 0 ? `Discount: -₹${order.discountAmount.toFixed(0)}\n` : ''}GST (${(order.taxRate * 100).toFixed(0)}%): ₹${order.taxAmount.toFixed(0)}
------------------------
TOTAL: ₹${order.total.toFixed(0)}

Thank you for your business!
    `.trim();

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${order.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 print:hidden">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Receipt</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-2">
              <ShoppingBag className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Restaurant POS</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Thank you for your order!</p>
          </div>

          {/* Order Details */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Order ID:</p>
                <p className="text-gray-600 dark:text-gray-400">{order.id}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Date:</p>
                <p className="text-gray-600 dark:text-gray-400">{order.timestamp.toLocaleString()}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Customer:</p>
                <p className="text-gray-600 dark:text-gray-400">{order.customer.name}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Mobile:</p>
                <p className="text-gray-600 dark:text-gray-400">{order.customer.mobile}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Items Ordered:</h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{item.menuItem.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ₹{item.menuItem.price.toFixed(0)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ₹{(item.menuItem.price * item.quantity).toFixed(0)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{order.subtotal.toFixed(0)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Discount ({order.discountCode}):</span>
                  <span>-₹{order.discountAmount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">GST ({(order.taxRate * 100).toFixed(0)}%):</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{order.taxAmount.toFixed(0)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="text-green-600 dark:text-green-400">₹{order.total.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Thank you for dining with us!</p>
            <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">Have a great day!</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </button>
        </div>

        <div className="p-6 pt-0 print:hidden">
          <button
            onClick={onNewOrder}
            className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            Start New Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default Receipt;