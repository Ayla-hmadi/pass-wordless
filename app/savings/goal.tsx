import React, { useState } from 'react';
import {
  Alert,
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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Icon } from '../../src/ui/Icon';
import { Button } from '../../src/ui/Button';
import { useTheme } from '../../src/ui/theme';
import { useSavings } from '../../src/savings/useSavings';
import { formatCurrency, formatDate, parseCents } from '../../src/finance/utils';

export default function GoalDetail() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getGoalById, getGoalContributions, addContribution, deleteContribution, deleteGoal, completeGoal } = useSavings();

  const goal = getGoalById(id ?? '');
  const contributions = getGoalContributions(id ?? '');

  const [modalOpen, setModalOpen] = useState(false);
  const [amountStr, setAmountStr] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(Date.now());
  const [saving, setSaving] = useState(false);

  if (!goal) {
    return null;
  }

  function adjustDate(days: number) {
    setDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + days);
      if (d > new Date()) return prev;
      return d.getTime();
    });
  }

  function dateLabel(): string {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  async function handleAddContribution() {
    const cents = parseCents(amountStr);
    if (cents <= 0) return;
    setSaving(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      addContribution(goal!.id, cents, notes.trim() || null, date);
      setModalOpen(false);
      setAmountStr('');
      setNotes('');
      setDate(Date.now());

      // Auto-complete if target reached
      if (!goal!.isCompleted && goal!.savedCents + cents >= goal!.targetCents) {
        Alert.alert(
          '🎉 Goal Reached!',
          `You've reached your savings goal for "${goal!.name}"! Mark it as complete?`,
          [
            { text: 'Keep Active', style: 'cancel' },
            { text: 'Complete Goal', onPress: () => completeGoal(goal!.id) },
          ],
        );
      }
    } finally {
      setSaving(false);
    }
  }

  function confirmDeleteContribution(contributionId: string) {
    Alert.alert('Delete Entry', 'Remove this contribution?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteContribution(contributionId) },
    ]);
  }

  function confirmDeleteGoal() {
    Alert.alert(
      'Delete Goal',
      `Delete "${goal!.name}" and all its contributions? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteGoal(goal!.id);
            router.back();
          },
        },
      ],
    );
  }

  const amountCents = parseCents(amountStr);
  const canAdd = amountCents > 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      {/* ── Nav ── */}
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Icon name="chevron-back" size={26} color={theme.text} />
        </Pressable>
        <View style={styles.navActions}>
          <Pressable
            onPress={() => router.push(`/savings/add-goal?goalId=${goal.id}`)}
            hitSlop={12}
          >
            <Icon name="pencil-outline" size={20} color={theme.muted} />
          </Pressable>
          <Pressable onPress={confirmDeleteGoal} hitSlop={12}>
            <Icon name="trash-outline" size={20} color={theme.danger} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Goal hero ── */}
        <Animated.View entering={FadeIn.duration(300)}>
          <View style={[styles.heroCard, { backgroundColor: theme.surface, borderColor: goal.color + '44' }]}>
            <View style={styles.heroTop}>
              <View style={[styles.heroIcon, { backgroundColor: goal.color + '22' }]}>
                <Icon
                  name={goal.icon as React.ComponentProps<typeof Icon>['name']}
                  size={32}
                  color={goal.isCompleted ? theme.success : goal.color}
                />
              </View>
              <View style={styles.heroMeta}>
                <Text style={[styles.heroName, { color: theme.text }]}>{goal.name}</Text>
                {goal.isCompleted ? (
                  <View style={[styles.completedBadge, { backgroundColor: theme.successDim }]}>
                    <Icon name="checkmark-circle" size={13} color={theme.success} />
                    <Text style={[styles.completedLabel, { color: theme.success }]}>Goal Completed</Text>
                  </View>
                ) : goal.deadline ? (
                  <Text style={[styles.deadline, { color: theme.muted }]}>
                    {new Date(goal.deadline).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Big progress number */}
            <Text style={[styles.heroSaved, { color: goal.isCompleted ? theme.success : goal.color }]}>
              {formatCurrency(goal.savedCents)}
            </Text>
            <Text style={[styles.heroTarget, { color: theme.muted }]}>
              saved of {formatCurrency(goal.targetCents)}
            </Text>

            {/* Progress bar */}
            <View style={[styles.heroTrack, { backgroundColor: theme.border }]}>
              <View
                style={[
                  styles.heroFill,
                  {
                    width: `${goal.percentage}%`,
                    backgroundColor: goal.isCompleted ? theme.success : goal.color,
                  },
                ]}
              />
            </View>

            <View style={styles.heroStats}>
              <Text style={[styles.heroPct, { color: goal.isCompleted ? theme.success : goal.color }]}>
                {goal.percentage.toFixed(0)}%
              </Text>
              {!goal.isCompleted && goal.remainingCents > 0 && (
                <Text style={[styles.heroRemain, { color: theme.muted }]}>
                  {formatCurrency(goal.remainingCents)} remaining
                </Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* ── Add money button ── */}
        {!goal.isCompleted && (
          <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.addMoneyWrap}>
            <Button
              label="+ Add Money"
              onPress={() => setModalOpen(true)}
            />
            {!goal.isCompleted && (
              <Pressable
                onPress={() => completeGoal(goal.id)}
                style={[styles.completeBtn, { borderColor: theme.success }]}
              >
                <Icon name="checkmark-circle-outline" size={18} color={theme.success} />
                <Text style={[styles.completeBtnLabel, { color: theme.success }]}>
                  Mark as Complete
                </Text>
              </Pressable>
            )}
          </Animated.View>
        )}

        {/* ── Contributions history ── */}
        <Animated.View entering={FadeInDown.delay(140).springify()}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Contributions ({contributions.length})
          </Text>
          {contributions.length === 0 ? (
            <View style={[styles.emptyContrib, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Icon name="cash-outline" size={28} color={theme.muted} />
              <Text style={[styles.emptyContribText, { color: theme.muted }]}>
                No contributions yet. Tap "Add Money" to start saving.
              </Text>
            </View>
          ) : (
            <View style={[styles.contribList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {contributions.map((c, i) => {
                const isLast = i === contributions.length - 1;
                return (
                  <View key={c.id}>
                    <Pressable
                      onLongPress={() => confirmDeleteContribution(c.id)}
                      style={styles.contribRow}
                    >
                      <View style={[styles.contribDot, { backgroundColor: goal.color + '33' }]}>
                        <Icon name="arrow-up" size={13} color={goal.color} />
                      </View>
                      <View style={styles.contribMeta}>
                        <Text style={[styles.contribDate, { color: theme.text }]}>
                          {formatDate(c.date)}
                        </Text>
                        {c.notes && (
                          <Text style={[styles.contribNotes, { color: theme.muted }]}>
                            {c.notes}
                          </Text>
                        )}
                      </View>
                      <Text style={[styles.contribAmt, { color: goal.color }]}>
                        +{formatCurrency(c.amountCents)}
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

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Add contribution modal ── */}
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
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Money</Text>
            <Text style={[styles.modalSub, { color: theme.muted }]}>
              {goal.name} · {formatCurrency(goal.savedCents)} saved
            </Text>

            {/* Amount */}
            <View style={styles.amountRow}>
              <Text style={[styles.currSign, { color: theme.muted }]}>$</Text>
              <TextInput
                style={[styles.amountInput, { color: theme.text }]}
                value={amountStr}
                onChangeText={setAmountStr}
                placeholder="0.00"
                placeholderTextColor={theme.border}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>

            {/* Date */}
            <View style={[styles.dateRow, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              <Pressable onPress={() => adjustDate(-1)} hitSlop={12}>
                <Icon name="chevron-back" size={18} color={theme.muted} />
              </Pressable>
              <Text style={[styles.dateLabel, { color: theme.text }]}>{dateLabel()}</Text>
              <Pressable
                onPress={() => adjustDate(1)}
                hitSlop={12}
                disabled={dateLabel() === 'Today'}
              >
                <Icon name="chevron-forward" size={18} color={dateLabel() === 'Today' ? 'transparent' : theme.muted} />
              </Pressable>
            </View>

            {/* Notes */}
            <TextInput
              style={[styles.notesInput, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Note (optional)"
              placeholderTextColor={theme.muted}
            />

            <Button
              label={canAdd ? `Add ${formatCurrency(amountCents)}` : 'Add Money'}
              disabled={!canAdd}
              loading={saving}
              onPress={handleAddContribution}
            />
            <View style={{ height: 8 }} />
            <Button label="Cancel" variant="ghost" onPress={() => setModalOpen(false)} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingHorizontal: 20 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 12 },
  navActions: { flexDirection: 'row', gap: 16 },
  scroll: { paddingBottom: 40 },
  heroCard: { borderRadius: 20, borderWidth: 1.5, padding: 20, marginBottom: 16 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  heroIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  heroMeta: { flex: 1 },
  heroName: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, marginTop: 4, alignSelf: 'flex-start' },
  completedLabel: { fontSize: 11, fontWeight: '700' },
  deadline: { fontSize: 13, marginTop: 3 },
  heroSaved: { fontSize: 38, fontWeight: '700', letterSpacing: -1.5, marginBottom: 2 },
  heroTarget: { fontSize: 14, marginBottom: 16 },
  heroTrack: { height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 10 },
  heroFill: { height: 10, borderRadius: 5 },
  heroStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroPct: { fontSize: 18, fontWeight: '700' },
  heroRemain: { fontSize: 13 },
  addMoneyWrap: { gap: 10, marginBottom: 28 },
  completeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, borderWidth: 1.5, paddingVertical: 13 },
  completeBtnLabel: { fontSize: 15, fontWeight: '600' },
  sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2, marginBottom: 12 },
  emptyContrib: { borderRadius: 16, borderWidth: 1.5, padding: 24, alignItems: 'center', gap: 10 },
  emptyContribText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  contribList: { borderRadius: 16, borderWidth: 1.5, overflow: 'hidden' },
  contribRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  contribDot: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  contribMeta: { flex: 1 },
  contribDate: { fontSize: 15, fontWeight: '600' },
  contribNotes: { fontSize: 12, marginTop: 2 },
  contribAmt: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBg: { flex: 1 },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 44 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  modalSub: { fontSize: 14, marginBottom: 20 },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 4 },
  currSign: { fontSize: 32, fontWeight: '300', marginTop: 8 },
  amountInput: { fontSize: 52, fontWeight: '700', letterSpacing: -1.5, minWidth: 120, textAlign: 'center' },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12 },
  dateLabel: { fontSize: 15, fontWeight: '600' },
  notesInput: { borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 16 },
});
