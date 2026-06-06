import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from './theme';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  keyboard?: boolean;
}

export function Screen({ children, style, keyboard = false }: ScreenProps) {
  const theme = useTheme();

  const inner = (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.bg }, style]}
    >
      {children}
    </SafeAreaView>
  );

  if (keyboard) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {inner}
      </KeyboardAvoidingView>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 20,
  },
});
