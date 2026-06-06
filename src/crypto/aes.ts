import { gcm } from '@noble/ciphers/aes';
import { getRandomBytesAsync } from 'expo-crypto';
import { toHex, fromHex } from './bytes';

export interface Encrypted {
  nonce: string;      // hex-encoded 12-byte nonce
  ciphertext: string; // hex-encoded ciphertext + 16-byte GCM auth tag
}

export async function encrypt(plaintext: string, key: Uint8Array): Promise<Encrypted> {
  const nonce = await getRandomBytesAsync(12);
  const aes = gcm(key, nonce);
  const data = new TextEncoder().encode(plaintext);
  const ciphertext = aes.encrypt(data);
  return { nonce: toHex(nonce), ciphertext: toHex(ciphertext) };
}

// Throws if key is wrong (GCM auth tag mismatch) — callers should catch.
export function decrypt(encrypted: Encrypted, key: Uint8Array): string {
  const nonce = fromHex(encrypted.nonce);
  const ciphertext = fromHex(encrypted.ciphertext);
  const aes = gcm(key, nonce);
  const plaintext = aes.decrypt(ciphertext);
  return new TextDecoder().decode(plaintext);
}
