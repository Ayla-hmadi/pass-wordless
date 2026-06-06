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
import { useFinance } from '../../src/finance/useFinance';
import { parseCents, centsToInputString, formatDate } from '../../src/finance/utils';
import type { TransactionType, Category } from '../../src/finance/types';

export default function EditTransaction() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions, categories, paymentMethods, updateTransaction, deleteTransaction } = useFinance();

  const tx = transactions.find((t) => t.id === id);

  const [type, setType] = useState<TransactionType>(tx?.type ?? 'expense');
  const [amountStr, setAmountStr] = useState(tx ? centsToInputString(tx.amountCents) : '');
  const [categoryId, setCategoryId] = useState(tx?.categoryId ?? '');
  const [label, setLabel] = useState(tx?.label ?? '');
  const [notes, setNotes] = useState(tx?.notes ?? '');
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(tx?.paymentMethodId ?? null);
  const [date, setDate] = useState(tx?.date ?? Date.now());
  const [investmentPlatform, setInvestmentPlatform] = useState(tx?.investmentPlatform ?? '');
  const [loading, setLoading] = useState(false);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);
  const amountCents = parseCents(amountStr);
  const canSave = amountCents > 0 && categoryId && label.trim().length > 0;

  useEffect(() => {
    if (!tx) {
      router.back();
    }
  }, [tx]);

  function changeType(t: TransactionType) {
    setType(t);
    setCategoryId('');
  }

  function adjustDate(days: number) {
    setDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + days);
      const now = new Date();
      if (d > now) return prev;
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

  async function handleSave() {
    if (!canSave || !tx) return;
    setLoading(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      updateTransaction(tx.id, {
        type,
        amountCents,
        categoryId,
        paymentMethodId,
        label: label.trim(),
        notes: notes.trim() || null,
        date,
        investmentPlatform: type === 'investment' ? investmentPlatform.trim() || null : null,
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to update. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleDelete() {
    if (!tx) return;
    Alert.alert('Delete Transaction', `Delete "${tx.label}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTransaction(tx.id);
          router.back();
        },
      },
    ]);
  }

  if (!tx) return null;

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
          <Text style={[styles.navTitle, { color: theme.text }]}>Edit Transaction</Text>
          <Pressable onPress={handleDelete} hitSlop={12}>
            <Icon name="trash-outline" size={22} color={theme.danger} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          {/* ── Type ── */}
          <Animated.View entering={FadeInDown.delay(40).springify()}>
            <View style={[styles.typeRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {(['expense', 'income', 'investment'] as TransactionType[]).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => changeType(t)}
                  style={[styles.typeBtn, type === t && { backgroundColor: theme.accent }]}
                >
                  <Text style={[styles.typeLabel, { color: type === t ? '#FFF' : theme.muted }]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* ── Amount ── */}
          <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.amountWrap}>
            <Text style={[styles.currencySign, { color: theme.muted }]}>$</Text>
            <TextInput
              style={[styles.amountInput, { color: theme.text }]}
              value={amountStr}
              onChangeText={setAmountStr}
              placeholder="0.00"
              placeholderTextColor={theme.border}
              keyboardType="decimal-pad"
            />
          </Animated.View>

          {/* ── Label ── */}
          <Animated.View entering={FadeInDown.delay(120).springify()}>
            <FormLabel theme={theme}>Description</FormLabel>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              value={label}
              onChangeText={setLabel}
              placeholder="Transaction description"
              placeholderTextColor={theme.muted}
            />
          </Animated.View>

          {/* ── Category ── */}
          <Animated.View entering={FadeInDown.delay(160).springify()}>
            <FormLabel theme={theme}>Category</FormLabel>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catScroll}
            >
              {filteredCategories.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  cat={cat}
                  selected={categoryId === cat.id}
                  onPress={() => setCategoryId(cat.id)}
                  theme={theme}
                />
              ))}
            </ScrollView>
          </Animated.View>

          {/* ── Investment platform ── */}
          {type === 'investment' && (
            <Animated.View entering={FadeInDown.delay(180).springify()}>
              <FormLabel theme={theme}>Platform</FormLabel>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                value={investmentPlatform}
                onChangeText={setInvestmentPlatform}
                placeholder="Vanguard, Fidelity…"
                placeholderTextColor={theme.muted}
              />
            </Animated.View>
          )}

          {/* ── Date ── */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <FormLabel theme={theme}>Date</FormLabel>
            <View style={[styles.dateRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Pressable onPress={() => adjustDate(-1)} hitSlop={12} style={styles.dateArrow}>
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
          </Animated.View>

          {/* ── Payment method ── */}
          <Animated.View entering={FadeInDown.delay(220).springify()}>
            <FormLabel theme={theme}>Payment Method</FormLabel>
            <Pressable
              onPress={() => setShowPaymentPicker(!showPaymentPicker)}
              style={[styles.picker, { backgroundColor: theme.surface, borderColor: showPaymentPicker ? theme.accent : theme.border }]}
            >
              <Text style={[styles.pickerText, { color: paymentMethodId ? theme.text : theme.muted }]}>
                {paymentMethods.find((m) => m.id === paymentMethodId)?.name ?? 'None'}
              </Text>
              <Icon name={showPaymentPicker ? 'chevron-up' : 'chevron-down'} size={16} color={theme.muted} />
            </Pressable>
            {showPaymentPicker && (
              <View style={[styles.dropDown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Pressable onPress={() => { setPaymentMethodId(null); setShowPaymentPicker(false); }} style={styles.dropItem}>
                  <Text style={[styles.dropLabel, { color: theme.muted }]}>None</Text>
                </Pressable>
                {paymentMethods.map((m) => (
                  <Pressable key={m.id} onPress={() => { setPaymentMethodId(m.id); setShowPaymentPicker(false); }} style={styles.dropItem}>
                    <Text style={[styles.dropLabel, { color: theme.text }]}>{m.name}</Text>
                    {paymentMethodId === m.id && <Icon name="checkmark" size={16} color={theme.accent} />}
                  </Pressable>
                ))}
              </View>
            )}
          </Animated.View>

          {/* ── Notes ── */}
          <Animated.View entering={FadeInDown.delay(240).springify()}>
            <FormLabel theme={theme}>Notes</FormLabel>
            <TextInput
              style={[styles.input, styles.notesInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional notes…"
              placeholderTextColor={theme.muted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </Animated.View>

          <View style={{ height: 16 }} />
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Button label="Save Changes" disabled={!canSave} loading={loading} onPress={handleSave} />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function FormLabel({ children, theme }: { children: React.ReactNode; theme: ReturnType<typeof useTheme> }) {
  return <Text style={[styles.formLabel, { color: theme.muted }]}>{children}</Text>;
}

function CategoryChip({ cat, selected, onPress, theme }: { cat: Category; selected: boolean; onPress: () => void; theme: ReturnType<typeof useTheme> }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.catChip, { backgroundColor: selected ? `${cat.color}22` : theme.surface, borderColor: selected ? cat.color : theme.border }]}
    >
      <Icon name={cat.icon as React.ComponentProps<typeof Icon>['name']} size={15} color={selected ? cat.color : theme.muted} />
      <Text style={[styles.catChipLabel, { color: selected ? cat.color : theme.muted }]}>{cat.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, paddingHorizontal: 20 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 12 },
  navTitle: { fontSize: 17, fontWeight: '600' },
  scroll: { paddingBottom: 8 },
  typeRow: { flexDirection: 'row', borderRadius: 14, borderWidth: 1.5, padding: 4, marginBottom: 20 },
  typeBtn: { flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { fontSize: 14, fontWeight: '600' },
  amountWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 28, gap: 4 },
  currencySign: { fontSize: 36, fontWeight: '300', marginTop: 6 },
  amountInput: { fontSize: 52, fontWeight: '700', letterSpacing: -1.5, minWidth: 120, textAlign: 'center' },
  formLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  input: { borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontWeight: '500' },
  notesInput: { height: 88, paddingTop: 12 },
  catScroll: { gap: 8, paddingBottom: 4 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5 },
  catChipLabel: { fontSize: 13, fontWeight: '600' },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 13 },
  dateArrow: { padding: 4 },
  dateLabel: { fontSize: 15, fontWeight: '600' },
  picker: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 13 },
  pickerText: { flex: 1, fontSize: 15, fontWeight: '500' },
  dropDown: { borderRadius: 12, borderWidth: 1.5, marginTop: 6, overflow: 'hidden' },
  dropItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 13 },
  dropLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, paddingBottom: 20 },
});
