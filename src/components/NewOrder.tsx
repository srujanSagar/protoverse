import React, { useState, useEffect } from 'react';
import { Plus, Minus, ShoppingCart, User, Phone, Tag, Calculator, ArrowLeft, Store, Calendar } from 'lucide-react';
import { OrderItem, Customer, Order, DiscountCode } from '../types';
import Receipt from './Receipt';
import { useOrderSound } from '../hooks/useOrderSound';
import Dropdown from './ui/Dropdown';
import { useSettingsData } from '../hooks/useSettingsData';

interface NewOrderProps {
  discountCodes: DiscountCode[];
  onOrderComplete: (order: Order) => void;
}

const NewOrder: React.FC<NewOrderProps> = ({ discountCodes, onOrderComplete }) => {
  const { products } = useSettingsData();
  const [customer, setCustomer] = useState<Customer>({ name: '', mobile: '' });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [discountPercentage, setDiscountPercentage] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'cash' | 'card' | 'upi' | null>(null);
  const [selectedStore, setSelectedStore] = useState<string>('Kondapur');
  const [showReceipt, setShowReceipt] = useState<boolean>(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { playOrderSound } = useOrderSound();

  // Update current date every minute (no need for seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const categories = ['All', ...Array.from(new Set(products.map(item => (item.category || 'Uncategorized'))))];
  const filteredItems = selectedCategory === 'All' 
    ? products 
    : products.filter(item => (item.category || 'Uncategorized') === selectedCategory);

  const stores = ['Kondapur', 'Kompally']; // Updated to include both outlets

  const TAX_RATE = 0.1; // 10% GST

  // Helper function to get outlet code
  const getOutletCode = (storeName: string): string => {
    switch (storeName) {
      case 'Kondapur':
        return 'KDR';
      case 'Kompally':
        return 'KPL';
      default:
        return 'UNK'; // Unknown outlet fallback
    }
  };

  const addItemToOrder = (product: Product) => {
    setOrderItems(prev => {
      const existingItem = prev.find(item => item.product?.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.product?.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(prev => prev.filter(item => item.product?.id !== itemId));
    } else {
      setOrderItems(prev =>
        prev.map(item =>
          item.product?.id === itemId
            ? { ...item, quantity }
            : item
        )
      );
    }
  };

  // Helper function to get quantity of an item in the cart
  const getItemQuantity = (itemId: string) => {
    const item = orderItems.find(orderItem => orderItem.product?.id === itemId);
    return item ? item.quantity : 0;
  };

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0);
    
    let discountAmount = 0;
    const discountPercent = parseFloat(discountPercentage) || 0;
    
    if (discountPercent > 0) {
      discountAmount = subtotal * (discountPercent / 100);
    }

    const discountedSubtotal = subtotal - discountAmount;
    const taxAmount = discountedSubtotal * TAX_RATE;
    const total = discountedSubtotal + taxAmount;

    return { subtotal, discountAmount, taxAmount, total };
  };

  const { subtotal, discountAmount, taxAmount, total } = calculateTotals();

  const handleCompleteOrder = async () => {
    if (!customer.name || !customer.mobile || orderItems.length === 0 || !paymentType || !selectedStore) {
      alert('Please fill in customer details, add items to the order, select a store, and select a payment method.');
      return;
    }

    setIsSubmitting(true);

    // Generate order ID with outlet code
    const outletCode = getOutletCode(selectedStore);
    const orderId = `${outletCode}-${Date.now()}`;

    const order: Order = {
      id: orderId,
      customer,
      items: orderItems,
      subtotal,
      discountCode: discountPercentage ? `${discountPercentage}%` : undefined,
      discountAmount,
      taxRate: TAX_RATE,
      taxAmount,
      total,
      paymentType,
      timestamp: new Date(),
      status: 'completed',
      outlet: selectedStore // Add outlet information to the order
    };

    try {
      await onOrderComplete(order);
      
      // Play success sound
      playOrderSound();
      
      setCurrentOrder(order);
      setShowReceipt(true);
    } catch (error) {
      console.error('Error completing order:', error);
      alert('Failed to complete order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetOrder = () => {
    setCustomer({ name: '', mobile: '' });
    setOrderItems([]);
    setDiscountPercentage('');
    setPaymentType(null);
    setSelectedStore('Kondapur');
    setShowReceipt(false);
    setCurrentOrder(null);
  };

  const handleBack = () => {
    // Redirect to orders page by calling the parent's onOrderComplete with null
    // This will trigger the app to switch to orders view
    onOrderComplete(null as any);
  };

  if (showReceipt && currentOrder) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50">
        <Receipt 
          order={currentOrder} 
          onClose={() => setShowReceipt(false)}
          onNewOrder={resetOrder}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mr-4"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">New Order</h1>
            </div>
            
            {/* Date Display with Calendar Icon */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-red-500" />
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {currentDate.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu Items */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Menu Items</h2>
                
                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-full font-medium transition-colors ${
                        selectedCategory === category
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/70'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Items Grid */}
              <div className="p-6">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No menu items available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredItems.map(item => {
                      const quantity = getItemQuantity(item.id);
                      
                      return (
                        <div
                          key={item.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                        >
                          {/* Item Image */}
                          {item.image && (
                            <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-700">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-32 object-cover"
                                onError={(e) => {
                                  // Hide image if it fails to load
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          
                          <div className="p-4">
                            {/* Title */}
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{item.name}</h3>
                            
                            {/* Price and Stepper Row */}
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-green-600 dark:text-green-400">₹{item.price.toFixed(0)}</span>
                              
                              {/* Stepper or Add Button */}
                              {quantity === 0 ? (
                                /* Add Button - Now using neutral gray style */
                                <button
                                  onClick={() => addItemToOrder(item)}
                                  className="flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                  <Plus className="h-5 w-5" />
                                </button>
                              ) : (
                                /* Stepper Controls */
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => updateItemQuantity(item.id, quantity - 1)}
                                    className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <span className="w-8 text-center font-semibold text-gray-900 dark:text-white">{quantity}</span>
                                  <button
                                    onClick={() => updateItemQuantity(item.id, quantity + 1)}
                                    className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Order Details - Store and Selected Items */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Order Details
              </h3>
              
              {/* Store Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Store</label>
                <Dropdown
                  value={selectedStore}
                  onChange={setSelectedStore}
                  options={stores}
                  icon={<Store className="h-4 w-4 text-gray-400" />}
                />
              </div>

              {/* 16px space */}
              <div className="mb-4"></div>

              {/* Selected Items */}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Selected Items ({orderItems.length})
                </p>
                
                {orderItems.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No items added yet</p>
                ) : (
                  <div className="space-y-3">
                    {orderItems.map(item => (
                      <div key={item.product?.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">{item.product?.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">₹{item.product?.price.toFixed(0)} each</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateItemQuantity(item.product?.id || '', item.quantity - 1)}
                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            <Minus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </button>
                          <span className="w-8 text-center font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateItemQuantity(item.product?.id || '', item.quantity + 1)}
                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            <Plus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </button>
                        </div>
                        <div className="ml-4 text-right">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            ₹{(item.product?.price || 0 * item.quantity).toFixed(0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Customer Info
              </h3>
              <div className="space-y-4">
                {/* Customer Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={customer.name}
                    onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Enter customer name"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="tel"
                      value={customer.mobile}
                      onChange={(e) => setCustomer(prev => ({ ...prev, mobile: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Enter mobile number"
                    />
                  </div>
                </div>

                {/* Payment Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Paid By</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setPaymentType('cash')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        paymentType === 'cash'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg font-semibold">💵</div>
                        <div className="text-sm font-medium">Cash</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setPaymentType('card')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        paymentType === 'card'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg font-semibold">💳</div>
                        <div className="text-sm font-medium">Card</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setPaymentType('upi')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        paymentType === 'upi'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg font-semibold">📱</div>
                        <div className="text-sm font-medium">UPI</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Total */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Order Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="font-medium text-gray-900 dark:text-white">₹{subtotal.toFixed(0)}</span>
                </div>
                
                {/* Discount Line Item */}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <input
                        type="number"
                        value={discountPercentage}
                        onChange={(e) => setDiscountPercentage(e.target.value)}
                        placeholder="0"
                        className="w-20 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 text-center pr-7 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        min="0"
                        max="100"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400 pointer-events-none">
                        %
                      </span>
                    </div>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {discountAmount > 0 ? `-₹${discountAmount.toFixed(0)}` : '₹0'}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">GST (10%):</span>
                  <span className="font-medium text-gray-900 dark:text-white">₹{taxAmount.toFixed(0)}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900 dark:text-white">Total:</span>
                    <span className="text-green-600 dark:text-green-400">₹{total.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCompleteOrder}
                disabled={!customer.name || !customer.mobile || orderItems.length === 0 || !paymentType || !selectedStore || isSubmitting}
                className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  'Complete Order'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewOrder;