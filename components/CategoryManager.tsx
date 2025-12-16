
import React, { useState } from 'react';
import { Category, TransactionType } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ isOpen, onClose, categories, onAddCategory, onUpdateCategory, onDeleteCategory }) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<TransactionType>('expense');
  const [newDeductibility, setNewDeductibility] = useState(100);
  
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const inputStyles = "bg-zinc-800 w-full p-2 rounded-md border border-zinc-700 focus:ring-1 focus:ring-sky-500 focus:border-sky-500";

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onAddCategory({ 
        name: newCategoryName.trim(), 
        type: newCategoryType,
        deductibility_percentage: newCategoryType === 'expense' ? newDeductibility : 0
      });
      setNewCategoryName('');
      setNewDeductibility(100);
    }
  };
  
  const handleUpdateCategory = () => {
    if (editingCategory && editingCategory.name.trim()) {
      onUpdateCategory(editingCategory);
      setEditingCategory(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Categories">
      <div className="space-y-6">
        {/* Add Category Form */}
        <div className="space-y-3 p-4 bg-zinc-800/50 rounded-lg">
          <h3 className="font-semibold text-lg text-white">Add New Category</h3>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category Name"
              className={`${inputStyles} sm:col-span-5`}
            />
            <select
              value={newCategoryType}
              onChange={(e) => setNewCategoryType(e.target.value as TransactionType)}
              className={`${inputStyles} sm:col-span-3`}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            {newCategoryType === 'expense' && (
                <div className="flex items-center gap-1 sm:col-span-2 relative group">
                     <input
                        type="number"
                        min="0"
                        max="100"
                        value={newDeductibility}
                        onChange={(e) => setNewDeductibility(Number(e.target.value))}
                        className={`${inputStyles} text-right pr-6`}
                        placeholder="%"
                    />
                    <span className="absolute right-3 top-2.5 text-zinc-500 text-sm">%</span>
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-xs p-2 rounded w-40 z-10">
                        Tax Deductible % (100% for most business items, 50% for meals)
                    </div>
                </div>
            )}
            <Button onClick={handleAddCategory} className="sm:col-span-2">Add</Button>
          </div>
        </div>

        {/* Category List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg text-white">Existing Categories</h3>
          <ul className="max-h-80 overflow-y-auto space-y-2 pr-2">
            {categories.map(cat => (
              <li key={cat.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-zinc-800 rounded-md">
                {editingCategory?.id === cat.id ? (
                    <div className="flex flex-grow gap-2 w-full">
                        <input
                            type="text"
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            className={`${inputStyles} flex-grow`}
                        />
                         {cat.type === 'expense' && (
                            <div className="relative w-24">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={editingCategory.deductibility_percentage ?? 100}
                                    onChange={(e) => setEditingCategory({ ...editingCategory, deductibility_percentage: Number(e.target.value) })}
                                    className={`${inputStyles} text-right pr-6`}
                                />
                                <span className="absolute right-3 top-2.5 text-zinc-500 text-sm">%</span>
                            </div>
                        )}
                    </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <div className="font-medium text-white">{cat.name}</div>
                    <div className="flex gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cat.type === 'income' ? 'bg-green-900/50 text-green-300' : 'bg-amber-900/50 text-amber-300'}`}>
                        {cat.type}
                        </span>
                        {cat.type === 'expense' && (
                             <span className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-700 text-zinc-300`}>
                                {cat.deductibility_percentage ?? 100}% Deductible
                             </span>
                        )}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 self-end sm:self-auto">
                  {editingCategory?.id === cat.id ? (
                    <>
                      <Button onClick={handleUpdateCategory} size="sm">Save</Button>
                      <Button onClick={() => setEditingCategory(null)} variant="secondary" size="sm">Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => setEditingCategory(cat)} variant="ghost" size="sm">Edit</Button>
                      <Button onClick={() => onDeleteCategory(cat.id)} variant="danger" size="sm">Delete</Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default CategoryManager;
