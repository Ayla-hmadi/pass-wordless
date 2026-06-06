import type { TransactionFrequency } from './types';

export function formatCurrency(cents: number, showSign = false): string {
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const centsStr = String(abs % 100).padStart(2, '0');
  const dollarsFormatted = dollars.toLocaleString('en-US');
  const formatted = `$${dollarsFormatted}.${centsStr}`;
  if (showSign && cents > 0) return `+${formatted}`;
  if (cents < 0) return `-${formatted}`;
  return formatted;
}

export function formatMonth(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
}

export function formatMonthShort(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleString('default', {
    month: 'short',
    year: 'numeric',
  });
}

export function formatDate(epochMs: number): string {
  const d = new Date(epochMs);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateFull(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getMonthRange(year: number, month: number): { start: number; end: number } {
  const start = new Date(year, month, 1, 0, 0, 0, 0).getTime();
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
  return { start, end };
}

export function parseCents(input: string): number {
  const cleaned = input.replace(/[^0-9.]/g, '');
  if (!cleaned) return 0;
  const value = parseFloat(cleaned);
  if (isNaN(value)) return 0;
  return Math.round(value * 100);
}

export function centsToInputString(cents: number): string {
  const abs = Math.abs(cents);
  return (abs / 100).toFixed(2);
}

export function nextDueDateFromFrequency(
  frequency: TransactionFrequency,
  fromDate: number,
): number {
  const d = new Date(fromDate);
  switch (frequency) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'biweekly':
      d.setDate(d.getDate() + 14);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d.getTime();
}

export function frequencyLabel(f: TransactionFrequency): string {
  const labels: Record<TransactionFrequency, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Every 2 weeks',
    monthly: 'Monthly',
    yearly: 'Yearly',
  };
  return labels[f];
}

export function prevMonth(year: number, month: number): { year: number; month: number } {
  if (month === 0) return { year: year - 1, month: 11 };
  return { year, month: month - 1 };
}

export function nextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 11) return { year: year + 1, month: 0 };
  return { year, month: month + 1 };
}

export function isCurrentOrPastMonth(year: number, month: number): boolean {
  const now = new Date();
  return year < now.getFullYear() || (year === now.getFullYear() && month <= now.getMonth());
}

export function getLast6Months(): Array<{ year: number; month: number }> {
  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return result;
}
