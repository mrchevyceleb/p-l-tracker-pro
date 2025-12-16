import React, { useState, useRef } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Category, TransactionType } from '../types';
import { parseBankStatementCSV, ParsedBankTransaction } from '../utils/bankStatementParser';

interface BankStatementImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onImport: (transactions: Array<{
    date: string;
    name: string;
    type: TransactionType;
    amount: number;
    category_id: string | null;
    notes: string;
  }>) => Promise<void>;
}

const BankStatementImportModal: React.FC<BankStatementImportModalProps> = ({
  isOpen, onClose, categories, onImport
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [editedTransactions, setEditedTransactions] = useState<ParsedBankTransaction[]>([]);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputStyles = "bg-zinc-800 w-full p-2 rounded-md border border-zinc-700 focus:ring-1 focus:ring-sky-500 focus:outline-none text-white";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const parsed = parseBankStatementCSV(text, selectedYear, categories);
      setEditedTransactions([...parsed]);
      setStep('preview');
    };
    reader.readAsText(file);
  };

  const handleCategoryChange = (index: number, categoryId: string) => {
    setEditedTransactions(prev =>
      prev.map((tx, i) => i === index ? { ...tx, suggestedCategoryId: categoryId || null } : tx)
    );
  };

  const handleTypeChange = (index: number, type: TransactionType) => {
    setEditedTransactions(prev =>
      prev.map((tx, i) => i === index ? { ...tx, suggestedType: type } : tx)
    );
  };

  const handleImport = async () => {
    setIsImporting(true);

    const transactions = editedTransactions.map(tx => ({
      date: tx.date,
      name: tx.description,
      type: tx.suggestedType,
      amount: tx.amount,
      category_id: tx.suggestedCategoryId,
      notes: 'Imported from bank statement'
    }));

    await onImport(transactions);
    setIsImporting(false);
    handleClose();
  };

  const handleClose = () => {
    setEditedTransactions([]);
    setStep('upload');
    setSelectedYear(currentYear);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  // Generate year options (last 5 years)
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Bank Statement">
      {step === 'upload' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Statement Year
            </label>
            <p className="text-xs text-zinc-500 mb-2">
              For dates like "4-Oct" that don't include a year
            </p>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className={inputStyles}
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Select CSV File
            </label>
            <p className="text-xs text-zinc-500 mb-2">
              Expected format: Transaction Date, Description, Amount
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileSelect}
              className={inputStyles + " file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-zinc-700 file:text-white hover:file:bg-zinc-600"}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
            <Button onClick={handleClose} variant="secondary">Cancel</Button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Preview ({editedTransactions.length} transactions)
            </h3>
            <Button onClick={() => setStep('upload')} variant="ghost" size="sm">
              Back
            </Button>
          </div>

          <div className="max-h-80 overflow-y-auto border border-zinc-800 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-zinc-800 sticky top-0">
                <tr>
                  <th className="p-2 text-left text-zinc-400 text-xs">Date</th>
                  <th className="p-2 text-left text-zinc-400 text-xs">Description</th>
                  <th className="p-2 text-right text-zinc-400 text-xs">Amount</th>
                  <th className="p-2 text-left text-zinc-400 text-xs">Category</th>
                </tr>
              </thead>
              <tbody>
                {editedTransactions.map((tx, idx) => (
                  <tr key={idx} className="border-t border-zinc-800 hover:bg-zinc-800/50">
                    <td className="p-2 text-zinc-300 text-xs whitespace-nowrap">{tx.date}</td>
                    <td className="p-2 text-white text-xs max-w-[120px] truncate" title={tx.description}>
                      {tx.description}
                    </td>
                    <td className="p-2 text-right text-amber-400 text-xs whitespace-nowrap">
                      ${tx.amount.toFixed(2)}
                    </td>
                    <td className="p-2">
                      <select
                        value={tx.suggestedCategoryId || ''}
                        onChange={(e) => handleCategoryChange(idx, e.target.value)}
                        className={`bg-zinc-700 p-1 rounded text-xs w-full ${
                          tx.confidence === 'high' ? 'border-l-2 border-green-500' : ''
                        }`}
                      >
                        <option value="">Uncategorized</option>
                        {expenseCategories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-zinc-500 flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-green-500 rounded-sm"></span>
            <span>Auto-categorized</span>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
            <Button onClick={handleClose} variant="secondary">Cancel</Button>
            <Button onClick={handleImport} disabled={isImporting || editedTransactions.length === 0}>
              {isImporting ? 'Importing...' : `Import ${editedTransactions.length} Transactions`}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default BankStatementImportModal;
