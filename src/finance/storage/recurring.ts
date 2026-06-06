import { randomUUID } from 'expo-crypto';
import { getDB } from '../../storage/db';
import type { RecurringItem } from '../types';

function rowToRecurring(row: Record<string, unknown>): RecurringItem {
  return {
    id: row.id as string,
    type: row.type as RecurringItem['type'],
    amountCents: row.amount_cents as number,
    currency: row.currency as string,
    categoryId: row.category_id as string,
    paymentMethodId: (row.payment_method_id as string | null) ?? null,
    label: row.label as string,
    notes: (row.notes as string | null) ?? null,
    frequency: row.frequency as RecurringItem['frequency'],
    startDate: row.start_date as number,
    nextDueDate: row.next_due_date as number,
    isActive: (row.is_active as number) === 1,
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
  };
}

export function listRecurring(): RecurringItem[] {
  const rows = getDB().getAllSync<Record<string, unknown>>(
    'SELECT * FROM finance_recurring ORDER BY next_due_date',
  );
  return rows.map(rowToRecurring);
}

export function addRecurring(
  data: Omit<RecurringItem, 'id' | 'createdAt' | 'updatedAt'>,
): RecurringItem {
  const db = getDB();
  const id = randomUUID();
  const now = Date.now();
  db.runSync(
    `INSERT INTO finance_recurring
      (id, type, amount_cents, currency, category_id, payment_method_id,
       label, notes, frequency, start_date, next_due_date, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.type,
      data.amountCents,
      data.currency,
      data.categoryId,
      data.paymentMethodId ?? null,
      data.label,
      data.notes ?? null,
      data.frequency,
      data.startDate,
      data.nextDueDate,
      data.isActive ? 1 : 0,
      now,
      now,
    ],
  );
  return { ...data, id, createdAt: now, updatedAt: now };
}

export function updateRecurring(
  id: string,
  data: Partial<Omit<RecurringItem, 'id' | 'createdAt'>>,
): void {
  const now = Date.now();
  const db = getDB();
  const existing = db.getFirstSync<Record<string, unknown>>(
    'SELECT * FROM finance_recurring WHERE id = ?',
    [id],
  );
  if (!existing) return;
  db.runSync(
    `UPDATE finance_recurring SET
      is_active = ?, next_due_date = ?, amount_cents = ?,
      label = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
    [
      data.isActive !== undefined ? (data.isActive ? 1 : 0) : existing.is_active,
      data.nextDueDate ?? existing.next_due_date,
      data.amountCents ?? existing.amount_cents,
      data.label ?? existing.label,
      'notes' in data ? (data.notes ?? null) : existing.notes,
      now,
      id,
    ],
  );
}

export function deleteRecurring(id: string): void {
  getDB().runSync('DELETE FROM finance_recurring WHERE id = ?', [id]);
}
