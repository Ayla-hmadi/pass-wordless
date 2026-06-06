import { randomUUID } from 'expo-crypto';
import { getDB } from '../../storage/db';
import type { Budget } from '../types';

function rowToBudget(row: Record<string, unknown>): Budget {
  return {
    id: row.id as string,
    categoryId: row.category_id as string,
    amountCents: row.amount_cents as number,
    period: 'monthly',
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
  };
}

export function listBudgets(): Budget[] {
  const rows = getDB().getAllSync<Record<string, unknown>>(
    'SELECT * FROM finance_budgets ORDER BY created_at',
  );
  return rows.map(rowToBudget);
}

export function upsertBudget(categoryId: string, amountCents: number): Budget {
  const db = getDB();
  const now = Date.now();
  const existing = db.getFirstSync<Record<string, unknown>>(
    'SELECT * FROM finance_budgets WHERE category_id = ?',
    [categoryId],
  );
  if (existing) {
    db.runSync(
      'UPDATE finance_budgets SET amount_cents = ?, updated_at = ? WHERE category_id = ?',
      [amountCents, now, categoryId],
    );
    return rowToBudget({ ...existing, amount_cents: amountCents, updated_at: now });
  }
  const id = randomUUID();
  db.runSync(
    `INSERT INTO finance_budgets (id, category_id, amount_cents, period, created_at, updated_at)
     VALUES (?, ?, ?, 'monthly', ?, ?)`,
    [id, categoryId, amountCents, now, now],
  );
  return { id, categoryId, amountCents, period: 'monthly', createdAt: now, updatedAt: now };
}

export function deleteBudget(categoryId: string): void {
  getDB().runSync('DELETE FROM finance_budgets WHERE category_id = ?', [categoryId]);
}
