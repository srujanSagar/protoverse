import React, { useState, useEffect, useRef } from 'react';
import { X, Package, Scale, Hash, ToggleLeft, ToggleRight, AlertCircle, ChevronDown, ChevronRight, ArrowDown, IndianRupee, Tag, Truck, Info, FileText, Thermometer, Clock, Edit } from 'lucide-react';

interface RawMaterial {
  id: string;
  name: string;
  code: string;
  category: string;
  unitOfMeasurement: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  price: number;
  isActive: boolean;
  // Optional fields
  purchaseOrderQuantity?: number;
  expiry?: string;
  storageLocation?: string;
  allergenInfo?: string;
  vendorId?: string;
  createdAt: string;
  // Add missing optional fields for linter
  secondaryUnitOfMeasurement?: string;
  conversionFactor?: number;
  reorderPoint?: number;
  storageRequirements?: string;
  nutritionalInfo?: string;
  regulatoryCertifications?: string;
  notes?: string;
}

interface Vendor {
  id: string;
  vendorName: string;
}

interface RawMaterialDrawerProps {
  isOpen: boolean;
  material?: RawMaterial | null;
  onSubmit: (material: Omit<RawMaterial, 'id' | 'code' | 'createdAt'>) => void;
  onClose: () => void;
  validateRawMaterialName?: (name: string, excludeId?: string) => { isValid: boolean; message?: string };
  vendors?: Vendor[];
  categories?: string[];
  unitsOfMeasurement?: string[];
}

const RawMaterialDrawer: React.FC<RawMaterialDrawerProps> = ({
  isOpen,
  material,
  onSubmit,
  onClose,
  validateRawMaterialName,
  vendors = [],
  categories,
  unitsOfMeasurement
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unitOfMeasurement: '',
    secondaryUnitOfMeasurement: '',
    conversionFactor: 0,
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    reorderPoint: 0,
    price: 0,
    isActive: true,
    // Optional fields
    purchaseOrderQuantity: 0,
    expiry: '',
    storageLocation: '',
    storageRequirements: '',
    allergenInfo: '',
    nutritionalInfo: '',
    regulatoryCertifications: '',
    notes: '',
    vendorId: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCTAs, setShowCTAs] = useState(false);
  
  const drawerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Initialize form data when editing
  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name,
        category: material.category || 'General',
        unitOfMeasurement: material.unitOfMeasurement,
        secondaryUnitOfMeasurement: material.secondaryUnitOfMeasurement || '',
        conversionFactor: material.conversionFactor || 0,
        currentStock: material.currentStock,
        minStock: material.minStock,
        maxStock: material.maxStock,
        reorderPoint: material.reorderPoint || 0,
        price: material.price,
        isActive: material.isActive,
        purchaseOrderQuantity: material.purchaseOrderQuantity || 0,
        expiry: material.expiry || '',
        storageLocation: material.storageLocation || '',
        storageRequirements: material.storageRequirements || '',
        allergenInfo: material.allergenInfo || '',
        nutritionalInfo: material.nutritionalInfo || '',
        regulatoryCertifications: material.regulatoryCertifications || '',
        notes: material.notes || '',
        vendorId: material.vendorId || ''
      });
      // Show advanced section if any optional fields have values
      const hasAdvancedData = material.purchaseOrderQuantity || 
                             material.expiry || material.storageLocation || material.allergenInfo || material.vendorId;
      setShowAdvanced(!!hasAdvancedData);
    } else {
      setFormData({
        name: '',
        category: '',
        unitOfMeasurement: '',
        secondaryUnitOfMeasurement: '',
        conversionFactor: 0,
        currentStock: 0,
        minStock: 0,
        maxStock: 0,
        reorderPoint: 0,
        price: 0,
        isActive: true,
        purchaseOrderQuantity: 0,
        expiry: '',
        storageLocation: '',
        storageRequirements: '',
        allergenInfo: '',
        nutritionalInfo: '',
        regulatoryCertifications: '',
        notes: '',
        vendorId: ''
      });
      setShowAdvanced(false);
    }
    setErrors({});
    setShowCTAs(false);
  }, [material, isOpen]);

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
  }, [isOpen, showAdvanced]);

  const generatePreviewCode = () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(2, 10).replace(/-/g, '');
    return `RM-${dateStr}-XXX`;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate all mandatory fields
    if (!formData.name.trim()) {
      newErrors.name = 'Material name is required';
    } else if (validateRawMaterialName) {
      // Check for duplicate material name if validation function is provided
      const validation = validateRawMaterialName(formData.name, material?.id);
      if (!validation.isValid) {
        newErrors.name = validation.message || 'Material name already exists';
      }
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.unitOfMeasurement) {
      newErrors.unitOfMeasurement = 'Unit of measurement is required';
    }

    if (formData.currentStock < 0) {
      newErrors.currentStock = 'Current stock cannot be negative';
    }

    if (formData.minStock < 0) {
      newErrors.minStock = 'Minimum stock cannot be negative';
    }

    if (formData.maxStock <= 0) {
      newErrors.maxStock = 'Maximum stock must be greater than 0';
    }

    if (formData.minStock >= formData.maxStock) {
      newErrors.minStock = 'Minimum stock must be less than maximum stock';
    }

    if (formData.price < 0) {
      newErrors.price = 'Price cannot be negative';
    }

    // Validate optional fields if they have values
    if (formData.purchaseOrderQuantity < 0) {
      newErrors.purchaseOrderQuantity = 'Purchase order quantity cannot be negative';
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
      // Clean up optional fields - only include if they have values
      const cleanedData = {
        name: formData.name.trim(),
        category: formData.category,
        unitOfMeasurement: formData.unitOfMeasurement,
        secondaryUnitOfMeasurement: formData.secondaryUnitOfMeasurement.trim() || undefined,
        conversionFactor: formData.conversionFactor > 0 ? formData.conversionFactor : undefined,
        currentStock: formData.currentStock,
        minStock: formData.minStock,
        maxStock: formData.maxStock,
        reorderPoint: formData.reorderPoint > 0 ? formData.reorderPoint : undefined,
        price: formData.price,
        isActive: formData.isActive,
        ...(formData.purchaseOrderQuantity > 0 && { purchaseOrderQuantity: formData.purchaseOrderQuantity }),
        ...(formData.expiry && { expiry: formData.expiry }),
        ...(formData.storageLocation.trim() && { storageLocation: formData.storageLocation.trim() }),
        ...(formData.storageRequirements.trim() && { storageRequirements: formData.storageRequirements.trim() }),
        ...(formData.allergenInfo.trim() && { allergenInfo: formData.allergenInfo.trim() }),
        ...(formData.nutritionalInfo.trim() && { nutritionalInfo: formData.nutritionalInfo.trim() }),
        ...(formData.regulatoryCertifications.trim() && { regulatoryCertifications: formData.regulatoryCertifications.trim() }),
        ...(formData.notes.trim() && { notes: formData.notes.trim() }),
        ...(formData.vendorId && { vendorId: formData.vendorId })
      };
      
      onSubmit(cleanedData);
    } catch (error) {
      console.error('Error submitting raw material:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNumberChange = (field: string, value: string) => {
    const numValue = value === '' ? 0 : Math.max(0, parseInt(value) || 0);
    setFormData(prev => ({ ...prev, [field]: numValue }));
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Clear min/max validation errors when either changes
    if (field === 'minStock' || field === 'maxStock') {
      setErrors(prev => ({ ...prev, minStock: '', maxStock: '' }));
    }
  };

  const handlePriceChange = (value: string) => {
    const numValue = value === '' ? 0 : Math.max(0, parseFloat(value) || 0);
    setFormData(prev => ({ ...prev, price: numValue }));
    
    if (errors.price) {
      setErrors(prev => ({ ...prev, price: '' }));
    }
  };

  const isEditing = !!material;

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
              {isEditing ? 'Edit Raw Material' : 'Add New Raw Material'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isEditing ? 'Update material information and stock levels' : 'Add a new raw material to your inventory'}
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
              {/* Auto-generated Code Preview */}

              {/* 1. Identification Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  1. Identification
                </h3>
                
                {/* Material Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Material Name <span className="text-blue-600 dark:text-blue-400">*</span>
                  </label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, name: e.target.value }));
                        if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                      }}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                        errors.name 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Enter material name"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Auto-generated Code Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SKU/Item Code <span className="text-blue-600 dark:text-blue-400">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={isEditing ? material?.code || '' : generatePreviewCode()}
                      onChange={(e) => {
                        // Allow editing if needed
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Enter SKU/Item code"
                      readOnly={!isEditing}
                    />
                    {!isEditing && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Edit className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    A unique code will be auto-generated when you save, but you can customize it
                  </p>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category <span className="text-blue-600 dark:text-blue-400">*</span>
                  </label>
                  <CategoryDropdown
                    value={formData.category}
                    onChange={(val: string) => {
                      setFormData(prev => ({ ...prev, category: val }));
                      if (errors.category) setErrors(prev => ({ ...prev, category: '' }));
                    }}
                    options={categories || []}
                    error={!!errors.category}
                  />
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.category}
                    </p>
                  )}
                </div>
              </div>

              {/* 2. Units & Measurement Section */}
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  2. Units & Measurement
                </h3>
                
                {/* Unit of Measurement */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primary Unit of Measure <span className="text-blue-600 dark:text-blue-400">*</span>
                  </label>
                  <div className="relative">
                    <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <select
                      value={formData.unitOfMeasurement}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, unitOfMeasurement: e.target.value }));
                        if (errors.unitOfMeasurement) setErrors(prev => ({ ...prev, unitOfMeasurement: '' }));
                      }}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                        errors.unitOfMeasurement 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <option value="">Select unit of measurement</option>
                      {unitsOfMeasurement?.map(unit => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.unitOfMeasurement && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.unitOfMeasurement}
                    </p>
                  )}
                </div>
                
                {/* Secondary Unit of Measurement */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Secondary Unit of Measure (optional)
                  </label>
                  <div className="relative">
                    <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <select
                      value={formData.secondaryUnitOfMeasurement}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, secondaryUnitOfMeasurement: e.target.value }));
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">None</option>
                      {unitsOfMeasurement?.map(unit => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Unit Conversion Factor */}
                {formData.secondaryUnitOfMeasurement && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Unit Conversion Factor
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.conversionFactor}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          setFormData(prev => ({ ...prev, conversionFactor: value }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="e.g., 1 box = 12 pieces"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      How many {formData.unitOfMeasurement} in 1 {formData.secondaryUnitOfMeasurement}
                    </p>
                  </div>
                )}
              </div>

              {/* 3. Pricing & Cost Section */}
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  3. Pricing & Cost
                </h3>
                
                {/* Price per Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Standard Cost per Unit <span className="text-blue-600 dark:text-blue-400">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                        errors.price 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="0.00"
                    />
                    {formData.unitOfMeasurement && (
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-medium">/{formData.unitOfMeasurement}</span>
                    )}
                  </div>
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.price}
                    </p>
                  )}
                </div>
              </div>

              {/* 4. Inventory Thresholds Section */}
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  4. Inventory Thresholds
                </h3>

                <div className="space-y-4">
                  {/* Current Stock */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Stock <span className="text-blue-600 dark:text-blue-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.currentStock}
                      onChange={(e) => handleNumberChange('currentStock', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                        errors.currentStock 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="0"
                    />
                    {errors.currentStock && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.currentStock}
                      </p>
                    )}
                  </div>

                  {/* Min Stock */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Minimum Stock Level <span className="text-blue-600 dark:text-blue-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minStock}
                      onChange={(e) => handleNumberChange('minStock', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                        errors.minStock 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="0"
                    />
                    {errors.minStock && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.minStock}
                      </p>
                    )}
                  </div>
                
                  {/* Max Stock */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Maximum Stock Level <span className="text-blue-600 dark:text-blue-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxStock}
                      onChange={(e) => handleNumberChange('maxStock', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                        errors.maxStock 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="0"
                    />
                    {errors.maxStock && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.maxStock}
                      </p>
                    )}
                  </div>
                
                  {/* Reorder Point */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reorder Point
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.reorderPoint}
                      onChange={(e) => handleNumberChange('reorderPoint', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="0"
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Triggers low stock alert when current stock falls below this level
                    </p>
                  </div>

                  {/* Purchase Order Quantity - Moved from Supplier section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reorder Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.purchaseOrderQuantity}
                      onChange={(e) => handleNumberChange('purchaseOrderQuantity', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                        errors.purchaseOrderQuantity 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="0"
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Suggested quantity to order when restocking
                    </p>
                    {errors.purchaseOrderQuantity && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.purchaseOrderQuantity}
                      </p>
                    )}
                  </div>

                </div>
              </div>
              
              {/* 5. Storage & Handling Section */}
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  5. Storage & Handling
                </h3>
                
                {/* Storage Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Storage Location
                  </label>
                  <input
                    type="text"
                    value={formData.storageLocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, storageLocation: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="e.g., Dry Storage A1, Freezer B2"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Specify where this item is stored in your facility
                  </p>
                </div>
                
                {/* Storage Requirements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Storage Requirements
                  </label>
                  <select
                    value={formData.storageRequirements}
                    onChange={(e) => setFormData(prev => ({ ...prev, storageRequirements: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Select storage requirements</option>
                    <option value="Room Temperature">Room Temperature</option>
                    <option value="Refrigerated">Refrigerated</option>
                    <option value="Frozen">Frozen</option>
                    <option value="Cool & Dry">Cool & Dry</option>
                    <option value="Dry">Dry</option>
                  </select>
                </div>
                
                {/* Shelf Life / Expiry */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Shelf Life
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      value={formData.expiry}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiry: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <Clock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Expiration date or shelf life duration
                  </p>
                </div>
              </div>
              
              {/* 6. Supplier & Procurement Section */}
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  6. Supplier & Procurement
                </h3>
                
                {/* Supplier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Supplier Information
                  </label>
                  <div className="relative">
                    <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <select
                      value={formData.vendorId}
                      onChange={(e) => setFormData(prev => ({ ...prev, vendorId: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">Select a supplier (optional)</option>
                      {vendors.map(vendor => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.vendorName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* 7. Safety & Compliance Section */}
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  7. Safety & Compliance
                </h3>
                
                {/* Allergen Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Allergen Information
                  </label>
                  <textarea
                    value={formData.allergenInfo}
                    onChange={(e) => setFormData(prev => ({ ...prev, allergenInfo: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                    placeholder="Contains nuts, gluten-free, etc."
                  />
                </div>
                
                {/* Nutritional Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nutritional Information
                  </label>
                  <textarea
                    value={formData.nutritionalInfo}
                    onChange={(e) => setFormData(prev => ({ ...prev, nutritionalInfo: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                    placeholder="Calories, protein, fat content, etc."
                  />
                </div>
                
                {/* Regulatory Certifications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Regulatory Certifications
                  </label>
                  <input
                    type="text"
                    value={formData.regulatoryCertifications}
                    onChange={(e) => setFormData(prev => ({ ...prev, regulatoryCertifications: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="e.g., FSSAI, USDA Organic"
                  />
                </div>
              </div>
              
              {/* 8. Miscellaneous Section */}
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  8. Miscellaneous
                </h3>
                
                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                    placeholder="Any additional instructions or information"
                  />
                </div>
                
                {/* Status Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                    className="flex items-center space-x-3 cursor-pointer"
                  >
                    {formData.isActive ? (
                      <ToggleRight className="h-6 w-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      formData.isActive 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </button>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Inactive materials won't appear in production workflows
                  </p>
                </div>
              </div>

              {/* Spacer to ensure content is scrollable */}
              <div className="h-32"></div>
            </form>
          </div>
        </div>

        {/* Scroll Indicator - Better Positioned */}
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
                isEditing ? 'Update Material' : 'Create Material'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Custom searchable dropdown for categories
function CategoryDropdown({ value, onChange, options, error }: { value: string; onChange: (val: string) => void; options: string[]; error?: boolean }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);
  const filtered = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={`w-full pl-10 pr-10 py-2 border rounded-lg text-left bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 ${error ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}`}
        onClick={() => setOpen(v => !v)}
      >
        <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
        {value || <span className="text-gray-400">Select</span>}
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
      </button>
      {open && (
        <div className="absolute z-30 mt-2 w-full rounded-lg bg-gray-900 dark:bg-gray-900 border border-gray-700 shadow-lg">
          <div className="p-3 border-b border-gray-800">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search category"
              className="w-full px-3 py-2 rounded bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-gray-400">No results</div>
            ) : (
              filtered.map(opt => (
                <div
                  key={opt}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-800 text-white ${opt === value ? 'bg-gray-800 font-semibold' : ''}`}
                  onClick={() => { onChange(opt); setOpen(false); setSearch(''); }}
                >
                  {opt}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RawMaterialDrawer;