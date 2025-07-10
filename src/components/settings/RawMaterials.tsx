import React, { useState, useEffect } from 'react';
import { Plus, Package, Search, MoreVertical, Edit, Trash2, AlertTriangle, Copy, Check, Upload, Tag, AlertCircle, TrendingDown, Truck, IndianRupee } from 'lucide-react';
import RawMaterialDrawer from './RawMaterialDrawer';
import BasicSetup from './BasicSetup';
import BulkUploadDrawer from '../ui/BulkUploadDrawer';
import DeleteConfirmation from '../ui/DeleteConfirmation';
import Toast from '../ui/Toast';
import { useSettingsData } from '../../hooks/useSettingsData';
import { supabase } from '../../lib/supabase';

const RAW_MATERIALS_TABS = {
  ALL: 'all',
  BASIC_SETUP: 'basic-setup',
} as const;
type RawMaterialsTabType = typeof RAW_MATERIALS_TABS[keyof typeof RAW_MATERIALS_TABS];

const RawMaterials: React.FC = () => {
  const { rawMaterials, vendors, loading, createRawMaterial, updateRawMaterial, deleteRawMaterial, validateRawMaterialName } = useSettingsData();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<RawMaterialsTabType>(RAW_MATERIALS_TABS.ALL);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [unitsOfMeasurement, setUnitsOfMeasurement] = useState<string[]>([]);
  
  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    material: any | null;
  }>({
    show: false,
    material: null
  });

  // Toast state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'success'
  });

  // Fetch categories and units from Supabase (or receive from BasicSetup)
  useEffect(() => {
    // Example fetch logic, replace with actual fetch if needed
    // fetchCategories().then(setCategories);
    // fetchUnits().then(setUnitsOfMeasurement);
  }, []);

  // Fallback: fetch categories if empty after mount or update
  useEffect(() => {
    if (categories.length === 0) {
      supabase.from('raw_material_categories').select('*').order('name').then(({ data, error }: { data: any, error: any }) => {
        if (!error && data) setCategories(data.map((c: any) => c.name));
      });
    }
  }, [categories]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleCreateMaterial = () => {
    setEditingMaterial(null);
    setShowDrawer(true);
  };

  const handleBulkUpload = () => {
    setShowBulkUpload(true);
  };

  const handleEditMaterial = (material: any) => {
    setEditingMaterial(material);
    setShowDrawer(true);
    setActiveDropdown(null);
  };

  const handleDrawerSubmit = async (materialData: any) => {
    try {
      let success = false;
      
      if (editingMaterial) {
        // Update existing material
        success = await updateRawMaterial(editingMaterial.id, materialData);
      } else {
        // Create new material
        success = await createRawMaterial(materialData);
      }
      
      if (success) {
        showToast(`"${materialData.name}" ${editingMaterial ? 'updated' : 'added to inventory'} successfully!`);
        setShowDrawer(false);
        setEditingMaterial(null);
      }
    } catch (error: any) {
      showToast(error.message || `Failed to ${editingMaterial ? 'update' : 'create'} material`, 'error');
    }
  };

  const handleBulkUploadSubmit = async (data: any[]) => {
    try {
      // Transform CSV data to raw material format
      const newMaterials = data.map((row) => {
        // Find vendor ID if a supplier is specified
        const vendorName = row['Supplier & Procurement'] || row['Supplier'];
        const vendorId = vendorName ? vendors.find(v => v.vendorName === vendorName)?.id : undefined;
        
        return {
          name: row['Material Name'] || row['name'],
          code: row['SKU/Item Code'] || undefined, // Let system generate if not provided
          category: row['Category'] || row['category'] || 'General',
          unitOfMeasurement: row['Primary Unit of Measure'] || row['Unit'] || row['unit'],
          secondaryUnitOfMeasurement: row['Secondary Unit of Measure'] || undefined,
          conversionFactor: row['Conversion Factor'] ? parseFloat(row['Conversion Factor']) : undefined,
          currentStock: parseInt(row['Current Stock']) || 0,
          minStock: parseInt(row['Minimum Stock Level'] || row['Min Stock']) || 0,
          maxStock: parseInt(row['Maximum Stock Level'] || row['Max Stock']) || 100,
          reorderPoint: parseInt(row['Reorder Point']) || undefined,
          purchaseOrderQuantity: parseInt(row['Reorder Quantity']) || undefined,
          price: parseFloat(row['Standard Cost per Unit'] || row['Price']) || 0,
          isActive: row['Status']?.toLowerCase() === 'active',
          storageLocation: row['Storage Location'],
          storageRequirements: row['Storage Requirements'],
          expiry: row['Shelf Life'], // Date format will be handled by the database
          allergenInfo: row['Allergen Information'],
          nutritionalInfo: row['Nutritional Information'],
          regulatoryCertifications: row['Regulatory Certifications'],
          notes: row['Notes'],
          vendorId
        };
      });
      
      // Create materials one by one
      let successCount = 0;
      for (const materialData of newMaterials) {
        try {
          const success = await createRawMaterial(materialData);
          if (success) successCount++;
        } catch (error: any) {
          console.warn(`Failed to create material "${materialData.name}":`, error.message);
        }
      }
      
      showToast(`✅ Successfully uploaded ${successCount} raw materials`);
      return true;
    } catch (error) {
      showToast('Failed to upload raw materials', 'error');
      return false;
    }
  };

  const handleDeleteClick = (material: any) => {
    setDeleteConfirmation({
      show: true,
      material
    });
    setActiveDropdown(null);
  };

  const handleDeleteConfirm = async () => {
    const { material } = deleteConfirmation;
    if (!material) return;

    const success = await deleteRawMaterial(material.id);
    if (success) {
      showToast(`🗑️ "${material.name}" removed from inventory`);
    } else {
      showToast('Failed to delete material', 'error');
    }
    
    setDeleteConfirmation({ show: false, material: null });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStockStatus = (material: any) => {
    if (material.currentStock === 0) return { 
      status: 'out-of-stock', 
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/50',
      icon: AlertCircle,
      label: 'Out of Stock'
    };
    if (material.currentStock <= material.minStock) return { 
      status: 'low-stock', 
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/50',
      icon: TrendingDown,
      label: 'Low Stock'
    };
    if (material.currentStock >= material.maxStock) return { 
      status: 'overstock', 
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/50',
      icon: AlertTriangle,
      label: 'Overstock'
    };
    return { 
      status: 'normal', 
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/50',
      icon: Package,
      label: 'Normal'
    };
  };

  // Get vendor name for a material
  const getVendorName = (material: any) => {
    if (!material.vendorId) return null;
    const vendor = vendors.find(v => v.id === material.vendorId);
    return vendor ? vendor.vendorName : null;
  };

  // Filter materials based on search
  const displayedMaterials = rawMaterials.filter(material => {
    const searchLower = searchTerm.toLowerCase();
    return (
      material.name.toLowerCase().includes(searchLower) ||
      material.code.toLowerCase().includes(searchLower) ||
      material.category.toLowerCase().includes(searchLower)
    );
  });

  // Bulk upload configuration
  const bulkUploadConfig = {
    expectedHeaders: ['Material Name', 'SKU/Item Code', 'Category', 'Primary Unit of Measure', 'Secondary Unit of Measure', 'Standard Cost per Unit', 'Current Stock', 'Minimum Stock Level', 'Maximum Stock Level', 'Reorder Point', 'Reorder Quantity', 'Storage Location', 'Storage Requirements', 'Shelf Life', 'Supplier & Procurement', 'Allergen Information', 'Nutritional Information', 'Regulatory Certifications', 'Notes', 'Status'],
    sampleData: [
      {
        'Material Name': 'Kataifi Pastry',
        'SKU/Item Code': 'RM-202507-750',
        'Category': 'Grains',
        'Primary Unit of Measure': 'kg',
        'Secondary Unit of Measure': '',
        'Standard Cost per Unit': '350.0',
        'Current Stock': '50',
        'Minimum Stock Level': '10',
        'Maximum Stock Level': '100',
        'Reorder Point': '20',
        'Reorder Quantity': '50',
        'Storage Location': 'Dry Storage A1',
        'Storage Requirements': 'Cool & Dry',
        'Shelf Life': '03/10/2025',
        'Supplier & Procurement': 'Pastry Supplies Co.',
        'Allergen Information': 'Contains gluten',
        'Nutritional Information': 'High in carbs',
        'Regulatory Certifications': 'FSSAI',
        'Notes': 'Essential for all Kunafa dishes',
        'Status': 'Active'
      },
      {
        'Material Name': 'Sweet Cheese',
        'SKU/Item Code': 'RM-202507-494',
        'Category': 'Dairy',
        'Primary Unit of Measure': 'kg',
        'Secondary Unit of Measure': '',
        'Standard Cost per Unit': '450.0',
        'Current Stock': '30',
        'Minimum Stock Level': '5',
        'Maximum Stock Level': '60',
        'Reorder Point': '10',
        'Reorder Quantity': '30',
        'Storage Location': 'Refrigerator B2',
        'Storage Requirements': 'Refrigerate',
        'Shelf Life': '19/07/2025',
        'Supplier & Procurement': 'Dairy Farms Ltd.',
        'Allergen Information': 'Contains dairy',
        'Nutritional Information': 'High in protein, fat',
        'Regulatory Certifications': 'FSSAI',
        'Notes': 'Main ingredient for cheese kunafa',
        'Status': 'Active'
      }
    ]
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading raw materials...</p>
      </div>
    );
  }

  if (rawMaterials.length === 0 && activeTab !== RAW_MATERIALS_TABS.BASIC_SETUP) {
    return (
      <>
        <div className="text-center py-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-full">
              <Package className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">No raw materials yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Track your inventory and manage stock levels. Add your first raw material to get started.
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={handleCreateMaterial}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add First Material
            </button>
            <button
              onClick={handleBulkUpload}
              className="inline-flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Upload className="h-5 w-5 mr-2" />
              Bulk Upload
            </button>
          </div>
        </div>

        <RawMaterialDrawer
          isOpen={showDrawer}
          material={editingMaterial}
          onSubmit={handleDrawerSubmit}
          onClose={() => {
            setShowDrawer(false);
            setEditingMaterial(null);
          }}
          validateRawMaterialName={validateRawMaterialName}
          vendors={vendors}
          categories={categories}
          unitsOfMeasurement={unitsOfMeasurement}
        />

        {/* Bulk Upload Drawer */}
        <BulkUploadDrawer
          isOpen={showBulkUpload}
          entityType="raw material"
          entityPlural="raw materials"
          expectedHeaders={bulkUploadConfig.expectedHeaders}
          requiredHeaders={bulkUploadConfig.expectedHeaders}
          sampleData={bulkUploadConfig.sampleData}
          onClose={() => setShowBulkUpload(false)}
          onUpload={handleBulkUploadSubmit}
        />
      </>
    );
  }

  // If Basic Setup tab is active, show that component
  if (activeTab === RAW_MATERIALS_TABS.BASIC_SETUP) {
    return (
      <div className="p-[16px]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Raw Materials</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage inventory and track stock levels for your ingredients
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBulkUpload}
              className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </button>
            <button
              onClick={handleCreateMaterial}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab(RAW_MATERIALS_TABS.BASIC_SETUP)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === RAW_MATERIALS_TABS.BASIC_SETUP
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Basic Setup
          </button>
          <button
            onClick={() => setActiveTab(RAW_MATERIALS_TABS.ALL)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === RAW_MATERIALS_TABS.ALL
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            All Materials ({rawMaterials.length})
          </button>
        </div>

        {/* Basic Setup Component */}
        <BasicSetup 
          onCategoriesUpdate={setCategories}
          onUnitsUpdate={units => setUnitsOfMeasurement(units.map(u => u.value))}
        />

        {/* Raw Material Drawer - Keep it here so it can be opened from Basic Setup tab */}
        <RawMaterialDrawer
          isOpen={showDrawer}
          material={editingMaterial}
          onSubmit={handleDrawerSubmit}
          onClose={() => {
            setShowDrawer(false);
            setEditingMaterial(null);
          }}
          validateRawMaterialName={validateRawMaterialName}
          vendors={vendors}
          categories={categories}
          unitsOfMeasurement={unitsOfMeasurement}
        />

        {/* Bulk Upload Drawer - Keep it here so it can be opened from Basic Setup tab */}
        <BulkUploadDrawer
          isOpen={showBulkUpload}
          entityType="raw material"
          entityPlural="raw materials"
          expectedHeaders={bulkUploadConfig.expectedHeaders}
          requiredHeaders={bulkUploadConfig.expectedHeaders}
          sampleData={bulkUploadConfig.sampleData}
          onClose={() => setShowBulkUpload(false)}
          onUpload={handleBulkUploadSubmit}
        />
      </div>
    );
  }

  return (
    <div className="p-[16px]">
      <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Raw Materials</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage inventory and track stock levels for your ingredients
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBulkUpload}
              className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </button>
            <button
              onClick={handleCreateMaterial}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab(RAW_MATERIALS_TABS.BASIC_SETUP)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === RAW_MATERIALS_TABS.BASIC_SETUP
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Basic Setup
          </button>
          <button
            onClick={() => setActiveTab(RAW_MATERIALS_TABS.ALL)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              activeTab === RAW_MATERIALS_TABS.ALL
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            All Materials ({rawMaterials.length})
          </button>
        </div>

        {/* Materials Table */}
        {activeTab === RAW_MATERIALS_TABS.ALL && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {displayedMaterials.length === 0 ? (
              <div className="text-center py-12">
                {searchTerm ? (
                  <>
                    <Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No materials found</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Try adjusting your search term or add a new material
                    </p>
                  </>
                ) : (
                  <>
                    <Package className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No materials found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Try adjusting your search term or add a new material
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Name & Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Price/Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Current Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Min. Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {displayedMaterials.map((material, index) => {
                      const stockStatus = getStockStatus(material);
                      const StatusIcon = stockStatus.icon;
                      const vendorName = getVendorName(material);
                      
                      return (
                        <tr key={material.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">{material.name}</div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-mono font-medium text-gray-600 dark:text-gray-400">
                                    {material.code}
                                  </span>
                                  <button
                                    onClick={() => handleCopyCode(material.code)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                                  >
                                    {copiedCode === material.code ? (
                                      <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                                    ) : (
                                      <Copy className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                    )}
                                  </button>
                                </div>
                                {!material.isActive && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 mt-1">
                                    Inactive
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Tag className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                              <span className="text-sm text-gray-900 dark:text-white">{material.category}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <IndianRupee className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-1" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {material.price.toFixed(0)}/{material.unitOfMeasurement}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div className={`p-1 rounded-full ${stockStatus.bgColor}`}>
                                <StatusIcon className={`h-3 w-3 ${stockStatus.color}`} />
                              </div>
                              <div>
                                <div className={`text-sm font-medium ${stockStatus.color}`}>
                                  {material.currentStock}
                                </div>
                                {material.isActive && stockStatus.status !== 'normal' && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {stockStatus.label}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {material.minStock}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {vendorName ? (
                              <div className="flex items-center">
                                <Truck className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                                <span className="text-sm text-gray-900 dark:text-white">{vendorName}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400 italic">Not assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="relative">
                              <button
                                onClick={() => setActiveDropdown(activeDropdown === material.id ? null : material.id)}
                                className={`p-1 rounded-full transition-colors ${
                                  activeDropdown === material.id 
                                    ? 'bg-gray-200 dark:bg-gray-600' 
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                              >
                                <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              </button>
                              
                              {activeDropdown === material.id && (
                                <div 
                                  className={`absolute ${
                                    index >= displayedMaterials.length - 2 ? 'bottom-full mb-2' : 'top-full mt-2'
                                  } right-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20`}
                                >
                                  <div className="py-1">
                                    <button
                                      onClick={() => handleEditMaterial(material)}
                                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                    >
                                      <Edit className="h-4 w-4 mr-3" />
                                      Edit Material
                                    </button>
                                    <button
                                      onClick={() => handleDeleteClick(material)}
                                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50"
                                    >
                                      <Trash2 className="h-4 w-4 mr-3" />
                                      Delete Material
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Click outside to close dropdown */}
        {activeDropdown && (
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setActiveDropdown(null)}
          />
        )}
      </div>

      {/* Raw Material Drawer */}
      <RawMaterialDrawer
        isOpen={showDrawer}
        material={editingMaterial}
        onSubmit={handleDrawerSubmit}
        onClose={() => {
          setShowDrawer(false);
          setEditingMaterial(null);
        }}
        validateRawMaterialName={validateRawMaterialName}
        vendors={vendors}
        categories={categories}
        unitsOfMeasurement={unitsOfMeasurement}
      />

      {/* Bulk Upload Drawer */}
      <BulkUploadDrawer
        isOpen={showBulkUpload}
        entityType="raw material"
        entityPlural="raw materials"
        expectedHeaders={bulkUploadConfig.expectedHeaders}
        requiredHeaders={bulkUploadConfig.expectedHeaders}
        sampleData={bulkUploadConfig.sampleData}
        onClose={() => setShowBulkUpload(false)}
        onUpload={handleBulkUploadSubmit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={deleteConfirmation.show}
        title="Delete Raw Material"
        message={`Are you sure you want to delete "${deleteConfirmation.material?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmation({ show: false, material: null })}
      />

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: 'success' })}
      />
    </div>
  );
};

export default RawMaterials;