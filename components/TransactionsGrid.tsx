
import React, { useState } from 'react';
import { Transaction, Category, TransactionType } from '../types';
import { formatCurrency } from '../utils';
import Button from './ui/Button';
import RecurringTransactionModal, { Frequency } from './RecurringTransactionModal';
import EditRecurringChoiceModal from './EditRecurringChoiceModal';

interface TransactionsGridProps {
  transactions: Transaction[];
  categories: Category[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => Promise<unknown>;
  onUpdateTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onAddRecurringTransactions: (baseTx: Omit<Transaction, 'id'>, frequency: Frequency, endDate: string) => void;
  onUpdateTransactionSeries: (recurringId: string, updates: Partial<Omit<Transaction, 'id' | 'date' | 'recurring_id'>>) => void;
  onManageRecurringSeries?: (recurringId: string) => void;
  requestSort: (key: keyof Transaction) => void;
  sortConfig: { key: keyof Transaction | null; direction: 'ascending' | 'descending' };
}

const EditRow: React.FC<{
  transaction: Partial<Transaction>;
  categories: Category[];
  onSave: (tx: Partial<Transaction>, isRecurring: boolean) => Promise<void>;
  onCancel: () => void;
  isNew?: boolean;
}> = ({ transaction, categories, onSave, onCancel, isNew = false }) => {
  const [editedTx, setEditedTx] = useState(transaction);
  const [isRecurring, setIsRecurring] = useState(false);
  const inputStyles = "bg-zinc-800 w-full p-2 rounded-md border border-zinc-700 focus:ring-1 focus:ring-sky-500 focus:border-sky-500";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedTx(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) || 0 : value }));
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as TransactionType;
    setEditedTx(prev => ({...prev, type, category_id: ''}));
  };

  const filteredCategories = categories.filter(c => c.type === editedTx.type);

  return (
    <tr className="bg-zinc-800/50">
      <td data-label="Date"><input type="date" name="date" value={editedTx.date || ''} onChange={handleChange} className={inputStyles} /></td>
      <td data-label="Name"><input type="text" name="name" value={editedTx.name || ''} onChange={handleChange} className={inputStyles} placeholder="Transaction Name"/></td>
      <td data-label="Type">
        <select name="type" value={editedTx.type || 'expense'} onChange={handleTypeChange} className={inputStyles}>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </td>
      <td data-label="Category">
        <select name="category_id" value={editedTx.category_id || ''} onChange={handleChange} className={inputStyles} disabled={!editedTx.type}>
          <option value="">Select Category</option>
          {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </td>
      <td data-label="Amount"><input type="number" name="amount" value={editedTx.amount || ''} onChange={handleChange} className={inputStyles} placeholder="0.00" /></td>
      <td data-label="Notes"><input name="notes" value={editedTx.notes || ''} onChange={handleChange} className={inputStyles} /></td>
      <td data-label="Actions" className="whitespace-nowrap">
        <div className="flex flex-wrap items-center justify-end gap-2">
            {isNew && (
                <label className="flex items-center cursor-pointer mr-2">
                <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="h-4 w-4 text-sky-600 bg-zinc-900 border-zinc-700 rounded focus:ring-sky-500" />
                <span className="ml-2 text-sm text-zinc-400">Recurring</span>
                </label>
            )}
            <Button onClick={() => onSave(editedTx, isRecurring)} size="sm">{isNew ? 'Add' : 'Save'}</Button>
            <Button onClick={onCancel} variant="secondary" size="sm">Cancel</Button>
        </div>
      </td>
    </tr>
  );
};

const SortableHeader: React.FC<{
    columnKey: keyof Transaction;
    title: string;
    requestSort: (key: keyof Transaction) => void;
    sortConfig: { key: keyof Transaction | null; direction: string };
    className?: string;
}> = ({ columnKey, title, requestSort, sortConfig, className = '' }) => {
    const isSorted = sortConfig.key === columnKey;
    const directionIndicator = isSorted ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '';
    
    return (
        <th className={`p-0 font-semibold text-sm uppercase text-zinc-400 whitespace-nowrap ${className}`}>
            <button 
                onClick={() => requestSort(columnKey)} 
                className={`p-4 w-full h-full flex items-center gap-2 transition-colors ${isSorted ? 'text-white bg-zinc-800/50' : 'hover:bg-zinc-800/50'} ${className?.includes('text-right') ? 'justify-end' : 'justify-start'}`}
            >
                {title}
                {directionIndicator && <span className="text-xs">{directionIndicator}</span>}
            </button>
        </th>
    );
};


const TransactionsGrid: React.FC<TransactionsGridProps> = ({ transactions, categories, onAddTransaction, onUpdateTransaction, onDeleteTransaction, onAddRecurringTransactions, onUpdateTransactionSeries, onManageRecurringSeries, requestSort, sortConfig }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [recurringTxCandidate, setRecurringTxCandidate] = useState<Omit<Transaction, 'id'> | null>(null);

  const [recurringEditCandidate, setRecurringEditCandidate] = useState<Transaction | null>(null);
  const [isEditingSeries, setIsEditingSeries] = useState(false);

  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

  const handleEditClick = (tx: Transaction) => {
    if (tx.recurring_id) {
        setRecurringEditCandidate(tx);
    } else {
        setEditingId(tx.id);
    }
  };
  
  const handleSave = async (tx: Partial<Transaction>, isRecurring: boolean) => {
    if (isAdding) {
      if (tx.date && tx.name && tx.type && tx.amount !== undefined) {
         const transactionData = {
           ...tx,
           category_id: tx.category_id || null,
         } as Omit<Transaction, 'id'>;
         if (isRecurring) {
            setRecurringTxCandidate(transactionData);
            setIsRecurringModalOpen(true);
         } else {
            await onAddTransaction(transactionData);
         }
         setIsAdding(false);
      } else {
        alert('Please fill all required fields: Date, Name, Type, Amount.');
      }
    } else { // UPDATING
        const originalTx = transactions.find(t => t.id === editingId);
        if (isEditingSeries && originalTx?.recurring_id) {
            const { id, date, recurring_id, ...updates } = tx;
            onUpdateTransactionSeries(originalTx.recurring_id, updates as Partial<Omit<Transaction, 'id' | 'date' | 'recurring_id'>>);
        } else {
            const updatedTx = tx as Transaction;
            if (originalTx?.recurring_id && !isEditingSeries) {
                // This is a single edit of a recurring item, detach it.
                updatedTx.recurring_id = null;
            }
            onUpdateTransaction(updatedTx);
        }
        setEditingId(null);
        setIsEditingSeries(false);
    }
  };
  
  const handleSaveRecurring = (frequency: Frequency, endDate: string) => {
    if (recurringTxCandidate) {
      onAddRecurringTransactions(recurringTxCandidate, frequency, endDate);
      setRecurringTxCandidate(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setIsEditingSeries(false);
  };

  const today = new Date();
  const localDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <>
      <RecurringTransactionModal 
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        onSave={handleSaveRecurring}
      />
      <EditRecurringChoiceModal
        isOpen={!!recurringEditCandidate}
        onClose={() => setRecurringEditCandidate(null)}
        onEditSingle={() => {
            if (recurringEditCandidate) {
                setEditingId(recurringEditCandidate.id);
                setIsEditingSeries(false);
                setRecurringEditCandidate(null);
            }
        }}
        onEditSeries={() => {
            if (recurringEditCandidate) {
                setEditingId(recurringEditCandidate.id);
                setIsEditingSeries(true);
                setRecurringEditCandidate(null);
            }
        }}
      />
      <div className="p-4 md:p-8">
        <div className="bg-zinc-900 rounded-lg overflow-hidden md:border md:border-zinc-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left responsive-table">
              <thead className="bg-zinc-950/50">
                <tr>
                  <SortableHeader columnKey="date" title="Date" requestSort={requestSort} sortConfig={sortConfig} />
                  <SortableHeader columnKey="name" title="Name" requestSort={requestSort} sortConfig={sortConfig} />
                  <SortableHeader columnKey="type" title="Type" requestSort={requestSort} sortConfig={sortConfig} />
                  <SortableHeader columnKey="category_id" title="Category" requestSort={requestSort} sortConfig={sortConfig} />
                  <SortableHeader columnKey="amount" title="Amount" requestSort={requestSort} sortConfig={sortConfig} className="text-right" />
                  <th className="p-4 font-semibold text-sm uppercase text-zinc-400">Notes</th>
                  <th className="p-4 font-semibold text-sm uppercase text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  editingId === tx.id ? (
                    <EditRow key={tx.id} transaction={tx} categories={categories} onSave={handleSave} onCancel={handleCancelEdit} />
                  ) : (
                  <tr key={tx.id} className="md:border-b md:border-zinc-800 md:hover:bg-zinc-800/50 transition-colors">
                    <td data-label="Date">{tx.date}</td>
                    <td data-label="Name" className="font-medium text-white">{tx.name}</td>
                    <td data-label="Type">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tx.type === 'income' ? 'bg-green-900/50 text-green-300' : 'bg-amber-900/50 text-amber-300'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td data-label="Category" className="text-zinc-400">{categoryMap.get(tx.category_id) || 'Uncategorized'}</td>
                    <td data-label="Amount" className={`text-right font-mono ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(tx.amount)}</td>
                    <td data-label="Notes" className="text-zinc-400">
                      <div className="flex items-center justify-end md:justify-start gap-2">
                        {tx.recurring_id && (
                          <button 
                            onClick={() => onManageRecurringSeries && onManageRecurringSeries(tx.recurring_id!)}
                            className="text-sky-400 hover:text-sky-300 transition-colors p-1 rounded hover:bg-zinc-700/50 group relative"
                            title="Manage Series (Cancel/Extend)"
                          >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.181a4.5 4.5 0 006.364 0l2.829-2.829m0 0c.43.43.43-1.131 0-1.562L12.5 7.854a4.5 4.5 0 00-6.364 0L3 10.993" />
                             </svg>
                          </button>
                        )}
                        <span>{tx.notes}</span>
                      </div>
                    </td>
                    <td data-label="Actions">
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => handleEditClick(tx)} variant="ghost" size="sm">Edit</Button>
                        <Button onClick={() => onDeleteTransaction(tx.id)} variant="danger" size="sm">Delete</Button>
                      </div>
                    </td>
                  </tr>
                  )
                ))}
                {isAdding && (
                  <EditRow 
                      transaction={{
                          date: localDateString,
                          name: '',
                          type: 'expense',
                          amount: 0,
                          category_id: '',
                          notes: '',
                      }}
                      categories={categories}
                      onSave={handleSave}
                      onCancel={() => setIsAdding(false)}
                      isNew
                  />
                )}
              </tbody>
            </table>
          </div>
          {!isAdding && (
              <div className="p-4 bg-zinc-900 border-t border-zinc-800 md:block hidden">
                  <Button onClick={() => setIsAdding(true)}>+ Add Transaction</Button>
              </div>
          )}
        </div>
         {!isAdding && (
              <div className="p-4 md:hidden">
                  <Button onClick={() => setIsAdding(true)} className="w-full">+ Add Transaction</Button>
              </div>
          )}
      </div>
    </>
  );
};

export default TransactionsGrid;
