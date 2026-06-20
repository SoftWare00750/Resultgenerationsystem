/**
 * services/sessions.ts
 * Replaces the localStorage-based sessions service.
 */

import { api } from '../api';
import { Session } from '../types';

interface BackendSession {
  id: string;
  year: string;
  is_active: boolean;
  created_at: string;
}

function mapSession(s: BackendSession): Session {
  return {
    $id: s.id,
    year: s.year,
    isActive: s.is_active,
    createdAt: s.created_at,
  };
}

export const sessionsService = {
  async createSession(year: string, isActive: boolean = false): Promise<Session> {
    const res = await api.post<BackendSession>('/sessions', { year, isActive });
    return mapSession(res);
  },

  async getAllSessions(): Promise<Session[]> {
    const rows = await api.get<BackendSession[]>('/sessions');
    return rows.map(mapSession);
  },

  async getActiveSession(): Promise<Session | null> {
    const s = await api.get<BackendSession | null>('/sessions/active');
    return s ? mapSession(s) : null;
  },

  async setActiveSession(sessionId: string): Promise<Session> {
    const res = await api.patch<BackendSession>(`/sessions/${sessionId}/activate`, {});
    return mapSession(res);
  },

  async deleteSession(sessionId: string): Promise<void> {
    await api.del(`/sessions/${sessionId}`);
  },
};