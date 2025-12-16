
import { TaxConfig, Transaction, Category } from '../types';

// 2025 Projected Numbers
const STANDARD_DEDUCTION = {
    single: 14600,
    married_joint: 29200,
};

const BRACKETS_SINGLE = [
    { limit: 11925, rate: 0.10 },
    { limit: 48475, rate: 0.12 },
    { limit: 103350, rate: 0.22 },
    { limit: 197300, rate: 0.24 },
    { limit: 250525, rate: 0.32 },
    { limit: 626350, rate: 0.35 },
    { limit: Infinity, rate: 0.37 },
];

const BRACKETS_MARRIED = [
    { limit: 23850, rate: 0.10 },
    { limit: 96950, rate: 0.12 },
    { limit: 206700, rate: 0.22 },
    { limit: 394600, rate: 0.24 },
    { limit: 501050, rate: 0.32 },
    { limit: 751600, rate: 0.35 },
    { limit: Infinity, rate: 0.37 },
];

export interface TaxResult {
    grossIncome: number; // Business Gross
    totalExpenses: number; // Business Total Exp
    deductibleExpenses: number; // Business Deductible Exp
    netProfit: number; // Business Cash Profit
    taxableNetProfit: number; // Business Taxable Profit (Sched C)
    
    federalTaxableIncome: number; // Final Taxable Income for Brackets (Household)
    seTax: number;
    stateTax: number;
    federalTax: number;
    credits: number;
    
    totalTax: number; // Final Tax Owed (after withholding)
    totalTaxBeforeWithholding: number;
    spouseWithholding: number;
    spouseGrossIncome: number;
    spouseTaxableIncome: number;

    effectiveRate: number;
}

export const calculateTax = (
    transactions: Transaction[],
    categories: Category[],
    config: TaxConfig
): TaxResult => {
    const categoryMap = new Map(categories.map(c => [c.id, c]));
    
    let grossIncome = 0;
    let totalExpenses = 0;
    let deductibleExpenses = 0;

    transactions.forEach(tx => {
        if (tx.type === 'income') {
            grossIncome += tx.amount;
        } else {
            totalExpenses += tx.amount;
            const cat = categoryMap.get(tx.category_id || '');
            const pct = cat?.deductibility_percentage ?? 100;
            deductibleExpenses += tx.amount * (pct / 100);
        }
    });

    // 1. User Business Profit
    const netProfit = grossIncome - totalExpenses; // Real cash profit
    const taxableNetProfit = Math.max(0, grossIncome - deductibleExpenses); // Taxable profit basis (Sched C)

    if (config.mode === 'simple') {
        const totalTax = Math.max(0, netProfit * (config.simpleRate / 100));
        return {
            grossIncome,
            totalExpenses,
            deductibleExpenses: totalExpenses, 
            netProfit,
            taxableNetProfit: netProfit,
            federalTaxableIncome: netProfit,
            seTax: 0,
            stateTax: 0,
            federalTax: totalTax,
            credits: 0,
            totalTax,
            totalTaxBeforeWithholding: totalTax,
            spouseWithholding: 0,
            spouseGrossIncome: 0,
            spouseTaxableIncome: 0,
            effectiveRate: netProfit > 0 ? (totalTax / netProfit) * 100 : 0,
        };
    }

    // --- SMART MODE (MFJ / SINGLE Logic) ---

    const isMFJ = config.filingStatus === 'married_joint';

    // 2. Spouse Income (MFJ Only)
    const spouseGross = isMFJ ? (config.spouseGrossIncome || 0) : 0;
    const spousePretaxRate = isMFJ ? (config.spousePretaxDeductionPercent || 10) / 100 : 0;
    const spouseTaxable = Math.max(0, spouseGross - (spouseGross * spousePretaxRate));
    const spouseWithholding = isMFJ ? (config.spouseFederalWithholding || 0) : 0;

    // 3. Self-Employment Tax (User Only)
    // SE Tax = Taxable Net Profit * 92.35% * 15.3%
    const seTax = taxableNetProfit * 0.9235 * 0.153;

    // 4. Federal Income Tax
    // Deduction for 1/2 SE Tax (Above the line deduction)
    const seTaxDeduction = seTax * 0.5;
    
    const standardDeduction = getStandardDeduction(config.filingStatus);
    
    // Household Taxable Income = UserTaxable + SpouseTaxable - SE_Deduction - Standard_Deduction
    const federalTaxableIncome = Math.max(0, 
        taxableNetProfit + spouseTaxable - seTaxDeduction - standardDeduction
    );

    // Brackets Lookup
    let federalTax = 0;
    let previousLimit = 0;
    const brackets = isMFJ ? BRACKETS_MARRIED : BRACKETS_SINGLE;

    for (const bracket of brackets) {
        if (federalTaxableIncome > previousLimit) {
            const taxableInBracket = Math.min(federalTaxableIncome, bracket.limit) - previousLimit;
            federalTax += taxableInBracket * bracket.rate;
            previousLimit = bracket.limit;
        } else {
            break;
        }
    }

    // 5. State Tax (PA Flat 3.07%) - Prompt specifies User Net Profit only
    const stateTax = taxableNetProfit * 0.0307;

    // 6. Credits (Child Tax Credit)
    // $2000 per child. 
    const creditAmount = config.dependents * 2000;
    
    // Apply credits only against Federal Income Tax (usually), not SE tax.
    // However, Refundable portion exists. For simplicity per prompt:
    // "federalIncomeTaxAfterCredits = Math.max(0, federalIncomeTax - childTaxCredit);"
    const federalTaxAfterCredits = Math.max(0, federalTax - creditAmount);

    // 7. Final Calculation
    const totalTaxBeforeWithholding = seTax + federalTaxAfterCredits + stateTax;
    
    // Subtract Spouse Withholding
    const totalHouseholdTaxOwed = totalTaxBeforeWithholding - spouseWithholding; // Can be negative (Refund)

    // 8. Effective Rate
    // Based on household combined income: totalHouseholdTaxOwed / (userNetProfit + spouseGrossIncome)
    const denominator = taxableNetProfit + spouseGross;
    const effectiveRate = denominator > 0 
        ? (totalHouseholdTaxOwed / denominator) * 100 
        : 0;

    return {
        grossIncome,
        totalExpenses,
        deductibleExpenses,
        netProfit,
        taxableNetProfit,
        federalTaxableIncome, // Household level
        seTax,
        stateTax,
        federalTax: federalTax, // Pre-credit for display purposes if needed, but usually we show net.
        credits: creditAmount,
        
        totalTax: totalHouseholdTaxOwed, // Final Owe/Refund
        totalTaxBeforeWithholding,
        spouseWithholding,
        spouseGrossIncome: spouseGross,
        spouseTaxableIncome: spouseTaxable,

        effectiveRate
    };
};

export const getStandardDeduction = (status: 'single' | 'married_joint') => {
    return status === 'single' ? STANDARD_DEDUCTION.single : STANDARD_DEDUCTION.married_joint;
};
