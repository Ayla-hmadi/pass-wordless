import { randomUUID } from 'expo-crypto';
import { getDB } from '../../storage/db';
import type { SavingsContribution } from '../types';

function rowToContribution(row: Record<string, unknown>): SavingsContribution {
  return {
    id: row.id as string,
    goalId: row.goal_id as string,
    amountCents: row.amount_cents as number,
    notes: (row.notes as string | null) ?? null,
    date: row.date as number,
    createdAt: row.created_at as number,
  };
}

export function listContributions(): SavingsContribution[] {
  const rows = getDB().getAllSync<Record<string, unknown>>(
    'SELECT * FROM savings_contributions ORDER BY date DESC, created_at DESC',
  );
  return rows.map(rowToContribution);
}

export function addContribution(
  goalId: string,
  amountCents: number,
  notes: string | null,
  date: number,
): SavingsContribution {
  const db = getDB();
  const id = randomUUID();
  const now = Date.now();
  db.runSync(
    `INSERT INTO savings_contributions (id, goal_id, amount_cents, notes, date, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, goalId, amountCents, notes ?? null, date, now],
  );
  return { id, goalId, amountCents, notes, date, createdAt: now };
}

export function deleteContribution(id: string): void {
  getDB().runSync('DELETE FROM savings_contributions WHERE id = ?', [id]);
}
