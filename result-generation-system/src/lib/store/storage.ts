// Local Storage Service - replaces Appwrite backend
import { User, Student, Result, Class, AuthCode, Session, Subject, GRADING_SCALE } from '@/lib/types';
import { ID } from './id';

const KEYS = {
  users: 'rgs_users',
  authCodes: 'rgs_auth_codes',
  students: 'rgs_students',
  results: 'rgs_results',
  classes: 'rgs_classes',
  sessions: 'rgs_sessions',
  currentSession: 'rgs_current_session',
  currentUser: 'rgs_current_user',
};

function getStore<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function setStore<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

function seedDefaults() {
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
      { $id: ID.unique(), name: 'Primary 1', category: 'Primary', students: [], createdAt: new Date().toISOString() },
      { $id: ID.unique(), name: 'Primary 2', category: 'Primary', students: [], createdAt: new Date().toISOString() },
      { $id: ID.unique(), name: 'Nursery 1', category: 'Nursery', students: [], createdAt: new Date().toISOString() },
      { $id: ID.unique(), name: 'Kindergarten 1', category: 'Kindergarten', students: [], createdAt: new Date().toISOString() },
    ];
    setStore(KEYS.classes, defaultClasses);
  }
}

// Auth passwords stored separately (not in users array for security)
function getPasswords(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('rgs_passwords') || '{}');
  } catch { return {}; }
}
function setPassword(userId: string, password: string) {
  const pwds = getPasswords();
  pwds[userId] = password;
  localStorage.setItem('rgs_passwords', JSON.stringify(pwds));
}

// Initialize default admin password
function ensureAdminPassword() {
  if (typeof window === 'undefined') return;
  const pwds = getPasswords();
  if (!pwds['admin-001']) {
    setPassword('admin-001', 'Admin@123');
  }
}

export { seedDefaults, ensureAdminPassword, getStore, setStore, KEYS, getPasswords, setPassword };