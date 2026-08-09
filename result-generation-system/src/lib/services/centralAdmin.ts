/**
 * services/centralAdmin.ts
 * Calls the /api/central/* endpoints. Central Admin only — the backend
 * middleware rejects these for any other role regardless of what the UI
 * shows, so this file is not itself a security boundary, just convenience.
 */

import { api } from '../api';

export interface School {
  id: string;
  name: string;
  address?: string;
  motto?: string;
  logo_url?: string;
  contact_email?: string;
  contact_phone?: string;
  status: 'active' | 'suspended';
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface SchoolWithStats extends School {
  userCount?: number;
  studentCount?: number;
  resultCount?: number;
  classCount?: number;
  estimatedStorageBytes?: number;
}

export interface PlatformOverview {
  totalSchools: number;
  usersByRole: Record<string, number>;
  estimatedTotalStorageBytes: number;
  schools: SchoolWithStats[];
}

export interface StorageRow {
  schoolId: string;
  name: string;
  status: string;
  userCount: number;
  studentCount: number;
  resultCount: number;
  classCount: number;
  estimatedStorageBytes: number;
}

export interface CentralUser {
  id: string;
  name: string;
  email: string;
  role: string;
  school_id: string | null;
  created_at: string;
}

export const centralAdminService = {
  // ── Overview / storage ────────────────────────────────────────────────
  async getOverview(): Promise<PlatformOverview> {
    return api.get<PlatformOverview>('/central/overview');
  },

  async getStorage(): Promise<StorageRow[]> {
    return api.get<StorageRow[]>('/central/storage');
  },

  // ── Schools ────────────────────────────────────────────────────────────
  async getSchools(): Promise<School[]> {
    return api.get<School[]>('/central/schools');
  },

  async getSchool(id: string): Promise<{ school: School; admins: CentralUser[]; counts: Record<string, number> }> {
    return api.get(`/central/schools/${id}`);
  },

  async createSchool(data: {
    name: string; address?: string; motto?: string; logoUrl?: string;
    contactEmail?: string; contactPhone?: string;
    adminName?: string; adminEmail?: string; adminPassword?: string;
  }): Promise<{ school: School; admin: CentralUser | null }> {
    return api.post('/central/schools', data);
  },

  async updateSchool(id: string, data: Partial<{
    name: string; address: string; motto: string; logoUrl: string;
    contactEmail: string; contactPhone: string; status: 'active' | 'suspended';
  }>): Promise<School> {
    return api.patch(`/central/schools/${id}`, data);
  },

  async deleteSchool(id: string): Promise<void> {
    await api.del(`/central/schools/${id}`);
  },

  async restoreSchool(id: string): Promise<void> {
    await api.patch(`/central/schools/${id}/restore`);
  },

  async addSchoolAdmin(schoolId: string, data: { name: string; email: string; password: string }): Promise<CentralUser> {
    return api.post(`/central/schools/${schoolId}/admins`, data);
  },

  // ── Users (cross-school) ──────────────────────────────────────────────
  async getUsers(filters?: { role?: string; schoolId?: string }): Promise<CentralUser[]> {
    const params = new URLSearchParams();
    if (filters?.role) params.set('role', filters.role);
    if (filters?.schoolId) params.set('schoolId', filters.schoolId);
    const qs = params.toString();
    return api.get<CentralUser[]>(`/central/users${qs ? `?${qs}` : ''}`);
  },

  async deleteUser(id: string): Promise<void> {
    await api.del(`/central/users/${id}`);
  },

  async restoreUser(id: string): Promise<CentralUser> {
    return api.patch(`/central/users/${id}/restore`);
  },

  async createCentralAdmin(data: { name: string; email: string; password: string }): Promise<CentralUser> {
    return api.post('/central/central-admins', data);
  },

  // ── Students / results (cross-school) ─────────────────────────────────
  async getStudents(schoolId?: string): Promise<unknown[]> {
    return api.get(`/central/students${schoolId ? `?schoolId=${schoolId}` : ''}`);
  },

  async deleteStudent(id: string): Promise<void> {
    await api.del(`/central/students/${id}`);
  },

  async getResults(schoolId?: string): Promise<unknown[]> {
    return api.get(`/central/results${schoolId ? `?schoolId=${schoolId}` : ''}`);
  },

  async deleteResult(id: string): Promise<void> {
    await api.del(`/central/results/${id}`);
  },

  // ── Platform settings ──────────────────────────────────────────────────
  async getSettings(): Promise<Record<string, unknown>> {
    return api.get('/central/settings');
  },

  async setSetting(key: string, value: unknown): Promise<void> {
    await api.put(`/central/settings/${key}`, { value });
  },
};
