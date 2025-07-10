import React, { useState, useEffect, useRef } from 'react';
import { X, User, Phone, MapPin, Building, AlertCircle, ExternalLink, ArrowDown } from 'lucide-react';

interface Manager {
  id: string;
  name: string;
  phone: string;
  address?: string;
  storeId?: string;
  storeName?: string;
  generatedId: string;
}

interface Store {
  id: string;
  name: string;
  isActive: boolean;
}

interface ManagerDrawerProps {
  isOpen: boolean;
  manager?: Manager | null;
  stores: Store[];
  onSubmit: (manager: Omit<Manager, 'id' | 'generatedId' | 'storeName'>) => void;
  onClose: () => void;
  validateManagerName?: (name: string, excludeId?: string) => { isValid: boolean; message?: string };
  validateManagerPhone?: (phone: string, excludeId?: string) => { isValid: boolean; message?: string };
}

const ManagerDrawer: React.FC<ManagerDrawerProps> = ({
  isOpen,
  manager,
  stores,
  onSubmit,
  onClose,
  validateManagerName,
  validateManagerPhone
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    storeId: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storesLoading] = useState(false);
  const [showCTAs, setShowCTAs] = useState(false);
  
  const drawerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Initialize form data when editing
  useEffect(() => {
    if (manager) {
      setFormData({
        name: manager.name,
        phone: manager.phone,
        address: manager.address || '',
        storeId: manager.storeId || ''
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        address: '',
        storeId: ''
      });
    }
    setErrors({});
    setShowCTAs(false);
  }, [manager, isOpen]);

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

  const validatePhone = (phone: string): boolean => {
    // Remove all spaces, dashes, parentheses, and plus signs
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    // Check if it's exactly 10 digits
    return /^\d{10}$/.test(cleanPhone);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Manager name is required';
    } else if (validateManagerName) {
      // Check for duplicate manager name if validation function is provided
      const validation = validateManagerName(formData.name, manager?.id);
      if (!validation.isValid) {
        newErrors.name = validation.message || 'Manager name already exists';
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    } else if (validateManagerPhone) {
      // Check for duplicate phone if validation function is provided
      const validation = validateManagerPhone(formData.phone, manager?.id);
      if (!validation.isValid) {
        newErrors.phone = validation.message || 'Phone number already in use';
      }
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
      onSubmit({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim() || undefined,
        storeId: formData.storeId || undefined
      });
    } catch (error) {
      console.error('Error submitting manager:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    setFormData(prev => ({ ...prev, phone: value }));
    // Clear phone error when user types
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, name: value }));
    // Clear name error when user types
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }));
    }
  };

  const isEditing = !!manager;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-gray-800 shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Manager' : 'Add New Manager'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isEditing ? 'Update manager information and store assignment' : 'Add a new manager to oversee your stores'}
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
              {/* Manager Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Manager Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                      errors.name 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter manager's full name"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={() => {
                      if (formData.phone && !validatePhone(formData.phone)) {
                        setErrors(prev => ({ ...prev, phone: 'Phone number must be exactly 10 digits' }));
                      }
                    }}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                      errors.phone 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="9876543210"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.phone}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Enter 10-digit phone number without country code
                </p>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address (Optional)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                    placeholder="Enter manager's address"
                  />
                </div>
              </div>

              {/* Store Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Store Assignment (Optional)
                </label>
                {storesLoading ? (
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-gray-500 dark:text-gray-400">Loading stores...</span>
                    </div>
                  </div>
                ) : stores.length === 0 ? (
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-yellow-50 dark:bg-yellow-900/50">
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-800 dark:text-yellow-300">No stores found. Create store first.</span>
                      <button
                        type="button"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center"
                      >
                        Create Store <ExternalLink className="h-3 w-3 ml-1" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <select
                      value={formData.storeId}
                      onChange={(e) => setFormData(prev => ({ ...prev, storeId: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none"
                    >
                      <option value="">Select a store (optional)</option>
                      {stores.map(store => (
                        <option key={store.id} value={store.id}>
                          {store.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Assign this manager to oversee a specific store
                </p>
              </div>

              {/* Auto-generated ID Info */}
              {isEditing && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Manager ID:</span>
                    <span className="text-sm font-mono text-blue-900 dark:text-blue-200">{manager?.generatedId}</span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    This ID was auto-generated when the manager was created
                  </p>
                </div>
              )}

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
              disabled={isSubmitting || storesLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Manager' : 'Create Manager'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManagerDrawer;