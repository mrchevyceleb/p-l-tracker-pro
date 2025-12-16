

export type TransactionType = "income" | "expense";

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  type: TransactionType;
  deductibility_percentage?: number; // 0 to 100
}

export interface Transaction {
  id:string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  name: string;
  type: TransactionType;
  amount: number;
  category_id: string | null;
  notes: string;
  recurring_id?: string;
}

export interface TaxConfig {
  mode: 'simple' | 'smart';
  simpleRate: number;
  filingStatus: 'single' | 'married_joint';
  dependents: number;
  // Spouse / Household fields for MFJ
  spouseGrossIncome?: number;
  spouseFederalWithholding?: number;
  spousePretaxDeductionPercent?: number; // 0-20
}