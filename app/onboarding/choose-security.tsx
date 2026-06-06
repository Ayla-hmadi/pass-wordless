import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen } from '../../src/ui/Screen';
import { Button } from '../../src/ui/Button';
import { TextField } from '../../src/ui/TextField';
import { Icon } from '../../src/ui/Icon';
import { useTheme } from '../../src/ui/theme';
import { getBiometricInfo, type BiometricInfo } from '../../src/auth/biometric';
import { useAuth } from '../../src/auth/useAuthGate';
import type { SecurityType } from '../../src/types';

type Choice = SecurityType | null;

export default function ChooseSecurity() {
  const theme = useTheme();
  const { completeSetup } = useAuth();

  const [biometricInfo, setBiometricInfo] = useState<BiometricInfo | null>(null);
  const [choice, setChoice] = useState<Choice>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getBiometricInfo().then(setBiometricInfo);
  }, []);

  const biometricReady = biometricInfo?.available && biometricInfo?.enrolled;

  function clearError() {
    if (error) setError('');
  }

  function validate(): string | null {
    if (choice === 'password') {
      if (password.length < 10) return 'Password must be at least 10 characters';
      if (password !== confirm) return 'Passwords do not match';
    }
    return null;
  }

  const canContinue =
    choice === 'biometric' ||
    (choice === 'password' && password.length >= 10 && password === confirm);

  async function handleContinue() {
    const err = validate();
    if (err) { setError(err); return; }
    if (!choice) return;
    setLoading(true);
    try {
      await completeSetup(choice, choice === 'password' ? password : undefined);
      router.replace('/vault');
    } catch {
      setError('Setup failed — please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen keyboard>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.Text entering={FadeInDown.delay(60).springify()} style={[styles.heading, { color: theme.text }]}>
          Choose your lock
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(120).springify()} style={[styles.sub, { color: theme.muted }]}>
          How should we protect your vault?
        </Animated.Text>

        <View style={styles.options}>
          {/* ── Biometric option ── */}
          <Animated.View entering={FadeInDown.delay(180).springify()}>
            <Pressable
              style={[
                styles.option,
                {
                  backgroundColor: theme.surface,
                  borderColor: choice === 'biometric' ? theme.accent : theme.border,
                  opacity: biometricReady ? 1 : 0.42,
                },
              ]}
              disabled={!biometricReady}
              onPress={() => { setChoice('biometric'); clearError(); }}
            >
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor:
                      choice === 'biometric' ? theme.accentDim : theme.border,
                  },
                ]}
              >
                <Icon
                  name="finger-print"
                  size={28}
                  color={choice === 'biometric' ? theme.accent : theme.muted}
                />
              </View>

              <View style={styles.optionBody}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>
                  {biometricInfo?.label ?? 'Biometrics'}
                </Text>
                <Text style={[styles.optionDesc, { color: theme.muted }]}>
                  {biometricReady
                    ? 'Fast, hardware-secured unlock'
                    : 'Not available or not enrolled on this device'}
                </Text>
              </View>

              {choice === 'biometric' && (
                <Icon name="checkmark-circle" size={22} color={theme.accent} />
              )}
            </Pressable>
          </Animated.View>

          {/* ── Password option ── */}
          <Animated.View entering={FadeInDown.delay(240).springify()}>
            <Pressable
              style={[
                styles.option,
                {
                  backgroundColor: theme.surface,
                  borderColor: choice === 'password' ? theme.accent : theme.border,
                },
              ]}
              onPress={() => { setChoice('password'); clearError(); }}
            >
              <View
                style={[
                  styles.optionIcon,
                  {
                    backgroundColor:
                      choice === 'password' ? theme.accentDim : theme.border,
                  },
                ]}
              >
                <Icon
                  name="key"
                  size={28}
                  color={choice === 'password' ? theme.accent : theme.muted}
                />
              </View>

              <View style={styles.optionBody}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>
                  Master password
                </Text>
                <Text style={[styles.optionDesc, { color: theme.muted }]}>
                  A strong password only you know
                </Text>
              </View>

              {choice === 'password' && (
                <Icon name="checkmark-circle" size={22} color={theme.accent} />
              )}
            </Pressable>
          </Animated.View>

          {/* ── Inline password fields ── */}
          {choice === 'password' && (
            <Animated.View entering={FadeInDown.springify()} style={styles.fields}>
              <TextField
                label="Master password"
                secureEntry
                value={password}
                onChangeText={(t) => { setPassword(t); clearError(); }}
                placeholder="At least 10 characters"
                returnKeyType="next"
              />
              <TextField
                label="Confirm password"
                secureEntry
                value={confirm}
                onChangeText={(t) => { setConfirm(t); clearError(); }}
                placeholder="Repeat your password"
                returnKeyType="done"
              />
            </Animated.View>
          )}

          {error ? (
            <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Continue"
          disabled={!canContinue}
          loading={loading}
          onPress={handleContinue}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: 36,
    paddingBottom: 24,
    gap: 8,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  sub: {
    fontSize: 16,
    marginBottom: 24,
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBody: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 3,
  },
  optionDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  fields: {
    gap: 12,
    marginTop: 4,
  },
  error: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  footer: {
    paddingBottom: 40,
    paddingTop: 12,
  },
});
