import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, Scale, AlertCircle, Check, Save, X } from 'lucide-react';
import Toast from '../ui/Toast';
import DeleteConfirmation from '../ui/DeleteConfirmation';
import { supabase } from '../../lib/supabase';

interface BasicSetupProps {
  onCategoriesUpdate?: (categories: string[]) => void;
  onUnitsUpdate?: (units: { value: string; label: string }[]) => void;
}

const BasicSetup: React.FC<BasicSetupProps> = ({ onCategoriesUpdate, onUnitsUpdate }) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'units'>('categories');
  
  // Categories state
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  
  // Units state
  const [units, setUnits] = useState<{ id: string; value: string; label: string }[]>([]);

  // Form states
  const [newCategory, setNewCategory] = useState('');
  const [newUnitValue, setNewUnitValue] = useState('');
  const [newUnitLabel, setNewUnitLabel] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ index: number; value: string } | null>(null);
  const [editingUnit, setEditingUnit] = useState<{ index: number; value: string; label: string } | null>(null);

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

  // Delete confirmation state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    type: 'category' | 'unit';
    item: string;
    index: number;
  }>({
    show: false,
    type: 'category',
    item: '',
    index: -1
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add modal state for category and unit
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);

  // Fetch categories and units from Supabase
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('raw_material_categories').select('*').order('name');
    if (error) {
      setError('Failed to fetch categories');
      setCategories([]);
    } else {
      setCategories(data || []);
      onCategoriesUpdate?.(data?.map((c: any) => c.name) || []);
    }
    setLoading(false);
  };
  const fetchUnits = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('units_of_measurement').select('*').order('label');
    if (error) {
      setError('Failed to fetch units');
      setUnits([]);
    } else {
      setUnits(data || []);
      onUnitsUpdate?.(data || []);
    }
    setLoading(false);
  };
  useEffect(() => {
    fetchCategories();
    fetchUnits();
    // eslint-disable-next-line
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Category operations
  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      showToast('Category name cannot be empty', 'error');
      return;
    }
    if (categories.some(c => c.name.toLowerCase() === newCategory.trim().toLowerCase())) {
      showToast('Category already exists', 'error');
      return;
    }
    const { error } = await supabase.from('raw_material_categories').insert({ name: newCategory.trim() });
    if (error) {
      showToast('Failed to add category', 'error');
      return;
    }
    setNewCategory('');
    fetchCategories();
    showToast('Category added successfully');
  };

  const handleEditCategory = (index: number) => {
    setEditingCategory({ index, value: categories[index].name });
  };

  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    if (!editingCategory.value.trim()) {
      showToast('Category name cannot be empty', 'error');
      return;
    }
    if (categories.some(c => c.name.toLowerCase() === editingCategory.value.trim().toLowerCase() && c.id !== categories[editingCategory.index].id)) {
      showToast('Category already exists', 'error');
      return;
    }
    const categoryId = categories[editingCategory.index].id;
    const { error } = await supabase.from('raw_material_categories').update({ name: editingCategory.value.trim() }).eq('id', categoryId);
    if (error) {
      showToast('Failed to update category', 'error');
      return;
    }
    setEditingCategory(null);
    fetchCategories();
    showToast('Category updated successfully');
  };

  const handleDeleteCategory = (index: number) => {
    const category = categories[index];
    
    // Check if category is in use (mock check - in real app, check database)
    if (category.name === 'General') {
      showToast('Cannot delete the default "General" category', 'error');
      return;
    }

    setDeleteConfirmation({
      show: true,
      type: 'category',
      item: category.name,
      index
    });
  };

  // Unit operations
  const handleAddUnit = async () => {
    if (!newUnitValue.trim() || !newUnitLabel.trim()) {
      showToast('Both unit value and label are required', 'error');
      return;
    }
    if (units.some(u => u.value.toLowerCase() === newUnitValue.trim().toLowerCase())) {
      showToast('Unit value already exists', 'error');
      return;
    }
    const { error } = await supabase.from('units_of_measurement').insert({ value: newUnitValue.trim(), label: newUnitLabel.trim() });
    if (error) {
      showToast('Failed to add unit', 'error');
      return;
    }
    setNewUnitValue('');
    setNewUnitLabel('');
    fetchUnits();
    showToast('Unit added successfully');
  };

  const handleEditUnit = (index: number) => {
    setEditingUnit({ 
      index, 
      value: units[index].value, 
      label: units[index].label 
    });
  };

  const handleSaveUnit = async () => {
    if (!editingUnit) return;
    if (!editingUnit.value.trim() || !editingUnit.label.trim()) {
      showToast('Both unit value and label are required', 'error');
      return;
    }
    if (units.some((u, i) => u.value.toLowerCase() === editingUnit.value.trim().toLowerCase() && u.id !== units[editingUnit.index].id)) {
      showToast('Unit value already exists', 'error');
      return;
    }
    const unitId = units[editingUnit.index].id;
    const { error } = await supabase.from('units_of_measurement').update({ value: editingUnit.value.trim(), label: editingUnit.label.trim() }).eq('id', unitId);
    if (error) {
      showToast('Failed to update unit', 'error');
      return;
    }
    setEditingUnit(null);
    fetchUnits();
    showToast('Unit updated successfully');
  };

  const handleDeleteUnit = (index: number) => {
    const unit = units[index];
    
    // Check if unit is in use (mock check - in real app, check database)
    if (['kg', 'g', 'l', 'ml'].includes(unit.value)) {
      showToast(`Cannot delete commonly used unit "${unit.value}" - it may be in use`, 'error');
      return;
    }

    setDeleteConfirmation({
      show: true,
      type: 'unit',
      item: unit.label,
      index
    });
  };

  const handleDeleteConfirm = async () => {
    const { type, index } = deleteConfirmation;
    
    if (type === 'category') {
      const categoryId = categories[index].id;
      const { error } = await supabase.from('raw_material_categories').delete().eq('id', categoryId);
      if (error) {
        showToast('Failed to delete category', 'error');
        return;
      }
      fetchCategories();
      showToast('Category deleted successfully');
    } else {
      const unitId = units[index].id;
      const { error } = await supabase.from('units_of_measurement').delete().eq('id', unitId);
      if (error) {
        showToast('Failed to delete unit', 'error');
        return;
      }
      fetchUnits();
      showToast('Unit deleted successfully');
    }
    
    setDeleteConfirmation({ show: false, type: 'category', item: '', index: -1 });
  };

  return (
    <>
      <div>
        {/* Inline Sub-navigation */}
        <div className="mb-6">
          <div className="flex space-x-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('categories')}
              className={`text-sm font-medium transition-colors pb-3 ${
                activeTab === 'categories'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab('units')}
              className={`text-sm font-medium transition-colors pb-3 ${
                activeTab === 'units'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Unit of Measurement
            </button>
          </div>
        </div>

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            {/* Add New Category */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Categories ({categories.length})
              </h3>
              <button
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium px-0 py-0 bg-transparent border-none shadow-none outline-none focus:outline-none"
                onClick={() => setShowAddCategoryModal(true)}
              >
                Add Category
              </button>
            </div>

            {/* Categories List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <Tag className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        {editingCategory?.index === index ? (
                          <input
                            type="text"
                            value={editingCategory.value}
                            onChange={(e) => setEditingCategory({ ...editingCategory, value: e.target.value })}
                            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-full"
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveCategory()}
                            autoFocus
                          />
                        ) : (
                          <span className="text-gray-900 dark:text-white truncate">{category.name}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        {editingCategory?.index === index ? (
                          <>
                            <button
                              onClick={handleSaveCategory}
                              className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 rounded"
                              title="Save"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingCategory(null)}
                              className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                              title="Cancel"
                            >
                              <span className="text-lg">×</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditCategory(index)}
                              className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(index)}
                              className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Units Tab */}
        {activeTab === 'units' && (
          <div className="space-y-6">
            {/* Add New Unit */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Units of Measurement ({units.length})
              </h3>
              <button
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium px-0 py-0 bg-transparent border-none shadow-none outline-none focus:outline-none"
                onClick={() => setShowAddUnitModal(true)}
              >
                Add Unit
              </button>
            </div>

            {/* Units List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {units.map((unit, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <Scale className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        {editingUnit?.index === index ? (
                          <div className="flex flex-col space-y-2 w-full">
                            <input
                              type="text"
                              value={editingUnit.value}
                              onChange={(e) => setEditingUnit({ ...editingUnit, value: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              placeholder="Value"
                            />
                            <input
                              type="text"
                              value={editingUnit.label}
                              onChange={(e) => setEditingUnit({ ...editingUnit, label: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              placeholder="Label"
                            />
                          </div>
                        ) : (
                          <div className="truncate">
                            <span className="text-gray-900 dark:text-white font-mono font-medium">{unit.value}</span>
                            <span className="text-gray-500 dark:text-gray-400"> - </span>
                            <span className="text-gray-900 dark:text-white">{unit.label}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        {editingUnit?.index === index ? (
                          <>
                            <button
                              onClick={handleSaveUnit}
                              className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 rounded"
                              title="Save"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingUnit(null)}
                              className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                              title="Cancel"
                            >
                              <span className="text-lg">×</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditUnit(index)}
                              className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUnit(index)}
                              className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={deleteConfirmation.show}
        title={`Delete ${deleteConfirmation.type === 'category' ? 'Category' : 'Unit'}`}
        message={`Are you sure you want to delete "${deleteConfirmation.item}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmation({ show: false, type: 'category', item: '', index: -1 })}
      />

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: 'success' })}
      />

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-auto min-w-fit p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white dark:text-white">Add New Category</h4>
              <button onClick={() => setShowAddCategoryModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <input
              type="text"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              placeholder="Enter category name"
              className="w-full px-3 py-2 border border-gray-400 dark:border-gray-600 rounded mb-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                onClick={() => setShowAddCategoryModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white"
                onClick={async () => { await handleAddCategory(); setShowAddCategoryModal(false); }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Unit Modal */}
      {showAddUnitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-auto min-w-fit p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white dark:text-white">Add New Unit</h4>
              <button onClick={() => setShowAddUnitModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <input
                type="text"
                value={newUnitValue}
                onChange={e => setNewUnitValue(e.target.value)}
                placeholder="Unit value (e.g., kg)"
                className="flex-1 px-3 py-2 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                value={newUnitLabel}
                onChange={e => setNewUnitLabel(e.target.value)}
                placeholder="Unit label (e.g., Kilograms)"
                className="flex-1 px-3 py-2 border border-gray-400 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                onClick={() => setShowAddUnitModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white"
                onClick={async () => { await handleAddUnit(); setShowAddUnitModal(false); }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BasicSetup;