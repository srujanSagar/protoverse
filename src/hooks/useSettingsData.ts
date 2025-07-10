import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Types for Settings modules
export interface Store {
  id: string;
  name: string;
  address: string;
  managerId?: string;
  managerName?: string;
  productIds: string[];
  productCount: number;
  isCentral: boolean;
  isActive: boolean;
  hasActiveOrders?: boolean;
}

export interface Manager {
  id: string;
  name: string;
  phone: string;
  address?: string;
  storeId?: string;
  storeName?: string;
  generatedId: string;
}

export interface RawMaterial {
  id: string;
  name: string;
  code: string;
  category: string;
  unitOfMeasurement: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint?: number;
  price: number;
  isActive: boolean;
  purchaseOrderQuantity?: number;
  expiry?: string;
  storageLocation?: string;
  storageRequirements?: string;
  allergenInfo?: string;
  nutritionalInfo?: string;
  regulatoryCertifications?: string;
  secondaryUnitOfMeasurement?: string;
  conversionFactor?: number;
  notes?: string;
  vendorId?: string;
  createdAt: string;
}

export interface Vendor {
  id: string;
  vendorName: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  address: string;
  gstinTaxId?: string;
  notes?: string;
  rawMaterialIds?: string[];
  categories?: string[];
  createdAt: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  isCombo: boolean;
  vegType: 'veg' | 'non-veg';
  storeIds: string[];
  recipe?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  addOns?: Array<{
    id: string;
    type: 'product' | 'raw';
    name: string;
    quantity: number;
  }>;
}

export const useSettingsData = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if we're in production (no Supabase connection)
  const isProduction = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Validation functions
  const validateStoreName = (name: string, excludeId?: string): { isValid: boolean; message?: string } => {
    const trimmedName = name.trim().toLowerCase();
    const existingStore = stores.find(store => 
      store.name.toLowerCase() === trimmedName && store.id !== excludeId
    );
    
    if (existingStore) {
      return { isValid: false, message: `Store name "${name}" already exists` };
    }
    
    return { isValid: true };
  };

  const validateManagerName = (name: string, excludeId?: string): { isValid: boolean; message?: string } => {
    const trimmedName = name.trim().toLowerCase();
    const existingManager = managers.find(manager => 
      manager.name.toLowerCase() === trimmedName && manager.id !== excludeId
    );
    
    if (existingManager) {
      return { isValid: false, message: `Manager name "${name}" already exists` };
    }
    
    return { isValid: true };
  };

  const validateRawMaterialName = (name: string, excludeId?: string): { isValid: boolean; message?: string } => {
    const trimmedName = name.trim().toLowerCase();
    const existingMaterial = rawMaterials.find(material => 
      material.name.toLowerCase() === trimmedName && material.id !== excludeId
    );
    
    if (existingMaterial) {
      return { isValid: false, message: `Raw material "${name}" already exists` };
    }
    
    return { isValid: true };
  };

  const validateVendorName = (name: string, excludeId?: string): { isValid: boolean; message?: string } => {
    const trimmedName = name.trim().toLowerCase();
    const existingVendor = vendors.find(vendor => 
      vendor.vendorName.toLowerCase() === trimmedName && vendor.id !== excludeId
    );
    
    if (existingVendor) {
      return { isValid: false, message: `Vendor name "${name}" already exists` };
    }
    
    return { isValid: true };
  };

  const validateProductName = (name: string, excludeId?: string): { isValid: boolean; message?: string } => {
    const trimmedName = name.trim().toLowerCase();
    const existingProduct = products.find(product => 
      product.name.toLowerCase() === trimmedName && product.id !== excludeId
    );
    
    if (existingProduct) {
      return { isValid: false, message: `Product name "${name}" already exists` };
    }
    
    return { isValid: true };
  };

  const validateVendorEmail = (email: string, excludeId?: string): { isValid: boolean; message?: string } => {
    const trimmedEmail = email.trim().toLowerCase();
    const existingVendor = vendors.find(vendor => 
      vendor.email.toLowerCase() === trimmedEmail && vendor.id !== excludeId
    );
    
    if (existingVendor) {
      return { isValid: false, message: `Email "${email}" is already registered with another vendor` };
    }
    
    return { isValid: true };
  };

  const validateManagerPhone = (phone: string, excludeId?: string): { isValid: boolean; message?: string } => {
    const trimmedPhone = phone.trim();
    const existingManager = managers.find(manager => 
      manager.phone === trimmedPhone && manager.id !== excludeId
    );
    
    if (existingManager) {
      return { isValid: false, message: `Phone number "${phone}" is already registered with another manager` };
    }
    
    return { isValid: true };
  };

  const validateVendorPhone = (phone: string, excludeId?: string): { isValid: boolean; message?: string } => {
    const trimmedPhone = phone.trim();
    const existingVendor = vendors.find(vendor => 
      vendor.phoneNumber === trimmedPhone && vendor.id !== excludeId
    );
    
    if (existingVendor) {
      return { isValid: false, message: `Phone number "${phone}" is already registered with another vendor` };
    }
    
    return { isValid: true };
  };

  // Helper function to handle manager-store relationship updates
  const updateManagerStoreRelationship = async (managerId: string | null, storeId: string | null, operation: 'assign' | 'clear') => {
    if (isProduction) return;

    try {
      if (operation === 'assign' && managerId && storeId) {
        // First, clear any existing assignments
        await supabase
          .from('managers')
          .update({ store_id: null })
          .eq('store_id', storeId);
        
        await supabase
          .from('stores')
          .update({ manager_id: null })
          .eq('manager_id', managerId);

        // Then set the new assignment
        await supabase
          .from('managers')
          .update({ store_id: storeId })
          .eq('id', managerId);

        await supabase
          .from('stores')
          .update({ manager_id: managerId })
          .eq('id', storeId);
      } else if (operation === 'clear') {
        if (managerId) {
          await supabase
            .from('managers')
            .update({ store_id: null })
            .eq('id', managerId);
        }
        if (storeId) {
          await supabase
            .from('stores')
            .update({ manager_id: null })
            .eq('id', storeId);
        }
      }
    } catch (err) {
      console.error('Error updating manager-store relationship:', err);
    }
  };

  // Fetch stores
  const fetchStores = async () => {
    try {
      if (isProduction) {
        // Fallback data for production
        setStores([
          {
            id: '1',
            name: 'Kondapur Main Store',
            address: 'Plot No. 123, HITEC City Road, Kondapur, Hyderabad, Telangana 500084',
            managerId: '1',
            managerName: 'Rajesh Kumar',
            productIds: ['1', '2', '3', '4', '5'],
            productCount: 5,
            isCentral: true,
            isActive: true,
            hasActiveOrders: true
          }
        ]);
        return;
      }

      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          managers!stores_manager_id_fkey (name),
          product_stores (
            products (id, name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedStores: Store[] = data.map((store: any) => ({
        id: store.id,
        name: store.name,
        address: store.address,
        managerId: store.manager_id,
        managerName: store.managers?.name,
        productIds: store.product_stores?.map((ps: any) => ps.products?.id).filter(Boolean) || [],
        productCount: store.product_stores?.filter((ps: any) => ps.products?.id).length || 0,
        isCentral: store.is_central,
        isActive: store.is_active,
        hasActiveOrders: false // TODO: Calculate from orders
      }));

      setStores(formattedStores);
    } catch (err) {
      console.error('Error fetching stores:', err);
      setError('Failed to fetch stores');
    }
  };

  // Fetch managers
  const fetchManagers = async () => {
    try {
      if (isProduction) {
        setManagers([
          {
            id: '1',
            name: 'Rajesh Kumar',
            phone: '9876543210',
            generatedId: 'MGR-001'
          }
        ]);
        return;
      }

      const { data, error } = await supabase
        .from('managers')
        .select(`
          *,
          stores!managers_store_id_fkey (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedManagers: Manager[] = data.map((manager: any) => ({
        id: manager.id,
        name: manager.name,
        phone: manager.phone,
        address: manager.address,
        storeId: manager.store_id,
        storeName: manager.stores?.name,
        generatedId: manager.generated_id
      }));

      setManagers(formattedManagers);
    } catch (err) {
      console.error('Error fetching managers:', err);
      setError('Failed to fetch managers');
    }
  };

  // Fetch raw materials
  const fetchRawMaterials = async () => {
    try {
      if (isProduction) {
        setRawMaterials([
          {
            id: '1',
            name: 'Almonds',
            code: 'RM-20250125-001',
            category: 'Nuts & Seeds',
            unitOfMeasurement: 'kg',
            currentStock: 25,
            minStock: 10,
            maxStock: 50,
            price: 800,
            isActive: true,
            storageLocation: 'Dry Storage A1',
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Cashews',
            code: 'RM-20250125-002',
            category: 'Nuts & Seeds',
            unitOfMeasurement: 'kg',
            currentStock: 8,
            minStock: 15,
            maxStock: 40,
            price: 1200,
            isActive: true,
            storageLocation: 'Dry Storage A2',
            createdAt: new Date().toISOString()
          },
          {
            id: '3',
            name: 'Phyllo Pastry',
            code: 'RM-20250125-003',
            category: 'General',
            unitOfMeasurement: 'pcs',
            currentStock: 45,
            minStock: 20,
            maxStock: 100,
            price: 25,
            isActive: true,
            storageLocation: 'Freezer B1',
            createdAt: new Date().toISOString()
          },
          {
            id: '4',
            name: 'Semolina',
            code: 'RM-20250125-004',
            category: 'Grains & Flour',
            unitOfMeasurement: 'kg',
            currentStock: 0,
            minStock: 5,
            maxStock: 25,
            price: 45,
            isActive: true,
            storageLocation: 'Dry Storage B1',
            createdAt: new Date().toISOString()
          }
        ]);
        return;
      }

      const { data, error } = await supabase
        .from('raw_materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedMaterials: RawMaterial[] = data.map((material: any) => ({
        id: material.id,
        name: material.name,
        code: material.code,
        category: material.category || 'General',
        unitOfMeasurement: material.unit_of_measurement,
        currentStock: material.current_stock,
        minStock: material.min_stock || 0,
        maxStock: material.max_stock || 100,
        reorderPoint: material.reorder_point,
        price: material.price,
        isActive: material.is_active,
        purchaseOrderQuantity: material.purchase_order_quantity,
        expiry: material.expiry,
        storageLocation: material.storage_location,
        storageRequirements: material.storage_requirements,
        allergenInfo: material.allergen_info,
        nutritionalInfo: material.nutritional_info,
        regulatoryCertifications: material.regulatory_certifications,
        secondaryUnitOfMeasurement: material.secondary_unit_of_measurement,
        conversionFactor: material.conversion_factor,
        notes: material.notes,
        vendorId: material.vendor_id,
        createdAt: material.created_at
      }));

      setRawMaterials(formattedMaterials);
    } catch (err) {
      console.error('Error fetching raw materials:', err);
      setError('Failed to fetch raw materials');
    }
  };

  // Fetch vendors
  const fetchVendors = async () => {
    try {
      if (isProduction) {
        setVendors([
          {
            id: '1',
            vendorName: 'Premium Nuts & Dry Fruits Co.',
            contactPerson: 'Rajesh Gupta',
            phoneNumber: '9876543210',
            email: 'rajesh@premiumnutsco.com',
            address: 'Plot No. 45, Industrial Area Phase-II, Chandigarh, Punjab 160002',
            gstinTaxId: '03ABCDE1234F1Z5',
            notes: 'Reliable supplier for almonds and cashews. Offers bulk discounts.',
            rawMaterialIds: ['1', '2'],
            createdAt: new Date().toISOString()
          }
        ]);
        return;
      }

      // First get all vendors
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });

      if (vendorsError) throw vendorsError;

      // Then get all raw materials to find which ones are linked to each vendor
      const { data: materialsData, error: materialsError } = await supabase
        .from('raw_materials')
        .select('id, vendor_id');

      if (materialsError) throw materialsError;

      // Create a map of vendor IDs to material IDs
      const vendorMaterialsMap: Record<string, string[]> = {};
      
      materialsData.forEach((material: any) => {
        if (material.vendor_id) {
          if (!vendorMaterialsMap[material.vendor_id]) {
            vendorMaterialsMap[material.vendor_id] = [];
          }
          vendorMaterialsMap[material.vendor_id].push(material.id);
        }
      });

      const formattedVendors: Vendor[] = vendorsData.map((vendor: any) => ({
        id: vendor.id,
        vendorName: vendor.vendor_name,
        contactPerson: vendor.contact_person,
        phoneNumber: vendor.phone_number,
        email: vendor.email,
        address: vendor.address,
        gstinTaxId: vendor.gstin_tax_id,
        notes: vendor.notes,
        rawMaterialIds: vendorMaterialsMap[vendor.id] || [],
        categories: vendor.categories || [],
        createdAt: vendor.created_at
      }));

      setVendors(formattedVendors);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError('Failed to fetch vendors');
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      if (isProduction) {
        setProducts([]);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_stores (
            stores (id, name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProducts = data.map((product: any) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        storeIds: product.product_stores?.map((ps: any) => ps.stores.id) || [],
        storeNames: product.product_stores?.map((ps: any) => ps.stores.name) || [],
        status: product.status,
        code: product.code,
        recipe: product.recipe,
        vegType: product.vegtype || 'veg',
        isCombo: product.iscombo || false,
        createdAt: product.created_at,
        image: product.image || undefined,
        addOns: product.add_ons ? JSON.parse(product.add_ons) : [],
      }));

      setProducts(formattedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products');
    }
  };

  // STORE OPERATIONS
  const createStore = async (storeData: Omit<Store, 'id' | 'hasActiveOrders'>) => {
    try {
      // Validate store name
      const nameValidation = validateStoreName(storeData.name);
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.message);
      }

      if (isProduction) {
        const newStore = { ...storeData, id: Date.now().toString(), hasActiveOrders: false };
        setStores(prev => [newStore, ...prev]);
        return true;
      }

      // Create the store first
      const { data, error } = await supabase
        .from('stores')
        .insert({
          name: storeData.name,
          address: storeData.address,
          manager_id: null, // We'll set this after handling the relationship
          is_central: storeData.isCentral,
          is_active: storeData.isActive
        })
        .select()
        .single();

      if (error) throw error;

      // Handle manager assignment if provided
      if (storeData.managerId) {
        await updateManagerStoreRelationship(storeData.managerId, data.id, 'assign');
      }

      // Link products to store
      if (storeData.productIds.length > 0) {
        const productStoreLinks = storeData.productIds.map(productId => ({
          product_id: productId,
          store_id: data.id
        }));

        await supabase.from('product_stores').insert(productStoreLinks);
      }

      // Refresh both stores and managers to show updated relationships
      await Promise.all([fetchStores(), fetchManagers()]);
      return true;
    } catch (err) {
      console.error('Error creating store:', err);
      throw err;
    }
  };

  const updateStore = async (storeId: string, storeData: Omit<Store, 'id' | 'hasActiveOrders'>) => {
    try {
      // Validate store name (excluding current store)
      const nameValidation = validateStoreName(storeData.name, storeId);
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.message);
      }

      if (isProduction) {
        setStores(prev => prev.map(store => 
          store.id === storeId 
            ? { ...store, ...storeData }
            : store
        ));
        return true;
      }

      // Get current store data to track manager changes
      const currentStore = stores.find(s => s.id === storeId);
      const previousManagerId = currentStore?.managerId;

      // Update the store (without manager_id for now)
      const { error } = await supabase
        .from('stores')
        .update({
          name: storeData.name,
          address: storeData.address,
          is_central: storeData.isCentral,
          is_active: storeData.isActive
        })
        .eq('id', storeId);

      if (error) throw error;

      // Handle manager assignment changes
      if (previousManagerId !== storeData.managerId) {
        // Clear previous assignment
        if (previousManagerId) {
          await updateManagerStoreRelationship(previousManagerId, storeId, 'clear');
        }
        
        // Set new assignment
        if (storeData.managerId) {
          await updateManagerStoreRelationship(storeData.managerId, storeId, 'assign');
        }
      }

      // Update product-store relationships
      await supabase.from('product_stores').delete().eq('store_id', storeId);

      if (storeData.productIds.length > 0) {
        const productStoreLinks = storeData.productIds.map(productId => ({
          product_id: productId,
          store_id: storeId
        }));

        await supabase.from('product_stores').insert(productStoreLinks);
      }

      // Refresh both stores and managers to show updated relationships
      await Promise.all([fetchStores(), fetchManagers()]);
      return true;
    } catch (err) {
      console.error('Error updating store:', err);
      throw err;
    }
  };

  const deleteStore = async (storeId: string) => {
    try {
      if (isProduction) {
        setStores(prev => prev.filter(store => store.id !== storeId));
        return true;
      }

      // Get current store data to clear manager assignment
      const currentStore = stores.find(s => s.id === storeId);
      
      // Clear manager's store assignment before deleting store
      if (currentStore?.managerId) {
        await updateManagerStoreRelationship(currentStore.managerId, storeId, 'clear');
      }

      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId);

      if (error) throw error;

      // Refresh both stores and managers to show updated relationships
      await Promise.all([fetchStores(), fetchManagers()]);
      return true;
    } catch (err) {
      console.error('Error deleting store:', err);
      return false;
    }
  };

  // MANAGER OPERATIONS
  const createManager = async (managerData: Omit<Manager, 'id' | 'generatedId' | 'storeName'>) => {
    try {
      // Validate manager name and phone
      const nameValidation = validateManagerName(managerData.name);
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.message);
      }

      const phoneValidation = validateManagerPhone(managerData.phone);
      if (!phoneValidation.isValid) {
        throw new Error(phoneValidation.message);
      }

      if (isProduction) {
        const newManager = { 
          ...managerData, 
          id: Date.now().toString(), 
          generatedId: `MGR-${Date.now().toString().slice(-6)}` 
        };
        setManagers(prev => [newManager, ...prev]);
        return true;
      }

      const generatedId = `MGR-${Date.now().toString().slice(-6)}`;

      // Create the manager first
      const { data, error } = await supabase
        .from('managers')
        .insert({
          name: managerData.name,
          phone: managerData.phone,
          address: managerData.address,
          store_id: null, // We'll set this after handling the relationship
          generated_id: generatedId
        })
        .select()
        .single();

      if (error) throw error;

      // Handle store assignment if provided
      if (managerData.storeId) {
        await updateManagerStoreRelationship(data.id, managerData.storeId, 'assign');
      }

      // Refresh both managers and stores to show updated relationships
      await Promise.all([fetchManagers(), fetchStores()]);
      return true;
    } catch (err) {
      console.error('Error creating manager:', err);
      throw err;
    }
  };

  const updateManager = async (managerId: string, managerData: Omit<Manager, 'id' | 'generatedId' | 'storeName'>) => {
    try {
      // Validate manager name and phone (excluding current manager)
      const nameValidation = validateManagerName(managerData.name, managerId);
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.message);
      }

      const phoneValidation = validateManagerPhone(managerData.phone, managerId);
      if (!phoneValidation.isValid) {
        throw new Error(phoneValidation.message);
      }

      if (isProduction) {
        setManagers(prev => prev.map(manager => 
          manager.id === managerId 
            ? { ...manager, ...managerData }
            : manager
        ));
        return true;
      }

      // Get current manager data to track store changes
      const currentManager = managers.find(m => m.id === managerId);
      const previousStoreId = currentManager?.storeId;

      // Update the manager (without store_id for now)
      const { error } = await supabase
        .from('managers')
        .update({
          name: managerData.name,
          phone: managerData.phone,
          address: managerData.address
        })
        .eq('id', managerId);

      if (error) throw error;

      // Handle store assignment changes
      if (previousStoreId !== managerData.storeId) {
        // Clear previous assignment
        if (previousStoreId) {
          await updateManagerStoreRelationship(managerId, previousStoreId, 'clear');
        }
        
        // Set new assignment
        if (managerData.storeId) {
          await updateManagerStoreRelationship(managerId, managerData.storeId, 'assign');
        }
      }

      // Refresh both managers and stores to show updated relationships
      await Promise.all([fetchManagers(), fetchStores()]);
      return true;
    } catch (err) {
      console.error('Error updating manager:', err);
      throw err;
    }
  };

  const deleteManager = async (managerId: string) => {
    try {
      if (isProduction) {
        setManagers(prev => prev.filter(manager => manager.id !== managerId));
        return true;
      }

      // Get current manager data to clear store assignment
      const currentManager = managers.find(m => m.id === managerId);
      
      // Clear store's manager assignment before deleting manager
      if (currentManager?.storeId) {
        await updateManagerStoreRelationship(managerId, currentManager.storeId, 'clear');
      }

      const { error } = await supabase
        .from('managers')
        .delete()
        .eq('id', managerId);

      if (error) throw error;

      // Refresh both managers and stores to show updated relationships
      await Promise.all([fetchManagers(), fetchStores()]);
      return true;
    } catch (err) {
      console.error('Error deleting manager:', err);
      return false;
    }
  };

  // RAW MATERIAL OPERATIONS
  const createRawMaterial = async (materialData: Omit<RawMaterial, 'id' | 'code' | 'createdAt'>) => {
    try {
      // Validate raw material name
      const nameValidation = validateRawMaterialName(materialData.name);
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.message);
      }

      if (isProduction) {
        const newMaterial = { 
          ...materialData, 
          id: Date.now().toString(), 
          code: `RM-${Date.now()}`,
          createdAt: new Date().toISOString()
        };
        setRawMaterials(prev => [newMaterial, ...prev]);
        return true;
      }

      const code = `RM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(rawMaterials.length + 1).padStart(3, '0')}`;

      const { error } = await supabase
        .from('raw_materials')
        .insert({
          name: materialData.name,
          code,
          category: materialData.category,
          unit_of_measurement: materialData.unitOfMeasurement,
          current_stock: materialData.currentStock,
          min_stock: materialData.minStock,
          max_stock: materialData.maxStock || 100, // Default max stock if not provided
          reorder_point: materialData.reorderPoint,
          price: materialData.price,
          is_active: materialData.isActive,
          purchase_order_quantity: materialData.purchaseOrderQuantity,
          expiry: materialData.expiry,
          storage_location: materialData.storageLocation,
          storage_requirements: materialData.storageRequirements,
          allergen_info: materialData.allergenInfo,
          nutritional_info: materialData.nutritionalInfo,
          regulatory_certifications: materialData.regulatoryCertifications,
          secondary_unit_of_measurement: materialData.secondaryUnitOfMeasurement,
          conversion_factor: materialData.conversionFactor,
          notes: materialData.notes,
          vendor_id: materialData.vendorId
        });

      if (error) throw error;

      await fetchRawMaterials();
      return true;
    } catch (err) {
      console.error('Error creating raw material:', err);
      throw err;
    }
  };

  const updateRawMaterial = async (materialId: string, materialData: Omit<RawMaterial, 'id' | 'code' | 'createdAt'>) => {
    try {
      // Validate raw material name (excluding current material)
      const nameValidation = validateRawMaterialName(materialData.name, materialId);
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.message);
      }

      if (isProduction) {
        setRawMaterials(prev => prev.map(material => 
          material.id === materialId 
            ? { ...material, ...materialData }
            : material
        ));
        return true;
      }

      const { error } = await supabase
        .from('raw_materials')
        .update({
          name: materialData.name,
          category: materialData.category,
          unit_of_measurement: materialData.unitOfMeasurement,
          current_stock: materialData.currentStock,
          min_stock: materialData.minStock,
          max_stock: materialData.maxStock || 100,
          reorder_point: materialData.reorderPoint,
          price: materialData.price,
          is_active: materialData.isActive,
          purchase_order_quantity: materialData.purchaseOrderQuantity,
          expiry: materialData.expiry,
          storage_location: materialData.storageLocation,
          storage_requirements: materialData.storageRequirements,
          allergen_info: materialData.allergenInfo,
          nutritional_info: materialData.nutritionalInfo,
          regulatory_certifications: materialData.regulatoryCertifications,
          secondary_unit_of_measurement: materialData.secondaryUnitOfMeasurement,
          conversion_factor: materialData.conversionFactor,
          notes: materialData.notes,
          vendor_id: materialData.vendorId
        })
        .eq('id', materialId);

      if (error) throw error;

      await fetchRawMaterials();
      return true;
    } catch (err) {
      console.error('Error updating raw material:', err);
      throw err;
    }
  };

  const deleteRawMaterial = async (materialId: string) => {
    try {
      if (isProduction) {
        setRawMaterials(prev => prev.filter(material => material.id !== materialId));
        return true;
      }

      const { error } = await supabase
        .from('raw_materials')
        .delete()
        .eq('id', materialId);

      if (error) throw error;

      await fetchRawMaterials();
      return true;
    } catch (err) {
      console.error('Error deleting raw material:', err);
      return false;
    }
  };

  // VENDOR OPERATIONS
  const createVendor = async (vendorData: Omit<Vendor, 'id' | 'createdAt'>) => {
    try {
      // Validate vendor name, email, and phone
      const nameValidation = validateVendorName(vendorData.vendorName);
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.message);
      }

      const emailValidation = validateVendorEmail(vendorData.email);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.message);
      }

      const phoneValidation = validateVendorPhone(vendorData.phoneNumber);
      if (!phoneValidation.isValid) {
        throw new Error(phoneValidation.message);
      }

      if (isProduction) {
        const newVendor = {
          ...vendorData,
          notes: vendorData.notes || '',
          categories: vendorData.categories || [],
          createdAt: new Date().toISOString(),
          id: Date.now().toString(),
        };
        setVendors(prev => [newVendor, ...prev]);
        
        // Update raw materials with this vendor
        if (vendorData.rawMaterialIds && vendorData.rawMaterialIds.length > 0) {
          setRawMaterials(prev => prev.map(material => 
            vendorData.rawMaterialIds?.includes(material.id)
              ? { ...material, vendorId: newVendor.id }
              : material
          ));
        }
        
        return true;
      }

      // Create the vendor
      const { data, error } = await supabase
        .from('vendors')
        .insert({
          vendor_name: vendorData.vendorName,
          contact_person: vendorData.contactPerson,
          phone_number: vendorData.phoneNumber,
          email: vendorData.email,
          address: vendorData.address,
          gstin_tax_id: vendorData.gstinTaxId,
          notes: vendorData.notes,
          categories: vendorData.categories
        })
        .select()
        .single();

      if (error) throw error;

      // Update raw materials with this vendor
      if (vendorData.rawMaterialIds && vendorData.rawMaterialIds.length > 0) {
        // First, clear any existing assignments for these materials
        await supabase
          .from('raw_materials')
          .update({ vendor_id: null })
          .in('id', vendorData.rawMaterialIds);
        
        // Then assign them to this vendor
        await supabase
          .from('raw_materials')
          .update({ vendor_id: data.id })
          .in('id', vendorData.rawMaterialIds);
      }

      await Promise.all([fetchVendors(), fetchRawMaterials()]);
      return true;
    } catch (err) {
      console.error('Error creating vendor:', err);
      throw err;
    }
  };

  const updateVendor = async (vendorId: string, vendorData: Omit<Vendor, 'id' | 'createdAt'>) => {
    try {
      // Validate vendor name, email, and phone (excluding current vendor)
      const nameValidation = validateVendorName(vendorData.vendorName, vendorId);
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.message);
      }

      const emailValidation = validateVendorEmail(vendorData.email, vendorId);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.message);
      }

      const phoneValidation = validateVendorPhone(vendorData.phoneNumber, vendorId);
      if (!phoneValidation.isValid) {
        throw new Error(phoneValidation.message);
      }

      if (isProduction) {
        setVendors(prev => prev.map(vendor => 
          vendor.id === vendorId 
            ? { ...vendor, ...vendorData }
            : vendor
        ));
        
        // Update raw materials with this vendor
        const currentVendor = vendors.find(v => v.id === vendorId);
        const previousMaterialIds = currentVendor?.rawMaterialIds || [];
        const newMaterialIds = vendorData.rawMaterialIds || [];
        
        // Materials to remove vendor from
        const materialsToRemove = previousMaterialIds.filter(id => !newMaterialIds.includes(id));
        
        // Materials to add vendor to
        const materialsToAdd = newMaterialIds.filter(id => !previousMaterialIds.includes(id));
        
        setRawMaterials(prev => prev.map(material => {
          if (materialsToRemove.includes(material.id) && material.vendorId === vendorId) {
            return { ...material, vendorId: undefined };
          }
          if (materialsToAdd.includes(material.id)) {
            return { ...material, vendorId };
          }
          return material;
        }));
        
        return true;
      }

      // Update the vendor
      const { error } = await supabase
        .from('vendors')
        .update({
          vendor_name: vendorData.vendorName,
          contact_person: vendorData.contactPerson,
          phone_number: vendorData.phoneNumber,
          email: vendorData.email,
          address: vendorData.address,
          gstin_tax_id: vendorData.gstinTaxId, 
          notes: vendorData.notes,
          categories: vendorData.categories
        })
        .eq('id', vendorId);

      if (error) throw error;

      // Get current vendor data to track raw material changes
      const currentVendor = vendors.find(v => v.id === vendorId);
      const previousMaterialIds = currentVendor?.rawMaterialIds || [];
      const newMaterialIds = vendorData.rawMaterialIds || [];
      
      // Materials to remove vendor from
      const materialsToRemove = previousMaterialIds.filter(id => !newMaterialIds.includes(id));
      
      // Materials to add vendor to
      const materialsToAdd = newMaterialIds.filter(id => !previousMaterialIds.includes(id));
      
      // Update raw materials that should no longer be associated with this vendor
      if (materialsToRemove.length > 0) {
        await supabase
          .from('raw_materials')
          .update({ vendor_id: null })
          .in('id', materialsToRemove)
          .eq('vendor_id', vendorId);
      }
      
      // Update raw materials that should now be associated with this vendor
      if (materialsToAdd.length > 0) {
        await supabase
          .from('raw_materials')
          .update({ vendor_id: vendorId })
          .in('id', materialsToAdd);
      }

      await Promise.all([fetchVendors(), fetchRawMaterials()]);
      return true;
    } catch (err) {
      console.error('Error updating vendor:', err);
      throw err;
    }
  };

  const deleteVendor = async (vendorId: string) => {
    try {
      if (isProduction) {
        // Clear vendor ID from any raw materials
        setRawMaterials(prev => prev.map(material => 
          material.vendorId === vendorId 
            ? { ...material, vendorId: undefined }
            : material
        ));
        
        // Remove the vendor
        setVendors(prev => prev.filter(vendor => vendor.id !== vendorId));
        return true;
      }

      // First, clear vendor_id from any raw materials
      await supabase
        .from('raw_materials')
        .update({ vendor_id: null })
        .eq('vendor_id', vendorId);

      // Then delete the vendor
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendorId);

      if (error) throw error;

      await Promise.all([fetchVendors(), fetchRawMaterials()]);
      return true;
    } catch (err) {
      console.error('Error deleting vendor:', err);
      return false;
    }
  };

  // PRODUCT OPERATIONS
  const generateProductCode = () => `PROD-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000000)}`;

  const createProduct = async (productData: Omit<Product, 'id' | 'code' | 'createdAt' | 'storeNames'> & { code?: string }) => {
    try {
      // Validate product name
      const nameValidation = validateProductName(productData.name);
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.message);
      }

      if (isProduction) {
        const newProduct = { 
          ...productData, 
          id: Date.now().toString(), 
          code: productData.code || generateProductCode(),
          createdAt: new Date().toISOString(),
          storeNames: []
        };
        setProducts(prev => [newProduct, ...prev]);
        return true;
      }

      let code = productData.code || generateProductCode();
      let attempts = 0;
      let existing;
      do {
        const { data, error: checkError } = await supabase
          .from('products')
          .select('id')
          .eq('code', code);
        if (checkError) throw checkError;
        existing = data && data.length > 0;
        if (existing) code = generateProductCode();
        attempts++;
      } while (existing && attempts < 5);

      if (existing) {
        throw new Error('Could not generate a unique product code. Please try again.');
      }

      const { data, error } = await supabase
        .from('products')
        .insert({
          name: productData.name,
          price: productData.price,
          code,
          status: productData.status,
          recipe: productData.recipe,
          vegtype: productData.vegType,
          iscombo: productData.isCombo,
          add_ons: productData.addOns ? JSON.stringify(productData.addOns) : null,
        })
        .select();

      if (error) throw error;

      // Link product to stores
      if (productData.storeIds.length > 0) {
        const productStoreLinks = productData.storeIds.map(storeId => ({
          product_id: data[0].id,
          store_id: storeId
        }));

        await supabase.from('product_stores').insert(productStoreLinks);
      }

      await fetchProducts();
      return true;
    } catch (err) {
      console.error('Error creating product:', err);
      throw err;
    }
  };

  const createProductWithoutRefresh = async (productData: Omit<Product, 'id' | 'code' | 'createdAt' | 'storeNames'> & { code?: string }) => {
    try {
      // Validate product name
      const nameValidation = validateProductName(productData.name);
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.message);
      }

      if (isProduction) {
        const newProduct = { 
          ...productData, 
          id: Date.now().toString(), 
          code: productData.code || generateProductCode(),
          createdAt: new Date().toISOString(),
          storeNames: []
        };
        setProducts(prev => [newProduct, ...prev]);
        return true;
      }

      let code = productData.code || generateProductCode();
      let attempts = 0;
      let existing;
      do {
        const { data, error: checkError } = await supabase
          .from('products')
          .select('id')
          .eq('code', code);
        if (checkError) throw checkError;
        existing = data && data.length > 0;
        if (existing) code = generateProductCode();
        attempts++;
      } while (existing && attempts < 5);

      if (existing) {
        throw new Error('Could not generate a unique product code. Please try again.');
      }

      const { data, error } = await supabase
        .from('products')
        .insert({
          name: productData.name,
          price: productData.price,
          code,
          status: productData.status,
          recipe: productData.recipe,
          vegtype: productData.vegType,
          iscombo: productData.isCombo,
          add_ons: productData.addOns ? JSON.stringify(productData.addOns) : null,
        })
        .select();

      if (error) throw error;

      // Link product to stores
      if (productData.storeIds.length > 0) {
        const productStoreLinks = productData.storeIds.map(storeId => ({
          product_id: data[0].id,
          store_id: storeId
        }));

        await supabase.from('product_stores').insert(productStoreLinks);
      }

      // Don't call fetchProducts() here
      return true;
    } catch (err) {
      console.error('Error creating product:', err);
      throw err;
    }
  };

  const updateProduct = async (productId: string, productData: Omit<Product, 'id' | 'code' | 'createdAt' | 'storeNames'>) => {
    try {
      // Validate product name (excluding current product)
      const nameValidation = validateProductName(productData.name, productId);
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.message);
      }

      if (isProduction) {
        setProducts(prev => prev.map(product => 
          product.id === productId 
            ? { ...product, ...productData }
            : product
        ));
        return true;
      }

      const { error } = await supabase
        .from('products')
        .update({
          name: productData.name,
          price: productData.price,
          status: productData.status,
          recipe: productData.recipe,
          vegtype: productData.vegType,
          iscombo: productData.isCombo,
          add_ons: productData.addOns ? JSON.stringify(productData.addOns) : null,
        })
        .eq('id', productId);

      if (error) throw error;

      // Update product-store relationships
      await supabase.from('product_stores').delete().eq('product_id', productId);

      if (productData.storeIds.length > 0) {
        const productStoreLinks = productData.storeIds.map(storeId => ({
          product_id: productId,
          store_id: storeId
        }));

        await supabase.from('product_stores').insert(productStoreLinks);
      }

      await fetchProducts();
      return true;
    } catch (err) {
      console.error('Error updating product:', err);
      throw err;
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      if (isProduction) {
        setProducts(prev => prev.filter(product => product.id !== productId));
        return true;
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      await fetchProducts();
      return true;
    } catch (err) {
      console.error('Error deleting product:', err);
      return false;
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchStores(),
        fetchManagers(),
        fetchRawMaterials(),
        fetchVendors(),
        fetchProducts()
      ]);
      
      setLoading(false);
    };

    initializeData();
  }, []);

  return {
    // Data
    stores,
    managers,
    rawMaterials,
    vendors,
    products,
    loading,
    error,
    
    // Store operations
    createStore,
    updateStore,
    deleteStore,
    
    // Manager operations
    createManager,
    updateManager,
    deleteManager,
    
    // Raw Material operations
    createRawMaterial,
    updateRawMaterial,
    deleteRawMaterial,
    
    // Vendor operations
    createVendor,
    updateVendor,
    deleteVendor,
    
    // Product operations
    createProduct,
    createProductWithoutRefresh,
    updateProduct,
    deleteProduct,
    
    // Validation functions (exposed for use in components)
    validateStoreName,
    validateManagerName,
    validateRawMaterialName,
    validateVendorName,
    validateProductName,
    validateVendorEmail,
    validateManagerPhone,
    validateVendorPhone,
    
    // Refresh
    refreshData: async () => {
      await Promise.all([
        fetchStores(),
        fetchManagers(),
        fetchRawMaterials(),
        fetchVendors(),
        fetchProducts()
      ]);
    }
  };
};