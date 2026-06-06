import React, { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Screen } from '../../src/ui/Screen';
import { Button } from '../../src/ui/Button';
import { TextField } from '../../src/ui/TextField';
import { Icon } from '../../src/ui/Icon';
import { PasswordStrengthBar } from '../../src/ui/PasswordStrengthBar';
import { useTheme } from '../../src/ui/theme';
import { addEntry } from '../../src/storage/entries';
import { checkStrength } from '../../src/crypto/passwordStrength';

export default function AddEntry() {
  const theme = useTheme();
  const usernameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [label, setLabel] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const canSave = label.trim().length > 0 && password.length > 0;

  async function handleSave() {
    if (!canSave) return;
    setLoading(true);
    try {
      await addEntry({
        label: label.trim(),
        username: username.trim(),
        password,
      });
      router.back();
    } catch {
      setError('Failed to save — please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen keyboard>
      {/* ── Nav bar ── */}
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Icon name="chevron-down" size={26} color={theme.text} />
        </Pressable>
        <Text style={[styles.navTitle, { color: theme.text }]}>New password</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.delay(60).springify()}>
          <TextField
            label="Label"
            value={label}
            onChangeText={setLabel}
            placeholder="GitHub, Netflix, ATM PIN…"
            returnKeyType="next"
            onSubmitEditing={() => usernameRef.current?.focus()}
            autoFocus
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <TextField
            ref={usernameRef}
            label="Username (optional)"
            value={username}
            onChangeText={setUsername}
            placeholder="email or username"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).springify()}>
          <TextField
            ref={passwordRef}
            label="Password"
            secureEntry
            value={password}
            onChangeText={setPassword}
            placeholder="Enter or paste password"
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          {password.length > 0 && (
            <PasswordStrengthBar level={checkStrength(password)} />
          )}
        </Animated.View>

        {error ? (
          <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
        ) : null}
      </ScrollView>

      <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.footer}>
        <Button
          label="Save password"
          disabled={!canSave}
          loading={loading}
          onPress={handleSave}
        />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 28,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  form: {
    gap: 18,
    paddingBottom: 24,
  },
  error: {
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    paddingBottom: 40,
    paddingTop: 8,
  },
});
