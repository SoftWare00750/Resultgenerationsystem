import { User, UserRole } from '@/lib/types';
import { ID } from '../id';
import {
  getStore, setStore, KEYS,
  getPasswords, setPassword,
  seedDefaults, ensureAdminPassword,
  getSchoolInfo, setSchoolInfo, setSignature,
  SchoolInfo,
} from '../storage';

export const authService = {
  async login(email: string, password: string): Promise<User> {
    seedDefaults();
    ensureAdminPassword();
    const users = getStore<User>(KEYS.users);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error('No account found with this email address');
    const passwords = getPasswords();
    if (passwords[user.$id] !== password) throw new Error('Incorrect password');
    localStorage.setItem(KEYS.currentUser, JSON.stringify(user));
    return user;
  },

  /**
   * Register a new user.
   * - Admin: requires school name, logo, address, principal signature.
   *          Auth code with role=admin is still required.
   * - Teacher: requires school name (must match existing school), teacher signature.
   *            Auth code with role=teacher required.
   * - Parent: no extra fields needed.
   */
  async register(
    email: string,
    password: string,
    name: string,
    role: UserRole,
    authCode: string,
    phone?: string,
    // School / profile extras
    extras?: {
      schoolName?: string;
      schoolLogo?: string;       // base64
      schoolAddress?: string;
      schoolMotto?: string;
      signatureDataUrl?: string; // base64 (teacher or principal)
    }
  ): Promise<User> {
    seedDefaults();
    const users = getStore<User>(KEYS.users);
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) throw new Error('An account with this email already exists');

    // Validate auth code
    const codes = getStore<any>(KEYS.authCodes);
    const code = codes.find((c: any) => c.code === authCode && c.role === role && !c.isUsed);
    if (!code) throw new Error('Invalid or already used authorization code for this role');
    if (new Date(code.expiresAt) < new Date()) throw new Error('Authorization code has expired');

    // Role-specific validation
    if (role === 'admin') {
      if (!extras?.schoolName?.trim()) throw new Error('School name is required for admin registration');
      // Save school info (first admin wins, subsequent admins update it)
      const schoolInfo: SchoolInfo = {
        name: extras.schoolName.trim(),
        logo: extras.schoolLogo,
        address: extras.schoolAddress?.trim(),
        motto: extras.schoolMotto?.trim(),
      };
      setSchoolInfo(schoolInfo);
    }

    if (role === 'teacher') {
      if (!extras?.schoolName?.trim()) throw new Error('School name is required for teacher registration');
      const schoolInfo = getSchoolInfo();
      if (schoolInfo && schoolInfo.name.toLowerCase() !== extras.schoolName.trim().toLowerCase()) {
        throw new Error(`School name does not match. Please enter the correct school name: "${schoolInfo.name}"`);
      }
    }

    // Mark auth code as used
    const updatedCodes = codes.map((c: any) =>
      c.code === authCode ? { ...c, isUsed: true, usedBy: email } : c
    );
    setStore(KEYS.authCodes, updatedCodes);

    const newUser: User = {
      $id: ID.unique(),
      name,
      email,
      role,
      phone: phone || '',
      assignedClasses: '[]',
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    setStore(KEYS.users, users);
    setPassword(newUser.$id, password);

    // Save signature if provided (admin = principal sig, teacher = teacher sig)
    if (extras?.signatureDataUrl) {
      setSignature(newUser.$id, extras.signatureDataUrl);
    }

    localStorage.setItem(KEYS.currentUser, JSON.stringify(newUser));
    return newUser;
  },

  async getCurrentUser(): Promise<User | null> {
    if (typeof window === 'undefined') return null;
    seedDefaults();
    try {
      const raw = localStorage.getItem(KEYS.currentUser);
      if (!raw) return null;
      const stored = JSON.parse(raw) as User;
      const users = getStore<User>(KEYS.users);
      const user = users.find(u => u.$id === stored.$id);
      return user || null;
    } catch { return null; }
  },

  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(KEYS.currentUser);
    }
  },

  async generateAuthCode(role: UserRole, createdBy: string): Promise<any> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const authCode = {
      $id: ID.unique(),
      code,
      role,
      isUsed: false,
      expiresAt: expiresAt.toISOString(),
      createdBy,
      createdAt: new Date().toISOString(),
    };
    const codes = getStore<any>(KEYS.authCodes);
    codes.unshift(authCode);
    setStore(KEYS.authCodes, codes);
    return authCode;
  },

  async getAuthCodes(): Promise<any[]> {
    return getStore<any>(KEYS.authCodes);
  },

  async getAllUsers(): Promise<User[]> {
    seedDefaults();
    return getStore<User>(KEYS.users);
  },

  async deleteUser(userId: string): Promise<void> {
    const users = getStore<User>(KEYS.users);
    setStore(KEYS.users, users.filter(u => u.$id !== userId));
  },

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    const users = getStore<User>(KEYS.users);
    const idx = users.findIndex(u => u.$id === userId);
    if (idx === -1) throw new Error('User not found');
    users[idx] = { ...users[idx], ...data };
    setStore(KEYS.users, users);
    const current = localStorage.getItem(KEYS.currentUser);
    if (current) {
      const cur = JSON.parse(current);
      if (cur.$id === userId) localStorage.setItem(KEYS.currentUser, JSON.stringify(users[idx]));
    }
    return users[idx];
  },
};