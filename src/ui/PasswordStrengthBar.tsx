import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { getStrengthInfo, type StrengthLevel } from '../crypto/passwordStrength';
import { useTheme } from './theme';

interface Props {
  level: StrengthLevel;
  compact?: boolean; // shorter label, used inside entry cards
}

const TOTAL_SEGMENTS = 4;

export function PasswordStrengthBar({ level, compact = false }: Props) {
  const theme = useTheme();
  const info = getStrengthInfo(level);

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
      <View style={styles.bars}>
        {Array.from({ length: TOTAL_SEGMENTS }, (_, i) => {
          const active = i < info.segments;
          return (
            <View
              key={i}
              style={[
                styles.bar,
                { backgroundColor: active ? info.color : theme.border },
              ]}
            />
          );
        })}
      </View>
      <Text
        style={[
          styles.label,
          { color: info.color },
          compact && styles.labelCompact,
        ]}
      >
        {compact ? info.label.split(' ')[0] : info.label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  bars: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  bar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 64,
    textAlign: 'right',
  },
  labelCompact: {
    minWidth: 42,
    fontSize: 11,
  },
});
