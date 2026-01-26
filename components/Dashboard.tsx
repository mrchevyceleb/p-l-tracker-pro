
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Transaction, Category } from '../types';
import { formatCurrency, exportToCsv } from '../utils';
import Card from './ui/Card';
import Button from './ui/Button';

// Helper to format date as YYYY-MM-DD (using local timezone, not UTC)
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
            // Cap at today to exclude future recurring projections
            return { startDate: formatDate(start), endDate: formatDate(today) };
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
            // Cap at today to exclude future recurring projections
            return { startDate: formatDate(start), endDate: formatDate(today) };
        }
    }
];

interface DashboardPageProps {
  transactions: Transaction[];
  categories: Category[];
  taxRate: number;
  onOpenTaxSettings: () => void;
}

const KPICard: React.FC<{ title: string; value: string; colorClass: string }> = ({ title, value, colorClass }) => (
  <Card>
    <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
    <p className={`text-4xl font-black mt-2 ${colorClass}`}>{value}</p>
  </Card>
);

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 shadow-xl">
          <p className="label font-bold text-white mb-2">{`${label}`}</p>
          {payload.map((pld: any) => (
            <div key={pld.dataKey} className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: pld.color }}></div>
                    <span className="text-zinc-400 mr-2">{`${pld.name}:`}</span>
                </div>
                <span className="font-bold text-white">{formatCurrency(pld.value)}</span>
            </div>
          ))}
        </div>
      );
    }
  
    return null;
};

const DashboardPage: React.FC<DashboardPageProps> = ({ transactions, categories, taxRate, onOpenTaxSettings }) => {
    const [activePreset, setActivePreset] = useState<string>('Last 30 Days');
    const [startDate, setStartDate] = useState(() => {
        const now = new Date();
        const start = new Date(now);
        start.setDate(start.getDate() - 30);
        return formatDate(start);
    });
    const [endDate, setEndDate] = useState(() => formatDate(new Date()));

    const filteredTransactions = useMemo(() => {
        // Parse dates for proper comparison
        const startParts = startDate.split('-').map(Number);
        const endParts = endDate.split('-').map(Number);
        const startMs = new Date(startParts[0], startParts[1] - 1, startParts[2]).getTime();
        const endMs = new Date(endParts[0], endParts[1] - 1, endParts[2], 23, 59, 59, 999).getTime();

        // Debug: Log first few transactions to see date format
        if (transactions.length > 0) {
            console.log('=== DATE FILTER DEBUG ===');
            console.log('Filter range:', startDate, 'to', endDate);
            console.log('Sample transaction dates:', transactions.slice(0, 5).map(tx => ({ name: tx.name, date: tx.date, rawDate: JSON.stringify(tx.date) })));
        }

        const filtered = transactions.filter(tx => {
            if (!tx.date || typeof tx.date !== 'string') {
                console.log('Invalid date on transaction:', tx.name, tx.date);
                return false;
            }
            const txParts = tx.date.split('-').map(Number);
            const txMs = new Date(txParts[0], txParts[1] - 1, txParts[2]).getTime();
            return txMs >= startMs && txMs <= endMs;
        });

        // More detailed debug
        const incomeFiltered = filtered.filter(t => t.type === 'income');
        const expenseFiltered = filtered.filter(t => t.type === 'expense');
        const incomeTotal = incomeFiltered.reduce((sum, t) => sum + t.amount, 0);
        const expenseTotal = expenseFiltered.reduce((sum, t) => sum + t.amount, 0);

        console.log('Total transactions:', transactions.length, 'Filtered:', filtered.length);
        console.log('Income txs:', incomeFiltered.length, 'Total: $' + incomeTotal);
        console.log('Expense txs:', expenseFiltered.length, 'Total: $' + expenseTotal);
        console.log('Filtered income transactions:', incomeFiltered.map(t => ({ date: t.date, name: t.name, amount: t.amount })));

        return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [transactions, startDate, endDate]);
    
    const { totalIncome, totalExpenses, netProfit } = useMemo(() => {
        let income = 0;
        let expenses = 0;
        filteredTransactions.forEach(tx => {
            if (tx.type === 'income') income += tx.amount;
            else expenses += tx.amount;
        });
        return { totalIncome: income, totalExpenses: expenses, netProfit: income - expenses };
    }, [filteredTransactions]);

    const profitMargin = useMemo(() => {
        if (totalIncome === 0) {
            return 0;
        }
        return (netProfit / totalIncome) * 100;
    }, [totalIncome, netProfit]);

    const estimatedTaxSavings = useMemo(() => {
        return netProfit > 0 ? netProfit * (taxRate / 100) : 0;
    }, [netProfit, taxRate]);

    const netProfitAfterTax = useMemo(() => {
        return netProfit - estimatedTaxSavings;
    }, [netProfit, estimatedTaxSavings]);

    const trendData = useMemo(() => {
        const dataByMonth: { [key: string]: { month: string; income: number; expenses: number } } = {};
        filteredTransactions.forEach(tx => {
            const month = tx.date.slice(0, 7); // YYYY-MM
            if (!dataByMonth[month]) {
                dataByMonth[month] = { month, income: 0, expenses: 0 };
            }
            if (tx.type === 'income') dataByMonth[month].income += tx.amount;
            else dataByMonth[month].expenses += tx.amount;
        });
        return Object.values(dataByMonth).sort((a, b) => a.month.localeCompare(b.month));
    }, [filteredTransactions]);
    
    const categoryMap = new Map<string, Category>(categories.map(c => [c.id, c]));

    const expensesByCategory = useMemo((): { name: string; value: number }[] => {
        const acc: Record<string, number> = {};
        filteredTransactions
            .filter(tx => tx.type === 'expense')
            .forEach(tx => {
                const categoryName = categoryMap.get(tx.category_id || '')?.name || 'Uncategorized';
                acc[categoryName] = (acc[categoryName] || 0) + tx.amount;
            });
        return Object.entries(acc).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [filteredTransactions, categoryMap]);
    
    const incomeByCategory = useMemo((): { name: string; value: number }[] => {
        const acc: Record<string, number> = {};
        filteredTransactions
            .filter(tx => tx.type === 'income')
            .forEach(tx => {
                const categoryName = categoryMap.get(tx.category_id || '')?.name || 'Uncategorized';
                acc[categoryName] = (acc[categoryName] || 0) + tx.amount;
            });
        return Object.entries(acc).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [filteredTransactions, categoryMap]);
  
    const netProfitColor = netProfit >= 0 ? 'text-green-400' : 'text-red-400';
    const COLORS = ['#0ea5e9', '#22c55e', '#f97316', '#ec4899', '#8b5cf6', '#eab308'];

    const handleExport = () => {
        exportToCsv(filteredTransactions, categories, `report-${startDate}-to-${endDate}`);
    };

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header & Date Range */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
            <h2 className="text-3xl font-bold text-white">Dashboard</h2>
            <p className="text-zinc-400 mt-1">Real-time insights into your finances.</p>
        </div>
        <div className="flex flex-col w-full lg:w-auto items-stretch gap-2 bg-zinc-900 p-2 rounded-lg border border-zinc-800">
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label htmlFor="start-date" className="text-sm font-medium text-zinc-400">From</label>
                    <input type="date" id="start-date" value={startDate} onChange={e => { setStartDate(e.target.value); setActivePreset(''); }} className="bg-zinc-800 flex-grow p-2 rounded-md border-zinc-700 focus:ring-sky-500 focus:border-sky-500" />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label htmlFor="end-date" className="text-sm font-medium text-zinc-400">To</label>
                    <input type="date" id="end-date" value={endDate} onChange={e => { setEndDate(e.target.value); setActivePreset(''); }} className="bg-zinc-800 flex-grow p-2 rounded-md border-zinc-700 focus:ring-sky-500 focus:border-sky-500" />
                </div>
                <Button onClick={handleExport} variant="secondary" className="w-full sm:w-auto">Export</Button>
            </div>
             <div className="flex flex-wrap items-center justify-start gap-2 border-t border-zinc-800 pt-2">
                 {datePresets.map(preset => (
                    <Button
                        key={preset.label}
                        onClick={() => {
                            const now = new Date();
                            const { startDate: newStart, endDate: newEnd } = preset.getRange(now);
                            setStartDate(newStart);
                            setEndDate(newEnd);
                            setActivePreset(preset.label);
                        }}
                        variant={activePreset === preset.label ? 'secondary' : 'ghost'}
                        size="sm"
                        className="text-xs px-2 py-1"
                    >
                        {preset.label}
                    </Button>
                ))}
            </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <KPICard title="Total Income" value={formatCurrency(totalIncome)} colorClass="text-green-400" />
        <KPICard title="Total Expenses" value={formatCurrency(totalExpenses)} colorClass="text-amber-400" />
        <KPICard title="Net Profit (Pre-Tax)" value={formatCurrency(netProfit)} colorClass={netProfitColor} />
        <KPICard title="Profit Margin" value={`${profitMargin.toFixed(1)}%`} colorClass={netProfitColor} />
      </div>

      {/* Tax Estimator Card */}
      <Card>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                  <h3 className="text-xl font-bold text-white">Tax Savings Estimator</h3>
                  <p className="text-zinc-400 mt-1">Based on an effective rate of <span className="font-bold text-sky-400">{taxRate.toFixed(1)}%</span> (Smart Mode or Custom).</p>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-center md:text-right w-full md:w-auto mt-4 md:mt-0">
                  <div>
                      <h4 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">To Set Aside</h4>
                      <p className="text-2xl font-black mt-1 text-sky-400">{formatCurrency(estimatedTaxSavings)}</p>
                  </div>
                  <div>
                      <h4 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Profit After Tax</h4>
                      <p className={`text-2xl font-black mt-1 ${netProfitAfterTax >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(netProfitAfterTax)}</p>
                  </div>
              </div>
              <Button onClick={onOpenTaxSettings} variant="secondary" className="w-full md:w-auto mt-4 md:mt-0 shrink-0">
                  Tax Settings
              </Button>
          </div>
      </Card>
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 lg:col-span-2">
            <h3 className="text-xl font-bold mb-4 text-white">Monthly Net Profit</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="month" stroke="#a1a1aa" />
                    <YAxis stroke="#a1a1aa" tickFormatter={(value) => formatCurrency(Number(value))} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="income" name="Income" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </Card>

        <Card>
            <h3 className="text-xl font-bold mb-4 text-white">Expenses By Category</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={expensesByCategory} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis type="number" stroke="#a1a1aa" tickFormatter={(value) => formatCurrency(Number(value))} />
                    <YAxis type="category" dataKey="name" stroke="#a1a1aa" width={100} tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Amount" fill="#f97316" radius={[0, 8, 8, 0]}>
                        {expensesByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </Card>
        
        <Card>
            <h3 className="text-xl font-bold mb-4 text-white">Income By Category</h3>
            <ResponsiveContainer width="100%" height={300}>
                 <BarChart data={incomeByCategory} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis type="number" stroke="#a1a1aa" tickFormatter={(value) => formatCurrency(Number(value))} />
                    <YAxis type="category" dataKey="name" stroke="#a1a1aa" width={100} tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Amount" fill="#22c55e" radius={[0, 8, 8, 0]}>
                        {incomeByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
