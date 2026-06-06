import React, { useMemo, useState } from 'react';
import {
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Screen } from '../../src/ui/Screen';
import { Icon } from '../../src/ui/Icon';
import { useTheme } from '../../src/ui/theme';
import { useFinance } from '../../src/finance/useFinance';
import { formatCurrency, formatDate } from '../../src/finance/utils';
import type { Transaction, TransactionType } from '../../src/finance/types';

type FilterType = 'all' | TransactionType;

const TYPE_FILTERS: Array<{ key: FilterType; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'expense', label: 'Expenses' },
  { key: 'income', label: 'Income' },
  { key: 'investment', label: 'Invested' },
];

function groupByDate(txns: Transaction[]): Array<{ title: string; data: Transaction[] }> {
  const groups = new Map<string, Transaction[]>();
  for (const tx of txns) {
    const key = formatDate(tx.date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }
  return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
}

export default function TransactionHistory() {
  const theme = useTheme();
  const { transactions, categories, deleteTransaction } = useFinance();

  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  const filtered = useMemo(() => {
    let list = transactions;
    if (filterType !== 'all') {
      list = list.filter((t) => t.type === filterType);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (t) =>
          t.label.toLowerCase().includes(q) ||
          categories.find((c) => c.id === t.categoryId)?.name.toLowerCase().includes(q),
      );
    }
    return list;
  }, [transactions, filterType, query, categories]);

  const sections = useMemo(() => groupByDate(filtered), [filtered]);

  function confirmDelete(id: string, label: string) {
    Alert.alert('Delete Transaction', `Delete "${label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteTransaction(id),
      },
    ]);
  }

  return (
    <Screen>
      {/* ── Nav ── */}
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Icon name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text style={[styles.navTitle, { color: theme.text }]}>Transactions</Text>
        <Pressable onPress={() => router.push('/finance/add')} hitSlop={12}>
          <Icon name="add-circle-outline" size={26} color={theme.accent} />
        </Pressable>
      </View>

      {/* ── Search ── */}
      <Animated.View entering={FadeIn.duration(200)} style={[styles.searchWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Icon name="search-outline" size={18} color={theme.muted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          value={query}
          onChangeText={setQuery}
          placeholder="Search transactions…"
          placeholderTextColor={theme.muted}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Icon name="close-circle" size={18} color={theme.muted} />
          </Pressable>
        )}
      </Animated.View>

      {/* ── Type filter ── */}
      <View style={styles.filterRow}>
        {TYPE_FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilterType(f.key)}
            style={[
              styles.filterChip,
              {
                backgroundColor: filterType === f.key ? theme.accent : theme.surface,
                borderColor: filterType === f.key ? theme.accent : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterLabel,
                { color: filterType === f.key ? '#FFF' : theme.muted },
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── List ── */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="receipt-outline" size={48} color={theme.muted} />
          <Text style={[styles.emptyText, { color: theme.muted }]}>
            {query || filterType !== 'all'
              ? 'No matching transactions'
              : 'No transactions yet'}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={[styles.sectionDate, { color: theme.muted }]}>{title}</Text>
          )}
          renderItem={({ item, index, section }) => {
            const cat = categories.find((c) => c.id === item.categoryId);
            const isLast = index === section.data.length - 1;
            return (
              <View
                style={[
                  styles.txCard,
                  !isLast && styles.txCardNotLast,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  index === 0 && styles.txCardFirst,
                  isLast && styles.txCardLast,
                ]}
              >
                <Pressable
                  onPress={() => router.push(`/finance/edit?id=${item.id}`)}
                  onLongPress={() => confirmDelete(item.id, item.label)}
                  style={styles.txRow}
                >
                  <View style={[styles.catIcon, { backgroundColor: cat ? `${cat.color}22` : theme.border }]}>
                    <Icon
                      name={(cat?.icon ?? 'ellipsis-horizontal-outline') as React.ComponentProps<typeof Icon>['name']}
                      size={18}
                      color={cat?.color ?? theme.muted}
                    />
                  </View>
                  <View style={styles.txMeta}>
                    <Text style={[styles.txLabel, { color: theme.text }]} numberOfLines={1}>
                      {item.label}
                    </Text>
                    <View style={styles.txSubRow}>
                      <Text style={[styles.txCat, { color: theme.muted }]}>
                        {cat?.name ?? 'Unknown'}
                      </Text>
                      {item.isRecurring && (
                        <View style={[styles.recurBadge, { backgroundColor: theme.accentDim }]}>
                          <Icon name="repeat-outline" size={10} color={theme.accent} />
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.txRight}>
                    <Text
                      style={[
                        styles.txAmount,
                        {
                          color:
                            item.type === 'income'
                              ? theme.success
                              : item.type === 'investment'
                              ? theme.accent
                              : theme.text,
                        },
                      ]}
                    >
                      {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amountCents)}
                    </Text>
                    <Icon name="chevron-forward" size={14} color={theme.border} />
                  </View>
                </Pressable>
              </View>
            );
          }}
          renderSectionFooter={() => <View style={{ height: 18 }} />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 16,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 40,
  },
  sectionDate: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  txCard: {
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    overflow: 'hidden',
  },
  txCardFirst: {
    borderTopWidth: 1.5,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  txCardLast: {
    borderBottomWidth: 1.5,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  txCardNotLast: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    gap: 12,
  },
  catIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txMeta: {
    flex: 1,
  },
  txLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  txSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  txCat: {
    fontSize: 12,
  },
  recurBadge: {
    width: 16,
    height: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
