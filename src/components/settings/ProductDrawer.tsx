import React, { useState, useEffect, useRef } from 'react';
import { X, ShoppingBag, IndianRupee, Store, ToggleLeft, ToggleRight, AlertCircle, Hash, ArrowDown, FileText, Tag, Plus, Minus, Search, Trash2 } from 'lucide-react';
import { useSettingsData } from '../../hooks/useSettingsData';

interface Product {
  id: string;
  name: string;
  price: number;
  storeIds: string[];
  storeNames: string[];
  status: 'active' | 'inactive';
  code: string;
  recipe?: string;
  createdAt: string;
  type?: 'single' | 'combo';
  variants?: Array<{ value: string; price: number; recipe?: string }>;
  comboProducts?: Array<{ productId: string; variantId?: string }>;
  comboPrice?: number;
  endDate?: string;
  vegType: 'veg' | 'non-veg';
  isCombo: boolean;
  addOns?: Array<{ id: string; type: 'product' | 'raw'; name: string; quantity: number; price: number }>;
}

interface Store {
  id: string;
  name: string;
  isActive: boolean;
}

interface ProductDrawerProps {
  isOpen: boolean;
  product?: Product | null;
  productType?: 'single' | 'combo' | null;
  stores: Store[];
  onSubmit: (product: Omit<Product, 'id' | 'code' | 'createdAt' | 'storeNames'>) => void;
  onClose: () => void;
  validateProductName?: (name: string, excludeId?: string) => { isValid: boolean; message?: string };
}

const ProductDrawer: React.FC<ProductDrawerProps> = ({
  isOpen,
  product,
  productType,
  stores,
  onSubmit,
  onClose,
  validateProductName
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    price: 0,
    storeIds: [] as string[],
    status: 'active' as 'active' | 'inactive',
    recipe: '',
    vegType: 'veg' as 'veg' | 'non-veg',
    isCombo: false,
    nutritionalInfo: '',
    allergenInfo: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCTAs, setShowCTAs] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [productRows, setProductRows] = useState([{ name: '', price: 0 }]);
  const [productRowErrors, setProductRowErrors] = useState<{ name?: string; price?: string }[]>([]);
  
  const drawerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const { products, rawMaterials } = useSettingsData();

  const [enableAddOns, setEnableAddOns] = useState(false);
  const [addOns, setAddOns] = useState<Array<{ id: string; type: 'product' | 'raw'; name: string; quantity: string; price: string }>>([]);
  const [addOnErrors, setAddOnErrors] = useState<string>('');
  const [addOnSearch, setAddOnSearch] = useState<string>('');
  const [addOnSuggestions, setAddOnSuggestions] = useState<Array<{ id: string; type: 'product' | 'raw'; name: string }>>([]);

  // Initialize form data when editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        code: product.code,
        price: product.price,
        storeIds: product.storeIds,
        status: product.status,
        recipe: product.recipe || '',
        vegType: (product as any).vegType || 'veg',
        isCombo: (product as any).isCombo || false,
        nutritionalInfo: (product as any).nutritionalInfo || '',
        allergenInfo: (product as any).allergenInfo || '',
      });
      setProductRows([{ name: product.name, price: product.price }]);
    } else {
      setFormData({
        name: '',
        code: generatePreviewCode(),
        price: 0,
        storeIds: [],
        status: 'active',
        recipe: '',
        vegType: 'veg',
        isCombo: false,
        nutritionalInfo: '',
        allergenInfo: '',
      });
      setProductRows([{ name: '', price: 0 }]);
    }
    setErrors({});
    setProductRowErrors([]);
    setShowCTAs(false);
  }, [product, isOpen]);

  // Reset add-ons on open/edit
  useEffect(() => {
    if (product && product.addOns && product.addOns.length > 0) {
      setEnableAddOns(true);
      setAddOns(product.addOns.map(a => ({ ...a, quantity: a.quantity.toString(), price: a.price !== undefined ? a.price.toString() : '0' })));
    } else {
      setEnableAddOns(false);
      setAddOns([]);
    }
    setAddOnErrors('');
    setAddOnSearch('');
    setAddOnSuggestions([]);
  }, [product, isOpen]);

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

  const generatePreviewCode = () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(2, 10).replace(/-/g, '');
    const type = productType === 'combo' ? 'COMBO' : 'PROD';
    return `${type}-${dateStr}-XXX`;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (validateProductName) {
      const validation = validateProductName(formData.name, product?.id);
      if (!validation.isValid) {
        newErrors.name = validation.message || 'Product name already exists';
      }
    }
    if (!formData.code.trim()) {
      newErrors.code = 'Product code is required';
    }
    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    if (formData.storeIds.length === 0) {
      newErrors.stores = 'At least one store must be selected';
    }
    if (!formData.vegType) {
      newErrors.vegType = 'Please select Veg/Non-veg';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add-ons validation
  const validateAddOns = () => {
    if (!enableAddOns) return true;
    if (addOns.length === 0) {
      setAddOnErrors('At least one add-on is required.');
      return false;
    }
    const ids = new Set();
    for (const addOn of addOns) {
      if (!addOn.name.trim()) {
        setAddOnErrors('Add-on name is required.');
        return false;
      }
      if (!addOn.quantity || !addOn.quantity.toString().trim()) {
        setAddOnErrors('Quantity is required.');
        return false;
      }
      if (!addOn.price || !addOn.price.toString().trim()) {
        setAddOnErrors('Price is required.');
        return false;
      }
      const key = addOn.type + '-' + addOn.id;
      if (ids.has(key)) {
        setAddOnErrors('Duplicate add-ons are not allowed.');
        return false;
      }
      ids.add(key);
    }
    setAddOnErrors('');
    return true;
  };

  const handleAddOnSearch = (value: string) => {
    setAddOnSearch(value);
    if (!value.trim()) {
      setAddOnSuggestions([]);
      return;
    }
    const lower = value.toLowerCase();
    const productMatches = products.filter(p => p.name.toLowerCase().includes(lower)).map(p => ({ id: p.id, type: 'product' as const, name: p.name }));
    const rawMatches = rawMaterials.filter(r => r.name.toLowerCase().includes(lower)).map(r => ({ id: r.id, type: 'raw' as const, name: r.name }));
    setAddOnSuggestions([...productMatches, ...rawMatches].filter(s => !addOns.some(a => a.id === s.id && a.type === s.type)));
  };
  const handleAddOnSelect = (suggestion: { id: string; type: 'product' | 'raw'; name: string }) => {
    setAddOns([...addOns, { ...suggestion, quantity: '1', price: '0' }]);
    setAddOnSearch('');
    setAddOnSuggestions([]);
  };
  const handleAddOnQuantityChange = (idx: number, value: string) => {
    setAddOns(addOns.map((a, i) => i === idx ? { ...a, quantity: value } : a));
  };
  const handleAddOnPriceChange = (idx: number, value: string) => {
    setAddOns(addOns.map((a, i) => i === idx ? { ...a, price: value } : a));
  };
  const handleRemoveAddOn = (idx: number) => {
    setAddOns(addOns.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate all rows
    const rowErrors = productRows.map(row => {
      const errs: { name?: string; price?: string } = {};
      if (!row.name.trim()) errs.name = 'Product name is required';
      if (row.price <= 0) errs.price = 'Price must be greater than 0';
      return errs;
    });
    setProductRowErrors(rowErrors);
    if (rowErrors.some(err => Object.keys(err).length > 0)) {
      setToast({ type: 'error', message: 'Please fix the errors above.' });
      return;
    }
    if (!validateAddOns()) {
      setToast({ type: 'error', message: addOnErrors || 'Please fix add-on errors.' });
      return;
    }
    setIsSubmitting(true);
    try {
      for (const row of productRows) {
        const cleanedData: any = {
          ...formData,
          name: row.name.trim(),
          price: row.price,
          addOns: enableAddOns ? addOns : undefined,
        };
        await onSubmit(cleanedData);
      }
      setToast({ type: 'success', message: isEditing ? 'Product(s) updated!' : 'Product(s) created!' });
    } catch (error: any) {
      setToast({ type: 'error', message: error?.message || 'Error submitting product.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStoreToggle = (storeId: string) => {
    setFormData(prev => ({
      ...prev,
      storeIds: prev.storeIds.includes(storeId)
        ? prev.storeIds.filter(id => id !== storeId)
        : [...prev.storeIds, storeId]
    }));
    
    // Clear stores error when user selects items
    if (errors.stores) {
      setErrors(prev => ({ ...prev, stores: '' }));
    }
  };

  const handleSelectAllStores = () => {
    const allStoreIds = stores.map(s => s.id);
    const isAllSelected = allStoreIds.every(id => formData.storeIds.includes(id));
    
    setFormData(prev => ({
      ...prev,
      storeIds: isAllSelected ? [] : allStoreIds
    }));
    
    // Clear stores error when user selects items
    if (errors.stores) {
      setErrors(prev => ({ ...prev, stores: '' }));
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePriceChange = (value: string) => {
    const numValue = value === '' ? 0 : Math.max(0, parseFloat(value) || 0);
    setFormData(prev => ({ ...prev, price: numValue }));
    
    if (errors.price) {
      setErrors(prev => ({ ...prev, price: '' }));
    }
  };

  const isEditing = !!product;
  const allStoresSelected = stores.length > 0 && stores.every(s => formData.storeIds.includes(s.id));

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
              {isEditing ? 'Edit Product' : `Add Product`}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isEditing ? 'Update product information and store assignments' : `Add a new product to your catalog`}
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
              {/* Product Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Product Code *
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleFieldChange('code', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                      errors.code 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter product code"
                  />
                </div>
                {errors.code && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.code}
                  </p>
                )}
              </div>

              {/* Product Name */}
              <div className="flex items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Product Name *</label>
                <div className="relative group">
                  <AlertCircle className="h-4 w-4 text-gray-400 dark:text-gray-500 cursor-pointer" />
                  <div className="absolute left-6 top-0 z-10 w-72 p-4 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-pre-line">
                    {`eg:
1. Cream Kunafa  --single item

2. Dry-fruit Baklava - 250 gms  --item with variant

3. Kunafa Chocolate Milk + Kunafa Chocolate Dark  --combo items`}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {productRows.map((row, idx) => (
                  <div key={idx} className="flex items-center space-x-2 mb-2">
                    <div className="relative w-4/5">
                      <ShoppingBag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        value={row.name}
                        onChange={e => {
                          const newRows = [...productRows];
                          newRows[idx].name = e.target.value;
                          setProductRows(newRows);
                        }}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${productRowErrors[idx]?.name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}`}
                        placeholder="Enter product name"
                      />
                      {productRowErrors[idx]?.name && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {productRowErrors[idx].name}
                        </p>
                      )}
                    </div>
                    <div className="relative w-1/5">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.price}
                        onChange={e => {
                          const newRows = [...productRows];
                          newRows[idx].price = parseFloat(e.target.value) || 0;
                          setProductRows(newRows);
                        }}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${productRowErrors[idx]?.price ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}`}
                        placeholder="0.00"
                      />
                      {productRowErrors[idx]?.price && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {productRowErrors[idx].price}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="ml-2 p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600"
                      onClick={() => setProductRows([...productRows, { name: '', price: 0 }])}
                      aria-label="Add row"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                    {productRows.length > 1 && (
                      <button
                        type="button"
                        className="ml-1 p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600"
                        onClick={() => setProductRows(productRows.filter((_, i) => i !== idx))}
                        aria-label="Delete row"
                      >
                        <Minus className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.name}
                </p>
              )}

              {/* Single Product Specific Fields */}
              <div className="flex flex-col md:flex-row md:space-x-6 space-y-4 md:space-y-0 mb-4">
                {/* Is Combo? Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Is Combo?</label>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('isCombo', !formData.isCombo)}
                    className="flex items-center space-x-3 cursor-pointer"
                  >
                    {formData.isCombo ? (
                      <ToggleRight className="h-6 w-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                    )}
                    <span className={`text-sm font-medium ${formData.isCombo ? 'text-green-700 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'}`}>{formData.isCombo ? 'Yes' : 'No'}</span>
                  </button>
                </div>
                {/* Veg/Non-veg Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Veg/Non-veg *</label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="vegType"
                        value="veg"
                        checked={formData.vegType === 'veg'}
                        onChange={() => handleFieldChange('vegType', 'veg')}
                        className="accent-green-600"
                      />
                      <span className="text-sm text-green-700 dark:text-green-300">Veg</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="vegType"
                        value="non-veg"
                        checked={formData.vegType === 'non-veg'}
                        onChange={() => handleFieldChange('vegType', 'non-veg')}
                        className="accent-red-600"
                      />
                      <span className="text-sm text-red-700 dark:text-red-300">Non-veg</span>
                    </label>
                  </div>
                  {errors.vegType && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.vegType}
                    </p>
                  )}
                </div>
              </div>

              {/* Stores */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stores *
                </label>
                {stores.length === 0 ? (
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-yellow-50 dark:bg-yellow-900/50">
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-800 dark:text-yellow-300">No stores found. Create store first.</span>
                      <button
                        type="button"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        Create Store
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`border rounded-lg ${
                    errors.stores 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {/* Select All Header */}
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allStoresSelected}
                          onChange={handleSelectAllStores}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Select All Stores ({stores.length})
                        </span>
                      </label>
                    </div>
                    
                    {/* Stores List */}
                    <div className="p-4 max-h-48 overflow-y-auto">
                      <div className="space-y-2">
                        {stores.map(store => (
                          <label key={store.id} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.storeIds.includes(store.id)}
                              onChange={() => handleStoreToggle(store.id)}
                              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                            />
                            <div className="flex items-center space-x-2">
                              <Store className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{store.name}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {formData.storeIds.length > 0 && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {formData.storeIds.length} {formData.storeIds.length === 1 ? 'store' : 'stores'} selected
                  </p>
                )}
                {errors.stores && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.stores}
                  </p>
                )}
              </div>

              {/* Status Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, status: prev.status === 'active' ? 'inactive' : 'active' }))}
                  className="flex items-center space-x-3 cursor-pointer"
                >
                  {formData.status === 'active' ? (
                    <ToggleRight className="h-6 w-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    formData.status === 'active' 
                      ? 'text-green-700 dark:text-green-300' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {formData.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </button>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Inactive products won't be available for ordering
                </p>
              </div>

              {/* Recipe (Optional) */}
              {!formData.isCombo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Recipe (Optional)
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <textarea
                      value={formData.recipe}
                      onChange={(e) => handleFieldChange('recipe', e.target.value)}
                      rows={4}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                      placeholder={`- 1 kg couverture chocolate\n- 200 g kataifi pastry\n- 150 ml heavy cream`}
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Include all raw materials in the recipe for accurate stock insights.
                  </p>
                </div>
              )}
              {/* Nutritional Info (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nutritional Info (Optional)
                </label>
                <textarea
                  value={formData.nutritionalInfo}
                  onChange={e => handleFieldChange('nutritionalInfo', e.target.value)}
                  rows={2}
                  className="w-full pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                  placeholder="e.g. 250 kcal per serving, 5g protein, 10g fat, 30g carbs"
                />
              </div>
              {/* Allergen Info (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Allergen Info (Optional)
                </label>
                <textarea
                  value={formData.allergenInfo}
                  onChange={e => handleFieldChange('allergenInfo', e.target.value)}
                  rows={2}
                  className="w-full pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                  placeholder="e.g. Contains nuts, dairy, gluten"
                />
              </div>

              {/* Add-ons */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <input
                    type="checkbox"
                    checked={enableAddOns}
                    onChange={() => setEnableAddOns(v => !v)}
                    className="mr-2 accent-blue-600"
                  />
                  Enable Add-Ons?
                </label>
                {enableAddOns && (
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-900 mt-2">
                    <div className="mb-2 relative flex items-center">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={addOnSearch}
                        onChange={e => handleAddOnSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        placeholder="Search raw materials or products..."
                      />
                    </div>
                    {addOnSuggestions.length > 0 && (
                      <div className="border rounded bg-white dark:bg-gray-900 shadow-lg max-h-40 overflow-y-auto mb-2">
                        {addOnSuggestions.map(s => (
                          <div
                            key={s.type + '-' + s.id}
                            className="px-4 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-700"
                            onClick={() => handleAddOnSelect(s)}
                          >
                            <span className="font-medium text-gray-900 dark:text-white">{s.name}</span>
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">[{s.type === 'product' ? 'Product' : 'Raw Material'}]</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="space-y-2">
                      {addOns.map((addOn, idx) => (
                        <div key={addOn.type + '-' + addOn.id} className="flex items-center space-x-2">
                          <span className="w-6 text-right text-gray-700 dark:text-gray-200 font-semibold">{idx + 1}.</span>
                          <span className="flex-1 truncate text-gray-900 dark:text-white">
                            {addOn.name}
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              [{addOn.type === 'product' ? 'Product' : 'Raw Material'}]
                            </span>
                          </span>
                          <input
                            type="text"
                            value={addOn.quantity}
                            onChange={e => handleAddOnQuantityChange(idx, e.target.value)}
                            className="w-28 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            placeholder="e.g. 2 pcs"
                          />
                          <input
                            type="number"
                            min="0"
                            value={addOn.price}
                            onChange={e => handleAddOnPriceChange(idx, e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            placeholder="Price"
                          />
                          <button type="button" className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-full" onClick={() => handleRemoveAddOn(idx)}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {addOnErrors && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{addOnErrors}</p>}
                    {addOns.length === 0 && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">No add-ons added yet.</p>}
                    {addOns.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Enter quantity and unit, e.g. 2 pcs, 5 ml, 100 g</p>
                    )}
                  </div>
                )}
              </div>

              {/* Spacer to ensure content is scrollable */}
              <div className="h-32"></div>
            </form>
          </div>
        </div>

        {/* Scroll Indicator - Bottom Left */}
        {!showCTAs && (
          <div className="absolute bottom-24 left-8 bg-blue-600 text-white px-3 py-1 rounded-full text-xs flex items-center space-x-1 animate-bounce">
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
              disabled={isSubmitting || stores.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Product' : 'Create Product'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Toast Messages */}
      {toast && toast.type === 'error' && (
        <div className="fixed top-6 right-6 z-[100] px-4 py-2 rounded shadow-lg text-white bg-red-600">
          {toast.message}
          <button className="ml-2 text-white/80 hover:text-white" onClick={() => setToast(null)}>&times;</button>
        </div>
      )}
    </>
  );
};

export default ProductDrawer;