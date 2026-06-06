export interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetCents: number;
  deadline: number | null;
  isCompleted: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SavingsContribution {
  id: string;
  goalId: string;
  amountCents: number;
  notes: string | null;
  date: number;
  createdAt: number;
}

export interface SavingsGoalWithProgress extends SavingsGoal {
  savedCents: number;
  remainingCents: number;
  percentage: number;
}

export const SAVINGS_ICONS = [
  { icon: 'shield-checkmark-outline', label: 'Emergency' },
  { icon: 'home-outline', label: 'Home' },
  { icon: 'car-outline', label: 'Car' },
  { icon: 'airplane-outline', label: 'Travel' },
  { icon: 'school-outline', label: 'Education' },
  { icon: 'laptop-outline', label: 'Tech' },
  { icon: 'phone-portrait-outline', label: 'Phone' },
  { icon: 'medical-outline', label: 'Health' },
  { icon: 'gift-outline', label: 'Gift' },
  { icon: 'diamond-outline', label: 'Luxury' },
  { icon: 'trophy-outline', label: 'Goal' },
  { icon: 'heart-outline', label: 'Personal' },
  { icon: 'bicycle-outline', label: 'Bicycle' },
  { icon: 'cash-outline', label: 'Cash' },
  { icon: 'flag-outline', label: 'Milestone' },
  { icon: 'star-outline', label: 'Special' },
] as const;

export const SAVINGS_COLORS = [
  '#7C5CFF',
  '#3DDC97',
  '#54A0FF',
  '#FF6B6B',
  '#FF9F43',
  '#F7C948',
  '#00D2D3',
  '#A29BFE',
  '#EE5A24',
  '#0984E3',
] as const;
