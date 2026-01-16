export type TransactionType = "income" | "expense";

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  type: TransactionType;
  deductibility_percentage?: number;
}

export interface Transaction {
  id: string;
  user_id?: string;
  date: string;
  name: string;
  type: TransactionType;
  amount: number;
  category_id: string | null;
  notes: string;
  recurring_id?: string;
}

export type Frequency = 'weekly' | 'monthly' | 'yearly';
