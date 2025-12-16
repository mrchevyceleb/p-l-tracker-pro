
import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Category, Transaction, TransactionType } from '../types';
import RecurringTransactionModal, { Frequency } from './RecurringTransactionModal';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => Promise<unknown>;
  onAddRecurringTransaction: (baseTx: Omit<Transaction, 'id'>, frequency: Frequency, endDate: string) => void;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  categories, 
  onAddTransaction,
  onAddRecurringTransaction
}) => {
  const today = new Date().toISOString().slice(0, 10);
  
  const [formData, setFormData] = useState({
    date: today,
    name: '',
    type: 'expense' as TransactionType,
    amount: '',
    category_id: '',
    notes: ''
  });
  const [isRecurring, setIsRecurring] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        name: '',
        type: 'expense',
        amount: '',
        category_id: '',
        notes: ''
      });
      setIsRecurring(false);
    }
  }, [isOpen]);

  const inputStyles = "bg-zinc-800 w-full p-2 rounded-md border border-zinc-700 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 mt-1 text-white";
  const labelStyles = "block text-sm font-medium text-zinc-400 mt-4";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ 
      ...prev, 
      type: e.target.value as TransactionType,
      category_id: '' // Reset category on type change
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.amount || !formData.date) {
        alert("Please fill in Date, Name, and Amount.");
        return;
    }

    const transactionData: Omit<Transaction, 'id'> = {
        date: formData.date,
        name: formData.name,
        type: formData.type,
        amount: parseFloat(formData.amount),
        category_id: formData.category_id || null,
        notes: formData.notes
    };

    if (isRecurring) {
        setIsRecurringModalOpen(true);
    } else {
        await onAddTransaction(transactionData);
        onClose();
    }
  };

  const handleRecurringSave = (frequency: Frequency, endDate: string) => {
    const transactionData: Omit<Transaction, 'id'> = {
        date: formData.date,
        name: formData.name,
        type: formData.type,
        amount: parseFloat(formData.amount),
        category_id: formData.category_id || null,
        notes: formData.notes
    };
    onAddRecurringTransaction(transactionData, frequency, endDate);
    setIsRecurringModalOpen(false);
    onClose();
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);

  return (
    <>
        <Modal isOpen={isOpen} onClose={onClose} title="Quick Add Transaction">
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelStyles}>Date</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className={inputStyles} />
                </div>
                <div>
                    <label className={labelStyles}>Type</label>
                    <select name="type" value={formData.type} onChange={handleTypeChange} className={inputStyles}>
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                    </select>
                </div>
            </div>

            <div>
                <label className={labelStyles}>Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Client Payment" className={inputStyles} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelStyles}>Amount</label>
                    <input type="number" name="amount" value={formData.amount} onChange={handleChange} placeholder="0.00" className={inputStyles} step="0.01" />
                </div>
                <div>
                    <label className={labelStyles}>Category</label>
                    <select name="category_id" value={formData.category_id} onChange={handleChange} className={inputStyles}>
                        <option value="">Select Category</option>
                        {filteredCategories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className={labelStyles}>Notes (Optional)</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} className={inputStyles} rows={2} />
            </div>

            <div className="flex items-center mt-4">
                <input 
                    type="checkbox" 
                    id="recurring" 
                    checked={isRecurring} 
                    onChange={e => setIsRecurring(e.target.checked)} 
                    className="h-4 w-4 text-sky-600 bg-zinc-800 border-zinc-700 rounded focus:ring-sky-500" 
                />
                <label htmlFor="recurring" className="ml-2 text-sm text-zinc-300 select-none cursor-pointer">Make this recurring</label>
            </div>
            
            <div className="flex justify-end gap-2 pt-4 mt-6 border-t border-zinc-800">
                <Button onClick={onClose} variant="secondary">Cancel</Button>
                <Button onClick={handleSubmit}>Add Transaction</Button>
            </div>
        </div>
        </Modal>
        
        <RecurringTransactionModal 
            isOpen={isRecurringModalOpen}
            onClose={() => setIsRecurringModalOpen(false)}
            onSave={handleRecurringSave}
        />
    </>
  );
};

export default AddTransactionModal;
