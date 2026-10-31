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
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(info));
  } catch {
    // Storage full / unavailable — the cache is optional, never fail the caller
  }
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
  const isData = typeof s.logo_url === 'string' && s.logo_url.startsWith('data:');
  return {
    name: s.name,
    address: s.address ?? undefined,
    motto: s.motto ?? undefined,
    // A small logo is stored on the backend as a data URL so every device
    // (teachers, parents) sees the same logo on result sheets.
    logo: isData ? s.logo_url : undefined,
    logoUrl: isData ? undefined : s.logo_url ?? undefined,
  };
}

export const schoolService = {
  async get(): Promise<SchoolInfo | null> {
    try {
      const s = await api.get<BackendSchool | null>('/school');
      if (!s) return null;
      const info = mapSchool(s);
      // Fall back to this browser's cached logo only if it belongs to the same school
      const local = getSchoolInfoLocal();
      if (!info.logo && !info.logoUrl && local?.logo && local.name === info.name) info.logo = local.logo;
      setSchoolInfoLocal(info); // keep the PDF generator's cache fresh
      return info;
    } catch {
      return getSchoolInfoLocal();
    }
  },

  async save(info: SchoolInfo): Promise<SchoolInfo> {
    setSchoolInfoLocal(info);
    // The (downscaled) logo is sent as a data URL in logo_url so it is shared
    // across devices; an http(s) logoUrl is sent as-is.
    const body = {
      name: info.name,
      address: info.address,
      motto: info.motto,
      logoUrl: info.logo || info.logoUrl || null,
    };
    try {
      const res = await api.put<BackendSchool>('/school', body);
      const saved = mapSchool(res);
      if (!saved.logo) saved.logo = info.logo;
      setSchoolInfoLocal(saved);
      return saved;
    } catch {
      // If backend is not reachable just keep local
      return info;
    }
  },
};