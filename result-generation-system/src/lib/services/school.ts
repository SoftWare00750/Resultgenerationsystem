/**
 * services/school.ts
 * Manages school info via the backend /api/school endpoint.
 * Also keeps a local cache so the PDF generator can read synchronously.
 */

import { api } from '../api';

export interface SchoolInfo {
  name: string;
  address?: string;
  motto?: string;
  logo?: string;    // base64 data URL stored locally only
  logoUrl?: string; // URL stored on backend (unused for now)
}

const LOCAL_KEY = 'rgs_school_info';

// ─── Local cache helpers (used by pdf-generator) ──────────────────────────────

export function getSchoolInfoLocal(): SchoolInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSchoolInfoLocal(info: SchoolInfo): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(info));
}

// ─── Backend-aware helpers ─────────────────────────────────────────────────────

interface BackendSchool {
  id?: string;
  name: string;
  address?: string;
  motto?: string;
  logo_url?: string;
}

function mapSchool(s: BackendSchool): SchoolInfo {
  return {
    name: s.name,
    address: s.address,
    motto: s.motto,
    logoUrl: s.logo_url,
  };
}

export const schoolService = {
  async get(): Promise<SchoolInfo | null> {
    try {
      const s = await api.get<BackendSchool | null>('/school');
      if (!s) return null;
      const info = mapSchool(s);
      // Merge local logo (base64) which we keep client-side
      const local = getSchoolInfoLocal();
      if (local?.logo) info.logo = local.logo;
      return info;
    } catch {
      return getSchoolInfoLocal();
    }
  },

  async save(info: SchoolInfo): Promise<SchoolInfo> {
    // Persist logo only locally (too large for typical API calls)
    setSchoolInfoLocal(info);
    // Send non-base64 fields to backend
    const body = {
      name: info.name,
      address: info.address,
      motto: info.motto,
      logoUrl: info.logoUrl,
    };
    try {
      const res = await api.put<BackendSchool>('/school', body);
      const saved = mapSchool(res);
      saved.logo = info.logo;
      setSchoolInfoLocal(saved);
      return saved;
    } catch {
      // If backend is not reachable just keep local
      return info;
    }
  },
};