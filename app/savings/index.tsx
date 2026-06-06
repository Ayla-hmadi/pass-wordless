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
import { useTheme } from '../../src/ui/theme';
import { useSavings } from '../../src/savings/useSavings';
import { formatCurrency } from '../../src/finance/utils';
import type { SavingsGoalWithProgress } from '../../src/savings/types';

export default function SavingsHome() {
  const theme = useTheme();
  const { goals, totalSaved, totalTarget, overallPercentage, isLoading } = useSavings();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  const activeGoals = goals.filter((g) => !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
        {/* ── Header ── */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Icon name="chevron-back" size={26} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Savings Goals</Text>
          <Pressable
            onPress={() => router.push('/savings/add-goal')}
            style={[styles.addBtn, { backgroundColor: theme.accent }]}
          >
            <Icon name="add" size={22} color="#FFF" />
          </Pressable>
        </Animated.View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* ── Overall overview ── */}
          {activeGoals.length > 0 && (
            <Animated.View entering={FadeInDown.delay(60).springify()}>
              <View style={[styles.overviewCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.overviewTop}>
                  <View>
                    <Text style={[styles.overviewLabel, { color: theme.muted }]}>Total Saved</Text>
                    <Text style={[styles.overviewSaved, { color: theme.success }]}>
                      {formatCurrency(totalSaved)}
                    </Text>
                  </View>
                  <View style={styles.overviewRight}>
                    <Text style={[styles.overviewLabel, { color: theme.muted }]}>Total Target</Text>
                    <Text style={[styles.overviewTarget, { color: theme.text }]}>
                      {formatCurrency(totalTarget)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.masterTrack, { backgroundColor: theme.border }]}>
                  <View
                    style={[
                      styles.masterFill,
                      {
                        width: `${overallPercentage}%`,
                        backgroundColor: theme.success,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.overviewPct, { color: theme.muted }]}>
                  {overallPercentage.toFixed(1)}% of all goals reached
                </Text>
              </View>
            </Animated.View>
          )}

          {/* ── Active goals ── */}
          {activeGoals.length === 0 ? (
            <Animated.View entering={FadeIn.duration(400)} style={styles.empty}>
              <View style={[styles.emptyIconWrap, { backgroundColor: theme.surface }]}>
                <Icon name="flag-outline" size={52} color={theme.muted} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No savings goals yet</Text>
              <Text style={[styles.emptySub, { color: theme.muted }]}>
                Create a goal to start tracking your savings progress.
              </Text>
              <Pressable
                onPress={() => router.push('/savings/add-goal')}
                style={[styles.emptyBtn, { backgroundColor: theme.accent }]}
              >
                <Text style={styles.emptyBtnLabel}>Create First Goal</Text>
              </Pressable>
            </Animated.View>
          ) : (
            activeGoals.map((goal, i) => (
              <Animated.View key={goal.id} entering={FadeInDown.delay(80 + i * 60).springify()}>
                <GoalCard goal={goal} theme={theme} />
              </Animated.View>
            ))
          )}

          {/* ── Completed goals ── */}
          {completedGoals.length > 0 && (
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Text style={[styles.sectionTitle, { color: theme.muted }]}>
                Completed ({completedGoals.length})
              </Text>
              {completedGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} theme={theme} completed />
              ))}
            </Animated.View>
          )}

          <View style={{ height: 16 }} />
        </ScrollView>
    </SafeAreaView>
  );
}

function GoalCard({
  goal,
  theme,
  completed,
}: {
  goal: SavingsGoalWithProgress;
  theme: ReturnType<typeof useTheme>;
  completed?: boolean;
}) {
  const daysLeft = goal.deadline
    ? Math.ceil((goal.deadline - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const deadlineLabel = () => {
    if (!goal.deadline) return null;
    if (daysLeft === null) return null;
    if (daysLeft < 0) return 'Overdue';
    if (daysLeft === 0) return 'Due today';
    if (daysLeft <= 7) return `${daysLeft}d left`;
    if (daysLeft <= 30) return `${Math.ceil(daysLeft / 7)}w left`;
    return `${Math.ceil(daysLeft / 30)}mo left`;
  };

  const deadlineColor = daysLeft !== null && daysLeft < 7 ? theme.danger : theme.muted;

  return (
    <Pressable
      onPress={() => router.push(`/savings/goal?id=${goal.id}`)}
      style={[
        styles.goalCard,
        {
          backgroundColor: theme.surface,
          borderColor: completed ? theme.border : goal.color + '44',
          opacity: completed ? 0.7 : 1,
        },
      ]}
    >
      {/* Top row */}
      <View style={styles.goalTop}>
        <View style={[styles.goalIconWrap, { backgroundColor: goal.color + '22' }]}>
          <Icon
            name={goal.icon as React.ComponentProps<typeof Icon>['name']}
            size={22}
            color={completed ? theme.muted : goal.color}
          />
        </View>
        <View style={styles.goalInfo}>
          <View style={styles.goalTitleRow}>
            <Text style={[styles.goalName, { color: theme.text }]} numberOfLines={1}>
              {goal.name}
            </Text>
            {completed && (
              <View style={[styles.completedBadge, { backgroundColor: theme.successDim }]}>
                <Icon name="checkmark-circle" size={13} color={theme.success} />
                <Text style={[styles.completedLabel, { color: theme.success }]}>Done</Text>
              </View>
            )}
          </View>
          {deadlineLabel() && (
            <Text style={[styles.deadlineText, { color: deadlineColor }]}>
              {deadlineLabel()}
            </Text>
          )}
        </View>
        <View style={styles.goalAmounts}>
          <Text style={[styles.savedAmt, { color: completed ? theme.success : goal.color }]}>
            {formatCurrency(goal.savedCents)}
          </Text>
          <Text style={[styles.targetAmt, { color: theme.muted }]}>
            of {formatCurrency(goal.targetCents)}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.goalTrack, { backgroundColor: theme.border }]}>
        <View
          style={[
            styles.goalFill,
            {
              width: `${goal.percentage}%`,
              backgroundColor: completed ? theme.success : goal.color,
            },
          ]}
        />
      </View>

      {/* Bottom row */}
      <View style={styles.goalBottom}>
        <Text style={[styles.pctText, { color: theme.muted }]}>
          {goal.percentage.toFixed(0)}% complete
        </Text>
        {!completed && goal.remainingCents > 0 && (
          <Text style={[styles.remainText, { color: theme.muted }]}>
            {formatCurrency(goal.remainingCents)} to go
          </Text>
        )}
        <Icon name="chevron-forward" size={14} color={theme.border} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingHorizontal: 20, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4, flex: 1, textAlign: 'center' },
  addBtn: { width: 38, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 16 },
  overviewCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    marginBottom: 20,
  },
  overviewTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  overviewRight: { alignItems: 'flex-end' },
  overviewLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 },
  overviewSaved: { fontSize: 26, fontWeight: '700', letterSpacing: -0.6 },
  overviewTarget: { fontSize: 26, fontWeight: '700', letterSpacing: -0.6 },
  masterTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  masterFill: { height: 8, borderRadius: 4 },
  overviewPct: { fontSize: 13, fontWeight: '500' },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 6,
  },
  goalCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 12,
  },
  goalTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  goalIconWrap: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  goalInfo: { flex: 1 },
  goalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalName: { fontSize: 16, fontWeight: '600', flex: 1 },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  completedLabel: { fontSize: 10, fontWeight: '700' },
  deadlineText: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  goalAmounts: { alignItems: 'flex-end' },
  savedAmt: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  targetAmt: { fontSize: 12, marginTop: 1 },
  goalTrack: { height: 7, borderRadius: 4, overflow: 'hidden', marginBottom: 10 },
  goalFill: { height: 7, borderRadius: 4 },
  goalBottom: { flexDirection: 'row', alignItems: 'center' },
  pctText: { flex: 1, fontSize: 12, fontWeight: '500' },
  remainText: { fontSize: 12, fontWeight: '500', marginRight: 6 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 14 },
  emptyIconWrap: { width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '600' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  emptyBtn: { marginTop: 4, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 999 },
  emptyBtnLabel: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
