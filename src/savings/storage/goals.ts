import { randomUUID } from 'expo-crypto';
import { getDB } from '../../storage/db';
import type { SavingsGoal } from '../types';

function rowToGoal(row: Record<string, unknown>): SavingsGoal {
  return {
    id: row.id as string,
    name: row.name as string,
    icon: row.icon as string,
    color: row.color as string,
    targetCents: row.target_cents as number,
    deadline: (row.deadline as number | null) ?? null,
    isCompleted: (row.is_completed as number) === 1,
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
  };
}

export function listGoals(): SavingsGoal[] {
  const rows = getDB().getAllSync<Record<string, unknown>>(
    'SELECT * FROM savings_goals ORDER BY is_completed ASC, created_at ASC',
  );
  return rows.map(rowToGoal);
}

export function addGoal(data: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>): SavingsGoal {
  const db = getDB();
  const id = randomUUID();
  const now = Date.now();
  db.runSync(
    `INSERT INTO savings_goals (id, name, icon, color, target_cents, deadline, is_completed, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.name, data.icon, data.color, data.targetCents, data.deadline ?? null, data.isCompleted ? 1 : 0, now, now],
  );
  return { ...data, id, createdAt: now, updatedAt: now };
}

export function updateGoal(
  id: string,
  data: Partial<Omit<SavingsGoal, 'id' | 'createdAt'>>,
): void {
  const db = getDB();
  const existing = db.getFirstSync<Record<string, unknown>>(
    'SELECT * FROM savings_goals WHERE id = ?',
    [id],
  );
  if (!existing) return;
  const now = Date.now();
  db.runSync(
    `UPDATE savings_goals SET
      name = ?, icon = ?, color = ?, target_cents = ?,
      deadline = ?, is_completed = ?, updated_at = ?
     WHERE id = ?`,
    [
      data.name ?? existing.name,
      data.icon ?? existing.icon,
      data.color ?? existing.color,
      data.targetCents ?? existing.target_cents,
      'deadline' in data ? (data.deadline ?? null) : existing.deadline,
      data.isCompleted !== undefined ? (data.isCompleted ? 1 : 0) : existing.is_completed,
      now,
      id,
    ],
  );
}

export function deleteGoal(id: string): void {
  const db = getDB();
  db.runSync('DELETE FROM savings_contributions WHERE goal_id = ?', [id]);
  db.runSync('DELETE FROM savings_goals WHERE id = ?', [id]);
}
