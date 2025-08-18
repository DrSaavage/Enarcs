import * as Crypto from 'expo-crypto';

export async function generateUUIDv4(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  // Per RFC 4122 §4.4
  randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40; // version 4
  randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80; // variant 10

  const hex = [...randomBytes].map(b => b.toString(16).padStart(2, '0')).join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20)
  ].join('-');
}
