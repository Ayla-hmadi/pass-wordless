import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Screen } from '../../src/ui/Screen';
import { Icon } from '../../src/ui/Icon';
import { useTheme } from '../../src/ui/theme';
import { useFinance } from '../../src/finance/useFinance';
import { formatCurrency, formatDate, frequencyLabel } from '../../src/finance/utils';
import type { RecurringItem } from '../../src/finance/types';

export default function RecurringScreen() {
  const theme = useTheme();
  const { recurringItems, categories, updateRecurring, deleteRecurring } = useFinance();

  const activeItems = recurringItems.filter((r) => r.isActive);
  const inactiveItems = recurringItems.filter((r) => !r.isActive);

  const monthlyTotal = activeItems
    .filter((r) => r.type === 'expense')
    .reduce((sum, r) => {
      const monthly = toMonthlyCents(r);
      return sum + monthly;
    }, 0);

  function toMonthlyCents(r: RecurringItem): number {
    switch (r.frequency) {
      case 'daily': return r.amountCents * 30;
      case 'weekly': return r.amountCents * 4;
      case 'biweekly': return r.amountCents * 2;
      case 'monthly': return r.amountCents;
      case 'yearly': return Math.round(r.amountCents / 12);
    }
  }

  function toggleActive(item: RecurringItem) {
    updateRecurring(item.id, { isActive: !item.isActive });
  }

  function confirmDelete(item: RecurringItem) {
    Alert.alert(
      'Delete Recurring',
      `Delete "${item.label}"? This will not affect past transactions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteRecurring(item.id) },
      ],
    );
  }

  function daysUntilDue(nextDue: number): number {
    const now = Date.now();
    return Math.ceil((nextDue - now) / (1000 * 60 * 60 * 24));
  }

  return (
    <Screen>
      {/* ── Nav ── */}
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Icon name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text style={[styles.navTitle, { color: theme.text }]}>Recurring</Text>
        <Pressable onPress={() => router.push('/finance/add')} hitSlop={12}>
          <Icon name="add-circle-outline" size={26} color={theme.accent} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Monthly recurring total ── */}
        {activeItems.length > 0 && (
          <Animated.View entering={FadeIn.duration(300)}>
            <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.summaryLabel, { color: theme.muted }]}>Monthly Recurring Expenses</Text>
              <Text style={[styles.summaryAmount, { color: theme.danger }]}>
                {formatCurrency(monthlyTotal)}
              </Text>
              <Text style={[styles.summarySub, { color: theme.muted }]}>
                {activeItems.filter((r) => r.type === 'expense').length} active subscription
                {activeItems.filter((r) => r.type === 'expense').length !== 1 ? 's' : ''}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── Active recurring ── */}
        {activeItems.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.muted }]}>Active</Text>
            {activeItems.map((item, i) => (
              <RecurringCard
                key={item.id}
                item={item}
                categories={categories}
                daysUntilDue={daysUntilDue(item.nextDueDate)}
                monthlyEstimate={toMonthlyCents(item)}
                onToggle={() => toggleActive(item)}
                onDelete={() => confirmDelete(item)}
                theme={theme}
                index={i}
              />
            ))}
          </>
        )}

        {/* ── Inactive recurring ── */}
        {inactiveItems.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.muted }]}>Paused</Text>
            {inactiveItems.map((item, i) => (
              <RecurringCard
                key={item.id}
                item={item}
                categories={categories}
                daysUntilDue={daysUntilDue(item.nextDueDate)}
                monthlyEstimate={toMonthlyCents(item)}
                onToggle={() => toggleActive(item)}
                onDelete={() => confirmDelete(item)}
                theme={theme}
                index={i}
                dimmed
              />
            ))}
          </>
        )}

        {recurringItems.length === 0 && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.empty}>
            <Icon name="repeat-outline" size={52} color={theme.muted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No recurring items</Text>
            <Text style={[styles.emptySub, { color: theme.muted }]}>
              When adding a transaction, toggle "Recurring" to track regular payments.
            </Text>
            <Pressable
              onPress={() => router.push('/finance/add')}
              style={[styles.emptyBtn, { backgroundColor: theme.accent }]}
            >
              <Text style={styles.emptyBtnLabel}>Add Transaction</Text>
            </Pressable>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  );
}

function RecurringCard({
  item,
  categories,
  daysUntilDue,
  monthlyEstimate,
  onToggle,
  onDelete,
  theme,
  index,
  dimmed,
}: {
  item: RecurringItem;
  categories: ReturnType<typeof useFinance>['categories'];
  daysUntilDue: number;
  monthlyEstimate: number;
  onToggle: () => void;
  onDelete: () => void;
  theme: ReturnType<typeof useTheme>;
  index: number;
  dimmed?: boolean;
}) {
  const cat = categories.find((c) => c.id === item.categoryId);
  const isOverdue = daysUntilDue < 0;
  const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 3;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            opacity: dimmed ? 0.6 : 1,
          },
        ]}
      >
        <View style={styles.cardRow}>
          {/* Icon */}
          <View style={[styles.catIcon, { backgroundColor: cat ? `${cat.color}22` : theme.border }]}>
            <Icon
              name={(cat?.icon ?? 'repeat-outline') as React.ComponentProps<typeof Icon>['name']}
              size={20}
              color={cat?.color ?? theme.muted}
            />
          </View>

          {/* Info */}
          <View style={styles.cardMeta}>
            <Text style={[styles.cardLabel, { color: theme.text }]}>{item.label}</Text>
            <Text style={[styles.cardSub, { color: theme.muted }]}>
              {frequencyLabel(item.frequency)} · {cat?.name ?? 'Unknown'}
            </Text>
          </View>

          {/* Amount */}
          <View style={styles.cardRight}>
            <Text
              style={[
                styles.cardAmount,
                {
                  color:
                    item.type === 'income'
                      ? theme.success
                      : item.type === 'investment'
                      ? theme.accent
                      : theme.danger,
                },
              ]}
            >
              {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amountCents)}
            </Text>
            <Text style={[styles.cardMonthly, { color: theme.muted }]}>
              ~{formatCurrency(monthlyEstimate)}/mo
            </Text>
          </View>
        </View>

        {/* Due date + actions */}
        <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
          <View style={styles.dueWrap}>
            <View
              style={[
                styles.dueBadge,
                {
                  backgroundColor: isOverdue
                    ? theme.dangerDim
                    : isDueSoon
                    ? `#FF9F4322`
                    : theme.accentDim,
                },
              ]}
            >
              <Icon
                name={isOverdue ? 'alert-circle-outline' : 'time-outline'}
                size={12}
                color={isOverdue ? theme.danger : isDueSoon ? '#FF9F43' : theme.accent}
              />
              <Text
                style={[
                  styles.dueLabel,
                  {
                    color: isOverdue
                      ? theme.danger
                      : isDueSoon
                      ? '#FF9F43'
                      : theme.accent,
                  },
                ]}
              >
                {isOverdue
                  ? `Overdue by ${Math.abs(daysUntilDue)}d`
                  : daysUntilDue === 0
                  ? 'Due today'
                  : `Due in ${daysUntilDue}d`}
              </Text>
            </View>
          </View>
          <View style={styles.cardActions}>
            <Pressable onPress={onToggle} hitSlop={12} style={styles.actionBtn}>
              <Icon
                name={item.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                size={22}
                color={item.isActive ? theme.muted : theme.success}
              />
            </Pressable>
            <Pressable onPress={onDelete} hitSlop={12} style={styles.actionBtn}>
              <Icon name="trash-outline" size={20} color={theme.danger} />
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 16 },
  navTitle: { fontSize: 17, fontWeight: '600' },
  scroll: { paddingBottom: 40 },
  summaryCard: { borderRadius: 20, borderWidth: 1.5, padding: 20, marginBottom: 24 },
  summaryLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  summaryAmount: { fontSize: 32, fontWeight: '700', letterSpacing: -1, marginBottom: 4 },
  summarySub: { fontSize: 13 },
  sectionTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 4 },
  card: { borderRadius: 16, borderWidth: 1.5, marginBottom: 10, overflow: 'hidden' },
  cardRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  catIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cardMeta: { flex: 1 },
  cardLabel: { fontSize: 15, fontWeight: '600' },
  cardSub: { fontSize: 12, marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  cardAmount: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },
  cardMonthly: { fontSize: 11, marginTop: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 10 },
  dueWrap: { flex: 1 },
  dueBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, alignSelf: 'flex-start' },
  dueLabel: { fontSize: 11, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '600' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  emptyBtn: { marginTop: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 999 },
  emptyBtnLabel: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
