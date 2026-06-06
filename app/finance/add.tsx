import React, { useState, useRef } from 'react';
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
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Icon } from '../../src/ui/Icon';
import { Button } from '../../src/ui/Button';
import { useTheme } from '../../src/ui/theme';
import { useFinance } from '../../src/finance/useFinance';
import { parseCents, formatCurrency, nextDueDateFromFrequency, frequencyLabel } from '../../src/finance/utils';
import type { TransactionType, TransactionFrequency, Category } from '../../src/finance/types';

const FREQUENCIES: TransactionFrequency[] = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'];

export default function AddTransaction() {
  const theme = useTheme();
  const {
    categories,
    paymentMethods,
    addTransaction,
    addRecurring,
  } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
  const [date, setDate] = useState(Date.now());
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<TransactionFrequency>('monthly');
  const [investmentPlatform, setInvestmentPlatform] = useState('');
  const [investmentUrl, setInvestmentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);
  const [showFreqPicker, setShowFreqPicker] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === type);
  const selectedCat = filteredCategories.find((c) => c.id === categoryId);
  const amountCents = parseCents(amountStr);
  const canSave = amountCents > 0 && categoryId && label.trim().length > 0;

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
    if (!canSave) return;
    setLoading(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (isRecurring) {
        addRecurring({
          type,
          amountCents,
          currency: 'USD',
          categoryId,
          paymentMethodId,
          label: label.trim(),
          notes: notes.trim() || null,
          frequency,
          startDate: date,
          nextDueDate: nextDueDateFromFrequency(frequency, date),
          isActive: true,
        });
      }
      addTransaction({
        type,
        amountCents,
        currency: 'USD',
        categoryId,
        paymentMethodId,
        label: label.trim(),
        notes: notes.trim() || null,
        date,
        isRecurring,
        recurringId: null,
        investmentPlatform: type === 'investment' ? investmentPlatform.trim() || null : null,
        investmentUrl: type === 'investment' ? investmentUrl.trim() || null : null,
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
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
          <Text style={[styles.navTitle, { color: theme.text }]}>New Transaction</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          {/* ── Type selector ── */}
          <Animated.View entering={FadeInDown.delay(40).springify()}>
            <View style={[styles.typeRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {(['expense', 'income', 'investment'] as TransactionType[]).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => changeType(t)}
                  style={[
                    styles.typeBtn,
                    type === t && { backgroundColor: theme.accent },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeLabel,
                      { color: type === t ? '#FFF' : theme.muted },
                    ]}
                  >
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
              autoFocus
            />
          </Animated.View>

          {/* ── Label ── */}
          <Animated.View entering={FadeInDown.delay(120).springify()}>
            <FormLabel theme={theme}>Description</FormLabel>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              value={label}
              onChangeText={setLabel}
              placeholder={
                type === 'expense'
                  ? 'Netflix, Groceries, Rent…'
                  : type === 'income'
                  ? 'Monthly salary, Freelance project…'
                  : 'Vanguard S&P 500, Bitcoin…'
              }
              placeholderTextColor={theme.muted}
              returnKeyType="next"
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

          {/* ── Investment platform (only for investments) ── */}
          {type === 'investment' && (
            <Animated.View entering={FadeInDown.delay(180).springify()}>
              <FormLabel theme={theme}>Platform</FormLabel>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                value={investmentPlatform}
                onChangeText={setInvestmentPlatform}
                placeholder="Vanguard, Fidelity, Coinbase…"
                placeholderTextColor={theme.muted}
              />
              <FormLabel theme={theme}>Platform URL (optional)</FormLabel>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                value={investmentUrl}
                onChangeText={setInvestmentUrl}
                placeholder="https://…"
                placeholderTextColor={theme.muted}
                keyboardType="url"
                autoCapitalize="none"
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
                style={styles.dateArrow}
                disabled={dateLabel() === 'Today'}
              >
                <Icon name="chevron-forward" size={18} color={dateLabel() === 'Today' ? 'transparent' : theme.muted} />
              </Pressable>
            </View>
          </Animated.View>

          {/* ── Payment method ── */}
          <Animated.View entering={FadeInDown.delay(220).springify()}>
            <FormLabel theme={theme}>Payment Method (optional)</FormLabel>
            <Pressable
              onPress={() => setShowPaymentPicker(!showPaymentPicker)}
              style={[styles.picker, { backgroundColor: theme.surface, borderColor: showPaymentPicker ? theme.accent : theme.border }]}
            >
              <Icon
                name={(paymentMethods.find((m) => m.id === paymentMethodId)?.icon ?? 'card-outline') as React.ComponentProps<typeof Icon>['name']}
                size={18}
                color={theme.muted}
              />
              <Text style={[styles.pickerText, { color: paymentMethodId ? theme.text : theme.muted }]}>
                {paymentMethods.find((m) => m.id === paymentMethodId)?.name ?? 'Select method'}
              </Text>
              <Icon name={showPaymentPicker ? 'chevron-up' : 'chevron-down'} size={16} color={theme.muted} />
            </Pressable>
            {showPaymentPicker && (
              <View style={[styles.dropDown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Pressable
                  onPress={() => { setPaymentMethodId(null); setShowPaymentPicker(false); }}
                  style={styles.dropItem}
                >
                  <Text style={[styles.dropLabel, { color: theme.muted }]}>None</Text>
                </Pressable>
                {paymentMethods.map((m) => (
                  <Pressable
                    key={m.id}
                    onPress={() => { setPaymentMethodId(m.id); setShowPaymentPicker(false); }}
                    style={styles.dropItem}
                  >
                    <Icon name={m.icon as React.ComponentProps<typeof Icon>['name']} size={16} color={theme.muted} />
                    <Text style={[styles.dropLabel, { color: theme.text }]}>{m.name}</Text>
                    {paymentMethodId === m.id && (
                      <Icon name="checkmark" size={16} color={theme.accent} />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </Animated.View>

          {/* ── Notes ── */}
          <Animated.View entering={FadeInDown.delay(240).springify()}>
            <FormLabel theme={theme}>Notes (optional)</FormLabel>
            <TextInput
              style={[styles.input, styles.notesInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes…"
              placeholderTextColor={theme.muted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </Animated.View>

          {/* ── Recurring toggle ── */}
          <Animated.View entering={FadeInDown.delay(260).springify()}>
            <Pressable
              onPress={() => setIsRecurring(!isRecurring)}
              style={[styles.toggle, { backgroundColor: theme.surface, borderColor: isRecurring ? theme.accent : theme.border }]}
            >
              <View style={styles.toggleLeft}>
                <Icon
                  name="repeat-outline"
                  size={18}
                  color={isRecurring ? theme.accent : theme.muted}
                />
                <View>
                  <Text style={[styles.toggleTitle, { color: theme.text }]}>Recurring</Text>
                  <Text style={[styles.toggleSub, { color: theme.muted }]}>
                    Repeats automatically
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.toggleSwitch,
                  { backgroundColor: isRecurring ? theme.accent : theme.border },
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    { transform: [{ translateX: isRecurring ? 18 : 0 }] },
                  ]}
                />
              </View>
            </Pressable>

            {isRecurring && (
              <View style={styles.freqWrap}>
                <Pressable
                  onPress={() => setShowFreqPicker(!showFreqPicker)}
                  style={[styles.picker, { backgroundColor: theme.surface, borderColor: showFreqPicker ? theme.accent : theme.border }]}
                >
                  <Icon name="time-outline" size={18} color={theme.muted} />
                  <Text style={[styles.pickerText, { color: theme.text }]}>
                    {frequencyLabel(frequency)}
                  </Text>
                  <Icon name={showFreqPicker ? 'chevron-up' : 'chevron-down'} size={16} color={theme.muted} />
                </Pressable>
                {showFreqPicker && (
                  <View style={[styles.dropDown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    {FREQUENCIES.map((f) => (
                      <Pressable
                        key={f}
                        onPress={() => { setFrequency(f); setShowFreqPicker(false); }}
                        style={styles.dropItem}
                      >
                        <Text style={[styles.dropLabel, { color: theme.text }]}>{frequencyLabel(f)}</Text>
                        {frequency === f && (
                          <Icon name="checkmark" size={16} color={theme.accent} />
                        )}
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}
          </Animated.View>

          <View style={{ height: 16 }} />
        </ScrollView>

        <Animated.View entering={FadeInDown.delay(300).springify()} style={[styles.footer, { borderTopColor: theme.border }]}>
          {amountCents > 0 && (
            <Text style={[styles.amountPreview, { color: theme.muted }]}>
              {type === 'income' ? '+' : '-'}{formatCurrency(amountCents)}
            </Text>
          )}
          <Button
            label="Save Transaction"
            disabled={!canSave}
            loading={loading}
            onPress={handleSave}
          />
        </Animated.View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function FormLabel({ children, theme }: { children: React.ReactNode; theme: ReturnType<typeof useTheme> }) {
  return (
    <Text style={[styles.formLabel, { color: theme.muted }]}>{children}</Text>
  );
}

function CategoryChip({
  cat,
  selected,
  onPress,
  theme,
}: {
  cat: Category;
  selected: boolean;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.catChip,
        {
          backgroundColor: selected ? `${cat.color}22` : theme.surface,
          borderColor: selected ? cat.color : theme.border,
        },
      ]}
    >
      <Icon
        name={cat.icon as React.ComponentProps<typeof Icon>['name']}
        size={16}
        color={selected ? cat.color : theme.muted}
      />
      <Text style={[styles.catChipLabel, { color: selected ? cat.color : theme.muted }]}>
        {cat.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 12,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  scroll: {
    paddingBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 4,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    gap: 4,
  },
  currencySign: {
    fontSize: 36,
    fontWeight: '300',
    marginTop: 6,
  },
  amountInput: {
    fontSize: 52,
    fontWeight: '700',
    letterSpacing: -1.5,
    minWidth: 120,
    textAlign: 'center',
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontWeight: '500',
  },
  notesInput: {
    height: 88,
    paddingTop: 12,
  },
  catScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  catChipLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  dateArrow: {
    padding: 4,
  },
  dateLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  pickerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  dropDown: {
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 6,
    overflow: 'hidden',
  },
  dropItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dropLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 16,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  toggleSub: {
    fontSize: 12,
    marginTop: 1,
  },
  toggleSwitch: {
    width: 44,
    height: 26,
    borderRadius: 999,
    padding: 3,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: '#FFF',
  },
  freqWrap: {
    marginTop: 10,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
    paddingBottom: 20,
    gap: 8,
  },
  amountPreview: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
  },
});
