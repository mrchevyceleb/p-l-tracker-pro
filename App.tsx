
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, Category, TaxConfig } from './types';
import { supabase } from './utils/supabase';
import { Session } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import DashboardPage from './components/Dashboard';
import TransactionsPage from './components/TransactionsPage';
import CategoryManager from './components/CategoryManager';
import Header from './components/Header';
import { Frequency } from './components/RecurringTransactionModal';
import { useLocalStorage } from './hooks/useLocalStorage';
import TaxSettingsModal from './components/TaxSettingsModal';
import TaxesPage from './components/TaxesPage';
import ReportsPage from './components/ReportsPage';
import AddTransactionModal from './components/AddTransactionModal';
import RecurringSeriesManagerModal from './components/RecurringSeriesManagerModal';
import SubscriptionsPage from './components/SubscriptionsPage';
import ConfirmationModal from './components/ui/ConfirmationModal';
import DeleteRecurringTransactionModal from './components/DeleteRecurringTransactionModal';
import DeleteSubscriptionModal from './components/DeleteSubscriptionModal';
import { DEFAULT_TAX_CONFIG, SEED_CATEGORIES } from './constants';
import { calculateTax } from './utils/tax';
import Auth from './components/Auth';

export type View = 'dashboard' | 'transactions' | 'reports' | 'taxes' | 'subscriptions';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [view, setView] = useState<View>('dashboard');
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isTaxSettingsOpen, setIsTaxSettingsOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  
  // Recurring Series Management
  const [managingSeriesId, setManagingSeriesId] = useState<string | null>(null);

  // Deletion Modal States
  const [deleteSeriesCandidateId, setDeleteSeriesCandidateId] = useState<string | null>(null);
  const [deleteRecurringTxCandidate, setDeleteRecurringTxCandidate] = useState<Transaction | null>(null);
  
  // Update to use TaxConfig object
  const [taxConfig, setTaxConfig] = useLocalStorage<TaxConfig>('taxConfig', DEFAULT_TAX_CONFIG);
  
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Auth Handling
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      if (!session) return;
      
      setLoading(true);
      
      // 1. Fetch Categories for this user
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', session.user.id) 
        .order('name');
      
      if (categoriesError) {
          console.error('Error fetching categories:', categoriesError.message);
      }

      let finalCategories: Category[] = [];

      // 2. Handle Seeding if New User (No categories found)
      if (categoriesData && categoriesData.length === 0) {
          // Prepare seed data with the current user_id
          const seedPayload = SEED_CATEGORIES.map((cat) => ({
              name: cat.name,
              type: cat.type,
              deductibility_percentage: cat.deductibility_percentage,
              user_id: session.user.id
          }));
          
          const { data: seededCategories, error: seedError } = await supabase
              .from('categories')
              .insert(seedPayload)
              .select();
              
          if (!seedError && seededCategories) {
              finalCategories = seededCategories;
          } else {
              console.error("Error seeding categories:", seedError?.message);
              finalCategories = []; 
          }
      } else if (categoriesData) {
          finalCategories = categoriesData;
      }

      setCategories(finalCategories);
      
      // 3. Fetch ALL Transactions using pagination (Supabase caps at 1000 per request)
      let allTransactions: Transaction[] = [];
      let hasMore = true;
      let page = 0;
      const pageSize = 1000;

      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', session.user.id)
          .order('date', { ascending: false })
          .range(from, to);

        if (transactionsError) {
          console.error('Error fetching transactions:', transactionsError.message);
          break;
        }

        if (transactionsData && transactionsData.length > 0) {
          allTransactions = [...allTransactions, ...transactionsData];
          hasMore = transactionsData.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      console.log(`Loaded ${allTransactions.length} total transactions via pagination`);
      setTransactions(allTransactions);
      
      setLoading(false);
    };

    fetchData();
  }, [session]);

  // --- Handlers ---

  const handleAddTransaction = async (tx: Omit<Transaction, 'id'>): Promise<unknown> => {
      if (!session) return;

      const payload = { ...tx, user_id: session.user.id };
      const { data, error } = await supabase.from('transactions').insert(payload).select().single();
      
      if (error) {
          console.error("Error adding transaction:", error.message);
          return null;
      }
      
      if (data) {
          setTransactions(prev => [data, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          return data;
      }
  };

  const handleImportTransactions = async (newTransactions: Omit<Transaction, 'id'>[]) => {
      if (!session) return;
      if (newTransactions.length === 0) return;

      const payloads = newTransactions.map(tx => ({
          ...tx,
          user_id: session.user.id
      }));

      const { data, error } = await supabase.from('transactions').insert(payloads).select();

      if (error) {
          console.error("Error importing transactions:", error.message);
          alert("Failed to import transactions. Please check your file format.");
          return;
      }

      if (data) {
          setTransactions(prev => [...data, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          alert(`Successfully imported ${data.length} transactions.`);
      }
  };

  const handleUpdateTransaction = async (updatedTx: Transaction) => {
    // Optimistic Update
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    const { error } = await supabase
        .from('transactions')
        .update({
            date: updatedTx.date,
            name: updatedTx.name,
            type: updatedTx.type,
            amount: updatedTx.amount,
            category_id: updatedTx.category_id,
            notes: updatedTx.notes,
            recurring_id: updatedTx.recurring_id
        })
        .eq('id', updatedTx.id);

    if (error) {
        console.error("Error updating transaction:", error.message);
        // Revert if needed (omitted for brevity)
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    // Check if it's recurring
    const tx = transactions.find(t => t.id === id);
    if (tx?.recurring_id) {
        setDeleteRecurringTxCandidate(tx);
        return;
    }
    
    // Proceed with normal delete
    await performDeleteTransaction(id);
  };

  const performDeleteTransaction = async (id: string) => {
      setTransactions(prev => prev.filter(t => t.id !== id));
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) {
          console.error("Error deleting transaction:", error.message);
      }
  };
  
  const handleDeleteTransactionSeries = async () => {
      if (!deleteRecurringTxCandidate?.recurring_id) return;
      const recId = deleteRecurringTxCandidate.recurring_id;

      setTransactions(prev => prev.filter(t => t.recurring_id !== recId));
      setDeleteRecurringTxCandidate(null);

      const { error } = await supabase.from('transactions').delete().eq('recurring_id', recId);
      if (error) {
           console.error("Error deleting series:", error.message);
      }
  };

  // --- Recurring Logic ---

  const handleAddRecurringTransactions = async (baseTx: Omit<Transaction, 'id'>, frequency: Frequency, endDate: string) => {
    if (!session) return;
    
    const recurringId = uuidv4();
    const newTransactions: any[] = [];
    const start = new Date(baseTx.date);
    const end = new Date(endDate);
    
    let current = new Date(start);
    
    while (current <= end) {
      newTransactions.push({
        ...baseTx,
        user_id: session.user.id, // Ensure user_id is attached
        date: current.toISOString().slice(0, 10),
        recurring_id: recurringId
      });
      
      if (frequency === 'weekly') {
        current.setDate(current.getDate() + 7);
      } else if (frequency === 'monthly') {
        current.setMonth(current.getMonth() + 1);
      } else if (frequency === 'yearly') {
        current.setFullYear(current.getFullYear() + 1);
      }
    }
    
    // Bulk insert
    const { data, error } = await supabase.from('transactions').insert(newTransactions).select();
    
    if (error) {
        console.error("Error creating recurring series:", error.message);
        return;
    }

    if (data) {
        setTransactions(prev => [...data, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
  };
  
  const handleUpdateTransactionSeries = async (recurringId: string, updates: Partial<Omit<Transaction, 'id' | 'date' | 'recurring_id'>>) => {
      // Optimistic Update
      setTransactions(prev => prev.map(t => {
          if (t.recurring_id === recurringId) {
              return { ...t, ...updates };
          }
          return t;
      }));

      const { error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('recurring_id', recurringId);
        
      if (error) console.error("Error updating series:", error.message);
  };
  
  const handleUpdateEndDate = async (recurringId: string, newEndDate: string) => {
      // 1. Delete future transactions that are now out of bounds
      const deadLine = new Date(newEndDate);
      
      // Determine existing transactions in the series
      const seriesTxs = transactions.filter(t => t.recurring_id === recurringId);
      const toDeleteIds = seriesTxs.filter(t => new Date(t.date) > deadLine).map(t => t.id);
      
      // Update Local State (Delete)
      if (toDeleteIds.length > 0) {
        setTransactions(prev => prev.filter(t => !toDeleteIds.includes(t.id)));
        await supabase.from('transactions').delete().in('id', toDeleteIds);
      }

      // 2. Extend if needed (Add new transactions)
      // Find the last transaction that is <= newEndDate
      const validTxs = seriesTxs.filter(t => new Date(t.date) <= deadLine).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      if (validTxs.length > 0) {
          const lastTx = validTxs[validTxs.length - 1];
          let current = new Date(lastTx.date);
          
          let intervalDays = 30; // Default
          if (validTxs.length >= 2) {
              const t1 = new Date(validTxs[validTxs.length - 2].date);
              const t2 = new Date(validTxs[validTxs.length - 1].date);
              intervalDays = Math.round((t2.getTime() - t1.getTime()) / (1000 * 3600 * 24));
          }
          
           if (intervalDays < 7) intervalDays = 7; // Min clamp
           
           current.setDate(current.getDate() + intervalDays); // Start from next slot
           
           const newPayloads = [];
           while (current <= deadLine) {
               newPayloads.push({
                   user_id: session?.user.id,
                   date: current.toISOString().slice(0, 10),
                   name: lastTx.name,
                   type: lastTx.type,
                   amount: lastTx.amount,
                   category_id: lastTx.category_id,
                   notes: lastTx.notes,
                   recurring_id: recurringId
               });
               current.setDate(current.getDate() + intervalDays);
           }
           
           if (newPayloads.length > 0) {
               const { data, error } = await supabase.from('transactions').insert(newPayloads).select();
               if (!error && data) {
                    setTransactions(prev => [...data, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
               }
           }
      }
  };

  // --- Categories ---
  const handleAddCategory = async (category: Omit<Category, 'id'>) => {
      if (!session) return;
      
      const payload = { ...category, user_id: session.user.id };
      const { data, error } = await supabase.from('categories').insert(payload).select().single();
      
      if (error) console.error("Error adding category:", error.message);
      if (data) setCategories(prev => [...prev, data]);
  };
  
  const handleUpdateCategory = async (category: Category) => {
      setCategories(prev => prev.map(c => c.id === category.id ? category : c));
      await supabase.from('categories').update({ name: category.name, type: category.type, deductibility_percentage: category.deductibility_percentage }).eq('id', category.id);
  };
  
  const handleDeleteCategory = async (id: string) => {
      setCategories(prev => prev.filter(c => c.id !== id));
      await supabase.from('categories').delete().eq('id', id);
  };

  const handleOpenRecurringManager = (seriesId: string) => {
      setManagingSeriesId(seriesId);
  };

  const handleDeleteSeries = (seriesId: string) => {
      setDeleteSeriesCandidateId(seriesId);
  };
  
  const confirmDeleteSeries = async () => {
      if (!deleteSeriesCandidateId) return;
      setTransactions(prev => prev.filter(t => t.recurring_id !== deleteSeriesCandidateId));
      await supabase.from('transactions').delete().eq('recurring_id', deleteSeriesCandidateId);
      setDeleteSeriesCandidateId(null);
  };

  const handleEndSubscription = async () => {
      if (!deleteSeriesCandidateId) return;

      // Get today's date to use as cutoff
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().slice(0, 10);

      // Find all future transactions in this series and delete them
      const seriesTxs = transactions.filter(t => t.recurring_id === deleteSeriesCandidateId);
      const toDeleteIds = seriesTxs.filter(t => new Date(t.date) > today).map(t => t.id);

      // Update local state - remove only future transactions
      if (toDeleteIds.length > 0) {
          setTransactions(prev => prev.filter(t => !toDeleteIds.includes(t.id)));
          await supabase.from('transactions').delete().in('id', toDeleteIds);
      }

      setDeleteSeriesCandidateId(null);
  };
  
  // RENDER LOADING / AUTH
  if (authLoading) {
      return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Loading...</div>;
  }

  if (!session) {
      return <Auth />;
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-200 font-sans overflow-hidden">
      <Sidebar 
        view={view} 
        setView={setView} 
        onManageCategories={() => setIsCategoryManagerOpen(true)} 
        onManageTaxes={() => setIsTaxSettingsOpen(true)}
        onQuickAdd={() => setIsQuickAddOpen(true)}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header for Mobile and Desktop when sidebar is closed */}
        <Header onToggleSidebar={() => setIsSidebarOpen(true)} title={view} isSidebarOpen={isSidebarOpen} />

        <div className="flex-1 overflow-auto">
            {view === 'dashboard' && (
            <DashboardPage 
                transactions={transactions} 
                categories={categories} 
                taxRate={taxConfig.mode === 'simple' ? taxConfig.simpleRate : calculateTax(transactions, categories, taxConfig).effectiveRate} 
                onOpenTaxSettings={() => setIsTaxSettingsOpen(true)}
            />
            )}
            
            {view === 'transactions' && (
            <TransactionsPage 
                transactions={transactions} 
                categories={categories}
                onAddTransaction={handleAddTransaction}
                onImportTransactions={handleImportTransactions}
                onUpdateTransaction={handleUpdateTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onAddRecurringTransactions={handleAddRecurringTransactions}
                onUpdateTransactionSeries={handleUpdateTransactionSeries}
                onManageRecurringSeries={handleOpenRecurringManager}
            />
            )}
            
            {view === 'reports' && (
            <ReportsPage transactions={transactions} categories={categories} />
            )}

            {view === 'taxes' && (
            <TaxesPage transactions={transactions} categories={categories} config={taxConfig} />
            )}
            
            {view === 'subscriptions' && (
            <SubscriptionsPage
                transactions={transactions}
                categories={categories}
                onManageSeries={handleOpenRecurringManager}
                onDeleteSeries={handleDeleteSeries}
                onAddTransaction={handleAddTransaction}
                onAddRecurringTransaction={handleAddRecurringTransactions}
            />
            )}
        </div>
      </main>

      {/* Modals */}
      <CategoryManager 
        isOpen={isCategoryManagerOpen} 
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <TaxSettingsModal 
        isOpen={isTaxSettingsOpen}
        onClose={() => setIsTaxSettingsOpen(false)}
        config={taxConfig}
        onSave={(newConfig) => setTaxConfig(newConfig)}
      />
      
      <AddTransactionModal 
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        categories={categories}
        onAddTransaction={handleAddTransaction}
        onAddRecurringTransaction={handleAddRecurringTransactions}
      />

      <RecurringSeriesManagerModal 
        isOpen={!!managingSeriesId}
        onClose={() => setManagingSeriesId(null)}
        seriesId={managingSeriesId}
        transactions={transactions}
        categories={categories}
        onUpdateEndDate={handleUpdateEndDate}
        onUpdateSeries={handleUpdateTransactionSeries}
      />
      
      <DeleteRecurringTransactionModal
        isOpen={!!deleteRecurringTxCandidate}
        onClose={() => setDeleteRecurringTxCandidate(null)}
        onDeleteSingle={() => {
            if (deleteRecurringTxCandidate) performDeleteTransaction(deleteRecurringTxCandidate.id);
            setDeleteRecurringTxCandidate(null);
        }}
        onDeleteSeries={handleDeleteTransactionSeries}
      />
      
      <DeleteSubscriptionModal
        isOpen={!!deleteSeriesCandidateId}
        onClose={() => setDeleteSeriesCandidateId(null)}
        onEndSubscription={handleEndSubscription}
        onDeleteAll={confirmDeleteSeries}
        subscriptionName={transactions.find(t => t.recurring_id === deleteSeriesCandidateId)?.name}
      />

    </div>
  );
};

export default App;
