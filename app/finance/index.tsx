import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../src/ui/Icon';
import { TabBar } from '../../src/ui/TabBar';
import { useTheme } from '../../src/ui/theme';
import { useFinance } from '../../src/finance/useFinance';
import { useSavings } from '../../src/savings/useSavings';
import {
  formatCurrency,
  formatMonth,
  formatDate,
  prevMonth,
  nextMonth,
} from '../../src/finance/utils';

export default function FinanceDashboard() {
  const theme = useTheme();
  const {
    selectedYear,
    selectedMonth,
    setSelectedMonth,
    monthlyIncome,
    monthlyExpenses,
    monthlyInvestment,
    monthlyNet,
    savingsRate,
    monthTransactions,
    expenseCategoryTotals,
    budgetProgress,
    isLoading,
    categories,
  } = useFinance();
  const { goals, totalSaved, totalTarget, overallPercentage } = useSavings();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  const netPositive = monthlyNet >= 0;
  const recentTxns = monthTransactions.slice(0, 5);
  const topBudgets = budgetProgress.slice(0, 3);

  function goToPrevMonth() {
    const { year, month } = prevMonth(selectedYear, selectedMonth);
    setSelectedMonth(year, month);
  }

  function goToNextMonth() {
    const { year, month } = nextMonth(selectedYear, selectedMonth);
    setSelectedMonth(year, month);
  }

  const now = new Date();
  const isOnCurrentMonth =
    selectedYear === now.getFullYear() && selectedMonth === now.getMonth();
  const canGoNext = !isOnCurrentMonth;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.bg }]}
        edges={['top', 'left', 'right']}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* ── Header ── */}
          <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
            <View style={styles.monthNav}>
              <Pressable onPress={goToPrevMonth} hitSlop={16} style={styles.navArrow}>
                <Icon name="chevron-back" size={20} color={theme.muted} />
              </Pressable>
              <Text style={[styles.monthLabel, { color: theme.text }]}>
                {formatMonth(selectedYear, selectedMonth)}
              </Text>
              <Pressable
                onPress={goToNextMonth}
                hitSlop={16}
                style={[styles.navArrow, !canGoNext && styles.arrowHidden]}
                disabled={!canGoNext}
              >
                <Icon name="chevron-forward" size={20} color={theme.muted} />
              </Pressable>
            </View>
            <Pressable onPress={() => router.push('/finance/add')}>
              <View style={[styles.addBtn, { backgroundColor: theme.accent }]}>
                <Icon name="add" size={22} color="#FFF" />
              </View>
            </Pressable>
          </Animated.View>

          {/* ── Net balance card ── */}
          <Animated.View entering={FadeInDown.delay(60).springify()}>
            <View
              style={[
                styles.netCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.netLabel, { color: theme.muted }]}>Net Balance</Text>
              <Text
                style={[
                  styles.netAmount,
                  { color: netPositive ? theme.success : theme.danger },
                ]}
              >
                {formatCurrency(monthlyNet, true)}
              </Text>
              <View style={styles.netRow}>
                <View style={styles.netItem}>
                  <View style={[styles.netDot, { backgroundColor: theme.success }]} />
                  <Text style={[styles.netSub, { color: theme.muted }]}>
                    {formatCurrency(monthlyIncome)} in
                  </Text>
                </View>
                <View style={styles.netItem}>
                  <View style={[styles.netDot, { backgroundColor: theme.danger }]} />
                  <Text style={[styles.netSub, { color: theme.muted }]}>
                    {formatCurrency(monthlyExpenses)} out
                  </Text>
                </View>
                {monthlyInvestment > 0 && (
                  <View style={styles.netItem}>
                    <View style={[styles.netDot, { backgroundColor: theme.accent }]} />
                    <Text style={[styles.netSub, { color: theme.muted }]}>
                      {formatCurrency(monthlyInvestment)} inv
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>

          {/* ── Stat cards ── */}
          <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.statsRow}>
            <StatCard
              label="Income"
              value={formatCurrency(monthlyIncome)}
              color={theme.success}
              dim={theme.successDim}
              icon="trending-up"
              theme={theme}
            />
            <StatCard
              label="Spent"
              value={formatCurrency(monthlyExpenses)}
              color={theme.danger}
              dim={theme.dangerDim}
              icon="trending-down"
              theme={theme}
            />
            <StatCard
              label="Savings"
              value={`${savingsRate}%`}
              color={theme.accent}
              dim={theme.accentDim}
              icon="shield-checkmark-outline"
              theme={theme}
            />
          </Animated.View>

          {/* ── Recent transactions ── */}
          <Animated.View entering={FadeInDown.delay(180).springify()}>
            <SectionHeader
              title="Recent"
              action="See all"
              onAction={() => router.push('/finance/history')}
              theme={theme}
            />
            {recentTxns.length === 0 ? (
              <EmptyCard
                icon="receipt-outline"
                message="No transactions this month"
                actionLabel="Add your first"
                onAction={() => router.push('/finance/add')}
                theme={theme}
              />
            ) : (
              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {recentTxns.map((tx, i) => {
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const isLast = i === recentTxns.length - 1;
                  return (
                    <View key={tx.id}>
                      <Pressable
                        style={styles.txRow}
                        onPress={() => router.push(`/finance/edit?id=${tx.id}`)}
                      >
                        <View
                          style={[
                            styles.catIcon,
                            { backgroundColor: cat ? `${cat.color}22` : theme.border },
                          ]}
                        >
                          <Icon
                            name={(cat?.icon ?? 'ellipsis-horizontal-outline') as React.ComponentProps<typeof Icon>['name']}
                            size={18}
                            color={cat?.color ?? theme.muted}
                          />
                        </View>
                        <View style={styles.txMeta}>
                          <Text style={[styles.txLabel, { color: theme.text }]} numberOfLines={1}>
                            {tx.label}
                          </Text>
                          <Text style={[styles.txDate, { color: theme.muted }]}>
                            {cat?.name ?? 'Unknown'} · {formatDate(tx.date)}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.txAmount,
                            {
                              color:
                                tx.type === 'income'
                                  ? theme.success
                                  : tx.type === 'investment'
                                  ? theme.accent
                                  : theme.text,
                            },
                          ]}
                        >
                          {tx.type === 'income' ? '+' : '-'}
                          {formatCurrency(tx.amountCents)}
                        </Text>
                      </Pressable>
                      {!isLast && (
                        <View style={[styles.divider, { backgroundColor: theme.border }]} />
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </Animated.View>

          {/* ── Budget overview ── */}
          <Animated.View entering={FadeInDown.delay(240).springify()}>
            <SectionHeader
              title="Budgets"
              action="Manage"
              onAction={() => router.push('/finance/budgets')}
              theme={theme}
            />
            {topBudgets.length === 0 ? (
              <EmptyCard
                icon="pie-chart-outline"
                message="No budgets set yet"
                actionLabel="Set up budgets"
                onAction={() => router.push('/finance/budgets')}
                theme={theme}
              />
            ) : (
              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {topBudgets.map((bp, i) => {
                  const pct = Math.min(bp.percentage, 100);
                  const overBudget = bp.percentage > 100;
                  const barColor = overBudget
                    ? theme.danger
                    : pct > 80
                    ? '#FF9F43'
                    : theme.success;
                  const isLast = i === topBudgets.length - 1;
                  return (
                    <View key={bp.budget.id}>
                      <View style={styles.budgetRow}>
                        <View style={styles.budgetTop}>
                          <View style={styles.budgetLeft}>
                            <View
                              style={[
                                styles.catDot,
                                { backgroundColor: bp.category.color },
                              ]}
                            />
                            <Text style={[styles.budgetName, { color: theme.text }]}>
                              {bp.category.name}
                            </Text>
                          </View>
                          <Text style={[styles.budgetAmt, { color: overBudget ? theme.danger : theme.muted }]}>
                            {formatCurrency(bp.spent)} / {formatCurrency(bp.budget.amountCents)}
                          </Text>
                        </View>
                        <View style={[styles.budgetBar, { backgroundColor: theme.border }]}>
                          <View
                            style={[
                              styles.budgetFill,
                              { width: `${pct}%`, backgroundColor: barColor },
                            ]}
                          />
                        </View>
                      </View>
                      {!isLast && (
                        <View style={[styles.divider, { backgroundColor: theme.border }]} />
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </Animated.View>

          {/* ── Top spending categories ── */}
          {expenseCategoryTotals.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <SectionHeader
                title="Top Spending"
                action="Insights"
                onAction={() => router.push('/finance/insights')}
                theme={theme}
              />
              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {expenseCategoryTotals.slice(0, 4).map((item, i) => {
                  const isLast = i === Math.min(expenseCategoryTotals.length, 4) - 1;
                  return (
                    <View key={item.category.id}>
                      <View style={styles.topCatRow}>
                        <View
                          style={[styles.catIcon, { backgroundColor: `${item.category.color}22` }]}
                        >
                          <Icon
                            name={item.category.icon as React.ComponentProps<typeof Icon>['name']}
                            size={17}
                            color={item.category.color}
                          />
                        </View>
                        <Text style={[styles.topCatName, { color: theme.text }]}>
                          {item.category.name}
                        </Text>
                        <Text style={[styles.topCatPct, { color: theme.muted }]}>
                          {item.percentage.toFixed(0)}%
                        </Text>
                        <Text style={[styles.topCatAmt, { color: theme.text }]}>
                          {formatCurrency(item.total)}
                        </Text>
                      </View>
                      {!isLast && (
                        <View style={[styles.divider, { backgroundColor: theme.border }]} />
                      )}
                    </View>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* ── Savings Goals ── */}
          <Animated.View entering={FadeInDown.delay(360).springify()}>
            <SectionHeader
              title="Savings Goals"
              action="See all"
              onAction={() => router.push('/savings')}
              theme={theme}
            />
            {goals.filter((g) => !g.isCompleted).length === 0 ? (
              <EmptyCard
                icon="flag-outline"
                message="No savings goals yet"
                actionLabel="Create a goal"
                onAction={() => router.push('/savings/add-goal')}
                theme={theme}
              />
            ) : (
              <Pressable
                onPress={() => router.push('/savings')}
                style={[styles.savingsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <View style={styles.savingsTop}>
                  <View>
                    <Text style={[styles.savingsLabel, { color: theme.muted }]}>Total Saved</Text>
                    <Text style={[styles.savingsSaved, { color: theme.success }]}>
                      {formatCurrency(totalSaved)}
                    </Text>
                  </View>
                  <View style={styles.savingsRight}>
                    <Text style={[styles.savingsLabel, { color: theme.muted }]}>Target</Text>
                    <Text style={[styles.savingsTarget, { color: theme.text }]}>
                      {formatCurrency(totalTarget)}
                    </Text>
                  </View>
                  <Icon name="chevron-forward" size={18} color={theme.border} />
                </View>
                <View style={[styles.savingsTrack, { backgroundColor: theme.border }]}>
                  <View
                    style={[styles.savingsFill, { width: `${overallPercentage}%`, backgroundColor: theme.success }]}
                  />
                </View>
                <Text style={[styles.savingsPct, { color: theme.muted }]}>
                  {overallPercentage.toFixed(1)}% · {goals.filter((g) => !g.isCompleted).length} active goal{goals.filter((g) => !g.isCompleted).length !== 1 ? 's' : ''}
                </Text>
              </Pressable>
            )}
          </Animated.View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
      <TabBar active="finance" />
    </View>
  );
}

function StatCard({
  label,
  value,
  color,
  dim,
  icon,
  theme,
}: {
  label: string;
  value: string;
  color: string;
  dim: string;
  icon: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.statIconWrap, { backgroundColor: dim }]}>
        <Icon name={icon as React.ComponentProps<typeof Icon>['name']} size={16} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

function SectionHeader({
  title,
  action,
  onAction,
  theme,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {action && onAction && (
        <Pressable onPress={onAction} hitSlop={12}>
          <Text style={[styles.sectionAction, { color: theme.accent }]}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

function EmptyCard({
  icon,
  message,
  actionLabel,
  onAction,
  theme,
}: {
  icon: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View
      style={[
        styles.card,
        styles.emptyCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <Icon name={icon as React.ComponentProps<typeof Icon>['name']} size={28} color={theme.muted} />
      <Text style={[styles.emptyMsg, { color: theme.muted }]}>{message}</Text>
      <Pressable onPress={onAction}>
        <Text style={[styles.emptyAction, { color: theme.accent }]}>{actionLabel} →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scroll: {
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 20,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navArrow: {
    padding: 4,
  },
  arrowHidden: {
    opacity: 0,
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  netCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    marginBottom: 14,
  },
  netLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  netAmount: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 14,
  },
  netRow: {
    flexDirection: 'row',
    gap: 16,
  },
  netItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  netDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  netSub: {
    fontSize: 13,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 6,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 14,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
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
  txDate: {
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 14,
  },
  budgetRow: {
    padding: 14,
    gap: 8,
  },
  budgetTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  budgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  budgetName: {
    fontSize: 14,
    fontWeight: '600',
  },
  budgetAmt: {
    fontSize: 12,
    fontWeight: '500',
  },
  budgetBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  budgetFill: {
    height: 6,
    borderRadius: 3,
  },
  topCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  topCatName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  topCatPct: {
    fontSize: 13,
    fontWeight: '500',
    width: 36,
    textAlign: 'right',
  },
  topCatAmt: {
    fontSize: 14,
    fontWeight: '700',
    width: 80,
    textAlign: 'right',
    letterSpacing: -0.2,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 8,
  },
  emptyMsg: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyAction: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  savingsCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 14,
  },
  savingsTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  savingsRight: {
    flex: 1,
    marginLeft: 32,
  },
  savingsLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  savingsSaved: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  savingsTarget: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  savingsTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  savingsFill: {
    height: 7,
    borderRadius: 4,
  },
  savingsPct: {
    fontSize: 12,
    fontWeight: '500',
  },
});
