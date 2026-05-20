import { create } from 'zustand';

interface User {
  id: string;
  telegramId: string;
  username: string;
  firstName?: string;
  balance: number;
  isAdmin: boolean;
  referralCode: string;
  referredById?: string;
  referralCount?: number;
  streak: number;
  vipTier: number;
}

interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'reward';
  message: string;
  timestamp: number;
}

interface AppState {
  user: User | null;
  token: string | null;
  isDarkMode: boolean;
  theme: 'light' | 'dark';
  notifications: NotificationItem[];
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  updateBalance: (amount: number) => void;
  logout: () => void;
  setStreak: (streak: number) => void;
  setVipTier: (tier: number) => void;
  setDarkMode: (isDark: boolean) => void;
  toggleTheme: () => void;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => void;
  clearNotifications: () => void;
}

const getInitialTheme = (): boolean => {
  if (typeof window === 'undefined') return false;
  const saved = localStorage.getItem('theme');
  if (saved) return saved === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const useStore = create<AppState>()((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isDarkMode: typeof window !== 'undefined' ? getInitialTheme() : false,
  theme: 'light',
  notifications: [],

  setUser: (user) => set({ user }),

  setToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('token', token);
      else localStorage.removeItem('token');
    }
    set({ token });
  },

  updateBalance: (amount) => set((state) => ({
    user: state.user ? { ...state.user, balance: Number(state.user.balance) + amount } : null
  })),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    set({ user: null, token: null });
  },

  setStreak: (streak) => set((state) => ({
    user: state.user ? { ...state.user, streak } : null
  })),

  setVipTier: (vipTier) => set((state) => ({
    user: state.user ? { ...state.user, vipTier } : null
  })),

  setDarkMode: (isDark) => {
    const newTheme = isDark ? 'dark' : 'light';
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
    set({ isDarkMode: isDark, theme: newTheme });
  },

  toggleTheme: () => {
    const current = get().isDarkMode;
    const newTheme = !current;
    const themeStr = newTheme ? 'dark' : 'light';
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', newTheme);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', themeStr);
    }
    set({ isDarkMode: newTheme, theme: themeStr });
  },

  addNotification: (notification) => set((state) => ({
    notifications: [
      ...state.notifications,
      {
        ...notification,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      }
    ].slice(-20)
  })),

  clearNotifications: () => set({ notifications: [] }),
}));