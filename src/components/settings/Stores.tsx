import React, { useState } from 'react';
import { Plus, Store, MapPin, User, Package, Crown, Edit, MoreVertical, Trash2, AlertCircle, Upload } from 'lucide-react';
import StoreDrawer from './StoreDrawer';
import BulkUploadDrawer from '../ui/BulkUploadDrawer';
import DeleteConfirmation from '../ui/DeleteConfirmation';
import Toast from '../ui/Toast';
import { useSettingsData, Store as StoreType, Manager, Product } from '../../hooks/useSettingsData';

const Stores: React.FC = () => {
  const { stores, managers, products, loading, createStore, updateStore, deleteStore, validateStoreName } = useSettingsData();
  const [showDrawer, setShowDrawer] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreType | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    store: StoreType | null;
    type: 'delete' | 'discontinue';
  }>({
    show: false,
    store: null,
    type: 'delete'
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

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleCreateStore = () => {
    setEditingStore(null);
    setShowDrawer(true);
  };

  const handleBulkUpload = () => {
    setShowBulkUpload(true);
  };

  const handleEditStore = (store: StoreType) => {
    setEditingStore(store);
    setShowDrawer(true);
    setActiveDropdown(null);
  };

  const handleDrawerSubmit = async (storeData: Omit<StoreType, 'id' | 'hasActiveOrders'>) => {
    try {
      let success = false;
      
      if (editingStore) {
        // Update existing store
        success = await updateStore(editingStore.id, storeData);
      } else {
        // Create new store
        success = await createStore(storeData);
      }
      
      if (success) {
        showToast(`Store "${storeData.name}" ${editingStore ? 'updated' : 'created'} successfully!`);
        setShowDrawer(false);
        setEditingStore(null);
      }
    } catch (error: any) {
      showToast(error.message || `Failed to ${editingStore ? 'update' : 'create'} store`, 'error');
    }
  };

  const handleBulkUploadSubmit = async (data: any[]) => {
    try {
      // Transform CSV data to store format
      const newStores = data.map((row) => ({
        name: row['Store Name'] || row['name'],
        address: row['Address'] || row['address'],
        managerId: managers.find(m => m.name === row['Manager'])?.id,
        managerName: row['Manager'] || undefined,
        productIds: row['Products'] ? row['Products'].split(';').map((p: string) => 
          products.find(prod => prod.name === p.trim())?.id
        ).filter(Boolean) : [],
        productCount: row['Products'] ? row['Products'].split(';').length : 0,
        isCentral: row['Is Central']?.toLowerCase() === 'true' || row['Is Central'] === '1',
        isActive: true
      }));
      
      // Create stores one by one
      let successCount = 0;
      for (const storeData of newStores) {
        try {
          const success = await createStore(storeData);
          if (success) successCount++;
        } catch (error: any) {
          console.warn(`Failed to create store "${storeData.name}":`, error.message);
        }
      }
      
      showToast(`✅ Successfully uploaded ${successCount} stores`);
      return true;
    } catch (error) {
      showToast('Failed to upload stores', 'error');
      return false;
    }
  };

  const handleDeleteClick = (store: StoreType) => {
    if (store.hasActiveOrders) {
      setDeleteConfirmation({
        show: true,
        store,
        type: 'discontinue'
      });
    } else {
      setDeleteConfirmation({
        show: true,
        store,
        type: 'delete'
      });
    }
    setActiveDropdown(null);
  };

  const handleDeleteConfirm = async () => {
    const { store, type } = deleteConfirmation;
    if (!store) return;

    const success = await deleteStore(store.id);
    if (success) {
      showToast(`Store "${store.name}" ${type === 'discontinue' ? 'discontinued' : 'deleted'} successfully`);
    } else {
      showToast(`Failed to ${type === 'discontinue' ? 'discontinue' : 'delete'} store`, 'error');
    }
    
    setDeleteConfirmation({ show: false, store: null, type: 'delete' });
  };

  // Bulk upload configuration
  const bulkUploadConfig = {
    expectedHeaders: ['Store Name', 'Address', 'Manager', 'Products', 'Is Central'],
    sampleData: [
      {
        'Store Name': 'Downtown Branch',
        'Address': '123 Main Street, Downtown, City 12345',
        'Manager': 'Rajesh Kumar',
        'Products': 'Kunafa Chocolate;Triangle Baklava;Almond Basbousa',
        'Is Central': 'false'
      },
      {
        'Store Name': 'Mall Outlet',
        'Address': '456 Shopping Mall, Level 2, City 67890',
        'Manager': 'Priya Sharma',
        'Products': 'Mixed Dry-Fruit Baklava;Cashew Basbousa',
        'Is Central': 'true'
      }
    ]
  };

  const activeStores = stores.filter(store => store.isActive);
  const inactiveStores = stores.filter(store => !store.isActive);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading stores...</p>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <>
        <div className="text-center py-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-full">
              <Store className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">No stores yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Central store will manage all your locations. Create your first store to get started.
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={handleCreateStore}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create First Store
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

        {/* Store Drawer */}
        <StoreDrawer
          isOpen={showDrawer}
          store={editingStore}
          managers={managers}
          products={products}
          onSubmit={handleDrawerSubmit}
          onClose={() => {
            setShowDrawer(false);
            setEditingStore(null);
          }}
          validateStoreName={validateStoreName}
        />

        {/* Bulk Upload Drawer */}
        <BulkUploadDrawer
          isOpen={showBulkUpload}
          entityType="store"
          entityPlural="stores"
          expectedHeaders={bulkUploadConfig.expectedHeaders}
          requiredHeaders={bulkUploadConfig.expectedHeaders}
          sampleData={bulkUploadConfig.sampleData}
          onClose={() => setShowBulkUpload(false)}
          onUpload={handleBulkUploadSubmit}
        />
      </>
    );
  }

  return (
    <div className="p-[16px]">
      <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Store Management</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your restaurant locations and their configurations
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
              onClick={handleCreateStore}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Store
            </button>
          </div>
        </div>

        {/* Active Stores */}
        {activeStores.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Active Stores ({activeStores.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeStores.map((store) => (
                <div
                  key={store.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg border-2 transition-all hover:shadow-md ${
                    store.isCentral 
                      ? 'border-blue-200 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="p-6">
                    {/* Header with badges */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{store.name}</h4>
                          {store.isCentral && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                              <Crown className="h-3 w-3 mr-1" />
                              Central
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === store.id ? null : store.id)}
                          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </button>
                        
                        {activeDropdown === store.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                            <div className="py-1">
                              <button
                                onClick={() => handleEditStore(store)}
                                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Edit className="h-4 w-4 mr-3" />
                                Edit Store
                              </button>
                              <button
                                onClick={() => handleDeleteClick(store)}
                                className={`w-full flex items-center px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/50 ${
                                  store.hasActiveOrders 
                                    ? 'text-orange-600 dark:text-orange-400' 
                                    : 'text-red-600 dark:text-red-400'
                                }`}
                              >
                                {store.hasActiveOrders ? (
                                  <>
                                    <AlertCircle className="h-4 w-4 mr-3" />
                                    Discontinue Store
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="h-4 w-4 mr-3" />
                                    Delete Store
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-start space-x-2 mb-4">
                      <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{store.address}</p>
                    </div>

                    {/* Manager */}
                    {store.managerName && (
                      <div className="flex items-center space-x-2 mb-4">
                        <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{store.managerName}</span>
                      </div>
                    )}

                    {/* Products */}
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {store.productCount} {store.productCount === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Click outside to close dropdown */}
        {activeDropdown && (
          <div 
            className="fixed inset-0 z-5" 
            onClick={() => setActiveDropdown(null)}
          />
        )}
      </div>

      {/* Store Drawer */}
      <StoreDrawer
        isOpen={showDrawer}
        store={editingStore}
        managers={managers}
        products={products}
        onSubmit={handleDrawerSubmit}
        onClose={() => {
          setShowDrawer(false);
          setEditingStore(null);
        }}
        validateStoreName={validateStoreName}
      />

      {/* Bulk Upload Drawer */}
      <BulkUploadDrawer
        isOpen={showBulkUpload}
        entityType="store"
        entityPlural="stores"
        expectedHeaders={bulkUploadConfig.expectedHeaders}
        requiredHeaders={bulkUploadConfig.expectedHeaders}
        sampleData={bulkUploadConfig.sampleData}
        onClose={() => setShowBulkUpload(false)}
        onUpload={handleBulkUploadSubmit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={deleteConfirmation.show}
        title={deleteConfirmation.type === 'discontinue' ? 'Discontinue Store' : 'Delete Store'}
        message={
          deleteConfirmation.type === 'discontinue'
            ? `Are you sure you want to discontinue "${deleteConfirmation.store?.name}"? This will prevent new orders but existing orders will continue.`
            : `Are you sure you want to delete "${deleteConfirmation.store?.name}"? This action cannot be undone.`
        }
        confirmText={deleteConfirmation.type === 'discontinue' ? 'Discontinue' : 'Delete'}
        confirmButtonClass={deleteConfirmation.type === 'discontinue' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmation({ show: false, store: null, type: 'delete' })}
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

export default Stores;