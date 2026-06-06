export const colors = {
  // Dark palette
  bgDark: '#0B0B0F',
  surfaceDark: '#16161C',
  borderDark: '#24242C',
  textPrimaryDark: '#F5F5F7',
  textMutedDark: '#9A9AA5',

  // Light palette
  bgLight: '#FAFAFA',
  surfaceLight: '#FFFFFF',
  borderLight: '#E6E6EC',
  textPrimaryLight: '#111113',
  textMutedLight: '#60606A',

  // Semantic
  accent: '#7C5CFF',
  accentDim: '#251C55',
  success: '#3DDC97',
  successDim: '#0D3325',
  danger: '#FF5D5D',
  dangerDim: '#3D1010',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const fontSize = {
  display: 32,
  title: 22,
  body: 16,
  small: 14,
  caption: 13,
} as const;
