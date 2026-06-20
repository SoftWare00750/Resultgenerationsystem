/**
 * store/auth-store.ts
 * Zustand auth store. The JWT itself is stored in localStorage by api.ts.
 * The user object is derived fresh from /api/auth/me on page load.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  $id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
  assignedClasses?: string;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      login: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
        }),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      // Only persist the user object — the token is managed by api.ts
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);