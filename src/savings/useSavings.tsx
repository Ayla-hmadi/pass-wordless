import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { SavingsGoal, SavingsContribution, SavingsGoalWithProgress } from './types';
import {
  listGoals,
  addGoal as dbAddGoal,
  updateGoal as dbUpdateGoal,
  deleteGoal as dbDeleteGoal,
} from './storage/goals';
import {
  listContributions,
  addContribution as dbAddContribution,
  deleteContribution as dbDeleteContribution,
} from './storage/contributions';

interface SavingsContextValue {
  goals: SavingsGoalWithProgress[];
  contributions: SavingsContribution[];
  totalSaved: number;
  totalTarget: number;
  overallPercentage: number;
  isLoading: boolean;

  addGoal: (data: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => SavingsGoal;
  updateGoal: (id: string, data: Partial<Omit<SavingsGoal, 'id' | 'createdAt'>>) => void;
  deleteGoal: (id: string) => void;
  completeGoal: (id: string) => void;

  addContribution: (
    goalId: string,
    amountCents: number,
    notes: string | null,
    date: number,
  ) => SavingsContribution;
  deleteContribution: (id: string) => void;

  getGoalContributions: (goalId: string) => SavingsContribution[];
  getGoalById: (id: string) => SavingsGoalWithProgress | undefined;
}

const SavingsContext = createContext<SavingsContextValue | null>(null);

export function SavingsProvider({ children }: { children: React.ReactNode }) {
  const [rawGoals, setRawGoals] = useState<SavingsGoal[]>([]);
  const [contributions, setContributions] = useState<SavingsContribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAll = useCallback(() => {
    try {
      setRawGoals(listGoals());
      setContributions(listContributions());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Enrich goals with computed progress
  const goals = useMemo((): SavingsGoalWithProgress[] => {
    return rawGoals.map((goal) => {
      const savedCents = contributions
        .filter((c) => c.goalId === goal.id)
        .reduce((s, c) => s + c.amountCents, 0);
      const remainingCents = Math.max(goal.targetCents - savedCents, 0);
      const percentage =
        goal.targetCents > 0 ? Math.min((savedCents / goal.targetCents) * 100, 100) : 0;
      return { ...goal, savedCents, remainingCents, percentage };
    });
  }, [rawGoals, contributions]);

  const activeGoals = useMemo(() => goals.filter((g) => !g.isCompleted), [goals]);

  const totalSaved = useMemo(
    () => activeGoals.reduce((s, g) => s + g.savedCents, 0),
    [activeGoals],
  );

  const totalTarget = useMemo(
    () => activeGoals.reduce((s, g) => s + g.targetCents, 0),
    [activeGoals],
  );

  const overallPercentage = useMemo(
    () => (totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0),
    [totalSaved, totalTarget],
  );

  // ── Actions ─────────────────────────────────────────────────────────────────

  function addGoal(data: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>): SavingsGoal {
    const goal = dbAddGoal(data);
    setRawGoals((prev) => [...prev, goal]);
    return goal;
  }

  function updateGoal(id: string, data: Partial<Omit<SavingsGoal, 'id' | 'createdAt'>>): void {
    dbUpdateGoal(id, data);
    setRawGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...data, updatedAt: Date.now() } : g)),
    );
  }

  function deleteGoal(id: string): void {
    dbDeleteGoal(id);
    setRawGoals((prev) => prev.filter((g) => g.id !== id));
    setContributions((prev) => prev.filter((c) => c.goalId !== id));
  }

  function completeGoal(id: string): void {
    updateGoal(id, { isCompleted: true });
  }

  function addContribution(
    goalId: string,
    amountCents: number,
    notes: string | null,
    date: number,
  ): SavingsContribution {
    const c = dbAddContribution(goalId, amountCents, notes, date);
    setContributions((prev) => [c, ...prev]);
    return c;
  }

  function deleteContribution(id: string): void {
    dbDeleteContribution(id);
    setContributions((prev) => prev.filter((c) => c.id !== id));
  }

  function getGoalContributions(goalId: string): SavingsContribution[] {
    return contributions.filter((c) => c.goalId === goalId);
  }

  function getGoalById(id: string): SavingsGoalWithProgress | undefined {
    return goals.find((g) => g.id === id);
  }

  const value: SavingsContextValue = {
    goals,
    contributions,
    totalSaved,
    totalTarget,
    overallPercentage,
    isLoading,
    addGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    addContribution,
    deleteContribution,
    getGoalContributions,
    getGoalById,
  };

  return <SavingsContext.Provider value={value}>{children}</SavingsContext.Provider>;
}

export function useSavings(): SavingsContextValue {
  const ctx = useContext(SavingsContext);
  if (!ctx) throw new Error('useSavings must be used within SavingsProvider');
  return ctx;
}
