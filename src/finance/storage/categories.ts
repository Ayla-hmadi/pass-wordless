import { randomUUID } from 'expo-crypto';
import { getDB } from '../../storage/db';
import type { Category } from '../types';

const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt'>[] = [
  // Expenses
  { name: 'Housing', icon: 'home-outline', color: '#FF6B6B', type: 'expense', isCustom: false },
  { name: 'Food & Drink', icon: 'restaurant-outline', color: '#FF9F43', type: 'expense', isCustom: false },
  { name: 'Transport', icon: 'car-outline', color: '#54A0FF', type: 'expense', isCustom: false },
  { name: 'Utilities', icon: 'flash-outline', color: '#9B59B6', type: 'expense', isCustom: false },
  { name: 'Health', icon: 'heart-outline', color: '#FF6B81', type: 'expense', isCustom: false },
  { name: 'Entertainment', icon: 'film-outline', color: '#00D2D3', type: 'expense', isCustom: false },
  { name: 'Shopping', icon: 'bag-outline', color: '#F7C948', type: 'expense', isCustom: false },
  { name: 'Education', icon: 'book-outline', color: '#7BED9F', type: 'expense', isCustom: false },
  { name: 'Personal', icon: 'person-outline', color: '#EE5A24', type: 'expense', isCustom: false },
  { name: 'Travel', icon: 'airplane-outline', color: '#0984E3', type: 'expense', isCustom: false },
  { name: 'Subscriptions', icon: 'repeat-outline', color: '#7C5CFF', type: 'expense', isCustom: false },
  { name: 'Other', icon: 'ellipsis-horizontal-outline', color: '#636E72', type: 'expense', isCustom: false },
  // Income
  { name: 'Salary', icon: 'briefcase-outline', color: '#00B894', type: 'income', isCustom: false },
  { name: 'Freelance', icon: 'laptop-outline', color: '#0984E3', type: 'income', isCustom: false },
  { name: 'Returns', icon: 'trending-up-outline', color: '#E17055', type: 'income', isCustom: false },
  { name: 'Gift', icon: 'gift-outline', color: '#A29BFE', type: 'income', isCustom: false },
  { name: 'Other', icon: 'ellipsis-horizontal-outline', color: '#636E72', type: 'income', isCustom: false },
  // Investment
  { name: 'Stocks', icon: 'bar-chart-outline', color: '#00B894', type: 'investment', isCustom: false },
  { name: 'Crypto', icon: 'logo-bitcoin', color: '#F9CA24', type: 'investment', isCustom: false },
  { name: 'Real Estate', icon: 'business-outline', color: '#E17055', type: 'investment', isCustom: false },
  { name: 'ETF / Funds', icon: 'pie-chart-outline', color: '#74B9FF', type: 'investment', isCustom: false },
  { name: 'Bonds', icon: 'document-text-outline', color: '#55EFC4', type: 'investment', isCustom: false },
  { name: 'Other', icon: 'ellipsis-horizontal-outline', color: '#636E72', type: 'investment', isCustom: false },
];

function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    name: row.name as string,
    icon: row.icon as string,
    color: row.color as string,
    type: row.type as Category['type'],
    isCustom: (row.is_custom as number) === 1,
    createdAt: row.created_at as number,
  };
}

export function seedCategories(): void {
  const db = getDB();
  const existing = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM finance_categories',
  );
  if (existing && existing.count > 0) return;

  const now = Date.now();
  for (const cat of DEFAULT_CATEGORIES) {
    db.runSync(
      'INSERT INTO finance_categories (id, name, icon, color, type, is_custom, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [randomUUID(), cat.name, cat.icon, cat.color, cat.type, cat.isCustom ? 1 : 0, now],
    );
  }
}

export function listCategories(): Category[] {
  const db = getDB();
  const rows = db.getAllSync<Record<string, unknown>>(
    'SELECT * FROM finance_categories ORDER BY type, name',
  );
  return rows.map(rowToCategory);
}

export function addCategory(data: Omit<Category, 'id' | 'createdAt'>): Category {
  const db = getDB();
  const id = randomUUID();
  const now = Date.now();
  db.runSync(
    'INSERT INTO finance_categories (id, name, icon, color, type, is_custom, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, data.name, data.icon, data.color, data.type, data.isCustom ? 1 : 0, now],
  );
  return { ...data, id, createdAt: now };
}

export function deleteCategory(id: string): void {
  getDB().runSync('DELETE FROM finance_categories WHERE id = ? AND is_custom = 1', [id]);
}
