import { useColorScheme } from 'react-native';
import { colors, spacing, radius, fontSize } from './tokens';

export interface Theme {
  bg: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentDim: string;
  success: string;
  successDim: string;
  danger: string;
  dangerDim: string;
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
}

function buildTheme(dark: boolean): Theme {
  return {
    bg: dark ? colors.bgDark : colors.bgLight,
    surface: dark ? colors.surfaceDark : colors.surfaceLight,
    border: dark ? colors.borderDark : colors.borderLight,
    text: dark ? colors.textPrimaryDark : colors.textPrimaryLight,
    muted: dark ? colors.textMutedDark : colors.textMutedLight,
    accent: colors.accent,
    accentDim: dark ? colors.accentDim : '#DDD8FF',
    success: colors.success,
    successDim: dark ? colors.successDim : '#D4F5E9',
    danger: colors.danger,
    dangerDim: dark ? colors.dangerDim : '#FFE0E0',
    spacing,
    radius,
    fontSize,
  };
}

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return buildTheme(scheme !== 'light');
}
