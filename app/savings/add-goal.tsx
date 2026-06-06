import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Icon } from '../../src/ui/Icon';
import { Button } from '../../src/ui/Button';
import { useTheme } from '../../src/ui/theme';
import { useSavings } from '../../src/savings/useSavings';
import { parseCents, centsToInputString } from '../../src/finance/utils';
import { SAVINGS_ICONS, SAVINGS_COLORS } from '../../src/savings/types';

export default function AddGoalScreen() {
  const theme = useTheme();
  const { goalId } = useLocalSearchParams<{ goalId?: string }>();
  const { addGoal, updateGoal, getGoalById } = useSavings();

  const existing = goalId ? getGoalById(goalId) : undefined;
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [icon, setIcon] = useState(existing?.icon ?? 'flag-outline');
  const [color, setColor] = useState(existing?.color ?? SAVINGS_COLORS[0]);
  const [targetStr, setTargetStr] = useState(existing ? centsToInputString(existing.targetCents) : '');
  const [hasDeadline, setHasDeadline] = useState(!!existing?.deadline);
  const [deadlineMonth, setDeadlineMonth] = useState(() => {
    if (existing?.deadline) {
      const d = new Date(existing.deadline);
      return { year: d.getFullYear(), month: d.getMonth() };
    }
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [loading, setLoading] = useState(false);

  const targetCents = parseCents(targetStr);
  const canSave = name.trim().length > 0 && targetCents > 0;

  function adjustDeadlineMonth(delta: number) {
    setDeadlineMonth((prev) => {
      let m = prev.month + delta;
      let y = prev.year;
      if (m > 11) { m -= 12; y++; }
      if (m < 0) { m += 12; y--; }
      const now = new Date();
      if (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth())) return prev;
      return { year: y, month: m };
    });
  }

  function deadlineLabel() {
    return new Date(deadlineMonth.year, deadlineMonth.month, 1)
      .toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  function getDeadlineEpoch(): number {
    return new Date(deadlineMonth.year, deadlineMonth.month + 1, 0, 23, 59, 59).getTime();
  }

  async function handleSave() {
    if (!canSave) return;
    setLoading(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const data = {
        name: name.trim(),
        icon,
        color,
        targetCents,
        deadline: hasDeadline ? getDeadlineEpoch() : null,
        isCompleted: existing?.isCompleted ?? false,
      };
      if (isEdit && goalId) {
        updateGoal(goalId, data);
      } else {
        addGoal(data);
      }
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save goal. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
        {/* ── Nav ── */}
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Icon name="chevron-down" size={26} color={theme.text} />
          </Pressable>
          <Text style={[styles.navTitle, { color: theme.text }]}>
            {isEdit ? 'Edit Goal' : 'New Savings Goal'}
          </Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          {/* ── Preview badge ── */}
          <Animated.View entering={FadeInDown.delay(40).springify()} style={styles.previewWrap}>
            <View style={[styles.preview, { backgroundColor: color + '22', borderColor: color + '44' }]}>
              <Icon
                name={icon as React.ComponentProps<typeof Icon>['name']}
                size={36}
                color={color}
              />
            </View>
            <Text style={[styles.previewName, { color: theme.text }]}>
              {name.trim() || 'Goal Name'}
            </Text>
          </Animated.View>

          {/* ── Name ── */}
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <FormLabel theme={theme}>Goal Name</FormLabel>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              value={name}
              onChangeText={setName}
              placeholder="Emergency Fund, Japan Trip, New Car…"
              placeholderTextColor={theme.muted}
              autoFocus
            />
          </Animated.View>

          {/* ── Target amount ── */}
          <Animated.View entering={FadeInDown.delay(120).springify()}>
            <FormLabel theme={theme}>Target Amount</FormLabel>
            <View style={styles.amountWrap}>
              <Text style={[styles.currSign, { color: theme.muted }]}>$</Text>
              <TextInput
                style={[styles.amountInput, { color: theme.text }]}
                value={targetStr}
                onChangeText={setTargetStr}
                placeholder="0.00"
                placeholderTextColor={theme.border}
                keyboardType="decimal-pad"
              />
            </View>
          </Animated.View>

          {/* ── Icon picker ── */}
          <Animated.View entering={FadeInDown.delay(160).springify()}>
            <FormLabel theme={theme}>Icon</FormLabel>
            <View style={styles.iconGrid}>
              {SAVINGS_ICONS.map((item) => (
                <Pressable
                  key={item.icon}
                  onPress={() => setIcon(item.icon)}
                  style={[
                    styles.iconBtn,
                    {
                      backgroundColor: icon === item.icon ? color + '22' : theme.surface,
                      borderColor: icon === item.icon ? color : theme.border,
                    },
                  ]}
                >
                  <Icon
                    name={item.icon as React.ComponentProps<typeof Icon>['name']}
                    size={22}
                    color={icon === item.icon ? color : theme.muted}
                  />
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* ── Color picker ── */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <FormLabel theme={theme}>Color</FormLabel>
            <View style={styles.colorRow}>
              {SAVINGS_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: c },
                    color === c && styles.colorSelected,
                  ]}
                >
                  {color === c && <Icon name="checkmark" size={14} color="#FFF" />}
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* ── Deadline toggle ── */}
          <Animated.View entering={FadeInDown.delay(240).springify()}>
            <Pressable
              onPress={() => setHasDeadline(!hasDeadline)}
              style={[
                styles.toggle,
                {
                  backgroundColor: theme.surface,
                  borderColor: hasDeadline ? theme.accent : theme.border,
                },
              ]}
            >
              <View style={styles.toggleLeft}>
                <Icon
                  name="calendar-outline"
                  size={18}
                  color={hasDeadline ? theme.accent : theme.muted}
                />
                <View>
                  <Text style={[styles.toggleTitle, { color: theme.text }]}>Target Date</Text>
                  <Text style={[styles.toggleSub, { color: theme.muted }]}>
                    Optional deadline for this goal
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.toggleSwitch,
                  { backgroundColor: hasDeadline ? theme.accent : theme.border },
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    { transform: [{ translateX: hasDeadline ? 18 : 0 }] },
                  ]}
                />
              </View>
            </Pressable>

            {hasDeadline && (
              <View style={[styles.deadlinePicker, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Pressable onPress={() => adjustDeadlineMonth(-1)} hitSlop={16}>
                  <Icon name="chevron-back" size={20} color={theme.muted} />
                </Pressable>
                <Text style={[styles.deadlineLabel, { color: theme.text }]}>
                  {deadlineLabel()}
                </Text>
                <Pressable onPress={() => adjustDeadlineMonth(1)} hitSlop={16}>
                  <Icon name="chevron-forward" size={20} color={theme.muted} />
                </Pressable>
              </View>
            )}
          </Animated.View>

          <View style={{ height: 16 }} />
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Button
            label={isEdit ? 'Save Changes' : 'Create Goal'}
            disabled={!canSave}
            loading={loading}
            onPress={handleSave}
          />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function FormLabel({
  children,
  theme,
}: {
  children: React.ReactNode;
  theme: ReturnType<typeof useTheme>;
}) {
  return <Text style={[styles.formLabel, { color: theme.muted }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingHorizontal: 20 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 12 },
  navTitle: { fontSize: 17, fontWeight: '600' },
  scroll: { paddingBottom: 8 },
  previewWrap: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  preview: { width: 80, height: 80, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  previewName: { fontSize: 18, fontWeight: '700' },
  formLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  input: { borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontWeight: '500' },
  amountWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  currSign: { fontSize: 28, fontWeight: '300' },
  amountInput: { fontSize: 36, fontWeight: '700', letterSpacing: -1, flex: 1 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconBtn: { width: 52, height: 52, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  colorSwatch: { width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  colorSelected: { borderWidth: 3, borderColor: '#FFF' },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 14, marginTop: 16 },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleTitle: { fontSize: 15, fontWeight: '600' },
  toggleSub: { fontSize: 12, marginTop: 1 },
  toggleSwitch: { width: 44, height: 26, borderRadius: 999, padding: 3, justifyContent: 'center' },
  toggleThumb: { width: 20, height: 20, borderRadius: 999, backgroundColor: '#FFF' },
  deadlinePicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 14, marginTop: 10 },
  deadlineLabel: { fontSize: 15, fontWeight: '600' },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, paddingBottom: 20 },
});
