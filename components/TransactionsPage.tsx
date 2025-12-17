
import React, { useState, useMemo, useRef } from 'react';
import { Transaction, Category, TransactionType } from '../types';
import TransactionsGrid from './TransactionsGrid';
import Button from './ui/Button';
import { exportToCsv } from '../utils';
import { Frequency } from './RecurringTransactionModal';
import CSVImportModal from './CSVImportModal';

// Helper to format date as YYYY-MM-DD
const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

// Preset definitions
const datePresets = [
    {
        label: 'Last 7 Days',
        getRange: (today: Date) => {
            const start = new Date(today);
            start.setDate(start.getDate() - 7);
            return { startDate: formatDate(start), endDate: formatDate(today) };
        }
    },
    {
        label: 'Last 14 Days',
        getRange: (today: Date) => {
            const start = new Date(today);
            start.setDate(start.getDate() - 14);
            return { startDate: formatDate(start), endDate: formatDate(today) };
        }
    },
    {
        label: 'Last 30 Days',
        getRange: (today: Date) => {
            const start = new Date(today);
            start.setDate(start.getDate() - 30);
            return { startDate: formatDate(start), endDate: formatDate(today) };
        }
    },
    {
        label: 'Month to Date',
        getRange: (today: Date) => {
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            return { startDate: formatDate(start), endDate: formatDate(today) };
        }
    },
    {
        label: 'Last Month',
        getRange: (today: Date) => {
            const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const end = new Date(today.getFullYear(), today.getMonth(), 0);
            return { startDate: formatDate(start), endDate: formatDate(end) };
        }
    },
    {
        label: 'This Quarter',
        getRange: (today: Date) => {
            const quarter = Math.floor(today.getMonth() / 3);
            const start = new Date(today.getFullYear(), quarter * 3, 1);
            const end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
            return { startDate: formatDate(start), endDate: formatDate(end) };
        }
    },
    {
        label: 'Last Quarter',
        getRange: (today: Date) => {
            const quarter = Math.floor(today.getMonth() / 3);
            let start, end;
            if (quarter === 0) { // Q1 -> prev year Q4
                start = new Date(today.getFullYear() - 1, 9, 1);
                end = new Date(today.getFullYear() - 1, 11, 31);
            } else { // Q2, Q3, Q4 -> prev quarter of same year
                start = new Date(today.getFullYear(), (quarter - 1) * 3, 1);
                end = new Date(today.getFullYear(), quarter * 3, 0);
            }
            return { startDate: formatDate(start), endDate: formatDate(end) };
        }
    },
    {
        label: 'Year to Date',
        getRange: (today: Date) => {
            const start = new Date(today.getFullYear(), 0, 1);
            return { startDate: formatDate(start), endDate: formatDate(today) };
        }
    },
     {
        label: 'This Year',
        getRange: (today: Date) => {
            const start = new Date(today.getFullYear(), 0, 1);
            const end = new Date(today.getFullYear(), 11, 31);
            return { startDate: formatDate(start), endDate: formatDate(end) };
        }
    }
];

const today = new Date().toISOString().slice(0, 10);

interface TransactionsPageProps {
  transactions: Transaction[];
  categories: Category[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => Promise<unknown>;
  onImportTransactions: (txs: Omit<Transaction, 'id'>[]) => Promise<void>;
  onUpdateTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onAddRecurringTransactions: (baseTx: Omit<Transaction, 'id'>, frequency: Frequency, endDate: string) => void;
  onUpdateTransactionSeries: (recurringId: string, updates: Partial<Omit<Transaction, 'id' | 'date' | 'recurring_id'>>) => void;
  onManageRecurringSeries: (recurringId: string) => void;
}

const TransactionsPage: React.FC<TransactionsPageProps> = ({ 
  transactions, 
  categories, 
  onAddTransaction,
  onImportTransactions,
  onUpdateTransaction, 
  onDeleteTransaction,
  onAddRecurringTransactions,
  onUpdateTransactionSeries,
  onManageRecurringSeries
}) => {
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return formatDate(startOfMonth);
  });
  const [endDate, setEndDate] = useState(today);
  const todayDate = useMemo(() => new Date(), []);
  
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction | null; direction: 'ascending' | 'descending' }>({ key: 'date', direction: 'descending' });
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const filteredTransactions = useMemo(() => {
    // Fix: Explicitly type `categoryMap` to prevent `get` from returning `unknown`.
    const categoryMap = new Map<string, string>(categories.map(c => [c.id, c.name]));

    let sortableItems = transactions
      .filter(tx => tx.date >= startDate && tx.date <= endDate);

    if (typeFilter !== 'all') {
      sortableItems = sortableItems.filter(tx => tx.type === typeFilter);
    }
    
    if (categoryFilter !== 'all') {
      sortableItems = sortableItems.filter(tx => tx.category_id === categoryFilter);
    }

    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        sortableItems = sortableItems.filter(tx =>
          tx.name.toLowerCase().includes(lowercasedQuery) ||
          tx.notes.toLowerCase().includes(lowercasedQuery) ||
          (categoryMap.get(tx.category_id || '')?.toLowerCase() || '').includes(lowercasedQuery)
        );
    }

    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
          let aValue: string | number | null | undefined;
          let bValue: string | number | null | undefined;

          if (sortConfig.key === 'category_id') {
              aValue = categoryMap.get(a.category_id!) || 'Uncategorized';
              bValue = categoryMap.get(b.category_id!) || 'Uncategorized';
          } else {
              aValue = a[sortConfig.key!];
              bValue = b[sortConfig.key!];
          }

          if (aValue === null || aValue === undefined) return 1;
          if (bValue === null || bValue === undefined) return -1;
          
          if (aValue < bValue) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        });
    }

    return sortableItems;
  }, [transactions, startDate, endDate, categoryFilter, typeFilter, searchQuery, sortConfig, categories]);
  
  const requestSort = (key: keyof Transaction) => {
      let direction: 'ascending' | 'descending' = 'ascending';
      if (sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
      }
      setSortConfig({ key, direction });
  };
  
  const handleExport = () => {
    exportToCsv(filteredTransactions, categories, `report-${startDate}-to-${endDate}`);
  };

  const handleImportClick = () => {
      setIsImportModalOpen(true);
  };

  // Legacy file change handler (kept for backwards compatibility)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          const text = event.target?.result as string;
          if (!text) return;
          
          try {
              const lines = text.split('\n');
              // Remove header if present
              const header = lines[0].toLowerCase();
              const startIdx = header.includes('date') && header.includes('amount') ? 1 : 0;
              
              const parsedTxs: Omit<Transaction, 'id'>[] = [];
              const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));

              for (let i = startIdx; i < lines.length; i++) {
                  const line = lines[i].trim();
                  if (!line) continue;
                  
                  // Simple CSV split (handles basic commas, not complex quotes, for simplicity in this rescue attempt)
                  // Ideally use a library, but minimal impl here:
                  // Handles "quoted string" by simple regex match or split
                  const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                  // Fallback to simple split if regex fails or matches is weird
                  const cols = matches || line.split(','); 
                  
                  // Clean quotes
                  const cleanCols = cols.map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
                  
                  // Expect: Date, Name, Type, Amount, Category, Notes ...
                  if (cleanCols.length < 4) continue;

                  const date = cleanCols[0];
                  const name = cleanCols[1];
                  const type = cleanCols[2].toLowerCase() as TransactionType;
                  const amount = parseFloat(cleanCols[3]);
                  const catName = cleanCols[4]?.toLowerCase();
                  const notes = cleanCols[5] || '';

                  if (!date || isNaN(amount)) continue;

                  parsedTxs.push({
                      date,
                      name,
                      type: (type === 'income' || type === 'expense') ? type : 'expense',
                      amount,
                      category_id: categoryMap.get(catName) || null,
                      notes
                  });
              }
              
              await onImportTransactions(parsedTxs);
              if (fileInputRef.current) fileInputRef.current.value = '';

          } catch (err) {
              console.error("Import failed", err);
              alert("Failed to parse CSV.");
          }
      };
      reader.readAsText(file);
  };

  return (
    <div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".csv" 
        className="hidden" 
      />
      <div className="p-4 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-zinc-950/80 backdrop-blur-sm sticky top-[65px] lg:top-0 z-10 border-b border-zinc-800">
        <div className="hidden lg:block">
            <h2 className="text-3xl font-bold text-white">Transactions</h2>
            <p className="text-zinc-400 mt-1">View and manage your financial records.</p>
        </div>
        <div className="flex flex-col w-full lg:w-auto items-stretch gap-2 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label htmlFor="start-date" className="text-sm font-medium text-zinc-400">From</label>
                    <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-zinc-800 flex-grow p-2 rounded-md border-zinc-700 focus:ring-sky-500 focus:border-sky-500" />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label htmlFor="end-date" className="text-sm font-medium text-zinc-400">To</label>
                    <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-zinc-800 flex-grow p-2 rounded-md border-zinc-700 focus:ring-sky-500 focus:border-sky-500" />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button onClick={handleImportClick} variant="secondary" className="flex-1">Import CSV</Button>
                    <Button onClick={handleExport} variant="secondary" className="flex-1">Export</Button>
                </div>
            </div>
             <div className="flex flex-wrap items-center justify-start gap-2 border-t border-zinc-800 pt-2">
                 {datePresets.map(preset => (
                    <Button 
                        key={preset.label}
                        onClick={() => {
                            const { startDate: newStart, endDate: newEnd } = preset.getRange(todayDate);
                            setStartDate(newStart);
                            setEndDate(newEnd);
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-xs px-2 py-1"
                    >
                        {preset.label}
                    </Button>
                ))}
            </div>
        </div>
      </div>
      <div className="p-4 md:px-8 flex flex-col md:flex-row items-stretch gap-4 border-b border-zinc-800">
        <div className="relative flex-grow">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input 
              type="search"
              placeholder="Search name, notes, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1 gap-1">
            <Button onClick={() => setTypeFilter('all')} variant={typeFilter === 'all' ? 'secondary' : 'ghost'} size="sm" className="!py-1.5 flex-1 md:flex-none">All</Button>
            <Button onClick={() => setTypeFilter('income')} variant={typeFilter === 'income' ? 'secondary' : 'ghost'} size="sm" className="!py-1.5 flex-1 md:flex-none !text-green-400">Income</Button>
            <Button onClick={() => setTypeFilter('expense')} variant={typeFilter === 'expense' ? 'secondary' : 'ghost'} size="sm" className="!py-1.5 flex-1 md:flex-none !text-amber-400">Expense</Button>
        </div>
        <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-300 focus:ring-sky-500 focus:border-sky-500"
        >
            <option value="all">All Categories</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>
      <TransactionsGrid
        transactions={filteredTransactions}
        categories={categories}
        onAddTransaction={onAddTransaction}
        onUpdateTransaction={onUpdateTransaction}
        onDeleteTransaction={onDeleteTransaction}
        onAddRecurringTransactions={onAddRecurringTransactions}
        onUpdateTransactionSeries={onUpdateTransactionSeries}
        onManageRecurringSeries={onManageRecurringSeries}
        requestSort={requestSort}
        sortConfig={sortConfig}
      />

      <CSVImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        categories={categories}
        onImport={onImportTransactions}
      />
    </div>
  );
};

export default TransactionsPage;
