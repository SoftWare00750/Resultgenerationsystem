/**
 * services/auth.ts
 * Replaces the localStorage-based auth service.
 * All calls go to /api/auth/* and /api/users/*.
 */

import { api, setToken, clearToken, getToken } from '../api';
import { User, UserRole } from '../types';

// Shape returned by the backend login/register endpoints
interface AuthResponse {
  token: string;
  user: BackendUser;
}

// Backend user shape (snake_case → camelCase mapping happens here)
interface BackendUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  assigned_classes?: unknown[];
  signature_url?: string;
  created_at: string;
}

function mapUser(u: BackendUser): User {
  return {
    $id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone || '',
    assignedClasses: JSON.stringify(u.assigned_classes || []),
    createdAt: u.created_at,
  };
}

export const authService = {
  async login(email: string, password: string): Promise<User> {
    const data = await api.post<AuthResponse>('/auth/login', { email, password }, { skipAuth: true });
    setToken(data.token);
    // Persist user for getCurrentUser
    localStorage.setItem('rgs_current_user', JSON.stringify(mapUser(data.user)));
    return mapUser(data.user);
  },

  async register(
    email: string,
    password: string,
    name: string,
    role: UserRole,
    authCode: string,
    phone?: string,
    extras?: {
      schoolName?: string;
      schoolLogo?: string;
      schoolAddress?: string;
      schoolMotto?: string;
      signatureDataUrl?: string;
    }
  ): Promise<User> {
    const body = {
      name,
      email,
      password,
      role,
      authCode,
      phone,
      schoolName: extras?.schoolName,
      schoolLogo: extras?.schoolLogo,
      schoolAddress: extras?.schoolAddress,
      schoolMotto: extras?.schoolMotto,
      signatureDataUrl: extras?.signatureDataUrl,
    };

    const data = await api.post<AuthResponse>('/auth/register', body, { skipAuth: true });
    setToken(data.token);
    localStorage.setItem('rgs_current_user', JSON.stringify(mapUser(data.user)));
    return mapUser(data.user);
  },

  async getCurrentUser(): Promise<User | null> {
    if (typeof window === 'undefined') return null;
    const token = getToken();
    if (!token) return null;
    try {
      const data = await api.get<{ user: BackendUser }>('/auth/me');
      const user = mapUser(data.user);
      localStorage.setItem('rgs_current_user', JSON.stringify(user));
      return user;
    } catch {
      clearToken();
      return null;
    }
  },

  async logout(): Promise<void> {
    clearToken();
    localStorage.removeItem('rgs_current_user');
  },

  // ── Admin: auth codes ──────────────────────────────────────────────────────

  async generateAuthCode(role: UserRole, _createdBy: string): Promise<unknown> {
    return api.post('/auth-codes', { role });
  },

  async getAuthCodes(): Promise<unknown[]> {
    const rows = await api.get<unknown[]>('/auth-codes');
    // Normalise to the shape the UI expects ($id, isUsed, expiresAt, createdAt)
    return (rows as any[]).map((c) => ({
      $id: c.id,
      code: c.code,
      role: c.role,
      isUsed: c.is_used,
      usedBy: c.used_by,
      expiresAt: c.expires_at,
      createdAt: c.created_at,
      createdBy: c.created_by,
    }));
  },

  async deleteAuthCode(id: string): Promise<void> {
    await api.del(`/auth-codes/${id}`);
  },

  // ── Admin: user management ─────────────────────────────────────────────────

  async getAllUsers(): Promise<User[]> {
    const rows = await api.get<BackendUser[]>('/users');
    return (rows as any[]).map(mapUser);
  },

  async deleteUser(userId: string): Promise<void> {
    await api.del(`/users/${userId}`);
  },

  async updateUser(userId: string, data: Partial<User> & { signatureDataUrl?: string }): Promise<User> {
    const body: Record<string, unknown> = {};
    if (data.name) body.name = data.name;
    if (data.phone !== undefined) body.phone = data.phone;
    if (data.signatureDataUrl) body.signatureDataUrl = data.signatureDataUrl;
    const res = await api.patch<BackendUser>(`/users/${userId}`, body);
    return mapUser(res);
  },
};