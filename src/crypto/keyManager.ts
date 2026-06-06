import * as SecureStore from 'expo-secure-store';
import { getRandomBytesAsync } from 'expo-crypto';
import { encrypt, decrypt } from './aes';
import { deriveKey, KDF_ITERATIONS } from './kdf';
import { toHex, fromHex } from './bytes';
import { getSetting, setSetting } from '../storage/settings';
import type { SecurityType } from '../types';

const SECURE_DEK_KEY = 'pass_wordless_dek_v1';

// DEK lives only in memory — never persisted in plaintext.
let _dek: Uint8Array | null = null;

export function getInMemoryDek(): Uint8Array | null {
  return _dek;
}

export function clearInMemoryDek(): void {
  if (_dek) {
    _dek.fill(0);
    _dek = null;
  }
}

function holdDek(dek: Uint8Array): void {
  _dek = dek;
}

// ── First-run setup ────────────────────────────────────────────────────────

export async function setupBiometric(): Promise<void> {
  const dek = await getRandomBytesAsync(32);
  await SecureStore.setItemAsync(SECURE_DEK_KEY, toHex(dek), {
    requireAuthentication: true,
    authenticationPrompt: 'Authorize pass-wordless setup',
  });
  holdDek(dek);
}

export async function setupPassword(password: string): Promise<void> {
  const dek = await getRandomBytesAsync(32);
  const salt = await getRandomBytesAsync(16);
  const kek = await deriveKey(password, salt);
  const wrapped = await encrypt(toHex(dek), kek);

  setSetting('kdf_salt', toHex(salt));
  setSetting('kdf_iters', String(KDF_ITERATIONS));
  setSetting('wrapped_dek_nonce', wrapped.nonce);
  setSetting('wrapped_dek_ct', wrapped.ciphertext);

  holdDek(dek);
}

// ── Unlock ─────────────────────────────────────────────────────────────────

export async function unlockWithBiometric(): Promise<boolean> {
  try {
    const dekHex = await SecureStore.getItemAsync(SECURE_DEK_KEY, {
      requireAuthentication: true,
      authenticationPrompt: 'Unlock pass-wordless',
    });
    if (!dekHex) return false;
    holdDek(fromHex(dekHex));
    return true;
  } catch {
    return false;
  }
}

export async function unlockWithPassword(password: string): Promise<boolean> {
  try {
    const saltHex = getSetting('kdf_salt');
    const itersStr = getSetting('kdf_iters');
    const nonce = getSetting('wrapped_dek_nonce');
    const ct = getSetting('wrapped_dek_ct');
    if (!saltHex || !itersStr || !nonce || !ct) return false;

    const kek = await deriveKey(password, fromHex(saltHex), parseInt(itersStr, 10));
    const dekHex = decrypt({ nonce, ciphertext: ct }, kek);
    holdDek(fromHex(dekHex));
    return true;
  } catch {
    // GCM auth-tag mismatch = wrong password
    return false;
  }
}
