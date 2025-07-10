import React, { useState } from 'react';
import { Plus, Truck, Search, MoreVertical, Edit, Trash2, Phone, Mail, MapPin, Building, Upload, Package, Tag } from 'lucide-react';
import VendorDrawer from './VendorDrawer';
import BulkUploadDrawer from '../ui/BulkUploadDrawer';
import DeleteConfirmation from '../ui/DeleteConfirmation';
import Toast from '../ui/Toast';
import { useSettingsData } from '../../hooks/useSettingsData';

const Vendors: React.FC = () => {
  const { 
    vendors, 
    rawMaterials,
    loading, 
    createVendor, 
    updateVendor, 
    deleteVendor, 
    validateVendorName,
    validateVendorEmail,
    validateVendorPhone
  } = useSettingsData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    vendor: any | null;
  }>({
    show: false,
    vendor: null
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

  const handleCreateVendor = () => {
    setEditingVendor(null);
    setShowDrawer(true);
  };

  const handleBulkUpload = () => {
    setShowBulkUpload(true);
  };

  const handleEditVendor = (vendor: any) => {
    setEditingVendor(vendor);
    setShowDrawer(true);
    setActiveDropdown(null);
  };

  const handleDrawerSubmit = async (vendorData: any) => {
    try {
      let success = false;
      
      if (editingVendor) {
        // Update existing vendor
        success = await updateVendor(editingVendor.id, vendorData);
      } else {
        // Create new vendor
        success = await createVendor(vendorData);
      }
      
      if (success) {
        showToast(`Vendor "${vendorData.vendorName}" ${editingVendor ? 'updated' : 'added'} successfully!`);
        setShowDrawer(false);
        setEditingVendor(null);
      }
    } catch (error: any) {
      showToast(error.message || `Failed to ${editingVendor ? 'update' : 'create'} vendor`, 'error');
    }
  };

  const handleBulkUploadSubmit = async (data: any[]) => {
    try {
      // Transform CSV data to vendor format
      const newVendors = data.map((row) => ({
        vendorName: row['Vendor Name'] || row['vendorName'],
        contactPerson: row['Contact Person'] || row['contactPerson'],
        phoneNumber: row['Phone Number'] || row['phoneNumber'],
        email: row['Email'] || row['email'],
        address: row['Address'] || row['address'],
        gstinTaxId: row['GSTIN'] || row['gstinTaxId'],
        notes: row['Notes'] || row['notes']
      }));
      
      // Create vendors one by one
      let successCount = 0;
      for (const vendorData of newVendors) {
        try {
          const success = await createVendor(vendorData);
          if (success) successCount++;
        } catch (error: any) {
          console.warn(`Failed to create vendor "${vendorData.vendorName}":`, error.message);
        }
      }
      
      showToast(`✅ Successfully uploaded ${successCount} vendors`);
      return true;
    } catch (error) {
      showToast('Failed to upload vendors', 'error');
      return false;
    }
  };

  const handleDeleteClick = (vendor: any) => {
    setDeleteConfirmation({
      show: true,
      vendor
    });
    setActiveDropdown(null);
  };

  const handleDeleteConfirm = async () => {
    const { vendor } = deleteConfirmation;
    if (!vendor) return;

    const success = await deleteVendor(vendor.id);
    if (success) {
      showToast(`🗑️ Vendor removed`);
    } else {
      showToast('Failed to delete vendor', 'error');
    }
    
    setDeleteConfirmation({ show: false, vendor: null });
  };

  // Get raw materials for a vendor
  const getVendorMaterials = (vendor: any) => {
    if (!vendor.rawMaterialIds || vendor.rawMaterialIds.length === 0) return [];
    
    return rawMaterials.filter(material => 
      vendor.rawMaterialIds.includes(material.id)
    );
  };

  const filteredVendors = vendors.filter(vendor => {
    const searchLower = searchTerm.toLowerCase();
    return vendor.vendorName.toLowerCase().includes(searchLower) ||
           vendor.contactPerson.toLowerCase().includes(searchLower) ||
           vendor.phoneNumber.includes(searchTerm) ||
           vendor.email.toLowerCase().includes(searchLower);
  });

  // Bulk upload configuration
  const bulkUploadConfig = {
    expectedHeaders: ['Vendor Name', 'Contact Person', 'Phone Number', 'Email', 'Address', 'GSTIN', 'Notes'],
    sampleData: [
      {
        'Vendor Name': 'Premium Nuts & Dry Fruits Co.',
        'Contact Person': 'Rajesh Gupta',
        'Phone Number': '9876543210',
        'Email': 'rajesh@premiumnutsco.com',
        'Address': 'Plot No. 45, Industrial Area Phase-II, Chandigarh, Punjab 160002',
        'GSTIN': '03ABCDE1234F1Z5',
        'Notes': 'Reliable supplier for almonds and cashews. Offers bulk discounts.'
      },
      {
        'Vendor Name': 'Fresh Dairy Products Ltd.',
        'Contact Person': 'Priya Sharma',
        'Phone Number': '8765432109',
        'Email': 'priya.sharma@freshdairy.in',
        'Address': '123 Dairy Farm Road, Sector 12, Gurgaon, Haryana 122001',
        'GSTIN': '06FGHIJ5678K2L9',
        'Notes': 'Premium dairy products supplier'
      }
    ]
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading vendors...</p>
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <>
        <div className="text-center py-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-full">
              <Truck className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">No vendors added yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Vendors supply your raw materials and products. Add your first vendor to get started.
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={handleCreateVendor}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add First Vendor
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

        <VendorDrawer
          isOpen={showDrawer}
          vendor={editingVendor}
          rawMaterials={rawMaterials}
          onSubmit={handleDrawerSubmit}
          onClose={() => {
            setShowDrawer(false);
            setEditingVendor(null);
          }}
          validateVendorName={validateVendorName}
          validateVendorEmail={validateVendorEmail}
          validateVendorPhone={validateVendorPhone}
        />

        {/* Bulk Upload Drawer */}
        <BulkUploadDrawer
          isOpen={showBulkUpload}
          entityType="vendor"
          entityPlural="vendors"
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Vendors</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your suppliers and vendor relationships
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
              onClick={handleCreateVendor}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search vendors by name, contact, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Vendors Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {filteredVendors.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No vendors found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try adjusting your search term or add a new vendor
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Vendor Details ({filteredVendors.length})
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contact Person
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Materials
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredVendors.map((vendor, index) => {
                    const vendorMaterials = getVendorMaterials(vendor);
                    
                    return (
                      <tr key={vendor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{vendor.vendorName}</div>
                              {vendor.gstinTaxId && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">GST: {vendor.gstinTaxId}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{vendor.contactPerson}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900 dark:text-white">
                            <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                            {vendor.phoneNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900 dark:text-white">
                            <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                            <a 
                              href={`mailto:${vendor.email}`}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            >
                              {vendor.email}
                            </a>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {getVendorMaterials(vendor).length > 0 ? (
                            <span className="relative group cursor-pointer">
                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-900/50 text-blue-200 text-xs font-medium">
                                {getVendorMaterials(vendor).length} {getVendorMaterials(vendor).length === 1 ? 'item' : 'items'}
                              </span>
                              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20 min-w-[200px] max-w-[320px] bg-gray-900 text-white text-xs rounded shadow-lg p-4 text-left opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200 whitespace-pre-line">
                                {getVendorMaterials(vendor).map((m, idx) => (
                                  <div key={m.id} className={idx !== getVendorMaterials(vendor).length - 1 ? 'mb-3' : ''}>
                                    {idx + 1}. {m.name}
                                  </div>
                                ))}
                              </div>
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">No materials assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative">
                            <button
                              onClick={() => setActiveDropdown(activeDropdown === vendor.id ? null : vendor.id)}
                              className={`p-1 rounded-full transition-colors ${
                                activeDropdown === vendor.id 
                                  ? 'bg-gray-200 dark:bg-gray-600' 
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            </button>
                            
                            {activeDropdown === vendor.id && (
                              <div 
                                className={`absolute ${
                                  index >= filteredVendors.length - 2 ? 'bottom-full mb-2' : 'top-full mt-2'
                                } right-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20`}
                              >
                                <div className="py-1">
                                  <button
                                    onClick={() => handleEditVendor(vendor)}
                                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <Edit className="h-4 w-4 mr-3" />
                                    Edit Vendor
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(vendor)}
                                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50"
                                  >
                                    <Trash2 className="h-4 w-4 mr-3" />
                                    Delete Vendor
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

        {/* Click outside to close dropdown */}
        {activeDropdown && (
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setActiveDropdown(null)}
          />
        )}
      </div>

      {/* Vendor Drawer */}
      <VendorDrawer
        isOpen={showDrawer}
        vendor={editingVendor}
        rawMaterials={rawMaterials}
        onSubmit={handleDrawerSubmit}
        onClose={() => {
          setShowDrawer(false);
          setEditingVendor(null);
        }}
        validateVendorName={validateVendorName}
        validateVendorEmail={validateVendorEmail}
        validateVendorPhone={validateVendorPhone}
      />

      {/* Bulk Upload Drawer */}
      <BulkUploadDrawer
        isOpen={showBulkUpload}
        entityType="vendor"
        entityPlural="vendors"
        expectedHeaders={bulkUploadConfig.expectedHeaders}
        requiredHeaders={bulkUploadConfig.expectedHeaders}
        sampleData={bulkUploadConfig.sampleData}
        onClose={() => setShowBulkUpload(false)}
        onUpload={handleBulkUploadSubmit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={deleteConfirmation.show}
        title="Delete Vendor"
        message={`Are you sure you want to delete "${deleteConfirmation.vendor?.vendorName}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmation({ show: false, vendor: null })}
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

export default Vendors;