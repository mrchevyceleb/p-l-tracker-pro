
import React, { useMemo, useState } from 'react';
import { Transaction, Category } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import { formatCurrency } from '../utils';

interface SubscriptionsPageProps {
  transactions: Transaction[];
  categories: Category[];
  onManageSeries: (seriesId: string) => void;
  onDeleteSeries: (seriesId: string) => void;
}

interface SubscriptionItem {
  id: string; // recurring_id
  name: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string | null;
  firstDate: string;
  lastDate: string;
  nextDate: string | null;
  status: 'Active' | 'Ended';
  frequency: string;
  transactionsCount: number;
  totalYtd: number;
}

const SubscriptionsPage: React.FC<SubscriptionsPageProps> = ({ 
  transactions, 
  categories, 
  onManageSeries,
  onDeleteSeries 
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('active');

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);
  const today = new Date();

  const subscriptions = useMemo(() => {
    const subs: Record<string, Transaction[]> = {};
    
    // Group by recurring_id
    transactions.forEach(tx => {
        if(tx.recurring_id) {
            if(!subs[tx.recurring_id]) subs[tx.recurring_id] = [];
            subs[tx.recurring_id].push(tx);
        }
    });

    const currentYear = today.getFullYear();

    return Object.entries(subs).map(([id, txs]) => {
        // Sort by date
        txs.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const first = txs[0];
        const last = txs[txs.length - 1];
        
        // Find next payment date (first one strictly after today, or today)
        // Actually, logic: if last date is in future, next date is the first one >= today
        const nextTx = txs.find(t => new Date(t.date) >= new Date(today.setHours(0,0,0,0)));
        const nextDate = nextTx ? nextTx.date : null;

        const isActive = new Date(last.date) >= new Date(today.setHours(0,0,0,0));
        
        // Infer Frequency
        let frequency = 'Monthly';
        if (txs.length >= 2) {
            // Check diff between first two or last two
            const t1 = new Date(txs[0].date);
            const t2 = new Date(txs[1].date);
            const diffDays = Math.round(Math.abs(t2.getTime() - t1.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays >= 360) frequency = 'Yearly';
            else if (diffDays <= 7) frequency = 'Weekly';
            else frequency = 'Monthly';
        }

        // Calculate YTD
        const totalYtd = txs
            .filter(t => new Date(t.date).getFullYear() === currentYear && new Date(t.date) <= today)
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            id,
            name: first.name,
            amount: first.amount,
            type: first.type,
            categoryId: first.category_id,
            firstDate: first.date,
            lastDate: last.date,
            nextDate,
            status: isActive ? 'Active' : 'Ended',
            frequency,
            transactionsCount: txs.length,
            totalYtd
        } as SubscriptionItem;
    }).sort((a, b) => {
        // Active first, then by next date
        if (a.status !== b.status) return a.status === 'Active' ? -1 : 1;
        if (a.nextDate && b.nextDate) return a.nextDate.localeCompare(b.nextDate);
        return 0;
    });
  }, [transactions, categoryMap]);

  const filteredSubscriptions = useMemo(() => {
      if (filter === 'all') return subscriptions;
      return subscriptions.filter(s => s.status === (filter === 'active' ? 'Active' : 'Ended'));
  }, [subscriptions, filter]);

  const activeMonthlyExpenses = useMemo(() => {
      return subscriptions
        .filter(s => s.status === 'Active' && s.type === 'expense')
        .reduce((sum, s) => {
            let monthlyAmount = s.amount;
            if (s.frequency === 'Weekly') monthlyAmount = s.amount * 4;
            if (s.frequency === 'Yearly') monthlyAmount = s.amount / 12;
            return sum + monthlyAmount;
        }, 0);
  }, [subscriptions]);

  const activeCount = subscriptions.filter(s => s.status === 'Active').length;

  return (
    <div className="p-4 md:p-8 space-y-6">
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold text-white">Subscriptions</h2>
            <p className="text-zinc-400 mt-1">Manage your recurring revenue and expenses.</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
             <Button onClick={() => setFilter('active')} variant={filter === 'active' ? 'secondary' : 'ghost'} size="sm">Active</Button>
             <Button onClick={() => setFilter('ended')} variant={filter === 'ended' ? 'secondary' : 'ghost'} size="sm">Ended</Button>
             <Button onClick={() => setFilter('all')} variant={filter === 'all' ? 'secondary' : 'ghost'} size="sm">All</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800">
              <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Active Subscriptions</h3>
              <p className="text-4xl font-black mt-2 text-white">{activeCount}</p>
          </Card>
          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800">
              <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Est. Monthly Cost</h3>
              <p className="text-4xl font-black mt-2 text-amber-400">{formatCurrency(activeMonthlyExpenses)}</p>
              <p className="text-xs text-zinc-500 mt-2">Normalized recurring expenses</p>
          </Card>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left responsive-table">
            <thead className="bg-zinc-950/50">
              <tr>
                <th className="p-4 font-semibold text-sm uppercase text-zinc-400">Name / Frequency</th>
                <th className="p-4 font-semibold text-sm uppercase text-zinc-400">Category</th>
                <th className="p-4 font-semibold text-sm uppercase text-zinc-400 text-right">Amount</th>
                <th className="p-4 font-semibold text-sm uppercase text-zinc-400">Next Due</th>
                <th className="p-4 font-semibold text-sm uppercase text-zinc-400">End Date</th>
                <th className="p-4 font-semibold text-sm uppercase text-zinc-400">Status</th>
                <th className="p-4 font-semibold text-sm uppercase text-zinc-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredSubscriptions.length === 0 ? (
                  <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-500">
                          No {filter === 'active' ? 'active' : ''} subscriptions found.
                      </td>
                  </tr>
              ) : (
                filteredSubscriptions.map(sub => (
                    <tr key={sub.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4" data-label="Name">
                        <div className="font-bold text-white">{sub.name}</div>
                        <div className="text-xs text-zinc-500">{sub.frequency} • {sub.type}</div>
                    </td>
                    <td className="p-4" data-label="Category">
                        <span className="text-zinc-300">{categoryMap.get(sub.categoryId || '') || 'Uncategorized'}</span>
                    </td>
                    <td className="p-4 text-right" data-label="Amount">
                        <div className={`font-mono font-bold ${sub.type === 'income' ? 'text-green-400' : 'text-white'}`}>
                            {formatCurrency(sub.amount)}
                        </div>
                        <div className="text-xs text-zinc-500">
                            YTD: {formatCurrency(sub.totalYtd)}
                        </div>
                    </td>
                    <td className="p-4 text-zinc-300" data-label="Next Due">
                        {sub.nextDate ? (
                            <span className={new Date(sub.nextDate) <= new Date() ? 'text-amber-400 font-bold' : ''}>
                                {sub.nextDate}
                            </span>
                        ) : '-'}
                    </td>
                    <td className="p-4 text-zinc-400" data-label="End Date">
                        {sub.lastDate}
                    </td>
                    <td className="p-4" data-label="Status">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            sub.status === 'Active' 
                            ? 'bg-green-900/50 text-green-300 border border-green-800' 
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}>
                            {sub.status}
                        </span>
                    </td>
                    <td className="p-4 text-right" data-label="Actions">
                        <div className="flex items-center justify-end gap-2">
                             <Button onClick={() => onManageSeries(sub.id)} variant="secondary" size="sm">
                                Manage
                            </Button>
                            <button 
                                onClick={() => onDeleteSeries(sub.id)}
                                className="text-zinc-500 hover:text-red-400 p-2 transition-colors"
                                title="Delete History"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default SubscriptionsPage;
