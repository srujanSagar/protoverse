import React, { useState, useEffect } from 'react';
import { X, FileText, Edit, Save, Eye } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  storeIds: string[];
  storeNames: string[];
  status: 'active' | 'inactive';
  code: string;
  recipe?: string;
  createdAt: string;
}

interface RecipeModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onRecipeUpdate: (productId: string, newRecipe: string) => void;
}

const RecipeModal: React.FC<RecipeModalProps> = ({
  isOpen,
  product,
  onClose,
  onRecipeUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecipe, setEditedRecipe] = useState('');

  useEffect(() => {
    if (product) {
      setEditedRecipe(product.recipe || '');
      setIsEditing(false);
    }
  }, [product]);

  const highlightQuantities = (text: string) => {
    // Regex to match quantities: number + optional decimal + space + unit
    const quantityRegex = /(\d+(?:\.\d+)?)\s*(kg|g|lb|oz|pcs|l|ml|cups|tbsp|tsp)/gi;
    
    return text.split('\n').map((line, lineIndex) => {
      const parts = line.split(quantityRegex);
      
      return (
        <div key={lineIndex} className="mb-1">
          {parts.map((part, partIndex) => {
            // Check if this part matches a unit (every 3rd element after a number)
            const isUnit = partIndex > 0 && (partIndex - 2) % 3 === 0;
            const isNumber = partIndex > 0 && (partIndex - 1) % 3 === 0;
            
            if (isNumber || isUnit) {
              return (
                <span key={partIndex} className="quantity text-blue-600 dark:text-blue-400 font-bold">
                  {part}
                </span>
              );
            }
            
            return <span key={partIndex}>{part}</span>;
          })}
        </div>
      );
    });
  };

  const handleSave = () => {
    if (product) {
      onRecipeUpdate(product.id, editedRecipe);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedRecipe(product?.recipe || '');
    setIsEditing(false);
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{product.name}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Recipe Details</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing && product.recipe && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Recipe
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {!product.recipe && !isEditing ? (
            /* No Recipe State */
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Recipe Added</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This product doesn't have a recipe yet. Add one to help with preparation.
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
              >
                <Edit className="h-4 w-4 mr-2" />
                Add Recipe
              </button>
            </div>
          ) : isEditing ? (
            /* Edit Mode */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recipe Instructions
                </label>
                <textarea
                  value={editedRecipe}
                  onChange={(e) => setEditedRecipe(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400 dark:focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none font-mono text-sm"
                  placeholder="Format: Quantity + Unit + Ingredient&#10;Example:&#10;200g kataifi pastry&#10;150g dark chocolate&#10;100ml heavy cream&#10;50g butter&#10;2 tbsp sugar"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Format: Quantity + Unit + Ingredient (quantities will be highlighted automatically)
                </p>
              </div>

              {/* Live Preview */}
              {editedRecipe && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Live Preview
                  </label>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="font-mono text-sm text-gray-900 dark:text-white">
                      {highlightQuantities(editedRecipe)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* View Mode */
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Eye className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recipe Instructions</h3>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="font-mono text-sm text-gray-900 dark:text-white leading-relaxed">
                  {product.recipe ? highlightQuantities(product.recipe) : (
                    <span className="text-gray-500 dark:text-gray-400 italic">No recipe available</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {isEditing && (
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Recipe
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeModal;