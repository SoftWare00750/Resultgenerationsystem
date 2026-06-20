/**
 * storageKeys.ts
 * Centralised localStorage key names.
 * Kept separate so both storage.ts and any legacy code can import KEYS.
 */

export const KEYS = {
  users: 'rgs_users',
  authCodes: 'rgs_auth_codes',
  students: 'rgs_students',
  results: 'rgs_results',
  classes: 'rgs_classes',
  sessions: 'rgs_sessions',
  currentSession: 'rgs_current_session',
  currentUser: 'rgs_current_user',
  schoolInfo: 'rgs_school_info',
  signatures: 'rgs_signatures',
} as const;