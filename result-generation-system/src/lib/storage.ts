// Local Storage Service - replaces Appwrite backend
import { User, Student, Result, Class, Session } from '@/lib/types';
import { ID } from './id';

export const KEYS = {
  users: 'rgs_users',
  authCodes: 'rgs_auth_codes',
  students: 'rgs_students',
  results: 'rgs_results',
  classes: 'rgs_classes',
  sessions: 'rgs_sessions',
  currentSession: 'rgs_current_session',
  currentUser: 'rgs_current_user',
  schoolInfo: 'rgs_school_info',       // school name, logo, address
  signatures: 'rgs_signatures',         // principal + teacher signatures by userId
};

export interface SchoolInfo {
  name: string;
  logo?: string;       // base64 data URL
  address?: string;
  motto?: string;
}

export interface SignatureStore {
  [userId: string]: string; // base64 data URL of signature
}

// ─── Generic store helpers ────────────────────────────────────────────────────

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

// ─── School info ──────────────────────────────────────────────────────────────

export function getSchoolInfo(): SchoolInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEYS.schoolInfo);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setSchoolInfo(info: SchoolInfo): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.schoolInfo, JSON.stringify(info));
}

// ─── Signatures ───────────────────────────────────────────────────────────────

export function getSignatures(): SignatureStore {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(KEYS.signatures) || '{}');
  } catch { return {}; }
}

export function setSignature(userId: string, signatureDataUrl: string): void {
  const sigs = getSignatures();
  sigs[userId] = signatureDataUrl;
  localStorage.setItem(KEYS.signatures, JSON.stringify(sigs));
}

export function getSignature(userId: string): string | null {
  return getSignatures()[userId] || null;
}

// ─── Seed defaults ────────────────────────────────────────────────────────────

export function seedDefaults() {
  if (typeof window === 'undefined') return;

  const users = getStore<User>(KEYS.users);
  if (users.length === 0) {
    const admin: User = {
      $id: 'admin-001',
      name: 'System Administrator',
      email: 'admin@school.edu.ng',
      role: 'admin',
      phone: '',
      assignedClasses: '[]',
      createdAt: new Date().toISOString(),
    };
    setStore(KEYS.users, [admin]);
  }

  const sessions = getStore<Session>(KEYS.sessions);
  if (sessions.length === 0) {
    const session: Session = {
      $id: 'session-001',
      year: '2024/2025',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setStore(KEYS.sessions, [session]);
  }

  const classes = getStore<Class>(KEYS.classes);
  if (classes.length === 0) {
    const defaultClasses: Class[] = [
      // Primary
      { $id: ID.unique(), name: 'Primary 1', category: 'Primary', students: [], createdAt: new Date().toISOString() },
      { $id: ID.unique(), name: 'Primary 2', category: 'Primary', students: [], createdAt: new Date().toISOString() },
      // Nursery
      { $id: ID.unique(), name: 'Nursery 1', category: 'Nursery', students: [], createdAt: new Date().toISOString() },
      // Kindergarten
      { $id: ID.unique(), name: 'Kindergarten 1', category: 'Kindergarten', students: [], createdAt: new Date().toISOString() },
      // Junior Secondary
      { $id: ID.unique(), name: 'JSS 1', category: 'JSS', students: [], createdAt: new Date().toISOString() },
      { $id: ID.unique(), name: 'JSS 2', category: 'JSS', students: [], createdAt: new Date().toISOString() },
      { $id: ID.unique(), name: 'JSS 3', category: 'JSS', students: [], createdAt: new Date().toISOString() },
      // Senior Secondary
      { $id: ID.unique(), name: 'SS 1', category: 'SSS', students: [], createdAt: new Date().toISOString() },
      { $id: ID.unique(), name: 'SS 2', category: 'SSS', students: [], createdAt: new Date().toISOString() },
      { $id: ID.unique(), name: 'SS 3', category: 'SSS', students: [], createdAt: new Date().toISOString() },
    ];
    setStore(KEYS.classes, defaultClasses);
  } else {
    // Patch: add any missing JSS/SSS classes to existing installs
    const existingNames = new Set(classes.map((c: any) => c.name));
    const toAdd: Class[] = [];
    const secondary = [
      { name: 'JSS 1', category: 'JSS' as const },
      { name: 'JSS 2', category: 'JSS' as const },
      { name: 'JSS 3', category: 'JSS' as const },
      { name: 'SS 1',  category: 'SSS' as const },
      { name: 'SS 2',  category: 'SSS' as const },
      { name: 'SS 3',  category: 'SSS' as const },
    ];
    for (const { name, category } of secondary) {
      if (!existingNames.has(name)) {
        toAdd.push({ $id: ID.unique(), name, category, students: [], createdAt: new Date().toISOString() });
      }
    }
    if (toAdd.length > 0) {
      setStore(KEYS.classes, [...classes, ...toAdd]);
    }
  }
}

// ─── Auth passwords ───────────────────────────────────────────────────────────

export function getPasswords(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('rgs_passwords') || '{}');
  } catch { return {}; }
}

export function setPassword(userId: string, password: string) {
  const pwds = getPasswords();
  pwds[userId] = password;
  localStorage.setItem('rgs_passwords', JSON.stringify(pwds));
}

export function ensureAdminPassword() {
  if (typeof window === 'undefined') return;
  const pwds = getPasswords();
  if (!pwds['admin-001']) {
    setPassword('admin-001', 'Admin@123');
  }
}