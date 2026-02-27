import React, { useState, useRef } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Category, TransactionType } from '../types';

interface CSVImportModalProps {
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

interface ParsedRow {
  [key: string]: string;
}

interface MappedTransaction {
  date: string;
  name: string;
  amount: number;
  type: TransactionType;
  category_id: string | null;
  isValid: boolean;
}

const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen, onClose, categories, onImport
}) => {
  const [step, setStep] = useState<'upload' | 'map' | 'preview'>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mapping state
  const [dateColumn, setDateColumn] = useState<string>('');
  const [nameColumn, setNameColumn] = useState<string>('');
  const [amountColumn, setAmountColumn] = useState<string>('');
  const [typeMode, setTypeMode] = useState<'all_income' | 'all_expense' | 'column'>('all_income');
  const [typeColumn, setTypeColumn] = useState<string>('');
  const [defaultCategory, setDefaultCategory] = useState<string>('');

  const inputStyles = "bg-zinc-800 w-full p-2 rounded-md border border-zinc-700 focus:ring-1 focus:ring-sky-500 focus:outline-none text-white text-sm";

  // Parse CSV line handling quotes and commas
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        alert('Could not read file');
        return;
      }

      const lines = text.split(/\r?\n/).filter(line => line.trim());
      if (lines.length < 2) {
        alert('File must have a header row and at least one data row');
        return;
      }

      const headerRow = parseCSVLine(lines[0]);
      setHeaders(headerRow);

      const dataRows: ParsedRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row: ParsedRow = {};
        headerRow.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });
        dataRows.push(row);
      }
      setRows(dataRows);

      // Auto-detect columns
      const lowerHeaders = headerRow.map(h => h.toLowerCase());

      // Date column detection
      const dateIdx = lowerHeaders.findIndex(h =>
        h.includes('date') || h.includes('time') || h === 'created'
      );
      if (dateIdx >= 0) setDateColumn(headerRow[dateIdx]);

      // Name/Description column detection
      const nameIdx = lowerHeaders.findIndex(h =>
        h.includes('description') || h.includes('name') || h.includes('memo') || h.includes('seller')
      );
      if (nameIdx >= 0) setNameColumn(headerRow[nameIdx]);

      // Amount column detection
      const amountIdx = lowerHeaders.findIndex(h =>
        h === 'amount' || h.includes('amount') || h.includes('total') || h.includes('sum')
      );
      if (amountIdx >= 0) setAmountColumn(headerRow[amountIdx]);

      setStep('map');
    };
    reader.readAsText(file);
  };

  // Parse date from various formats
  const parseDate = (dateStr: string): string | null => {
    if (!dateStr) return null;

    // Try ISO format first: 2025-12-16 or 2025-12-16 13:35:52
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }

    // Try MM/DD/YYYY
    const usMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (usMatch) {
      return `${usMatch[3]}-${usMatch[1].padStart(2, '0')}-${usMatch[2].padStart(2, '0')}`;
    }

    // Try DD/MM/YYYY (less common in US)
    const euMatch = dateStr.match(/^(\d{1,2})[-.](\d{1,2})[-.](\d{4})/);
    if (euMatch) {
      return `${euMatch[3]}-${euMatch[2].padStart(2, '0')}-${euMatch[1].padStart(2, '0')}`;
    }

    return null;
  };

  // Parse amount from string
  const parseAmount = (amountStr: string): number | null => {
    if (!amountStr) return null;
    const cleaned = amountStr.replace(/[$,\s]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : Math.abs(num);
  };

  // Get mapped transactions for preview
  const getMappedTransactions = (): MappedTransaction[] => {
    return rows.map(row => {
      const dateStr = row[dateColumn] || '';
      const nameStr = row[nameColumn] || '';
      const amountStr = row[amountColumn] || '';

      const parsedDate = parseDate(dateStr);
      const parsedAmount = parseAmount(amountStr);

      let type: TransactionType = 'income';
      if (typeMode === 'all_expense') {
        type = 'expense';
      } else if (typeMode === 'column' && typeColumn) {
        const typeVal = (row[typeColumn] || '').toLowerCase();
        type = typeVal.includes('expense') || typeVal.includes('debit') ? 'expense' : 'income';
      }

      return {
        date: parsedDate || '',
        name: nameStr,
        amount: parsedAmount || 0,
        type,
        category_id: defaultCategory || null,
        isValid: !!parsedDate && !!parsedAmount && parsedAmount > 0
      };
    });
  };

  const validTransactions = getMappedTransactions().filter(t => t.isValid);

  const handleImport = async () => {
    // Rate limiting: Maximum 10,000 transactions per import
    const MAX_IMPORT_SIZE = 10000;
    
    if (validTransactions.length > MAX_IMPORT_SIZE) {
      alert(`Import limited to ${MAX_IMPORT_SIZE} transactions. Please split your file into smaller chunks.`);
      return;
    }

    // Validate all transactions have required fields
    const invalidTransactions = validTransactions.filter(tx => 
      !tx.date || !tx.amount || tx.amount <= 0
    );
    
    if (invalidTransactions.length > 0) {
      alert(`${invalidTransactions.length} transactions have invalid data and will be skipped.`);
    }

    setIsImporting(true);

    const transactions = validTransactions
      .filter(tx => tx.date && tx.amount > 0)  // Double-check validation
      .map(tx => ({
        date: tx.date,
        name: (tx.name || 'Imported transaction')
          .replace(/<[^>]*>/g, '')  // Basic XSS prevention
          .trim()
          .slice(0, 200),  // Limit description length
        type: tx.type,
        amount: Math.round(tx.amount * 100) / 100,  // Round to 2 decimals
        category_id: tx.category_id,
        notes: 'Imported from CSV'.slice(0, 500)
      }));

    try {
      await onImport(transactions);
      alert(`Successfully imported ${transactions.length} transactions.`);
    } catch (error: any) {
      console.error('Import failed:', error);
      alert('Import failed. Please check the console for details and try again.');
    }

    setIsImporting(false);
    handleClose();
  };

  const handleClose = () => {
    setStep('upload');
    setHeaders([]);
    setRows([]);
    setDateColumn('');
    setNameColumn('');
    setAmountColumn('');
    setTypeMode('all_income');
    setTypeColumn('');
    setDefaultCategory('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import CSV" size="lg">
      {step === 'upload' && (
        <div className="space-y-4">
          <p className="text-zinc-400 text-sm">
            Upload any CSV file. You'll map the columns in the next step.
          </p>
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleFileSelect}
            className={inputStyles + " file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-zinc-700 file:text-white hover:file:bg-zinc-600"}
          />
          <div className="flex justify-end pt-4 border-t border-zinc-800">
            <Button onClick={handleClose} variant="secondary">Cancel</Button>
          </div>
        </div>
      )}

      {step === 'map' && (
        <div className="space-y-4">
          <p className="text-zinc-400 text-sm">
            Map your CSV columns to transaction fields. Found {rows.length} rows.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Date Column *
              </label>
              <select value={dateColumn} onChange={e => setDateColumn(e.target.value)} className={inputStyles}>
                <option value="">Select column...</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Amount Column *
              </label>
              <select value={amountColumn} onChange={e => setAmountColumn(e.target.value)} className={inputStyles}>
                <option value="">Select column...</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Description Column
              </label>
              <select value={nameColumn} onChange={e => setNameColumn(e.target.value)} className={inputStyles}>
                <option value="">Select column...</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Transaction Type
              </label>
              <select value={typeMode} onChange={e => setTypeMode(e.target.value as any)} className={inputStyles}>
                <option value="all_income">All as Income</option>
                <option value="all_expense">All as Expense</option>
                <option value="column">From Column</option>
              </select>
            </div>

            {typeMode === 'column' && (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Type Column
                </label>
                <select value={typeColumn} onChange={e => setTypeColumn(e.target.value)} className={inputStyles}>
                  <option value="">Select column...</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Default Category
              </label>
              <select value={defaultCategory} onChange={e => setDefaultCategory(e.target.value)} className={inputStyles}>
                <option value="">None</option>
                <optgroup label="Income">
                  {incomeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </optgroup>
                <optgroup label="Expense">
                  {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </optgroup>
              </select>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-zinc-800">
            <Button onClick={() => setStep('upload')} variant="ghost">Back</Button>
            <Button
              onClick={() => setStep('preview')}
              disabled={!dateColumn || !amountColumn}
            >
              Preview ({validTransactions.length} valid)
            </Button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-zinc-400 text-sm">
              {validTransactions.length} of {rows.length} rows will be imported
            </p>
          </div>

          <div className="max-h-64 overflow-y-auto border border-zinc-800 rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-zinc-800 sticky top-0">
                <tr>
                  <th className="p-2 text-left text-zinc-400">Date</th>
                  <th className="p-2 text-left text-zinc-400">Description</th>
                  <th className="p-2 text-right text-zinc-400">Amount</th>
                  <th className="p-2 text-left text-zinc-400">Type</th>
                </tr>
              </thead>
              <tbody>
                {validTransactions.slice(0, 50).map((tx, idx) => (
                  <tr key={idx} className="border-t border-zinc-800">
                    <td className="p-2 text-zinc-300 whitespace-nowrap">{tx.date}</td>
                    <td className="p-2 text-white max-w-[150px] truncate" title={tx.name}>
                      {tx.name || '(no description)'}
                    </td>
                    <td className={`p-2 text-right whitespace-nowrap ${tx.type === 'income' ? 'text-green-400' : 'text-amber-400'}`}>
                      ${tx.amount.toFixed(2)}
                    </td>
                    <td className="p-2 text-zinc-400 capitalize">{tx.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {validTransactions.length > 50 && (
            <p className="text-xs text-zinc-500">Showing first 50 of {validTransactions.length} transactions</p>
          )}

          <div className="flex justify-between pt-4 border-t border-zinc-800">
            <Button onClick={() => setStep('map')} variant="ghost">Back</Button>
            <Button onClick={handleImport} disabled={isImporting || validTransactions.length === 0}>
              {isImporting ? 'Importing...' : `Import ${validTransactions.length} Transactions`}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CSVImportModal;
