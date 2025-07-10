import React, { useState } from 'react';
import { Plus, Users, Phone, MapPin, Building, Edit, MoreVertical, Trash2, Copy, Check, ExternalLink, Upload } from 'lucide-react';
import ManagerDrawer from './ManagerDrawer';
import BulkUploadDrawer from '../ui/BulkUploadDrawer';
import DeleteConfirmation from '../ui/DeleteConfirmation';
import Toast from '../ui/Toast';
import { useSettingsData, Manager, Store } from '../../hooks/useSettingsData';

const Managers: React.FC = () => {
  const { managers, stores, loading, createManager, updateManager, deleteManager, validateManagerName, validateManagerPhone } = useSettingsData();
  const [showDrawer, setShowDrawer] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    manager: Manager | null;
  }>({
    show: false,
    manager: null
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
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
  };

  const handleCreateManager = () => {
    setEditingManager(null);
    setShowDrawer(true);
  };

  const handleBulkUpload = () => {
    setShowBulkUpload(true);
  };

  const handleEditManager = (manager: Manager) => {
    setEditingManager(manager);
    setShowDrawer(true);
    setActiveDropdown(null);
  };

  const handleDrawerSubmit = async (managerData: Omit<Manager, 'id' | 'generatedId' | 'storeName'>) => {
    try {
      let success = false;
      
      if (editingManager) {
        // Update existing manager
        success = await updateManager(editingManager.id, managerData);
      } else {
        // Create new manager
        success = await createManager(managerData);
      }
      
      if (success) {
        showToast(`Manager "${managerData.name}" ${editingManager ? 'updated' : 'created'} successfully!`);
        setShowDrawer(false);
        setEditingManager(null);
      }
    } catch (error: any) {
      showToast(error.message || `Failed to ${editingManager ? 'update' : 'create'} manager`, 'error');
    }
  };

  const handleBulkUploadSubmit = async (data: any[]) => {
    try {
      // Transform CSV data to manager format
      const newManagers = data.map((row) => ({
        name: row['Manager Name'] || row['name'],
        phone: row['Phone Number'] || row['phone'],
        address: row['Address'] || row['address'],
        storeId: stores.find(s => s.name === row['Store'])?.id,
      }));
      
      // Create managers one by one
      let successCount = 0;
      for (const managerData of newManagers) {
        try {
          const success = await createManager(managerData);
          if (success) successCount++;
        } catch (error: any) {
          console.warn(`Failed to create manager "${managerData.name}":`, error.message);
        }
      }
      
      showToast(`✅ Successfully uploaded ${successCount} managers`);
      return true;
    } catch (error) {
      showToast('Failed to upload managers', 'error');
      return false;
    }
  };

  const handleDeleteClick = (manager: Manager) => {
    // Check if manager is assigned to active store
    if (manager.storeId && manager.storeName) {
      showToast('Reassign store manager first', 'error');
      setActiveDropdown(null);
      return;
    }

    setDeleteConfirmation({
      show: true,
      manager
    });
    setActiveDropdown(null);
  };

  const handleDeleteConfirm = async () => {
    const { manager } = deleteConfirmation;
    if (!manager) return;

    const success = await deleteManager(manager.id);
    if (success) {
      showToast(`🗑️ Manager removed`);
    } else {
      showToast('Failed to delete manager', 'error');
    }
    
    setDeleteConfirmation({ show: false, manager: null });
  };

  const handleCopyId = (managerId: string) => {
    navigator.clipboard.writeText(managerId);
    setCopiedId(managerId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Bulk upload configuration
  const bulkUploadConfig = {
    expectedHeaders: ['Manager Name', 'Phone Number', 'Address', 'Store'],
    sampleData: [
      {
        'Manager Name': 'John Smith',
        'Phone Number': '9876543210',
        'Address': '123 Main Street, City, State 12345',
        'Store': 'Kondapur Main Store'
      },
      {
        'Manager Name': 'Sarah Johnson',
        'Phone Number': '8765432109',
        'Address': '456 Oak Avenue, City, State 67890',
        'Store': 'Kompally Branch'
      }
    ]
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading managers...</p>
      </div>
    );
  }

  if (managers.length === 0) {
    return (
      <>
        <div className="text-center py-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-full">
              <Users className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">No managers added yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Managers will oversee your stores. Add your first manager to get started.
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={handleCreateManager}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add First Manager
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

        {/* Manager Drawer */}
        <ManagerDrawer
          isOpen={showDrawer}
          manager={editingManager}
          stores={stores.filter(s => s.isActive)}
          onSubmit={handleDrawerSubmit}
          onClose={() => {
            setShowDrawer(false);
            setEditingManager(null);
          }}
          validateManagerName={validateManagerName}
          validateManagerPhone={validateManagerPhone}
        />

        {/* Bulk Upload Drawer */}
        <BulkUploadDrawer
          isOpen={showBulkUpload}
          entityType="manager"
          entityPlural="managers"
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Manager Management</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your restaurant managers and their store assignments
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
              onClick={handleCreateManager}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Manager
            </button>
          </div>
        </div>

        {/* Managers Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Manager ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name & Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Store Assignment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {managers.map((manager, index) => (
                  <tr key={manager.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                          {manager.generatedId}
                        </span>
                        <button
                          onClick={() => handleCopyId(manager.generatedId)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                        >
                          {copiedId === manager.generatedId ? (
                            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                          ) : (
                            <Copy className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{manager.name}</div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <Phone className="h-3 w-3 mr-1" />
                          {manager.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {manager.storeName ? (
                        <div className="flex items-center">
                          <Building className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">{manager.storeName}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {manager.address ? (
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate" title={manager.address}>
                            {manager.address}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500 italic">Not provided</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === manager.id ? null : manager.id)}
                          className={`p-1 rounded-full transition-colors ${
                            activeDropdown === manager.id 
                              ? 'bg-gray-200 dark:bg-gray-600' 
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </button>
                        
                        {activeDropdown === manager.id && (
                          <div 
                            className={`absolute ${
                              index >= managers.length - 2 ? 'bottom-full mb-2' : 'top-full mt-2'
                            } right-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20`}
                          >
                            <div className="py-1">
                              <button
                                onClick={() => handleEditManager(manager)}
                                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Edit className="h-4 w-4 mr-3" />
                                Edit Manager
                              </button>
                              <button
                                onClick={() => handleDeleteClick(manager)}
                                disabled={!!(manager.storeId && manager.storeName)}
                                className={`w-full flex items-center px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/50 ${
                                  manager.storeId && manager.storeName
                                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                    : 'text-red-600 dark:text-red-400'
                                }`}
                              >
                                <Trash2 className="h-4 w-4 mr-3" />
                                Delete Manager
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
        </div>

        {/* No Stores Warning */}
        {stores.filter(s => s.isActive).length === 0 && (
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/50 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ExternalLink className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                <span className="text-yellow-800 dark:text-yellow-300">
                  No active stores available. Create stores first to assign managers.
                </span>
              </div>
              <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium">
                Create Store
              </button>
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

      {/* Manager Drawer */}
      <ManagerDrawer
        isOpen={showDrawer}
        manager={editingManager}
        stores={stores.filter(s => s.isActive)}
        onSubmit={handleDrawerSubmit}
        onClose={() => {
          setShowDrawer(false);
          setEditingManager(null);
        }}
        validateManagerName={validateManagerName}
        validateManagerPhone={validateManagerPhone}
      />

      {/* Bulk Upload Drawer */}
      <BulkUploadDrawer
        isOpen={showBulkUpload}
        entityType="manager"
        entityPlural="managers"
        expectedHeaders={bulkUploadConfig.expectedHeaders}
        requiredHeaders={bulkUploadConfig.expectedHeaders}
        sampleData={bulkUploadConfig.sampleData}
        onClose={() => setShowBulkUpload(false)}
        onUpload={handleBulkUploadSubmit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={deleteConfirmation.show}
        title="Delete Manager"
        message={`Are you sure you want to delete "${deleteConfirmation.manager?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmation({ show: false, manager: null })}
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

export default Managers;