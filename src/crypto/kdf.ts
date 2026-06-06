import { pbkdf2Async } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha2';

export const KDF_ITERATIONS = 100_000;

export async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number = KDF_ITERATIONS
): Promise<Uint8Array> {
  return pbkdf2Async(sha256, password, salt, { c: iterations, dkLen: 32 });
}
