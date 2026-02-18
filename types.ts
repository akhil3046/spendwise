
export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description?: string;
  date: string; // ISO string YYYY-MM-DD
  createdAt: number;
}

export interface Contact {
  id: string;
  name: string;
  createdAt: number;
}

export interface DebtEntry {
  id: string;
  contactId: string;
  amount: number;
  type: 'borrow' | 'lent';
  description?: string;
  date: string;
  createdAt: number;
}

export type FilterType = 'this-week' | 'this-month' | 'custom';
export type AppTab = 'expenses' | 'debts';

export interface DateRange {
  start: string;
  end: string;
}
