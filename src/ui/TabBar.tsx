import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Icon } from './Icon';
import { useTheme } from './theme';

export type TabName = 'vault' | 'finance';

const TABS: Array<{
  name: TabName;
  label: string;
  icon: string;
  iconOff: string;
  route: string;
}> = [
  { name: 'vault', label: 'Vault', icon: 'key', iconOff: 'key-outline', route: '/vault' },
  { name: 'finance', label: 'Finance', icon: 'wallet', iconOff: 'wallet-outline', route: '/finance' },
];

interface TabBarProps {
  active: TabName;
}

export function TabBar({ active }: TabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  async function handlePress(tab: (typeof TABS)[0]) {
    if (tab.name === active) return;
    await Haptics.selectionAsync();
    router.replace(tab.route as Parameters<typeof router.replace>[0]);
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = tab.name === active;
        return (
          <Pressable
            key={tab.name}
            onPress={() => handlePress(tab)}
            style={styles.tab}
            hitSlop={8}
          >
            <Icon
              name={(isActive ? tab.icon : tab.iconOff) as React.ComponentProps<typeof Icon>['name']}
              size={23}
              color={isActive ? theme.accent : theme.muted}
            />
            <Text
              style={[
                styles.label,
                { color: isActive ? theme.accent : theme.muted },
                isActive && styles.labelActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  labelActive: {
    fontWeight: '700',
  },
});
