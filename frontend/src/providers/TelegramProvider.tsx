'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';
import { useStore } from '../store/useStore';

interface TelegramContextType {
  initDataRaw: string | undefined;
  initData: any | undefined;
}

const TelegramContext = createContext<TelegramContextType>({
  initDataRaw: undefined,
  initData: undefined,
});

function extractStartParam(initDataRaw: string): string | undefined {
  try {
    const params = new URLSearchParams(initDataRaw);
    return params.get('start_param') || undefined;
  } catch {
    return undefined;
  }
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [initDataRaw, setInitDataRaw] = useState<string>();
  const [initData, setInitData] = useState<any>();
  const { setUser, setToken, isDarkMode, setDarkMode } = useStore();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      setDarkMode(true);
    } else if (saved === 'light') {
      setDarkMode(false);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const failSafeTimer = setTimeout(() => {
      if (mounted) {
        setUser(null);
      }
    }, 12000);

    const init = async () => {
      try {
        let raw: string | undefined;
        let parsed: any | undefined;

        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.initData) {
          raw = (window as any).Telegram.WebApp.initData;
          try {
            const tgSdk = (window as any).Telegram?.WebApp;
            if (tgSdk?.initDataUnsafe) {
              parsed = tgSdk.initDataUnsafe;
            } else {
              parsed = undefined;
            }
          } catch {
            parsed = undefined;
          }
        }

        if (!mounted) return;

        if (raw) {
          setInitDataRaw(raw);
          setInitData(parsed);

          const referralCode = extractStartParam(raw);

          try {
            const payload: Record<string, string> = { initData: raw };
            if (referralCode) payload.referralCode = referralCode;

            const response = await api.post('/auth/telegram', payload);
            if (!mounted) return;

            const u = response.data.user;
            setToken(response.data.access_token);
            setUser({
              id: u.id || '',
              telegramId: String(u.telegramId || ''),
              username: u.username || '',
              firstName: u.firstName || '',
              balance: Number(u.balance) || 0,
              isAdmin: u.isAdmin || false,
              referralCode: u.referralCode || '',
              streak: u.streak ?? 0,
              vipTier: u.vipTier ?? 0,
              referralCount: u.referralCount || 0,
            });
          } catch (err) {
            if (!mounted) return;
            console.warn('Auth failed, showing public page:', err);
            setUser(null);
          }
        } else {
          if (!mounted) return;
          setInitDataRaw(undefined);
          setInitData(undefined);
          setUser(null);
        }
      } catch (e) {
        if (mounted) {
          setUser(null);
        }
      }

      clearTimeout(failSafeTimer);
    };

    init();

    return () => {
      mounted = false;
      clearTimeout(failSafeTimer);
    };
  }, []);

  return (
    <TelegramContext.Provider value={{ initDataRaw, initData }}>
      {children}
    </TelegramContext.Provider>
  );
}

export const useTelegram = () => useContext(TelegramContext);