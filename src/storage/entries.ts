import { randomUUID } from 'expo-crypto';
import { encrypt, decrypt } from '../crypto/aes';
import { getInMemoryDek } from '../crypto/keyManager';
import { getDB } from './db';
import type { Entry } from '../types';

function requireDek(): Uint8Array {
  const dek = getInMemoryDek();
  if (!dek) throw new Error('Vault is locked — DEK not available');
  return dek;
}

type EntryRow = {
  id: string;
  nonce: string;
  ciphertext: string;
  created_at: number;
  updated_at: number;
};

export async function addEntry(
  data: Pick<Entry, 'label' | 'username' | 'password'>
): Promise<Entry> {
  const dek = requireDek();
  const id = randomUUID();
  const now = Date.now();
  const plaintext = JSON.stringify({
    label: data.label,
    username: data.username,
    password: data.password,
  });
  const { nonce, ciphertext } = await encrypt(plaintext, dek);
  getDB().runSync(
    'INSERT INTO entries (id, nonce, ciphertext, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [id, nonce, ciphertext, now, now]
  );
  return { ...data, id, createdAt: now, updatedAt: now };
}

export function listEntries(): Entry[] {
  const dek = requireDek();
  const rows = getDB().getAllSync<EntryRow>(
    'SELECT * FROM entries ORDER BY created_at DESC'
  );
  return rows.map((row) => {
    try {
      const parsed = JSON.parse(
        decrypt({ nonce: row.nonce, ciphertext: row.ciphertext }, dek)
      ) as Pick<Entry, 'label' | 'username' | 'password'>;
      return {
        id: row.id,
        label: parsed.label,
        username: parsed.username,
        password: parsed.password,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch {
      return {
        id: row.id,
        label: '[error]',
        username: '',
        password: '',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }
  });
}
