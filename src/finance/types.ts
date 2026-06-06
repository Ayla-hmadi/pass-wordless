export type TransactionType = 'income' | 'expense' | 'investment';

export type TransactionFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'investment';
  isCustom: boolean;
  createdAt: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  isDefault: boolean;
  createdAt: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amountCents: number;
  currency: string;
  categoryId: string;
  paymentMethodId: string | null;
  label: string;
  notes: string | null;
  date: number;
  isRecurring: boolean;
  recurringId: string | null;
  investmentPlatform: string | null;
  investmentUrl: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Budget {
  id: string;
  categoryId: string;
  amountCents: number;
  period: 'monthly';
  createdAt: number;
  updatedAt: number;
}

export interface RecurringItem {
  id: string;
  type: TransactionType;
  amountCents: number;
  currency: string;
  categoryId: string;
  paymentMethodId: string | null;
  label: string;
  notes: string | null;
  frequency: TransactionFrequency;
  startDate: number;
  nextDueDate: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}
