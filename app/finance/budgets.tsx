import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Screen } from '../../src/ui/Screen';
import { Button } from '../../src/ui/Button';
import { Icon } from '../../src/ui/Icon';
import { useTheme } from '../../src/ui/theme';
import { useFinance } from '../../src/finance/useFinance';
import { formatCurrency, parseCents, centsToInputString } from '../../src/finance/utils';
import type { Category } from '../../src/finance/types';

export default function BudgetsScreen() {
  const theme = useTheme();
  const { categories, budgets, budgetProgress, monthlyExpenses, setBudget, deleteBudget } = useFinance();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [amountStr, setAmountStr] = useState('');

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const budgetedIds = new Set(budgets.map((b) => b.categoryId));
  const unbudgetedCategories = expenseCategories.filter((c) => !budgetedIds.has(c.id));

  const totalBudgeted = budgets.reduce((s, b) => s + b.amountCents, 0);

  function openEdit(catId: string) {
    const existing = budgets.find((b) => b.categoryId === catId);
    setEditingCatId(catId);
    setAmountStr(existing ? centsToInputString(existing.amountCents) : '');
    setModalOpen(true);
  }

  function handleSaveBudget() {
    if (!editingCatId) return;
    const cents = parseCents(amountStr);
    if (cents <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid budget amount.');
      return;
    }
    setBudget(editingCatId, cents);
    setModalOpen(false);
    setEditingCatId(null);
    setAmountStr('');
  }

  function confirmDelete(catId: string, catName: string) {
    Alert.alert('Remove Budget', `Remove the budget for ${catName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteBudget(catId) },
    ]);
  }

  const editingCat = categories.find((c) => c.id === editingCatId);

  return (
    <Screen>
      {/* ── Nav ── */}
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Icon name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text style={[styles.navTitle, { color: theme.text }]}>Budgets</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ── Overview ── */}
        {budgets.length > 0 && (
          <Animated.View entering={FadeIn.duration(300)}>
            <View style={[styles.overviewCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.overviewRow}>
                <View>
                  <Text style={[styles.overviewLabel, { color: theme.muted }]}>Total Budget</Text>
                  <Text style={[styles.overviewValue, { color: theme.text }]}>
                    {formatCurrency(totalBudgeted)}
                  </Text>
                </View>
                <View style={styles.overviewRight}>
                  <Text style={[styles.overviewLabel, { color: theme.muted }]}>Spent</Text>
                  <Text
                    style={[
                      styles.overviewValue,
                      { color: monthlyExpenses > totalBudgeted ? theme.danger : theme.text },
                    ]}
                  >
                    {formatCurrency(monthlyExpenses)}
                  </Text>
                </View>
              </View>
              <View style={{ marginTop: 14 }}>
                <View style={[styles.masterBar, { backgroundColor: theme.border }]}>
                  <View
                    style={[
                      styles.masterFill,
                      {
                        width: `${Math.min((monthlyExpenses / Math.max(totalBudgeted, 1)) * 100, 100)}%`,
                        backgroundColor:
                          monthlyExpenses > totalBudgeted ? theme.danger : theme.accent,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.overviewSub, { color: theme.muted }]}>
                  {totalBudgeted > 0
                    ? `${Math.round((monthlyExpenses / totalBudgeted) * 100)}% of total budget used`
                    : 'No budgets set'}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── Active budgets ── */}
        {budgetProgress.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.muted }]}>Active Budgets</Text>
            {budgetProgress.map((bp, i) => {
              const pct = Math.min(bp.percentage, 100);
              const overBudget = bp.percentage > 100;
              const barColor = overBudget ? theme.danger : pct > 80 ? '#FF9F43' : theme.success;
              return (
                <Animated.View
                  key={bp.budget.id}
                  entering={FadeInDown.delay(i * 50).springify()}
                >
                  <View
                    style={[
                      styles.budgetCard,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                    ]}
                  >
                    <View style={styles.budgetHeader}>
                      <View style={styles.budgetLeft}>
                        <View
                          style={[styles.catIcon, { backgroundColor: `${bp.category.color}22` }]}
                        >
                          <Icon
                            name={bp.category.icon as React.ComponentProps<typeof Icon>['name']}
                            size={18}
                            color={bp.category.color}
                          />
                        </View>
                        <View>
                          <Text style={[styles.catName, { color: theme.text }]}>
                            {bp.category.name}
                          </Text>
                          <Text style={[styles.budgetSub, { color: overBudget ? theme.danger : theme.muted }]}>
                            {formatCurrency(bp.spent)} / {formatCurrency(bp.budget.amountCents)}
                            {overBudget ? ' — Over budget!' : ''}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.budgetActions}>
                        <Pressable onPress={() => openEdit(bp.budget.categoryId)} hitSlop={12}>
                          <Icon name="pencil-outline" size={18} color={theme.muted} />
                        </Pressable>
                        <Pressable
                          onPress={() => confirmDelete(bp.budget.categoryId, bp.category.name)}
                          hitSlop={12}
                        >
                          <Icon name="trash-outline" size={18} color={theme.danger} />
                        </Pressable>
                      </View>
                    </View>
                    <View style={[styles.barTrack, { backgroundColor: theme.border }]}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${pct}%`, backgroundColor: barColor },
                        ]}
                      />
                    </View>
                    <Text style={[styles.pctLabel, { color: overBudget ? theme.danger : theme.muted }]}>
                      {bp.percentage.toFixed(0)}% used
                      {bp.budget.amountCents > bp.spent
                        ? ` · ${formatCurrency(bp.budget.amountCents - bp.spent)} left`
                        : ''}
                    </Text>
                  </View>
                </Animated.View>
              );
            })}
          </>
        )}

        {/* ── Add budget for unbudgeted categories ── */}
        {unbudgetedCategories.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.muted }]}>Add Budgets</Text>
            {unbudgetedCategories.map((cat, i) => (
              <Animated.View key={cat.id} entering={FadeInDown.delay(i * 40).springify()}>
                <Pressable
                  onPress={() => openEdit(cat.id)}
                  style={[styles.unbudgetedRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <View style={[styles.catIcon, { backgroundColor: `${cat.color}22` }]}>
                    <Icon
                      name={cat.icon as React.ComponentProps<typeof Icon>['name']}
                      size={18}
                      color={cat.color}
                    />
                  </View>
                  <Text style={[styles.catName, { flex: 1, color: theme.text }]}>{cat.name}</Text>
                  <Icon name="add-circle-outline" size={22} color={theme.accent} />
                </Pressable>
              </Animated.View>
            ))}
          </>
        )}

        {budgets.length === 0 && unbudgetedCategories.length === 0 && (
          <View style={styles.empty}>
            <Icon name="pie-chart-outline" size={48} color={theme.muted} />
            <Text style={[styles.emptyText, { color: theme.muted }]}>No expense categories found</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Edit budget modal ── */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBg} onPress={() => setModalOpen(false)} />
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingCat ? `Budget for ${editingCat.name}` : 'Set Budget'}
            </Text>
            <Text style={[styles.modalSub, { color: theme.muted }]}>Monthly spending limit</Text>
            <View style={styles.modalAmountRow}>
              <Text style={[styles.modalSign, { color: theme.muted }]}>$</Text>
              <TextInput
                style={[styles.modalAmount, { color: theme.text }]}
                value={amountStr}
                onChangeText={setAmountStr}
                placeholder="0.00"
                placeholderTextColor={theme.border}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
            <Button label="Set Budget" onPress={handleSaveBudget} disabled={!parseCents(amountStr)} />
            <View style={{ height: 8 }} />
            <Button label="Cancel" variant="ghost" onPress={() => setModalOpen(false)} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 16 },
  navTitle: { fontSize: 17, fontWeight: '600' },
  scroll: { paddingBottom: 40 },
  overviewCard: { borderRadius: 20, borderWidth: 1.5, padding: 20, marginBottom: 24 },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-between' },
  overviewRight: { alignItems: 'flex-end' },
  overviewLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  overviewValue: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  masterBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  masterFill: { height: 8, borderRadius: 4 },
  overviewSub: { fontSize: 12, marginTop: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 8 },
  budgetCard: { borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 10 },
  budgetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  budgetLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  catIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 15, fontWeight: '600' },
  budgetSub: { fontSize: 12, marginTop: 2 },
  budgetActions: { flexDirection: 'row', gap: 14 },
  barTrack: { height: 7, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  barFill: { height: 7, borderRadius: 4 },
  pctLabel: { fontSize: 12, fontWeight: '500' },
  unbudgetedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 80 },
  emptyText: { fontSize: 15, fontWeight: '500' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBg: { flex: 1 },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  modalSub: { fontSize: 14, marginBottom: 24 },
  modalAmountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 28, gap: 4 },
  modalSign: { fontSize: 32, fontWeight: '300', marginTop: 6 },
  modalAmount: { fontSize: 48, fontWeight: '700', letterSpacing: -1.5, minWidth: 100, textAlign: 'center' },
});
