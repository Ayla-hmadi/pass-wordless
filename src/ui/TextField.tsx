import React, { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Icon } from './Icon';
import { useTheme } from './theme';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
  secureEntry?: boolean;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(
  ({ label, error, secureEntry = false, ...rest }, ref) => {
    const theme = useTheme();
    const [hidden, setHidden] = useState(secureEntry);
    const [focused, setFocused] = useState(false);

    return (
      <View style={styles.wrapper}>
        <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
        <View
          style={[
            styles.row,
            {
              backgroundColor: theme.surface,
              borderColor: error
                ? theme.danger
                : focused
                ? theme.accent
                : theme.border,
            },
          ]}
        >
          <TextInput
            ref={ref}
            style={[styles.input, { color: theme.text }]}
            secureTextEntry={hidden}
            placeholderTextColor={theme.muted}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            {...rest}
          />
          {secureEntry && (
            <Pressable
              onPress={() => setHidden((h) => !h)}
              style={styles.eyeBtn}
              hitSlop={8}
            >
              <Icon
                name={hidden ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={theme.muted}
              />
            </Pressable>
          )}
        </View>
        {error ? (
          <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
        ) : null}
      </View>
    );
  }
);

TextField.displayName = 'TextField';

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  error: {
    fontSize: 12,
    fontWeight: '500',
  },
});
