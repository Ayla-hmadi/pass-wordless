import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInRight,
  FadeInDown,
  Layout,
} from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/ui/Button';
import { Icon } from '../../src/ui/Icon';
import { TabBar } from '../../src/ui/TabBar';
import { PasswordStrengthBar } from '../../src/ui/PasswordStrengthBar';
import { useTheme } from '../../src/ui/theme';
import { useAuth } from '../../src/auth/useAuthGate';
import { listEntries } from '../../src/storage/entries';
import { checkStrength } from '../../src/crypto/passwordStrength';
import type { Entry } from '../../src/types';

const COPY_CLEAR_MS = 30_000;

export default function VaultHome() {
  const theme = useTheme();
  const { lock } = useAuth();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      try {
        setEntries(listEntries());
      } catch {
        // vault locked — shouldn't reach this screen; index will redirect
      }
    }, [])
  );

  async function handleCopy(entry: Entry) {
    await Clipboard.setStringAsync(entry.password);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopiedId(entry.id);
    setTimeout(() => {
      Clipboard.setStringAsync('');
      setCopiedId((prev) => (prev === entry.id ? null : prev));
    }, COPY_CLEAR_MS);
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function handleLock() {
    lock();
    router.replace('/lock');
  }

  const initials = (label: string) => label.trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.bg }]}
        edges={['top', 'left', 'right']}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            pass-wordless
          </Text>
          <View style={styles.headerRight}>
            <Pressable onPress={handleLock} style={styles.iconBtn} hitSlop={12}>
              <Icon name="lock-closed-outline" size={21} color={theme.muted} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/vault/add')}
              style={[styles.addBtn, { backgroundColor: theme.accent }]}
              hitSlop={8}
            >
              <Icon name="add" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {entries.length === 0 ? (
          /* ── Empty state ── */
          <View style={styles.empty}>
            <Animated.View
              entering={FadeIn.duration(500)}
              style={[styles.emptyIconWrap, { backgroundColor: theme.surface }]}
            >
              <Icon name="key-outline" size={52} color={theme.muted} />
            </Animated.View>
            <Animated.Text
              entering={FadeInDown.delay(100).springify()}
              style={[styles.emptyTitle, { color: theme.text }]}
            >
              No passwords yet
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.delay(180).springify()}
              style={[styles.emptyDesc, { color: theme.muted }]}
            >
              Tap + to add your first entry.
            </Animated.Text>
            <Animated.View entering={FadeInDown.delay(260).springify()} style={styles.emptyBtn}>
              <Button
                label="Add password"
                onPress={() => router.push('/vault/add')}
              />
            </Animated.View>
          </View>
        ) : (
          /* ── Entry list ── */
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item, index }) => {
              const expanded = expandedId === item.id;
              const copied = copiedId === item.id;
              return (
                <Animated.View
                  entering={FadeInRight.delay(index * 45).springify()}
                  layout={Layout.springify()}
                >
                  <Pressable
                    onPress={() => toggleExpand(item.id)}
                    style={[
                      styles.card,
                      {
                        backgroundColor: theme.surface,
                        borderColor: expanded ? theme.accent : theme.border,
                      },
                    ]}
                  >
                    {/* Card header */}
                    <View style={styles.cardRow}>
                      <View
                        style={[styles.avatar, { backgroundColor: theme.accentDim }]}
                      >
                        <Text style={[styles.avatarText, { color: theme.accent }]}>
                          {initials(item.label)}
                        </Text>
                      </View>
                      <View style={styles.cardMeta}>
                        <Text
                          style={[styles.cardLabel, { color: theme.text }]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                        {item.username ? (
                          <Text
                            style={[styles.cardUsername, { color: theme.muted }]}
                            numberOfLines={1}
                          >
                            {item.username}
                          </Text>
                        ) : null}
                      </View>
                      <Icon
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={theme.muted}
                      />
                    </View>

                    {/* Expanded section */}
                    {expanded && (
                      <Animated.View
                        entering={FadeIn.duration(180)}
                        style={[styles.expanded, { borderTopColor: theme.border }]}
                      >
                        <View style={styles.passwordRow}>
                          <Text
                            style={[styles.dots, { color: theme.text }]}
                            numberOfLines={1}
                          >
                            {'•'.repeat(Math.min(item.password.length, 22))}
                          </Text>
                          <Pressable
                            onPress={() => handleCopy(item)}
                            style={[
                              styles.copyBtn,
                              {
                                backgroundColor: copied
                                  ? theme.successDim
                                  : theme.accentDim,
                              },
                            ]}
                          >
                            <Icon
                              name={copied ? 'checkmark' : 'copy-outline'}
                              size={15}
                              color={copied ? theme.success : theme.accent}
                            />
                            <Text
                              style={[
                                styles.copyLabel,
                                { color: copied ? theme.success : theme.accent },
                              ]}
                            >
                              {copied ? 'Copied!' : 'Copy'}
                            </Text>
                          </Pressable>
                        </View>
                        <PasswordStrengthBar
                          level={checkStrength(item.password)}
                          compact
                        />
                      </Animated.View>
                    )}
                  </Pressable>
                </Animated.View>
              );
            }}
          />
        )}
      </SafeAreaView>
      <TabBar active="vault" />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 22,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    padding: 6,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingBottom: 24,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptyDesc: {
    fontSize: 15,
    textAlign: 'center',
  },
  emptyBtn: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 19,
    fontWeight: '700',
  },
  cardMeta: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardUsername: {
    fontSize: 13,
    marginTop: 2,
  },
  expanded: {
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dots: {
    flex: 1,
    fontSize: 18,
    letterSpacing: 3,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
