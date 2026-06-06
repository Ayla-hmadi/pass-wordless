import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/auth/useAuthGate';
import { FinanceProvider } from '../src/finance/useFinance';
import { SavingsProvider } from '../src/savings/useSavings';

export default function RootLayout() {
  const scheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FinanceProvider>
          <SavingsProvider>
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'fade',
                contentStyle: {
                  backgroundColor: scheme === 'dark' ? '#0B0B0F' : '#FAFAFA',
                },
              }}
            >
              <Stack.Screen
                name="onboarding/choose-security"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="vault/add"
                options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
              />
              <Stack.Screen
                name="finance/add"
                options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
              />
              <Stack.Screen
                name="finance/edit"
                options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
              />
              <Stack.Screen
                name="finance/history"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="finance/budgets"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="finance/insights"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="finance/recurring"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="savings/index"
                options={{ animation: 'slide_from_right' }}
              />
              <Stack.Screen
                name="savings/add-goal"
                options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
              />
              <Stack.Screen
                name="savings/goal"
                options={{ animation: 'slide_from_right' }}
              />
            </Stack>
          </SavingsProvider>
        </FinanceProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
