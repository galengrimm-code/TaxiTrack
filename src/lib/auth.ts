// ============================================================================
// TAXITRACK - AUTH UTILITIES
// ============================================================================

import { cookies } from 'next/headers';

const COOKIE_NAME = 'taxitrack_auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Create a simple HMAC-like hash for the PIN using Web Crypto
 */
async function hashPin(pin: string): Promise<string> {
  const secret = process.env.AUTH_PIN || '';
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(pin));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Set an httpOnly secure auth cookie with HMAC-signed value
 */
export async function setAuthCookie(pin: string): Promise<void> {
  const hash = await hashPin(pin);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, hash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

/**
 * Verify the auth cookie is valid
 */
export async function verifyAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return false;

  const expectedHash = await hashPin(process.env.AUTH_PIN || '');
  return cookie.value === expectedHash;
}

/**
 * Clear the auth cookie (logout)
 */
export async function clearAuth(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
