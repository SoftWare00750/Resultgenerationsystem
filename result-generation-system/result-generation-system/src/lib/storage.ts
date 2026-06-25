/**
 * storage.ts
 * Thin shim that replaces the old localStorage-only storage module.
 *
 * The UI pages now call the backend services directly.
 * This file exists only so that:
 *  - pdf-generator.tsx can call getSchoolInfo() / getSignatures() synchronously
 *  - any legacy code that still imports from '@/lib/storage' continues to compile
 *
 * Signatures are still kept in localStorage because they are large base64 blobs
 * that the current backend doesn't expose via a dedicated download URL.
 */

// ─── Re-export the types / constants the old storage module exported ──────────

export { KEYS } from './storageKeys';

// ─── School info (local cache only, populated when admin saves settings) ──────

export interface SchoolInfo {
  name: string;
  logo?: string;
  address?: string;
  motto?: string;
}

export function getSchoolInfo(): SchoolInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('rgs_school_info');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSchoolInfo(info: SchoolInfo): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('rgs_school_info', JSON.stringify(info));
}

// ─── Signatures (always local) ─────────────────────────────────────────────────

export interface SignatureStore {
  [userId: string]: string;
}

export function getSignatures(): SignatureStore {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('rgs_signatures') || '{}');
  } catch {
    return {};
  }
}

export function setSignature(userId: string, dataUrl: string): void {
  const sigs = getSignatures();
  sigs[userId] = dataUrl;
  if (typeof window !== 'undefined') {
    localStorage.setItem('rgs_signatures', JSON.stringify(sigs));
  }
}

export function getSignature(userId: string): string | null {
  return getSignatures()[userId] || null;
}

// ─── Generic helpers (used by a handful of legacy page imports) ───────────────

export function getStore<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setStore<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── No-op seeds (data now lives in Postgres, not localStorage) ───────────────

export function seedDefaults(): void {
  /* no-op — backend owns the data */
}

export function ensureAdminPassword(): void {
  /* no-op — backend owns passwords */
}

export function getPasswords(): Record<string, string> {
  return {};
}

export function setPassword(_userId: string, _password: string): void {
  /* no-op */
}