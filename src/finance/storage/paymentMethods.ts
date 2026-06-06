import { randomUUID } from 'expo-crypto';
import { getDB } from '../../storage/db';
import type { PaymentMethod } from '../types';

const DEFAULT_METHODS: Omit<PaymentMethod, 'id' | 'createdAt'>[] = [
  { name: 'Cash', icon: 'cash-outline', isDefault: false },
  { name: 'Credit Card', icon: 'card-outline', isDefault: true },
  { name: 'Debit Card', icon: 'card-outline', isDefault: false },
  { name: 'Bank Transfer', icon: 'swap-horizontal-outline', isDefault: false },
];

function rowToMethod(row: Record<string, unknown>): PaymentMethod {
  return {
    id: row.id as string,
    name: row.name as string,
    icon: row.icon as string,
    isDefault: (row.is_default as number) === 1,
    createdAt: row.created_at as number,
  };
}

export function seedPaymentMethods(): void {
  const db = getDB();
  const existing = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM finance_payment_methods',
  );
  if (existing && existing.count > 0) return;

  const now = Date.now();
  for (const m of DEFAULT_METHODS) {
    db.runSync(
      'INSERT INTO finance_payment_methods (id, name, icon, is_default, created_at) VALUES (?, ?, ?, ?, ?)',
      [randomUUID(), m.name, m.icon, m.isDefault ? 1 : 0, now],
    );
  }
}

export function listPaymentMethods(): PaymentMethod[] {
  const db = getDB();
  const rows = db.getAllSync<Record<string, unknown>>(
    'SELECT * FROM finance_payment_methods ORDER BY name',
  );
  return rows.map(rowToMethod);
}

export function addPaymentMethod(data: Omit<PaymentMethod, 'id' | 'createdAt'>): PaymentMethod {
  const db = getDB();
  const id = randomUUID();
  const now = Date.now();
  db.runSync(
    'INSERT INTO finance_payment_methods (id, name, icon, is_default, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, data.name, data.icon, data.isDefault ? 1 : 0, now],
  );
  return { ...data, id, createdAt: now };
}

export function deletePaymentMethod(id: string): void {
  getDB().runSync('DELETE FROM finance_payment_methods WHERE id = ?', [id]);
}
