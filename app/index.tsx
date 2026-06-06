import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/auth/useAuthGate';
import { useTheme } from '../src/ui/theme';

export default function Index() {
  const { state } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    if (state === 'loading') return;
    if (state === 'setup') {
      router.replace('/onboarding/welcome');
    } else if (state === 'locked') {
      router.replace('/lock');
    } else {
      router.replace('/vault');
    }
  }, [state]);

  return (
    <View
      style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}
    >
      <ActivityIndicator color={theme.accent} size="large" />
    </View>
  );
}
