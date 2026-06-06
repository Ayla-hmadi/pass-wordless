import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from './theme';

type Variant = 'primary' | 'ghost' | 'danger';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: Variant;
  loading?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  onPress,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.96, { damping: 18, stiffness: 200 });
  }

  function handlePressOut() {
    scale.value = withSpring(1, { damping: 18, stiffness: 200 });
  }

  async function handlePress(e: Parameters<NonNullable<PressableProps['onPress']>>[0]) {
    if (loading || disabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(e);
  }

  const bgColor =
    variant === 'primary'
      ? theme.accent
      : variant === 'danger'
      ? theme.danger
      : 'transparent';

  const labelColor =
    variant === 'ghost' ? theme.accent : '#FFFFFF';

  const borderColor =
    variant === 'ghost' ? theme.accent : 'transparent';

  return (
    <AnimatedPressable
      style={[
        styles.base,
        animStyle,
        {
          backgroundColor: bgColor,
          borderColor,
          opacity: disabled || loading ? 0.45 : 1,
        },
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} size="small" />
      ) : (
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    borderWidth: 1.5,
    alignSelf: 'stretch',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
