import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { getSetting, setSetting } from '../storage/settings';
import {
  clearInMemoryDek,
  setupBiometric,
  setupPassword,
  unlockWithBiometric,
  unlockWithPassword,
} from '../crypto/keyManager';
import type { SecurityType } from '../types';

type AuthState = 'loading' | 'setup' | 'locked' | 'unlocked';

interface AuthContextValue {
  state: AuthState;
  securityType: SecurityType | null;
  completeSetup(type: SecurityType, password?: string): Promise<void>;
  unlock(password?: string): Promise<boolean>;
  lock(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>('loading');
  const [securityType, setSecurityType] = useState<SecurityType | null>(null);
  const stateRef = useRef<AuthState>('loading');

  useEffect(() => {
    const st = getSetting('security_type') as SecurityType | null;
    if (st) {
      setSecurityType(st);
      setState('locked');
      stateRef.current = 'locked';
    } else {
      setState('setup');
      stateRef.current = 'setup';
    }
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (
        (next === 'background' || next === 'inactive') &&
        stateRef.current === 'unlocked'
      ) {
        clearInMemoryDek();
        setState('locked');
        stateRef.current = 'locked';
      }
    });
    return () => sub.remove();
  }, []);

  async function completeSetup(
    type: SecurityType,
    password?: string
  ): Promise<void> {
    if (type === 'biometric') {
      await setupBiometric();
    } else {
      if (!password) throw new Error('Password is required');
      await setupPassword(password);
    }
    setSetting('security_type', type);
    setSecurityType(type);
    setState('unlocked');
    stateRef.current = 'unlocked';
  }

  async function unlock(password?: string): Promise<boolean> {
    let ok = false;
    if (securityType === 'biometric') {
      ok = await unlockWithBiometric();
    } else {
      if (!password) return false;
      ok = await unlockWithPassword(password);
    }
    if (ok) {
      setState('unlocked');
      stateRef.current = 'unlocked';
    }
    return ok;
  }

  function lock(): void {
    clearInMemoryDek();
    setState('locked');
    stateRef.current = 'locked';
  }

  return (
    <AuthContext.Provider
      value={{ state, securityType, completeSetup, unlock, lock }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
