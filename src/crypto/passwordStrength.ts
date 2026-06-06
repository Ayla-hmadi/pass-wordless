export type StrengthLevel = 'weak' | 'fair' | 'strong' | 'very-strong';

export interface StrengthInfo {
  level: StrengthLevel;
  label: string;
  color: string;
  segments: number; // 1-4, for the bar
}

const INFO: Record<StrengthLevel, Omit<StrengthInfo, 'level'>> = {
  'weak':        { label: 'Weak',        color: '#FF5D5D', segments: 1 },
  'fair':        { label: 'Fair',        color: '#FF9F0A', segments: 2 },
  'strong':      { label: 'Strong',      color: '#3DDC97', segments: 3 },
  'very-strong': { label: 'Very strong', color: '#3DDC97', segments: 4 },
};

export function getStrengthInfo(level: StrengthLevel): StrengthInfo {
  return { level, ...INFO[level] };
}

export function checkStrength(password: string): StrengthLevel {
  if (!password || password.length < 8) return 'weak';

  let score = 0;

  // Length bonuses
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // Character variety
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Penalise trivially repetitive passwords (e.g. "aaaaaaaa", "12341234")
  if (/^(.)\1+$/.test(password)) score -= 3;

  if (score <= 1) return 'weak';
  if (score <= 3) return 'fair';
  if (score <= 5) return 'strong';
  return 'very-strong';
}
