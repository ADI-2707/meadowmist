'use client';

import { create } from 'zustand';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  logout: (onSuccess?: () => void) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  checkAuth: async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          set({ user: data.user, isAuthenticated: true, isLoading: false });
          return;
        }
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
  logout: async (onSuccess?: () => void) => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
    } finally {
      set({ user: null, isAuthenticated: false });
      if (onSuccess) {
        onSuccess();
      } else if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.assign(window.location.origin + '/');
      }
    }
  },
}));
