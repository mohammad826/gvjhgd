'use client';

import { useStore } from "@/store/useStore";
import { Play, Wallet, Users, History, User, Sun, Moon, Gift, Timer, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "@/api/axios";
import { motion, AnimatePresence } from "framer-motion";

const TASK_DATA = [
  { id: 1, title: "Join Telegram Channel", desc: "Join our official news channel for updates.", reward: 0.05, link: "https://t.me/wfjcikcnfhcdbcbot" },
  { id: 2, title: "Play Ton Boost Mini-App", desc: "Launch the partner mini app and complete level 1.", reward: 0.08, link: "https://t.me/your_bot" },
  { id: 3, title: "Subscribe to YouTube", desc: "Subscribe to our partner channel for tech tips.", reward: 0.04, link: "https://youtube.com" }
];

const VIP_TIERS: Record<number, { label: string; textColor: string; bgColor: string; glow: string }> = {
  0: { label: "", textColor: "", bgColor: "", glow: "" },
  1: { label: "Bronze", textColor: "text-orange-700", bgColor: "bg-orange-100", glow: "" },
  2: { label: "Silver", textColor: "text-gray-600", bgColor: "bg-gray-100", glow: "" },
  3: { label: "Gold", textColor: "text-yellow-600", bgColor: "bg-yellow-100", glow: "shadow-yellow-300/50" },
  4: { label: "Platinum", textColor: "text-cyan-600", bgColor: "bg-cyan-100", glow: "" },
  5: { label: "Diamond", textColor: "text-purple-600", bgColor: "bg-purple-100", glow: "shadow-purple-300/50" }
};

const NAV_ITEMS = [
  { icon: Play, label: "Ads", path: "/" },
  { icon: Users, label: "Friends", path: "/referrals" },
  { icon: Wallet, label: "Wallet", path: "/wallet" },
  { icon: History, label: "History", path: "/history" },
  { icon: User, label: "Profile", path: "/profile" }
];

export default function Home() {
  const { user, isDarkMode, toggleTheme, updateBalance, addNotification } = useStore();
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [rewardAnim, setRewardAnim] = useState<{ show: boolean; amount: number }>({ show: false, amount: 0 });
  const periodicAdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (periodicAdRef.current) {
      clearInterval(periodicAdRef.current);
      periodicAdRef.current = null;
    }
    if (!user) return;

    const showPeriodicAd = async () => {
      try {
        const showAdFn = (window as any).show_11017565;
        if (typeof showAdFn === 'function') {
          await showAdFn();
          fetchStats();
        }
      } catch {}
    };

    const id = setInterval(showPeriodicAd, 3 * 60 * 1000);
    periodicAdRef.current = id;

    return () => {
      if (periodicAdRef.current) clearInterval(periodicAdRef.current);
    };
  }, [user]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown(c => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/user/stats');
      setStats(data);
    } catch {}
  };

  const handleClaimDaily = async () => {
    if (!stats?.canClaimDaily) return;
    setClaimingDaily(true);
    try {
      const { data } = await api.post('/user/daily-bonus');
      updateBalance(data.reward);
      setRewardAnim({ show: true, amount: data.reward });
      setTimeout(() => setRewardAnim({ show: false, amount: 0 }), 2000);
      if (data.streak !== undefined) {
        useStore.getState().setStreak(data.streak);
      }
      addNotification({ type: 'reward', message: `Daily bonus claimed! +$${data.reward.toFixed(4)}` });
      fetchStats();
    } catch (e: any) {
      addNotification({ type: 'error', message: e.response?.data?.message || 'Failed to claim daily bonus' });
    } finally {
      setClaimingDaily(false);
    }
  };

  const handleWatchAd = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    try {
      const showAdFn = (window as any).show_11017565;
      if (typeof showAdFn === 'function') {
        await showAdFn().then(async () => {
          const { data } = await api.post('/ad/reward');
          updateBalance(data.reward);
          setCooldown(15);
          fetchStats();
          addNotification({ type: 'reward', message: `Watched ad! +$${data.reward.toFixed(4)}` });
        }).catch(() => {});
      } else {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const { data } = await api.post('/ad/reward');
        updateBalance(data.reward);
        setCooldown(15);
        fetchStats();
        addNotification({ type: 'reward', message: `[Demo] Ad reward! +$${data.reward.toFixed(4)}` });
      }
    } catch (e: any) {
      addNotification({ type: 'error', message: e.response?.data?.message || 'Failed to claim reward' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#f0f0f0] dark:bg-[#111827]">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Loading...</p>
        </motion.div>
      </div>
    );
  }

  const vipTier = user.vipTier || 0;
  const vipInfo = VIP_TIERS[vipTier] || VIP_TIERS[0];
  const vipMultiplier = 1 + vipTier * 0.1;

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-[#f0f0f0] dark:bg-[#111827] pb-28">
      <div className="flex flex-col p-4 gap-5 max-w-2xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/profile')}>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
              {user.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100">@{user.username || 'User'}</h2>
                {vipTier > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${vipInfo.textColor} ${vipInfo.bgColor} ${vipInfo.glow} shadow-sm`}>
                    {vipInfo.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">ID: {user.telegramId}</p>
            </div>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-full bg-white dark:bg-[#1f2937] shadow-md hover:scale-105 transition-transform">
            {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-[1.8rem] p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="relative z-10">
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Daily Bonus</p>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🔥</span>
                <div>
                  <p className="text-2xl font-black">{stats?.streak || user.streak || 0} Day Streak</p>
                  {vipTier > 0 && <p className="text-sm text-blue-200">VIP ×{vipMultiplier.toFixed(1)} Multiplier</p>}
                </div>
              </div>
              <AnimatePresence>
                {stats?.canClaimDaily ? (
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={handleClaimDaily}
                    disabled={claimingDaily}
                    className="bg-white text-blue-600 font-black px-6 py-2.5 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
                  >
                    {claimingDaily ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                    Claim ${(stats?.dailyBonus || 0.01).toFixed(4)}
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl inline-flex items-center gap-2 text-sm font-bold"
                  >
                    <span className="text-green-300">✓</span> Claimed Today
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="bg-white dark:bg-[#1f2937] rounded-[1.8rem] p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="mb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">Current Balance</p>
              <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100">${user.balance.toFixed(4)}</h1>
            </div>
            <div className="flex gap-3">
              <div className="bg-[#f0f0f0] dark:bg-[#111827] rounded-2xl p-3 flex-1">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Total Earned</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">${(stats?.totalEarned || 0).toFixed(4)}</p>
              </div>
              <div className="bg-[#f0f0f0] dark:bg-[#111827] rounded-2xl p-3 flex-1">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Referrals</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats?.referralCount || 0}</p>
              </div>
              <div className="bg-[#f0f0f0] dark:bg-[#111827] rounded-2xl p-3 flex-1">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Rank</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">#{stats?.rank || '—'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <button
            onClick={handleWatchAd}
            disabled={loading || cooldown > 0}
            className={`
              w-full h-[4.5rem] rounded-[2rem] flex items-center justify-center gap-3 font-black text-lg transition-all shadow-xl
              ${loading || cooldown > 0
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 active:scale-[0.98] shadow-green-200 dark:shadow-green-900'}
            `}
          >
            {loading ? (
              <><Loader2 className="w-6 h-6 animate-spin" /> Processing...</>
            ) : cooldown > 0 ? (
              <><Timer className="w-6 h-6 animate-pulse" /> Wait {cooldown}s</>
            ) : (
              <><Play className="w-7 h-7 fill-current" /> WATCH & EARN $0.002</>
            )}
          </button>
          <div className="flex justify-between px-2 mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
            <span>Remaining: {(stats?.dailyAdsRemaining || 0)}/20</span>
            <span>Reward: $0.0020</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-[1.8rem] p-5 text-white shadow-lg relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold mb-1">Invite Friends & Earn!</p>
                <p className="text-xs text-purple-100">Get 10% forever from each referral</p>
              </div>
              <button
                onClick={() => router.push('/referrals')}
                className="bg-white text-purple-600 font-bold px-4 py-2 rounded-2xl text-sm shadow-lg hover:scale-105 active:scale-95 transition-transform"
              >
                Invite
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="bg-white dark:bg-[#1f2937] rounded-[1.8rem] p-5 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-gray-900 dark:text-gray-100">Quick Tasks</h3>
              <button onClick={() => router.push('/tasks')} className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
                See All →
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {TASK_DATA.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.05 }}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-900 dark:text-gray-100">{task.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{task.desc}</p>
                  </div>
                  <span className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
                    +${task.reward.toFixed(4)}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {rewardAnim.show && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -60, scale: 1.2 }}
            exit={{ opacity: 0, y: -120, scale: 0.8 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 text-3xl font-black text-green-500 pointer-events-none z-50"
          >
            +${rewardAnim.amount.toFixed(4)}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 border-t border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg z-40">
        <div className="flex items-center justify-around py-3 max-w-2xl mx-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all ${isActive ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-gray-400 dark:text-gray-500'}`}
              >
                <Icon size={22} className={isActive ? 'fill-blue-100 dark:fill-blue-900/50' : ''} />
                <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}