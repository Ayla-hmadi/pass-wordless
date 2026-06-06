import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Screen } from '../../src/ui/Screen';
import { Button } from '../../src/ui/Button';
import { Icon } from '../../src/ui/Icon';
import { useTheme } from '../../src/ui/theme';

export default function Welcome() {
  const theme = useTheme();

  return (
    <Screen>
      <View style={styles.hero}>
        <Animated.View
          entering={FadeInDown.delay(80).springify()}
          style={[styles.iconWrap, { backgroundColor: theme.accentDim }]}
        >
          <Icon name="lock-closed" size={52} color={theme.accent} />
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.delay(180).springify()}
          style={[styles.title, { color: theme.text }]}
        >
          pass-wordless
        </Animated.Text>

        <Animated.Text
          entering={FadeInDown.delay(260).springify()}
          style={[styles.tagline, { color: theme.muted }]}
        >
          {'Your passwords.\nOn your device. Only yours.'}
        </Animated.Text>

        <Animated.View
          entering={FadeInDown.delay(340).springify()}
          style={[styles.pills, { borderColor: theme.border }]}
        >
          {['No cloud', 'No account', 'No tracking'].map((t) => (
            <View
              key={t}
              style={[styles.pill, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Icon name="checkmark" size={13} color={theme.success} />
              <Text style={[styles.pillText, { color: theme.muted }]}>{t}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      <Animated.View entering={FadeInUp.delay(420).springify()} style={styles.footer}>
        <Button
          label="Get started"
          onPress={() => router.replace('/onboarding/choose-security')}
        />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  tagline: {
    fontSize: 18,
    lineHeight: 27,
    textAlign: 'center',
    fontWeight: '400',
  },
  pills: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    paddingBottom: 40,
  },
});
