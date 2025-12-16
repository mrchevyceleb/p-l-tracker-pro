
import React, { useState, useMemo } from 'react';
import { Transaction, TaxConfig, Category } from '../types';
import { calculateTax, TaxResult, getStandardDeduction } from '../utils/tax';
import Card from './ui/Card';
import Button from './ui/Button';
import { formatCurrency } from '../utils';

interface TaxesPageProps {
    transactions: Transaction[];
    categories: Category[];
    config: TaxConfig;
}

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
    <div className="group relative inline-block ml-1.5 align-middle">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-500 hover:text-sky-400 cursor-help transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-black border border-zinc-700 text-zinc-200 text-xs p-3 rounded shadow-xl z-50 whitespace-normal">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-700"></div>
        </div>
    </div>
);

const TaxesPage: React.FC<TaxesPageProps> = ({ transactions, categories, config }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Calculate taxes for the entire selected year
  const annualTaxResult: TaxResult = useMemo(() => {
    const yearTransactions = transactions.filter(tx => {
        const d = new Date(tx.date);
        return d.getFullYear() === selectedYear;
    });
    return calculateTax(yearTransactions, categories, config);
  }, [transactions, categories, config, selectedYear]);

  // Quarterly Data
  const quarterlyData = useMemo(() => {
    const quarters = [
        { name: 'Q1', period: 'Jan 1 - Mar 31', dueDate: `April 15, ${selectedYear}`, start: 0, end: 2 },
        { name: 'Q2', period: 'Apr 1 - May 31', dueDate: `June 15, ${selectedYear}`, start: 3, end: 4 },
        { name: 'Q3', period: 'Jun 1 - Aug 31', dueDate: `Sep 15, ${selectedYear}`, start: 5, end: 7 },
        { name: 'Q4', period: 'Sep 1 - Dec 31', dueDate: `Jan 15, ${selectedYear + 1}`, start: 8, end: 11 }
    ];

    return quarters.map(q => {
        const startDate = new Date(selectedYear, q.start, 1);
        const endDate = new Date(selectedYear, q.end + 1, 0);

        const qTxs = transactions.filter(tx => {
            const d = new Date(`${tx.date}T12:00:00Z`);
            return d >= startDate && d <= endDate;
        });

        const qResult = calculateTax(qTxs, categories, config);
        
        let estimatedPayment = 0;
        if (config.mode === 'simple') {
            estimatedPayment = qResult.totalTax;
        } else {
            // Apply annual effective rate to this quarter's taxable profit
            // Note: this assumes user pays proportional tax on business profit
            estimatedPayment = qResult.taxableNetProfit > 0 ? qResult.taxableNetProfit * (annualTaxResult.effectiveRate / 100) : 0;
        }
        
        // For MFJ with high withholding, est payment might be 0
        if (annualTaxResult.totalTax < 0) estimatedPayment = 0;

        return {
            ...q,
            income: qResult.grossIncome,
            expenses: qResult.totalExpenses,
            profit: qResult.netProfit,
            estimatedTax: estimatedPayment
        };
    });
  }, [transactions, categories, config, selectedYear, annualTaxResult]);

  // Derived Values
  const isRefund = annualTaxResult.totalTax < 0;
  const finalTaxDisplayAmount = Math.abs(annualTaxResult.totalTax);
  const weeklyCushion = Math.max(0, annualTaxResult.totalTax) / 52;
  const monthlyCushion = Math.max(0, annualTaxResult.totalTax) / 12;

  // Confidence / Accuracy Logic
  const uncategorizedCount = transactions.filter(tx => 
      new Date(tx.date).getFullYear() === selectedYear && !tx.category_id
  ).length;
  const accuracyLevel = uncategorizedCount === 0 ? 'High' : (uncategorizedCount < 5 ? 'Medium' : 'Low');
  const accuracyColor = uncategorizedCount === 0 ? 'bg-green-900/50 text-green-300 border-green-800' : (uncategorizedCount < 5 ? 'bg-amber-900/50 text-amber-300 border-amber-800' : 'bg-red-900/50 text-red-300 border-red-800');

  // Optimizer Tips Logic
  const tips = useMemo(() => {
      const generatedTips = [];
      const yearTxs = transactions.filter(t => new Date(t.date).getFullYear() === selectedYear);
      // Explicitly type the Map to avoid unknown inference
      const categoryMap = new Map<string, string>(categories.map(c => [c.id, c.name.toLowerCase()]));
      
      const hasHomeOffice = yearTxs.some(t => {
          const name = categoryMap.get(t.category_id || '') || '';
          return name.includes('rent') || name.includes('home office') || name.includes('mortgage');
      });

      const hasVehicle = yearTxs.some(t => {
          const name = categoryMap.get(t.category_id || '') || '';
          return name.includes('vehicle') || name.includes('mileage') || name.includes('car') || name.includes('gas') || name.includes('travel');
      });

      if (!hasHomeOffice) {
          generatedTips.push({ icon: '🏠', text: "Home office deduction might lower SE tax. If you work from home, ensure you track related expenses." });
      } else {
          generatedTips.push({ icon: '✅', text: "Great job tracking housing expenses! Ensure you only deduct the business-use percentage." });
      }

      if (!hasVehicle) {
          generatedTips.push({ icon: '🚗', text: "Tracking mileage could reduce your 2025 tax. 67 cents per mile adds up fast!" });
      }

      if (config.mode === 'smart' && annualTaxResult.credits > 0) {
          generatedTips.push({ icon: '👶', text: "Your Child Tax Credits are significantly reducing your bill. Make sure dependent info is accurate." });
      }

      if (config.filingStatus === 'married_joint' && annualTaxResult.spouseWithholding > 0) {
          generatedTips.push({ icon: '💍', text: "Spouse withholding is covering a portion of your self-employment tax liability." });
      }

      return generatedTips;
  }, [transactions, categories, selectedYear, config.mode, config.filingStatus, annualTaxResult.credits, annualTaxResult.spouseWithholding]);


  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-white">Tax Center</h2>
                {config.mode === 'smart' && <span className="px-2 py-1 rounded-full bg-sky-900/50 text-sky-300 text-xs font-medium border border-sky-800">Smart Mode</span>}
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${accuracyColor}`}>
                    Accuracy: {accuracyLevel}
                </span>
            </div>
            <p className="text-zinc-400 mt-1">
                {config.mode === 'simple' 
                    ? `Estimates based on a flat ${config.simpleRate}% rate.` 
                    : `Estimates based on 2025 IRS Brackets (${config.filingStatus === 'single' ? 'Single' : 'Joint Household'}).`}
            </p>
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

      {/* Survival Mode Cushion */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 relative overflow-hidden">
             {/* Background glow for refunds */}
            {isRefund && <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl rounded-full pointer-events-none"></div>}
            
            <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">
                {isRefund ? "Estimated Refund" : "Final Tax Owed"}
            </h3>
            <p className={`text-4xl font-black mt-2 ${isRefund ? 'text-green-400' : 'text-white'}`}>
                {isRefund ? '+' : ''}{formatCurrency(finalTaxDisplayAmount)}
            </p>
            <div className="mt-2 text-sm text-zinc-500">
                Effective Rate: <span className={`${isRefund ? 'text-green-500' : 'text-sky-400'} font-bold`}>
                    {annualTaxResult.effectiveRate.toFixed(1)}%
                </span>
                {config.filingStatus === 'married_joint' && <span className="ml-1">(Household)</span>}
            </div>
        </Card>
        
        {/* Only show cushion if we actually owe money */}
        {!isRefund ? (
            <>
                <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800">
                    <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Rec. Monthly Cushion</h3>
                    <p className="text-4xl font-black mt-2 text-sky-400">{formatCurrency(monthlyCushion)}</p>
                    <p className="text-xs text-zinc-500 mt-2">Save this much every month.</p>
                </Card>
                <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800">
                    <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Rec. Weekly Cushion</h3>
                    <p className="text-4xl font-black mt-2 text-sky-400">{formatCurrency(weeklyCushion)}</p>
                    <p className="text-xs text-zinc-500 mt-2">Save this much every week.</p>
                </Card>
            </>
        ) : (
             <Card className="col-span-1 md:col-span-2 bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 flex flex-col justify-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-900/30 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">You're in the green!</h3>
                        <p className="text-zinc-400">Based on your credits and withholding, you currently don't owe taxes. Keep tracking to stay accurate.</p>
                    </div>
                </div>
            </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Annual Summary & Breakdown */}
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <h3 className="text-xl font-bold text-white mb-6">Annual Tax Breakdown ({selectedYear})</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                        <span className="text-zinc-300">Total Business Income</span>
                        <span className="text-green-400 font-mono font-bold">{formatCurrency(annualTaxResult.grossIncome)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                        <span className="text-zinc-300">Total Business Expenses</span>
                        <span className="text-amber-400 font-mono font-bold">{formatCurrency(annualTaxResult.totalExpenses)}</span>
                    </div>
                    {config.mode === 'smart' && (
                         <div className="flex justify-between items-center py-2 border-b border-zinc-800 bg-zinc-900/50 px-2 -mx-2 rounded">
                            <span className="text-zinc-400 text-sm pl-4">↳ Non-Deductible Portion</span>
                            <span className="text-zinc-500 font-mono text-sm">{formatCurrency(annualTaxResult.totalExpenses - annualTaxResult.deductibleExpenses)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                        <span className="text-white font-bold">User Net Profit (Taxable)</span>
                        <span className={`${annualTaxResult.taxableNetProfit >= 0 ? 'text-green-400' : 'text-red-400'} font-mono font-bold`}>{formatCurrency(annualTaxResult.taxableNetProfit)}</span>
                    </div>
                    
                    {config.mode === 'smart' && (
                        <>
                            {/* Detailed Smart Tax Logic */}
                            <div className="pt-4 pb-2">
                                <h4 className="text-sm font-bold text-sky-400 uppercase tracking-wider mb-2">Detailed Tax Liability</h4>
                            </div>

                             {/* Household Logic Display */}
                            {config.filingStatus === 'married_joint' && (
                                <div className="bg-zinc-900/30 p-3 rounded border border-zinc-800/50 mb-4 space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-400">User Net Profit (Taxable)</span>
                                        <span className="text-zinc-200 font-mono">{formatCurrency(annualTaxResult.taxableNetProfit)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-400">Spouse Taxable Income (Est.)</span>
                                        <span className="text-zinc-200 font-mono">{formatCurrency(annualTaxResult.spouseTaxableIncome)}</span>
                                    </div>
                                     <div className="flex justify-between items-center text-sm pt-1 border-t border-zinc-700/50 font-bold">
                                        <span className="text-white">Combined Household Income</span>
                                        <span className="text-white font-mono">{formatCurrency(annualTaxResult.taxableNetProfit + annualTaxResult.spouseTaxableIncome)}</span>
                                    </div>
                                </div>
                            )}

                            {/* New Line: Federal Taxable Income */}
                            <div className="flex justify-between items-center py-2 border-b border-zinc-800 bg-zinc-900/30 px-2 -mx-2 rounded mb-2">
                                <span className="text-zinc-300 flex items-center">
                                    Household Taxable Income
                                    <InfoTooltip text={`Combined Income - (50% of SE Tax) - Standard Deduction ($${getStandardDeduction(config.filingStatus).toLocaleString()}). This is the amount applied to tax brackets.`} />
                                </span>
                                <span className="text-white font-mono">{formatCurrency(annualTaxResult.federalTaxableIncome)}</span>
                            </div>

                            <div className="flex justify-between items-center py-1">
                                <span className="text-zinc-400 flex items-center">
                                    Self-Employment Tax (User Only)
                                    <InfoTooltip text="15.3% on 92.35% of User's Net Profit. Covers Social Security & Medicare." />
                                </span>
                                <span className="text-zinc-200 font-mono">{formatCurrency(annualTaxResult.seTax)}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                                <span className="text-zinc-400 flex items-center">
                                    Federal Income Tax
                                    <InfoTooltip text={`Based on 2025 IRS brackets for ${config.filingStatus === 'single' ? 'Single' : 'Married Joint'} filers on household income.`} />
                                </span>
                                <span className="text-zinc-200 font-mono">{formatCurrency(annualTaxResult.federalTax)}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                                <span className="text-zinc-400">State Tax (PA 3.07% on User Profit)</span>
                                <span className="text-zinc-200 font-mono">{formatCurrency(annualTaxResult.stateTax)}</span>
                            </div>
                             <div className="flex justify-between items-center py-1 pb-2">
                                <span className="text-zinc-400 flex items-center">
                                    Tax Credits ({config.dependents} children)
                                    <InfoTooltip text="Child Tax Credit reduces your total tax bill dollar-for-dollar." />
                                </span>
                                <span className="text-green-400 font-mono">-{formatCurrency(annualTaxResult.credits)}</span>
                            </div>

                            <div className="flex justify-between items-center py-2 border-t border-zinc-700 font-semibold">
                                <span className="text-zinc-300">Total Tax Liability</span>
                                <span className="text-white font-mono">{formatCurrency(annualTaxResult.totalTaxBeforeWithholding)}</span>
                            </div>
                            
                            {annualTaxResult.spouseWithholding > 0 && (
                                 <div className="flex justify-between items-center py-1 text-sm">
                                    <span className="text-zinc-400">Less: Spouse Withholding</span>
                                    <span className="text-green-400 font-mono">-{formatCurrency(annualTaxResult.spouseWithholding)}</span>
                                </div>
                            )}

                            {/* Final Tax / Refund Row */}
                             <div className="flex justify-between items-center py-3 mt-2 border-t-2 border-zinc-700">
                                <span className="text-white font-bold text-lg">
                                    {isRefund ? "Estimated Refund" : "Final Estimated Balance"}
                                </span>
                                <span className={`${isRefund ? 'text-green-400' : 'text-sky-400'} font-mono font-black text-xl`}>
                                    {isRefund ? '+' : ''}{formatCurrency(finalTaxDisplayAmount)}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </Card>

            {/* Quarterly Cards Grid - Only show if we expect to pay taxes */}
            {!isRefund && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {quarterlyData.map(q => (
                        <Card key={q.name}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="text-lg font-bold text-white">{q.name}</h4>
                                    <p className="text-xs text-zinc-400">{q.period}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-mono text-zinc-500 block">Due</span>
                                    <span className="text-sm text-zinc-300">{q.dueDate.split(',')[0]}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="text-zinc-500">Net Profit</span>
                                <span className="text-zinc-300">{formatCurrency(q.profit)}</span>
                            </div>
                            <div className="bg-zinc-950/50 border border-zinc-800 rounded p-2 mt-2 text-center">
                                <p className="text-xs text-zinc-400 uppercase">Est. Payment</p>
                                <p className="text-xl font-bold text-sky-400">{formatCurrency(q.estimatedTax)}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-6">
             <Card>
                <h3 className="text-lg font-bold text-white mb-4">Tax Optimizer Tips</h3>
                <ul className="space-y-4">
                    {tips.length > 0 ? tips.map((tip, idx) => (
                        <li key={idx} className="flex gap-3">
                            <div className="mt-1 min-w-[20px] text-lg">{tip.icon}</div>
                            <p className="text-sm text-zinc-300">{tip.text}</p>
                        </li>
                    )) : (
                         <li className="flex gap-3">
                            <div className="mt-1 min-w-[20px]">✨</div>
                            <p className="text-sm text-zinc-300">You're doing great! Keep categorized your expenses for the best tax outcome.</p>
                        </li>
                    )}
                </ul>
            </Card>

            <Card className="!bg-zinc-950/50">
                 <h3 className="text-lg font-semibold text-white">Disclaimer</h3>
                <p className="text-zinc-500 mt-2 text-xs leading-relaxed">
                    This tool uses simplified 2025 IRS bracket projections and PA state tax rules. It does not account for local taxes, specific deductions (like QBI), or other complex situations. Always consult a CPA.
                </p>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default TaxesPage;
