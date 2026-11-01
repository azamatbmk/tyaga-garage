import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/** Общий пароль демо-сотрудников. В пустой боевой базе его не будет. */
export const DEMO_PASSWORD = 'tyaga-demo';

const KEY_LEN = 32;

export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LEN);
  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export function verifyPassword(password: string, stored: string) {
  const [kind, saltB64, hashB64] = stored.split('$');
  if (kind !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64url');
  const actual = scryptSync(password, Buffer.from(saltB64, 'base64url'), expected.length);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

let sharedDemoHash: string | null = null;

export function demoPasswordHash() {
  sharedDemoHash ??= hashPassword(DEMO_PASSWORD);
  return sharedDemoHash;
}
