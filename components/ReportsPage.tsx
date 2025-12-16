import React, { useState, useMemo } from 'react';
import { Transaction, Category } from '../types';
import { formatCurrency } from '../utils';
import Card from './ui/Card';
import Button from './ui/Button';

interface ReportsPageProps {
  transactions: Transaction[];
  categories: Category[];
}

const ReportsPage: React.FC<ReportsPageProps> = ({ transactions, categories }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const pivotData = useMemo(() => {
    // 1. Filter by Year
    const yearTransactions = transactions.filter(tx => {
        const d = new Date(tx.date);
        return d.getFullYear() === selectedYear;
    });

    // 2. Initialize Structure
    // map[categoryId][monthIndex] = amount
    const data: Record<string, number[]> = {};
    const monthlyTotals = {
        income: new Array(12).fill(0),
        expense: new Array(12).fill(0),
        profit: new Array(12).fill(0)
    };

    categories.forEach(cat => {
        data[cat.id] = new Array(12).fill(0);
    });
    // Add a bucket for "Uncategorized" if needed, though we usually enforce categories
    data['uncategorized'] = new Array(12).fill(0);

    // 3. Fill Data
    yearTransactions.forEach(tx => {
        const monthIndex = new Date(tx.date).getUTCMonth(); // 0-11
        const catId = tx.category_id || 'uncategorized';
        
        if (!data[catId]) data[catId] = new Array(12).fill(0);
        data[catId][monthIndex] += tx.amount;

        if (tx.type === 'income') {
            monthlyTotals.income[monthIndex] += tx.amount;
            monthlyTotals.profit[monthIndex] += tx.amount;
        } else {
            monthlyTotals.expense[monthIndex] += tx.amount;
            monthlyTotals.profit[monthIndex] -= tx.amount;
        }
    });

    return { data, monthlyTotals };
  }, [transactions, categories, selectedYear]);

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const renderRow = (label: string, amounts: number[], isTotal = false, isNet = false) => {
    const total = amounts.reduce((a, b) => a + b, 0);
    const textColor = isNet ? (total >= 0 ? 'text-green-400' : 'text-red-400') : (isTotal ? 'text-white' : 'text-zinc-300');
    const weight = isTotal ? 'font-bold' : 'font-normal';
    const bg = isTotal ? 'bg-zinc-800/50' : '';
    
    return (
        <tr className={`border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors ${bg}`}>
            <td className={`p-3 sticky left-0 bg-zinc-900 border-r border-zinc-800 z-10 ${weight} ${textColor}`}>{label}</td>
            {amounts.map((amt, i) => (
                <td key={i} className={`p-3 text-right whitespace-nowrap font-mono text-sm ${textColor}`}>
                    {amt === 0 ? '-' : formatCurrency(amt)}
                </td>
            ))}
            <td className={`p-3 text-right whitespace-nowrap font-mono font-bold border-l border-zinc-800 ${textColor}`}>
                {formatCurrency(total)}
            </td>
        </tr>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold text-white">Monthly P&L</h2>
            <p className="text-zinc-400 mt-1">Detailed breakdown of income and expenses by month.</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
          <Button onClick={() => setSelectedYear(y => y - 1)} variant="ghost" size="sm" className="px-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          </Button>
          <span className="text-lg font-semibold text-sky-300 px-4 w-24 text-center">{selectedYear}</span>
          <Button onClick={() => setSelectedYear(y => y + 1)} variant="ghost" size="sm" className="px-2">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-zinc-950/50 border-b border-zinc-800">
                        <th className="p-3 font-semibold text-sm uppercase text-zinc-400 sticky left-0 bg-zinc-900 border-r border-zinc-800 z-20 min-w-[200px]">Category</th>
                        {months.map(m => (
                            <th key={m} className="p-3 font-semibold text-sm uppercase text-zinc-400 text-right min-w-[100px]">{m}</th>
                        ))}
                        <th className="p-3 font-semibold text-sm uppercase text-zinc-400 text-right min-w-[120px] border-l border-zinc-800">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Income Section */}
                    <tr className="bg-zinc-900/50">
                        <td colSpan={14} className="p-2 pl-3 text-xs font-bold uppercase text-green-500 tracking-wider">Income</td>
                    </tr>
                    {incomeCategories.map(cat => renderRow(cat.name, pivotData.data[cat.id]))}
                    {renderRow('Total Income', pivotData.monthlyTotals.income, true)}

                    {/* Expense Section */}
                    <tr className="bg-zinc-900/50">
                         <td colSpan={14} className="p-2 pl-3 text-xs font-bold uppercase text-amber-500 tracking-wider mt-4">Expenses</td>
                    </tr>
                    {expenseCategories.map(cat => renderRow(cat.name, pivotData.data[cat.id]))}
                    {renderRow('Total Expenses', pivotData.monthlyTotals.expense, true)}

                    {/* Net Profit Section */}
                     <tr className="bg-zinc-950 border-t-2 border-zinc-700">
                        <td className="p-3 sticky left-0 bg-zinc-900 border-r border-zinc-800 z-10 font-black text-white">Net Profit</td>
                        {pivotData.monthlyTotals.profit.map((amt, i) => (
                            <td key={i} className={`p-3 text-right whitespace-nowrap font-mono font-bold ${amt >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatCurrency(amt)}
                            </td>
                        ))}
                        <td className={`p-3 text-right whitespace-nowrap font-mono font-black border-l border-zinc-800 ${pivotData.monthlyTotals.profit.reduce((a, b) => a + b, 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(pivotData.monthlyTotals.profit.reduce((a, b) => a + b, 0))}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage;