import React, { useState, useEffect, useRef } from 'react';
import { X, Building, User, Phone, Mail, MapPin, FileText, CreditCard, AlertCircle, ArrowDown, Package, Check, Tag } from 'lucide-react';

interface Vendor {
  id: string;
  vendorName: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  address: string;
  // Optional fields
  gstinTaxId?: string;
  notes?: string;
  createdAt: string;
  rawMaterialIds?: string[];
  categories?: string[];
}

interface RawMaterial {
  id: string;
  name: string;
  code: string;
  category: string;
}

interface VendorDrawerProps {
  isOpen: boolean;
  vendor?: Vendor | null;
  rawMaterials?: RawMaterial[];
  onSubmit: (vendor: Omit<Vendor, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  validateVendorName?: (name: string, excludeId?: string) => { isValid: boolean; message?: string };
  validateVendorEmail?: (email: string, excludeId?: string) => { isValid: boolean; message?: string };
  validateVendorPhone?: (phone: string, excludeId?: string) => { isValid: boolean; message?: string };
}

// Categories from basic setup
const CATEGORIES = [
  'Dairy & Eggs',
  'Nuts & Seeds', 
  'Grains & Flour',
  'Spices & Herbs',
  'Sweeteners',
  'Oils & Fats',
  'Fruits & Vegetables',
  'Meat & Poultry',
  'Seafood',
  'Beverages',
  'Baking Essentials',
  'Condiments & Sauces',
  'Frozen Items',
  'Canned Goods',
  'Pastry & Dough',
  'Dairy',
  'Chocolate & Spreads',
  'Nuts & Dry Fruits',
  'Flavour & Garnish',
  'General'
];

const VendorDrawer: React.FC<VendorDrawerProps> = ({
  isOpen,
  vendor,
  rawMaterials = [],
  onSubmit,
  onClose,
  validateVendorName,
  validateVendorEmail,
  validateVendorPhone
}) => {
  const [formData, setFormData] = useState({
    vendorName: '',
    contactPerson: '',
    phoneNumber: '',
    email: '',
    address: '',
    // Optional fields
    gstinTaxId: '',
    notes: '',
    rawMaterialIds: [] as string[],
    categories: [] as string[]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCTAs, setShowCTAs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const drawerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Initialize form data when editing
  useEffect(() => {
    if (vendor) {
      setFormData({
        vendorName: vendor.vendorName,
        contactPerson: vendor.contactPerson,
        phoneNumber: vendor.phoneNumber,
        email: vendor.email,
        address: vendor.address,
        gstinTaxId: vendor.gstinTaxId || '',
        notes: vendor.notes || '',
        rawMaterialIds: vendor.rawMaterialIds || [],
        categories: vendor.categories || []
      });
    } else {
      setFormData({
        vendorName: '',
        contactPerson: '',
        phoneNumber: '',
        email: '',
        address: '',
        gstinTaxId: '',
        notes: '',
        rawMaterialIds: [],
        categories: []
      });
    }
    setErrors({});
    setShowCTAs(false);
    setSearchTerm('');
  }, [vendor, isOpen]);

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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateGSTIN = (gstin: string): boolean => {
    if (!gstin) return true; // Optional field
    // Basic GSTIN format: 15 characters, alphanumeric
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate all mandatory fields
    if (!formData.vendorName.trim()) {
      newErrors.vendorName = 'Vendor name is required';
    } else if (validateVendorName) {
      // Check for duplicate vendor name if validation function is provided
      const validation = validateVendorName(formData.vendorName, vendor?.id);
      if (!validation.isValid) {
        newErrors.vendorName = validation.message || 'Vendor name already exists';
      }
    }

    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Contact person is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhone(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be exactly 10 digits';
    } else if (validateVendorPhone) {
      // Check for duplicate phone if validation function is provided
      const validation = validateVendorPhone(formData.phoneNumber, vendor?.id);
      if (!validation.isValid) {
        newErrors.phoneNumber = validation.message || 'Phone number already in use';
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (validateVendorEmail) {
      // Check for duplicate email if validation function is provided
      const validation = validateVendorEmail(formData.email, vendor?.id);
      if (!validation.isValid) {
        newErrors.email = validation.message || 'Email already in use';
      }
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    // Validate optional fields if they have values
    if (formData.gstinTaxId && !validateGSTIN(formData.gstinTaxId)) {
      newErrors.gstinTaxId = 'Please enter a valid GSTIN format';
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
      // Clean up data - only include optional fields if they have values
      const cleanedData = {
        vendorName: formData.vendorName.trim(),
        contactPerson: formData.contactPerson.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        ...(formData.gstinTaxId.trim() && { gstinTaxId: formData.gstinTaxId.trim() }),
        ...(formData.notes.trim() && { notes: formData.notes.trim() }),
        rawMaterialIds: formData.rawMaterialIds,
        categories: formData.categories
      };
      
      onSubmit(cleanedData);
    } catch (error) {
      console.error('Error submitting vendor:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleRawMaterialToggle = (materialId: string) => {
    setFormData(prev => ({
      ...prev,
      rawMaterialIds: prev.rawMaterialIds.includes(materialId)
        ? prev.rawMaterialIds.filter(id => id !== materialId)
        : [...prev.rawMaterialIds, materialId]
    }));
  };

  const handleSelectAllMaterials = () => {
    const allMaterialIds = rawMaterials.map(material => material.id);
    const isAllSelected = allMaterialIds.every(id => formData.rawMaterialIds.includes(id));
    
    setFormData(prev => ({
      ...prev,
      rawMaterialIds: isAllSelected ? [] : allMaterialIds
    }));
  };

  // Filter raw materials based on search term
  const filteredMaterials = rawMaterials.filter(material => {
    if (!searchTerm) return true;
    
    return (
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Group materials by category
  const materialsByCategory = filteredMaterials.reduce((acc, material) => {
    if (!acc[material.category]) {
      acc[material.category] = [];
    }
    acc[material.category].push(material);
    return acc;
  }, {} as Record<string, RawMaterial[]>);

  // Sort categories alphabetically
  const sortedCategories = Object.keys(materialsByCategory).sort();

  const isEditing = !!vendor;
  const allMaterialsSelected = rawMaterials.length > 0 && 
    rawMaterials.every(material => formData.rawMaterialIds.includes(material.id));

  // Check if all materials in a category are selected
  const isCategorySelected = (category: string) => {
    const categoryMaterials = rawMaterials.filter(m => m.category === category);
    return categoryMaterials.every(m => formData.rawMaterialIds.includes(m.id));
  };

  // Check if some (but not all) materials in a category are selected
  const isCategoryPartiallySelected = (category: string) => {
    const categoryMaterials = rawMaterials.filter(m => m.category === category);
    const selectedCount = categoryMaterials.filter(m => 
      formData.rawMaterialIds.includes(m.id)
    ).length;
    
    return selectedCount > 0 && selectedCount < categoryMaterials.length;
  };

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
              {isEditing ? 'Edit Vendor' : 'Add New Vendor'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isEditing ? 'Update vendor information and contact details' : 'Add a new vendor to your supplier network'}
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
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Name *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={formData.vendorName}
                    onChange={(e) => handleFieldChange('vendorName', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                      errors.vendorName 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter company name"
                  />
                </div>
                {errors.vendorName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.vendorName}
                  </p>
                )}
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact Person *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => handleFieldChange('contactPerson', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                      errors.contactPerson 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter contact person's name"
                  />
                </div>
                {errors.contactPerson && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.contactPerson}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                    onBlur={() => {
                      if (formData.phoneNumber && !validatePhone(formData.phoneNumber)) {
                        setErrors(prev => ({ ...prev, phoneNumber: 'Phone number must be exactly 10 digits' }));
                      }
                    }}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                      errors.phoneNumber 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="9876543210"
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.phoneNumber}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Enter 10-digit phone number without country code
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    onBlur={() => {
                      if (formData.email && !validateEmail(formData.email)) {
                        setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
                      }
                    }}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                      errors.email 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="vendor@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    rows={3}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none ${
                      errors.address 
                        ? 'border-red-300 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter complete vendor address"
                  />
                </div>
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.address}
                  </p>
                )}
              </div>

              {/* Raw Materials Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Raw Materials Supplied
                </label>
                
                {rawMaterials.length === 0 ? (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/50 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      No raw materials found. Add raw materials first to associate them with this vendor.
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg">
                    {/* Search and Select All Header */}
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search materials..."
                            className="w-full pl-3 pr-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        <label className="flex items-center space-x-3 cursor-pointer whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={allMaterialsSelected}
                            onChange={handleSelectAllMaterials}
                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Select All ({rawMaterials.length})
                          </span>
                        </label>
                      </div>
                    </div>
                    
                    {/* Materials List */}
                    <div className="p-4 max-h-60 overflow-y-auto">
                      {filteredMaterials.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                          No materials match your search
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {sortedCategories.map(category => (
                            <div key={category}>
                              <div className="flex items-center mb-2">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                  <div className="relative flex items-center justify-center w-4 h-4">
                                    <input
                                      type="checkbox"
                                      checked={isCategorySelected(category)}
                                      onChange={() => handleRawMaterialToggle(category)}
                                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    />
                                    {isCategoryPartiallySelected(category) && (
                                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-sm"></div>
                                      </div>
                                    )}
                                  </div>
                                  <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    {category}
                                  </h4>
                                </label>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-6">
                                {materialsByCategory[category].map(material => (
                                  <label key={material.id} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                                    <input
                                      type="checkbox"
                                      checked={formData.rawMaterialIds.includes(material.id)}
                                      onChange={() => handleRawMaterialToggle(material.id)}
                                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {material.name}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {material.code}
                                      </div>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {formData.rawMaterialIds.length > 0 && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {formData.rawMaterialIds.length} {formData.rawMaterialIds.length === 1 ? 'material' : 'materials'} selected
                  </p>
                )}
              </div>

              {/* Optional Fields Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Additional Information
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-normal ml-2">(Optional)</span>
                </h3>

                {/* GSTIN/Tax ID */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    GSTIN/Tax ID
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={formData.gstinTaxId}
                      onChange={(e) => handleFieldChange('gstinTaxId', e.target.value.toUpperCase())}
                      onBlur={() => {
                        if (formData.gstinTaxId && !validateGSTIN(formData.gstinTaxId)) {
                          setErrors(prev => ({ ...prev, gstinTaxId: 'Please enter a valid GSTIN format' }));
                        }
                      }}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                        errors.gstinTaxId 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="22AAAAA0000A1Z5"
                      maxLength={15}
                    />
                  </div>
                  {errors.gstinTaxId && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.gstinTaxId}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    15-character GSTIN format (e.g., 22AAAAA0000A1Z5)
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleFieldChange('notes', e.target.value)}
                      rows={3}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                      placeholder="Additional notes about the vendor (payment terms, specialties, etc.)"
                    />
                  </div>
                </div>
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
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Vendor' : 'Create Vendor'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default VendorDrawer;