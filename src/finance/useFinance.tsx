import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  Budget,
  Category,
  PaymentMethod,
  RecurringItem,
  Transaction,
  TransactionType,
} from './types';
import { seedCategories, listCategories, addCategory as dbAddCategory, deleteCategory as dbDeleteCategory } from './storage/categories';
import { seedPaymentMethods, listPaymentMethods, addPaymentMethod as dbAddPaymentMethod, deletePaymentMethod as dbDeletePaymentMethod } from './storage/paymentMethods';
import { listTransactions, addTransaction as dbAddTransaction, updateTransaction as dbUpdateTransaction, deleteTransaction as dbDeleteTransaction } from './storage/transactions';
import { listBudgets, upsertBudget, deleteBudget as dbDeleteBudget } from './storage/budgets';
import { listRecurring, addRecurring as dbAddRecurring, updateRecurring as dbUpdateRecurring, deleteRecurring as dbDeleteRecurring } from './storage/recurring';
import { getMonthRange } from './utils';

export interface CategoryTotal {
  category: Category;
  total: number;
  count: number;
  percentage: number;
}

export interface BudgetProgress {
  budget: Budget;
  category: Category;
  spent: number;
  percentage: number;
}

interface FinanceContextValue {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  budgets: Budget[];
  recurringItems: RecurringItem[];
  transactions: Transaction[];

  selectedYear: number;
  selectedMonth: number;
  setSelectedMonth: (year: number, month: number) => void;

  // Derived for selected month
  monthTransactions: Transaction[];
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyInvestment: number;
  monthlyNet: number;
  expenseCategoryTotals: CategoryTotal[];
  budgetProgress: BudgetProgress[];
  savingsRate: number;

  isLoading: boolean;

  // Transaction actions
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Transaction;
  updateTransaction: (id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => void;
  deleteTransaction: (id: string) => void;

  // Category actions
  addCategory: (data: Omit<Category, 'id' | 'createdAt'>) => Category;
  deleteCategory: (id: string) => void;

  // Budget actions
  setBudget: (categoryId: string, amountCents: number) => void;
  deleteBudget: (categoryId: string) => void;

  // Recurring actions
  addRecurring: (data: Omit<RecurringItem, 'id' | 'createdAt' | 'updatedAt'>) => RecurringItem;
  updateRecurring: (id: string, data: Partial<Omit<RecurringItem, 'id' | 'createdAt'>>) => void;
  deleteRecurring: (id: string) => void;

  // Payment method actions
  addPaymentMethod: (data: Omit<PaymentMethod, 'id' | 'createdAt'>) => PaymentMethod;
  deletePaymentMethod: (id: string) => void;

  refreshData: () => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const now = new Date();
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonthState] = useState(now.getMonth());
  const [isLoading, setIsLoading] = useState(true);

  const loadAll = useCallback(() => {
    try {
      seedCategories();
      seedPaymentMethods();
      setCategories(listCategories());
      setPaymentMethods(listPaymentMethods());
      setBudgets(listBudgets());
      setRecurringItems(listRecurring());
      setTransactions(listTransactions());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function setSelectedMonth(year: number, month: number) {
    setSelectedYear(year);
    setSelectedMonthState(month);
  }

  // ── Derived values ──────────────────────────────────────────────────────────

  const monthTransactions = useMemo(() => {
    const { start, end } = getMonthRange(selectedYear, selectedMonth);
    return transactions.filter((t) => t.date >= start && t.date <= end);
  }, [transactions, selectedYear, selectedMonth]);

  const monthlyIncome = useMemo(
    () =>
      monthTransactions
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + t.amountCents, 0),
    [monthTransactions],
  );

  const monthlyExpenses = useMemo(
    () =>
      monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + t.amountCents, 0),
    [monthTransactions],
  );

  const monthlyInvestment = useMemo(
    () =>
      monthTransactions
        .filter((t) => t.type === 'investment')
        .reduce((s, t) => s + t.amountCents, 0),
    [monthTransactions],
  );

  const monthlyNet = useMemo(
    () => monthlyIncome - monthlyExpenses - monthlyInvestment,
    [monthlyIncome, monthlyExpenses, monthlyInvestment],
  );

  const savingsRate = useMemo(() => {
    if (monthlyIncome === 0) return 0;
    return Math.max(0, Math.round((monthlyNet / monthlyIncome) * 100));
  }, [monthlyNet, monthlyIncome]);

  const expenseCategoryTotals = useMemo((): CategoryTotal[] => {
    const expenseTxns = monthTransactions.filter((t) => t.type === 'expense');
    const totalSpend = expenseTxns.reduce((s, t) => s + t.amountCents, 0);
    const byCategory = new Map<string, { total: number; count: number }>();
    for (const t of expenseTxns) {
      const existing = byCategory.get(t.categoryId) ?? { total: 0, count: 0 };
      byCategory.set(t.categoryId, {
        total: existing.total + t.amountCents,
        count: existing.count + 1,
      });
    }
    const result: CategoryTotal[] = [];
    for (const [catId, data] of byCategory.entries()) {
      const category = categories.find((c) => c.id === catId);
      if (!category) continue;
      result.push({
        category,
        total: data.total,
        count: data.count,
        percentage: totalSpend > 0 ? (data.total / totalSpend) * 100 : 0,
      });
    }
    return result.sort((a, b) => b.total - a.total);
  }, [monthTransactions, categories]);

  const budgetProgress = useMemo((): BudgetProgress[] => {
    return budgets
      .map((budget) => {
        const category = categories.find((c) => c.id === budget.categoryId);
        if (!category) return null;
        const spent = monthTransactions
          .filter((t) => t.type === 'expense' && t.categoryId === budget.categoryId)
          .reduce((s, t) => s + t.amountCents, 0);
        const percentage = budget.amountCents > 0 ? (spent / budget.amountCents) * 100 : 0;
        return { budget, category, spent, percentage };
      })
      .filter(Boolean) as BudgetProgress[];
  }, [budgets, monthTransactions, categories]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  function addTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction {
    const tx = dbAddTransaction(data);
    setTransactions((prev) => [tx, ...prev]);
    return tx;
  }

  function updateTransaction(
    id: string,
    data: Partial<Omit<Transaction, 'id' | 'createdAt'>>,
  ): void {
    dbUpdateTransaction(id, data);
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, ...data, updatedAt: Date.now() } : t,
      ),
    );
  }

  function deleteTransaction(id: string): void {
    dbDeleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  function addCategory(data: Omit<Category, 'id' | 'createdAt'>): Category {
    const cat = dbAddCategory(data);
    setCategories((prev) => [...prev, cat]);
    return cat;
  }

  function deleteCategory(id: string): void {
    dbDeleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  function setBudget(categoryId: string, amountCents: number): void {
    const budget = upsertBudget(categoryId, amountCents);
    setBudgets((prev) => {
      const existing = prev.findIndex((b) => b.categoryId === categoryId);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = budget;
        return next;
      }
      return [...prev, budget];
    });
  }

  function deleteBudget(categoryId: string): void {
    dbDeleteBudget(categoryId);
    setBudgets((prev) => prev.filter((b) => b.categoryId !== categoryId));
  }

  function addRecurring(
    data: Omit<RecurringItem, 'id' | 'createdAt' | 'updatedAt'>,
  ): RecurringItem {
    const item = dbAddRecurring(data);
    setRecurringItems((prev) => [...prev, item]);
    return item;
  }

  function updateRecurring(
    id: string,
    data: Partial<Omit<RecurringItem, 'id' | 'createdAt'>>,
  ): void {
    dbUpdateRecurring(id, data);
    setRecurringItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...data, updatedAt: Date.now() } : r)),
    );
  }

  function deleteRecurring(id: string): void {
    dbDeleteRecurring(id);
    setRecurringItems((prev) => prev.filter((r) => r.id !== id));
  }

  function addPaymentMethod(data: Omit<PaymentMethod, 'id' | 'createdAt'>): PaymentMethod {
    const m = dbAddPaymentMethod(data);
    setPaymentMethods((prev) => [...prev, m]);
    return m;
  }

  function deletePaymentMethod(id: string): void {
    dbDeletePaymentMethod(id);
    setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
  }

  const value: FinanceContextValue = {
    categories,
    paymentMethods,
    budgets,
    recurringItems,
    transactions,
    selectedYear,
    selectedMonth,
    setSelectedMonth,
    monthTransactions,
    monthlyIncome,
    monthlyExpenses,
    monthlyInvestment,
    monthlyNet,
    expenseCategoryTotals,
    budgetProgress,
    savingsRate,
    isLoading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    deleteCategory,
    setBudget,
    deleteBudget,
    addRecurring,
    updateRecurring,
    deleteRecurring,
    addPaymentMethod,
    deletePaymentMethod,
    refreshData: loadAll,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}

export function useCategoryById(id: string | null): Category | undefined {
  const { categories } = useFinance();
  return categories.find((c) => c.id === id);
}

export function usePaymentMethodById(id: string | null): PaymentMethod | undefined {
  const { paymentMethods } = useFinance();
  return paymentMethods.find((m) => m.id === id);
}

export function useTransactionsByType(type: TransactionType | 'all'): Transaction[] {
  const { transactions } = useFinance();
  if (type === 'all') return transactions;
  return transactions.filter((t) => t.type === type);
}
