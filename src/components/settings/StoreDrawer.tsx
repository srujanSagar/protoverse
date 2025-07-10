import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, User, Package, Crown, AlertCircle, ExternalLink, ArrowDown } from 'lucide-react';

interface Store {
  id: string;
  name: string;
  address: string;
  gstin?: string;
  managerId?: string;
  managerName?: string;
  productIds: string[];
  productCount: number;
  isCentral: boolean;
  isActive: boolean;
}

interface Manager {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
}

interface StoreDrawerProps {
  isOpen: boolean;
  store?: Store | null;
  managers: Manager[];
  products: Product[];
  onSubmit: (store: Omit<Store, 'id' | 'hasActiveOrders'>) => void;
  onClose: () => void;
  validateStoreName?: (name: string, excludeId?: string) => { isValid: boolean; message?: string };
}

const StoreDrawer: React.FC<StoreDrawerProps> = ({
  isOpen,
  store,
  managers,
  products,
  onSubmit,
  onClose,
  validateStoreName
}) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    gstin: '',
    managerId: '',
    productIds: [] as string[],
    isCentral: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managersLoading] = useState(false);
  const [productsLoading] = useState(false);
  const [showCTAs, setShowCTAs] = useState(false);
  
  const drawerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Initialize form data when editing
  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name,
        address: store.address,
        gstin: (store as any).gstin || '',
        managerId: store.managerId || '',
        productIds: store.productIds,
        isCentral: store.isCentral
      });
    } else {
      setFormData({
        name: '',
        address: '',
        gstin: '',
        managerId: '',
        productIds: [],
        isCentral: false
      });
    }
    setErrors({});
    setShowCTAs(false);
  }, [store, isOpen]);

  // Handle scroll to show/hide CTAs
  useEffect(() => {
    const handleScroll = () => {
      if (drawerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = drawerRef.current;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
        setShowCTAs(isAtBottom);
      }
    };

    const drawerElement = drawerRef.current;
    if (drawerElement) {
      drawerElement.addEventListener('scroll', handleScroll);
      // Check initial state
      handleScroll();
      
      return () => drawerElement.removeEventListener('scroll', handleScroll);
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Store name is required';
    } else if (validateStoreName) {
      // Check for duplicate store name if validation function is provided
      const validation = validateStoreName(formData.name, store?.id);
      if (!validation.isValid) {
        newErrors.name = validation.message || 'Store name already exists';
      }
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (formData.productIds.length === 0) {
      newErrors.products = 'At least one product must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const managerName = managers.find(m => m.id === formData.managerId)?.name;
      
      onSubmit({
        name: formData.name.trim(),
        address: formData.address.trim(),
        gstin: formData.gstin.trim(),
        managerId: formData.managerId || undefined,
        managerName,
        productIds: formData.productIds,
        productCount: formData.productIds.length,
        isCentral: formData.isCentral,
        isActive: true
      });
    } catch (error) {
      console.error('Error submitting store:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductToggle = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter(id => id !== productId)
        : [...prev.productIds, productId]
    }));
    
    // Clear products error when user selects items
    if (errors.products) {
      setErrors(prev => ({ ...prev, products: '' }));
    }
  };

  const handleSelectAllProducts = () => {
    const allProductIds = products.map(p => p.id);
    const isAllSelected = allProductIds.every(id => formData.productIds.includes(id));
    
    setFormData(prev => ({
      ...prev,
      productIds: isAllSelected ? [] : allProductIds
    }));
    
    // Clear products error when user selects items
    if (errors.products) {
      setErrors(prev => ({ ...prev, products: '' }));
    }
  };

  const isEditing = !!store;
  const allProductsSelected = products.length > 0 && products.every(p => formData.productIds.includes(p.id));

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-gray-800 shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Store' : 'Create New Store'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isEditing ? 'Update store information and configuration' : 'Add a new store location to your restaurant chain'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div ref={drawerRef} className="flex-1 overflow-y-auto">
          <div className="p-6">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              {/* Store Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Store Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                    if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    errors.name 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter store name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, address: e.target.value }));
                    if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
                  }}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none ${
                    errors.address 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter complete store address"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.address}
                  </p>
                )}
              </div>

              {/* GSTIN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  GSTIN
                </label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => setFormData(prev => ({ ...prev, gstin: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  placeholder="Enter GSTIN (optional)"
                />
              </div>

              {/* Manager */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Manager
                </label>
                {managersLoading ? (
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-gray-500 dark:text-gray-400">Loading managers...</span>
                    </div>
                  </div>
                ) : managers.length === 0 ? (
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-yellow-50 dark:bg-yellow-900/50">
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-800 dark:text-yellow-300">No managers found. Create one first.</span>
                      <button
                        type="button"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center"
                      >
                        Create Manager <ExternalLink className="h-3 w-3 ml-1" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    value={formData.managerId}
                    onChange={(e) => setFormData(prev => ({ ...prev, managerId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Select a manager (optional)</option>
                    {managers.map(manager => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Products */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Menu *
                </label>
                {productsLoading ? (
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-gray-500 dark:text-gray-400">Loading products...</span>
                    </div>
                  </div>
                ) : products.length === 0 ? (
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-yellow-50 dark:bg-yellow-900/50">
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-800 dark:text-yellow-300">No products found. Create products first.</span>
                      <button
                        type="button"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center"
                      >
                        Create Product <ExternalLink className="h-3 w-3 ml-1" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`border rounded-lg ${
                    errors.products 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {/* Select All Header */}
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allProductsSelected}
                          onChange={handleSelectAllProducts}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Select All Products ({products.length})
                        </span>
                      </label>
                    </div>
                    
                    {/* Products List */}
                    <div className="p-4 max-h-60 overflow-y-auto">
                      <div className="space-y-2">
                        {products.map(product => (
                          <label key={product.id} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.productIds.includes(product.id)}
                              onChange={() => handleProductToggle(product.id)}
                              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                            />
                            <div className="flex items-center space-x-2">
                              <Package className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{product.name}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {formData.productIds.length > 0 && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {formData.productIds.length} {formData.productIds.length === 1 ? 'product' : 'products'} selected
                  </p>
                )}
                {errors.products && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.products}
                  </p>
                )}
              </div>

              {/* Central Store (moved to end) */}
              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isCentral}
                    onChange={(e) => setFormData(prev => ({ ...prev, isCentral: e.target.checked }))}
                    disabled={isEditing && store?.isCentral} // Prevent removing central status during edit
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50"
                  />
                  <div className="flex items-center space-x-2">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Set as Central Store</span>
                  </div>
                </label>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 ml-7">
                  Central store manages all locations and inventory
                </p>
                {isEditing && store?.isCentral && (
                  <p className="mt-1 text-sm text-blue-600 dark:text-blue-400 ml-7 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Cannot remove central store status during edit
                  </p>
                )}
              </div>

              {/* Spacer to ensure content is scrollable */}
              <div className="h-32"></div>
            </form>
          </div>
        </div>

        {/* Scroll Indicator - Bottom Left */}
        {!showCTAs && (
          <div className="absolute bottom-20 left-6 bg-blue-600 text-white px-3 py-1 rounded-full text-xs flex items-center space-x-1 animate-bounce">
            <span>Scroll to continue</span>
            <ArrowDown className="h-3 w-3" />
          </div>
        )}

        {/* Fixed CTAs */}
        <div className={`border-t border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800 transition-all duration-300 ${
          showCTAs ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'
        }`}>
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                formRef.current?.requestSubmit();
              }}
              disabled={isSubmitting || managersLoading || productsLoading || products.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Store' : 'Create Store'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default StoreDrawer;