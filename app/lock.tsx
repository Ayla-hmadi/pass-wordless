import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Screen } from '../src/ui/Screen';
import { Button } from '../src/ui/Button';
import { TextField } from '../src/ui/TextField';
import { Icon } from '../src/ui/Icon';
import { useTheme } from '../src/ui/theme';
import { useAuth } from '../src/auth/useAuthGate';

export default function Lock() {
  const theme = useTheme();
  const { securityType, unlock } = useAuth();

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  function shake() {
    shakeX.value = withSequence(
      withTiming(-14, { duration: 55 }),
      withTiming(14, { duration: 55 }),
      withTiming(-10, { duration: 55 }),
      withTiming(10, { duration: 55 }),
      withTiming(-6, { duration: 55 }),
      withTiming(0, { duration: 55 })
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  // Auto-prompt biometrics on mount
  useEffect(() => {
    if (securityType === 'biometric') {
      tryBiometric();
    }
  }, [securityType]);

  async function tryBiometric() {
    setLoading(true);
    setError('');
    const ok = await unlock();
    setLoading(false);
    if (ok) {
      router.replace('/vault');
    } else {
      setError('Authentication failed — tap to try again.');
    }
  }

  async function tryPassword() {
    if (!password.trim()) return;
    setLoading(true);
    setError('');
    const ok = await unlock(password);
    setLoading(false);
    if (ok) {
      router.replace('/vault');
    } else {
      setPassword('');
      setError('Incorrect password');
      shake();
    }
  }

  return (
    <Screen keyboard>
      <View style={styles.container}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.hero}>
          <View style={[styles.iconWrap, { backgroundColor: theme.surface }]}>
            <Icon name="lock-closed" size={42} color={theme.accent} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>pass-wordless</Text>
          <Text style={[styles.sub, { color: theme.muted }]}>Vault is locked</Text>
        </Animated.View>

        {securityType === 'biometric' ? (
          <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.biometric}>
            {error ? (
              <Text style={[styles.errorMsg, { color: theme.danger }]}>{error}</Text>
            ) : null}
            <Button
              label={loading ? 'Authenticating…' : 'Unlock with biometrics'}
              loading={loading}
              onPress={tryBiometric}
            />
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeIn.delay(200).duration(400)}
            style={[styles.passwordSection, shakeStyle]}
          >
            <TextField
              label="Master password"
              secureEntry
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              placeholder="Enter your master password"
              error={error}
              returnKeyType="done"
              onSubmitEditing={tryPassword}
              autoFocus
            />
            <Button
              label="Unlock"
              disabled={!password.trim() || loading}
              loading={loading}
              onPress={tryPassword}
            />
          </Animated.View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 48,
  },
  hero: {
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 15,
    fontWeight: '500',
  },
  biometric: {
    gap: 16,
  },
  errorMsg: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  passwordSection: {
    gap: 16,
  },
});
