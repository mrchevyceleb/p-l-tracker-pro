import { Transaction, Category } from '../types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const exportToCsv = (transactions: Transaction[], categories: Category[], fileName: string) => {
  // Fix: Explicitly type map key/value
  const categoryMap = new Map<string, Category>(categories.map(cat => [cat.id, cat]));
  
  let csvContent = 'Date,Name,Type,Amount,Category,Notes,Deductible,DeductionPercentage,AdjustedAmount,TaxWeight\n';
  
  transactions.forEach(tx => {
    const category = categoryMap.get(tx.category_id || '');
    const categoryName = category?.name || 'Uncategorized';
    
    // Determine deductibility
    let deductionPercentage = 0;
    let deductible = 'false';
    
    if (tx.type === 'expense') {
        deductionPercentage = category?.deductibility_percentage ?? 100; // Default to 100 if undefined, or 0 if not expense? Usually expenses default to 100 in simple mode, but let's be strict.
        if (deductionPercentage === 100) deductible = 'true';
        else if (deductionPercentage > 0) deductible = 'partial';
    }

    const adjustedAmount = tx.type === 'expense' ? tx.amount * (deductionPercentage / 100) : tx.amount;
    const taxWeight = tx.type === 'income' ? 1 : (deductionPercentage / 100) * -1; // Helper for simple spreadsheet math

    const row = [
      tx.date,
      `"${tx.name.replace(/"/g, '""')}"`,
      tx.type,
      tx.amount,
      `"${categoryName.replace(/"/g, '""')}"`,
      `"${tx.notes.replace(/"/g, '""')}"`,
      deductible,
      `${deductionPercentage}%`,
      adjustedAmount.toFixed(2),
      taxWeight.toFixed(2)
    ].join(',');
    csvContent += row + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Re-export validation utilities
export * from './validation';
