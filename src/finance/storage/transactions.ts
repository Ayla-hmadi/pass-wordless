import { randomUUID } from 'expo-crypto';
import { getDB } from '../../storage/db';
import type { Transaction } from '../types';

function rowToTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    type: row.type as Transaction['type'],
    amountCents: row.amount_cents as number,
    currency: row.currency as string,
    categoryId: row.category_id as string,
    paymentMethodId: (row.payment_method_id as string | null) ?? null,
    label: row.label as string,
    notes: (row.notes as string | null) ?? null,
    date: row.date as number,
    isRecurring: (row.is_recurring as number) === 1,
    recurringId: (row.recurring_id as string | null) ?? null,
    investmentPlatform: (row.investment_platform as string | null) ?? null,
    investmentUrl: (row.investment_url as string | null) ?? null,
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
  };
}

export function listTransactions(): Transaction[] {
  const rows = getDB().getAllSync<Record<string, unknown>>(
    'SELECT * FROM finance_transactions ORDER BY date DESC, created_at DESC',
  );
  return rows.map(rowToTransaction);
}

export function addTransaction(
  data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
): Transaction {
  const db = getDB();
  const id = randomUUID();
  const now = Date.now();
  db.runSync(
    `INSERT INTO finance_transactions
      (id, type, amount_cents, currency, category_id, payment_method_id,
       label, notes, date, is_recurring, recurring_id,
       investment_platform, investment_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.type,
      data.amountCents,
      data.currency,
      data.categoryId,
      data.paymentMethodId ?? null,
      data.label,
      data.notes ?? null,
      data.date,
      data.isRecurring ? 1 : 0,
      data.recurringId ?? null,
      data.investmentPlatform ?? null,
      data.investmentUrl ?? null,
      now,
      now,
    ],
  );
  return { ...data, id, createdAt: now, updatedAt: now };
}

export function updateTransaction(
  id: string,
  data: Partial<Omit<Transaction, 'id' | 'createdAt'>>,
): void {
  const now = Date.now();
  const db = getDB();
  const existing = db.getFirstSync<Record<string, unknown>>(
    'SELECT * FROM finance_transactions WHERE id = ?',
    [id],
  );
  if (!existing) return;
  db.runSync(
    `UPDATE finance_transactions SET
      type = ?, amount_cents = ?, category_id = ?,
      payment_method_id = ?, label = ?, notes = ?,
      date = ?, is_recurring = ?, investment_platform = ?,
      investment_url = ?, updated_at = ?
     WHERE id = ?`,
    [
      data.type ?? existing.type,
      data.amountCents ?? existing.amount_cents,
      data.categoryId ?? existing.category_id,
      'paymentMethodId' in data ? (data.paymentMethodId ?? null) : existing.payment_method_id,
      data.label ?? existing.label,
      'notes' in data ? (data.notes ?? null) : existing.notes,
      data.date ?? existing.date,
      data.isRecurring !== undefined ? (data.isRecurring ? 1 : 0) : existing.is_recurring,
      'investmentPlatform' in data ? (data.investmentPlatform ?? null) : existing.investment_platform,
      'investmentUrl' in data ? (data.investmentUrl ?? null) : existing.investment_url,
      now,
      id,
    ],
  );
}

export function deleteTransaction(id: string): void {
  getDB().runSync('DELETE FROM finance_transactions WHERE id = ?', [id]);
}
