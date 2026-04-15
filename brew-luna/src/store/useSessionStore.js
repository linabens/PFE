import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * BREW LUNA — Session Store
 * Manages table session, token, and expiry
 */

export const useSessionStore = create(
  persist(
    (set, get) => ({
      token: null,
      tableId: null,
      tableNumber: null,
      expiresAt: null,
      isInitialized: false,

      // Actions
      setSession: (data) => set({
        token: data.token,
        tableId: data.table_id,
        tableNumber: data.table_number,
        expiresAt: data.expires_at,
        isInitialized: true,
      }),

      clearSession: () => set({
        token: null,
        tableId: null,
        tableNumber: null,
        expiresAt: null,
        isInitialized: false,
      }),

      isExpired: () => {
        const { expiresAt } = get();
        if (!expiresAt) return true;
        return new Date() > new Date(expiresAt);
      },
    }),
    {
      name: 'brew-luna-session', // Key in localStorage
    }
  )
);
