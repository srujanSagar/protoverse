import React, { useState } from 'react';
import { Plus, ShoppingBag, Search, MoreVertical, Edit, Trash2, Eye, IndianRupee, Store, ToggleLeft, ToggleRight, Hash, Upload, ChevronDown, Tag, FileX, Info, CheckCircle, X } from 'lucide-react';
import ProductDrawer from './ProductDrawer';
import RecipeModal from './RecipeModal';
import BulkUploadDrawer from '../ui/BulkUploadDrawer';
import DeleteConfirmation from '../ui/DeleteConfirmation';
import Toast from '../ui/Toast';
import { useSettingsData } from '../../hooks/useSettingsData';
import type { Product as BaseProduct } from '../../hooks/useSettingsData';

type Product = BaseProduct & { storeNames?: string[]; addOns?: Array<{ id: string; type: 'product' | 'raw'; name: string; quantity: number; price?: number | string }>; allergenInfo?: string };

// Helper function to format combo names
function formatComboName(name: string) {
  return name
    .split('+')
    .map(part => `[${part.trim()}]`)
    .join(' + ');
}

// Helper for add-on price sum
function getAddOnPrice(addOn: { price?: number | string }) {
  if (addOn.price === undefined) return 0;
  if (typeof addOn.price === 'number') return addOn.price;
  const parsed = parseFloat(addOn.price);
  return isNaN(parsed) ? 0 : parsed;
}

const Products: React.FC = () => {
  const { 
    products, 
    stores, 
    loading, 
    createProduct, 
    updateProduct, 
    deleteProduct, 
    validateProductName,
    createProductWithoutRefresh,
    refreshData
  } = useSettingsData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [recipeModal, setRecipeModal] = useState<{
    show: boolean;
    product: any | null;
  }>({
    show: false,
    product: null
  });
  
  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    product: any | null;
  }>({
    show: false,
    product: null
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

  const [openAccordions, setOpenAccordions] = useState<{ [productId: string]: boolean }>({});

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleBulkUpload = () => {
    setShowBulkUpload(true);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setShowDrawer(true);
    setActiveDropdown(null);
  };

  const handleDrawerSubmit = async (productData: any) => {
    try {
      let success = false;
      
      if (editingProduct) {
        // Update existing product
        success = await updateProduct(editingProduct.id, productData);
      } else {
        // Create new product
        success = await createProduct(productData);
      }
      
      if (success) {
        showToast(`Product "${productData.name}" ${editingProduct ? 'updated' : 'created'} successfully!`);
        setShowDrawer(false);
        setEditingProduct(null);
      }
    } catch (error: any) {
      showToast(error.message || `Failed to ${editingProduct ? 'update' : 'create'} product`, 'error');
    }
  };

  const handleBulkUploadSubmit = async (data: any[]) => {
    try {
      // Transform CSV data to product format (flat model)
      const newProducts = data.map((row, rowIndex) => {
        let status: 'active' | 'inactive' = row['Status']?.toLowerCase() === 'active' ? 'active' : 'inactive';
        let storeIds: string[] = [];
        if (row['Stores']) {
          const storeNames = row['Stores'].split(',').map((s: string) => s.trim()).filter(Boolean);
          if (storeNames.some((name: string) => name.toLowerCase() === 'all')) {
            storeIds = stores.map(s => s.id);
          } else {
            storeIds = stores.filter(s => storeNames.some((n: string) => n.toLowerCase() === s.name.toLowerCase())).map(s => s.id);
          }
        }
        // Generate a unique code for each product using the row index
        const code = `PROD-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${rowIndex + 1}`;
        let vegType: 'veg' | 'non-veg' = 'veg';
        const vegField = (row['Veg/Non-veg'] || '').toLowerCase();
        if (vegField === 'non-veg') vegType = 'non-veg';
        return {
          name: row['Product Name'] || row['name'],
          price: parseFloat(row['Price'] || row['price']) || 0,
          storeIds,
          status,
          recipe: row['Recipe'] || '',
          code,
          isCombo: row['Is Combo'] === 'Yes' || row['isCombo'] === true || false,
          vegType,
        };
      });
      
      // Create products one by one (without refreshing after each)
      let successCount = 0;
      let errorMessages: string[] = [];
      for (const productData of newProducts) {
        try {
          const success = await createProductWithoutRefresh(productData);
          if (success) successCount++;
        } catch (error: any) {
          const errorMsg = `Failed to create product "${productData.name}": ${error.message}`;
          console.warn(errorMsg);
          errorMessages.push(errorMsg);
        }
      }
      // Refresh the products list once at the end
      await refreshData();
      if (errorMessages.length > 0) {
        showToast(`⚠️ Upload completed with ${errorMessages.length} errors. Check console for details.`, 'error');
      } else {
        showToast(`✅ Successfully uploaded ${successCount} products`);
      }
      return true;
    } catch (error) {
      showToast('Failed to upload products', 'error');
      return false;
    }
  };

  const handleDeleteClick = (product: any) => {
    setDeleteConfirmation({
      show: true,
      product
    });
    setActiveDropdown(null);
  };

  const handleDeleteConfirm = async () => {
    const { product } = deleteConfirmation;
    if (!product) return;

    const success = await deleteProduct(product.id);
    if (success) {
      showToast(`🗑️ "${product.name}" removed from catalog`);
    } else {
      showToast('Failed to delete product', 'error');
    }
    
    setDeleteConfirmation({ show: false, product: null });
  };

  const handleViewRecipe = (product: any) => {
    setRecipeModal({
      show: true,
      product
    });
    setActiveDropdown(null);
  };

  const handleRecipeUpdate = (productId: string, newRecipe: string) => {
    // Update recipe in local state or refetch products
    showToast('Recipe updated successfully');
  };

  // Filter products based on search
  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.code.toLowerCase().includes(searchLower)
    );
  });

  // Bulk upload configuration
  const bulkUploadConfig = {
    expectedHeaders: [
      'Product Name',
      'Price',
      'Status',
      'Recipe',
      'Stores'
    ],
    requiredHeaders: [
      'Product Name',
      'Price',
      'Status',
      'Stores'
    ],
    sampleData: []
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="p-[16px]">
      <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Products</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your product catalog and store assignments
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
            {/* Single Add New button */}
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowDrawer(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search products by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No products found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search term or add a new product
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Add-ons</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Add-on Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Allergen info</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {(filteredProducts as Product[]).map(product => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="flex flex-col">
                            {/* <span className="text-xs font-medium text-gray-400 dark:text-gray-300 mb-1">{product.code}</span> */}
                            <span className="text-base font-semibold text-white flex items-center">
                              <span className="relative group mr-1">
                                {product.vegType === 'veg' ? (
                                  <span title="Veg" className="inline-flex items-center">
                                    <span className="h-3 w-3 rounded-full bg-green-500 inline-block border border-green-700" />
                                    <span className="sr-only">Veg</span>
                                  </span>
                                ) : (
                                  <span title="Non-veg" className="inline-flex items-center">
                                    <span className="h-3 w-3 rounded-full bg-red-500 inline-block border border-red-700" />
                                    <span className="sr-only">Non-veg</span>
                                  </span>
                                )}
                                <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 rounded bg-gray-800 text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 transition-opacity duration-150">
                                  {product.vegType === 'veg' ? 'Veg' : 'Non-veg'}
                                </span>
                              </span>
                              {product.isCombo ? formatComboName(product.name) : product.name}
                              {product.isCombo && (
                                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300">
                                  <Tag className="h-3 w-3 mr-1" />Combo
                                </span>
                              )}
                              {!product.isCombo && !product.recipe && (
                                <span className="group relative ml-2">
                                  <FileX className="h-4 w-4 text-orange-500" />
                                  <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 rounded bg-orange-600 text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 transition-opacity duration-150">
                                    No recipe added
                                  </span>
                                </span>
                              )}
                              {product.status === 'inactive' && (
                                <ToggleLeft className="h-4 w-4 ml-2 text-gray-400 dark:text-gray-500" />
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-white">
                        <div className="flex items-center text-sm font-medium text-white">
                          <IndianRupee className="h-4 w-4 text-gray-400 dark:text-gray-300 mr-1" />
                          {product.price.toFixed(0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {product.addOns && product.addOns.length > 0 ? (
                          <span className="relative group cursor-pointer font-semibold text-blue-600 dark:text-blue-300">
                            {product.addOns.length}
                            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20 min-w-[200px] max-w-[320px] bg-gray-900 text-white text-xs rounded shadow-lg p-4 text-left opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200 whitespace-pre-line">
                              {product.addOns.map((addOn, idx) => (
                                <div key={addOn.id} className="mb-3">
                                  <span className="font-bold">{idx + 1}.</span>{' '}
                                  <span className="font-medium">{addOn.name}</span>
                                  {addOn.quantity && (
                                    <span className="ml-1 text-gray-300">- {addOn.quantity}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center text-sm font-medium text-white">
                          {(() => {
                            let value = '-';
                            if (product.addOns && product.addOns.length > 0) {
                              const total = product.addOns.reduce((sum, addOn) => sum + getAddOnPrice(addOn as any), 0);
                              value = total === 0 ? '-' : total.toString();
                            }
                            return value === '-' ? <span>-</span> : <><IndianRupee className="h-4 w-4 text-gray-400 dark:text-gray-300 mr-1" />{`${value}`}</>;
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {product.allergenInfo && product.allergenInfo.trim() !== '' ? (
                          <CheckCircle className="h-5 w-5 text-green-500 inline" />
                        ) : (
                          <X className="h-5 w-5 text-red-500 inline" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-center h-full relative">
                          <button
                            onClick={() => setActiveDropdown(activeDropdown === product.id ? null : product.id)}
                            className={`p-1 rounded-full transition-colors ${
                              activeDropdown === product.id 
                                ? 'bg-gray-200 dark:bg-gray-600' 
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            aria-label="Product actions"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </button>
                          {activeDropdown === product.id && (
                            <div 
                              className={`absolute top-full mt-2 right-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20`}
                            >
                              <div className="py-1">
                                <button
                                  onClick={() => handleEditProduct(product)}
                                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <Edit className="h-4 w-4 mr-3" />
                                  Edit Product
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(product)}
                                  className="w-full flex items-center px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400"
                                >
                                  <Trash2 className="h-4 w-4 mr-3" />
                                  Delete Product
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* No Stores Warning */}
        {stores.filter(s => s.isActive).length === 0 && (
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/50 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center">
              <Store className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  No active stores found
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  Create at least one store to assign products to locations
                </p>
              </div>
            </div>
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

      {/* Product Drawer */}
      <ProductDrawer
        isOpen={showDrawer}
        product={editingProduct}
        stores={stores.filter(s => s.isActive)}
        onSubmit={handleDrawerSubmit}
        onClose={() => {
          setShowDrawer(false);
          setEditingProduct(null);
        }}
        validateProductName={validateProductName}
      />

      {/* Bulk Upload Drawer */}
      <BulkUploadDrawer
        isOpen={showBulkUpload}
        entityType="Product"
        entityPlural="Products"
        expectedHeaders={bulkUploadConfig.expectedHeaders}
        requiredHeaders={bulkUploadConfig.requiredHeaders}
        sampleData={bulkUploadConfig.sampleData}
        onClose={() => setShowBulkUpload(false)}
        onUpload={handleBulkUploadSubmit}
      />

      {/* Recipe Modal */}
      <RecipeModal
        isOpen={recipeModal.show}
        product={recipeModal.product}
        onClose={() => setRecipeModal({ show: false, product: null })}
        onRecipeUpdate={handleRecipeUpdate}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={deleteConfirmation.show}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteConfirmation.product?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmation({ show: false, product: null })}
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

export default Products;