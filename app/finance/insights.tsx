import React, { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Screen } from '../../src/ui/Screen';
import { Icon } from '../../src/ui/Icon';
import { useTheme } from '../../src/ui/theme';
import { useFinance } from '../../src/finance/useFinance';
import {
  formatCurrency,
  formatMonthShort,
  getMonthRange,
  getLast6Months,
} from '../../src/finance/utils';

export default function InsightsScreen() {
  const theme = useTheme();
  const { transactions, categories, monthlyIncome, monthlyExpenses, monthlyNet, expenseCategoryTotals, savingsRate } = useFinance();

  // 6-month trend data
  const months6 = useMemo(() => getLast6Months(), []);
  const monthlyData = useMemo(() => {
    return months6.map(({ year, month }) => {
      const { start, end } = getMonthRange(year, month);
      const txns = transactions.filter((t) => t.date >= start && t.date <= end);
      const income = txns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amountCents, 0);
      const expense = txns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amountCents, 0);
      const investment = txns.filter((t) => t.type === 'investment').reduce((s, t) => s + t.amountCents, 0);
      return { year, month, income, expense, investment, label: formatMonthShort(year, month).split(' ')[0] };
    });
  }, [transactions, months6]);

  const maxBarValue = useMemo(() => {
    return Math.max(...monthlyData.map((m) => Math.max(m.income, m.expense, 1)), 1);
  }, [monthlyData]);

  const totalExpensesAllTime = useMemo(
    () => transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amountCents, 0),
    [transactions],
  );

  const totalIncomeAllTime = useMemo(
    () => transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amountCents, 0),
    [transactions],
  );

  const avgDailySpend = useMemo(() => {
    if (monthlyExpenses === 0) return 0;
    const now = new Date();
    const daysElapsed = Math.max(now.getDate(), 1);
    return Math.round(monthlyExpenses / daysElapsed);
  }, [monthlyExpenses]);

  return (
    <Screen>
      {/* ── Nav ── */}
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Icon name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <Text style={[styles.navTitle, { color: theme.text }]}>Insights</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Key metrics ── */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.metricsGrid}>
          <MetricCard label="This Month Income" value={formatCurrency(monthlyIncome)} color={theme.success} theme={theme} />
          <MetricCard label="This Month Expenses" value={formatCurrency(monthlyExpenses)} color={theme.danger} theme={theme} />
          <MetricCard label="Net Balance" value={formatCurrency(monthlyNet, true)} color={monthlyNet >= 0 ? theme.success : theme.danger} theme={theme} />
          <MetricCard label="Savings Rate" value={`${savingsRate}%`} color={theme.accent} theme={theme} />
          <MetricCard label="Avg Daily Spend" value={formatCurrency(avgDailySpend)} color={theme.text} theme={theme} />
          <MetricCard label="All-time Income" value={formatCurrency(totalIncomeAllTime)} color={theme.success} theme={theme} />
        </Animated.View>

        {/* ── 6-month bar chart ── */}
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>6-Month Overview</Text>
          <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.success }]} />
                <Text style={[styles.legendLabel, { color: theme.muted }]}>Income</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.danger }]} />
                <Text style={[styles.legendLabel, { color: theme.muted }]}>Expenses</Text>
              </View>
            </View>
            <View style={styles.barChart}>
              {monthlyData.map(({ year, month, income, expense, label }) => (
                <View key={`${year}-${month}`} style={styles.barGroup}>
                  <View style={styles.barPair}>
                    <BarColumn
                      value={income}
                      maxValue={maxBarValue}
                      color={theme.success}
                      dim={theme.successDim}
                    />
                    <BarColumn
                      value={expense}
                      maxValue={maxBarValue}
                      color={theme.danger}
                      dim={theme.dangerDim}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: theme.muted }]}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* ── Expense category breakdown ── */}
        {expenseCategoryTotals.length > 0 && (
          <Animated.View entering={FadeInDown.delay(160).springify()}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Spending by Category</Text>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {expenseCategoryTotals.map((item, i) => {
                const isLast = i === expenseCategoryTotals.length - 1;
                return (
                  <View key={item.category.id}>
                    <View style={styles.catRow}>
                      <View style={[styles.catIcon, { backgroundColor: `${item.category.color}22` }]}>
                        <Icon
                          name={item.category.icon as React.ComponentProps<typeof Icon>['name']}
                          size={16}
                          color={item.category.color}
                        />
                      </View>
                      <View style={styles.catMeta}>
                        <View style={styles.catTop}>
                          <Text style={[styles.catName, { color: theme.text }]}>
                            {item.category.name}
                          </Text>
                          <Text style={[styles.catAmt, { color: theme.text }]}>
                            {formatCurrency(item.total)}
                          </Text>
                        </View>
                        <View style={[styles.barTrack, { backgroundColor: theme.border }]}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                width: `${item.percentage}%`,
                                backgroundColor: item.category.color,
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.catPct, { color: theme.muted }]}>
                          {item.percentage.toFixed(1)}% · {item.count} transaction{item.count !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                    {!isLast && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* ── Smart summary ── */}
        <Animated.View entering={FadeInDown.delay(240).springify()}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Smart Summary</Text>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <SummaryRow
              icon="trending-up-outline"
              color={theme.success}
              label="Total income this month"
              value={formatCurrency(monthlyIncome)}
              theme={theme}
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <SummaryRow
              icon="trending-down-outline"
              color={theme.danger}
              label="Total expenses this month"
              value={formatCurrency(monthlyExpenses)}
              theme={theme}
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <SummaryRow
              icon="wallet-outline"
              color={theme.accent}
              label="Average daily spend"
              value={formatCurrency(avgDailySpend)}
              theme={theme}
            />
            {expenseCategoryTotals.length > 0 && (
              <>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <SummaryRow
                  icon="flame-outline"
                  color="#FF9F43"
                  label="Top spending category"
                  value={expenseCategoryTotals[0].category.name}
                  theme={theme}
                />
              </>
            )}
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <SummaryRow
              icon="shield-checkmark-outline"
              color={savingsRate >= 20 ? theme.success : savingsRate >= 10 ? '#FF9F43' : theme.danger}
              label="Savings rate"
              value={`${savingsRate}%`}
              theme={theme}
            />
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  );
}

const BAR_MAX_H = 72;

function BarColumn({
  value,
  maxValue,
  color,
  dim,
}: {
  value: number;
  maxValue: number;
  color: string;
  dim: string;
}) {
  const fillH = maxValue > 0 ? Math.max(Math.round((value / maxValue) * BAR_MAX_H), value > 0 ? 4 : 0) : 0;
  return (
    <View style={[styles.barColumnWrap, { height: BAR_MAX_H, backgroundColor: dim }]}>
      <View style={[styles.barColumnFill, { height: fillH, backgroundColor: color }]} />
    </View>
  );
}

function MetricCard({
  label,
  value,
  color,
  theme,
}: {
  label: string;
  value: string;
  color: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: theme.muted }]}>{label}</Text>
    </View>
  );
}

function SummaryRow({
  icon,
  color,
  label,
  value,
  theme,
}: {
  icon: string;
  color: string;
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.summaryRow}>
      <View style={[styles.summaryIcon, { backgroundColor: `${color}22` }]}>
        <Icon name={icon as React.ComponentProps<typeof Icon>['name']} size={16} color={color} />
      </View>
      <Text style={[styles.summaryLabel, { color: theme.muted }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 16 },
  navTitle: { fontSize: 17, fontWeight: '600' },
  scroll: { paddingBottom: 40 },
  sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2, marginBottom: 12, marginTop: 8 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  metricCard: { width: '47%', borderRadius: 16, borderWidth: 1.5, padding: 14 },
  metricValue: { fontSize: 18, fontWeight: '700', letterSpacing: -0.4, marginBottom: 4 },
  metricLabel: { fontSize: 11, fontWeight: '500', lineHeight: 15 },
  chartCard: { borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 24 },
  chartLegend: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendLabel: { fontSize: 12, fontWeight: '500' },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  barGroup: { flex: 1, alignItems: 'center', gap: 6 },
  barPair: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  barColumnWrap: { width: 14, borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  barColumnFill: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  card: { borderRadius: 16, borderWidth: 1.5, overflow: 'hidden', marginBottom: 24 },
  catRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  catIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catMeta: { flex: 1 },
  catTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catName: { fontSize: 14, fontWeight: '600' },
  catAmt: { fontSize: 14, fontWeight: '700' },
  barTrack: { height: 5, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  barFill: { height: 5, borderRadius: 3 },
  catPct: { fontSize: 11 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  summaryIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { flex: 1, fontSize: 13, fontWeight: '500' },
  summaryValue: { fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },
});
