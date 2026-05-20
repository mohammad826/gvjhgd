'use client';

import { useStore } from "@/store/useStore";
import { ArrowLeft, Copy, Share2, Bell, Moon, Globe, LogOut, Trophy, Users, Zap, Calendar, Check } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/api/axios";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const TIER_CONFIG = [
  { label: "Bronze", color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-300" },
  { label: "Silver", color: "text-gray-500", bg: "bg-gray-200", border: "border-gray-400" },
  { label: "Gold", color: "text-yellow-600", bg: "bg-yellow-100", border: "border-yellow-400" },
  { label: "Platinum", color: "text-cyan-600", bg: "bg-cyan-100", border: "border-cyan-400" },
  { label: "Diamond", color: "text-purple-600", bg: "bg-purple-100", border: "border-purple-400" },
];

export default function ProfilePage() {
  const { user, isDarkMode, toggleTheme, logout } = useStore();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get("/user/stats");
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const referralLink = user?.referralCode
    ? `https://t.me/your_bot?start=${user.referralCode}`
    : "";

  const handleCopyCode = async () => {
    if (!user?.referralCode) return;
    try {
      await navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = user.referralCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareTelegram = () => {
    const text = `Join me on Watch & Earn! Use my referral code: ${user?.referralCode}`;
    const url = referralLink;
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp?.openTelegramLink) {
      (window as any).Telegram.WebApp.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
      );
    } else {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const tier = user?.vipTier || 0;
  const tierConfig = TIER_CONFIG[Math.min(tier, 5) - 1] || TIER_CONFIG[0];

  const bgBase = isDarkMode ? "bg-[#111827]" : "bg-[#f0f0f0]";
  const cardBase = isDarkMode ? "bg-[#1f2937]" : "bg-white";
  const textPrimary = isDarkMode ? "text-white" : "text-gray-900";
  const textSecondary = isDarkMode ? "text-gray-400" : "text-gray-500";
  const borderBase = isDarkMode ? "border-[#374151]" : "border-gray-100";

  return (
    <div className={`flex flex-col flex-1 ${bgBase} min-h-full pb-8`}>
      <div className="p-6 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className={`p-2 ${isDarkMode ? "hover:bg-[#252525]" : "hover:bg-gray-100"} rounded-full transition-colors`}
        >
          <ArrowLeft size={24} className={textPrimary} />
        </button>
        <h1 className={`text-xl font-bold ${textPrimary}`}>Profile</h1>
      </div>

      <div className="px-6 flex flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${cardBase} rounded-[2rem] p-6 flex flex-col items-center gap-3 ${borderBase} border`}
        >
          <div className="relative">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-3xl shadow-lg ${tier > 0 ? `border-4 ${tierConfig.border}` : 'border-4 border-blue-400'}`}>
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
            {tier > 0 && (
              <div className={`absolute -bottom-1 -right-1 ${tierConfig.bg} ${tierConfig.color} text-[10px] font-black px-2 py-0.5 rounded-full border ${tierConfig.border}`}>
                {tierConfig.label}
              </div>
            )}
          </div>

          <div className="text-center">
            <h2 className={`text-xl font-bold ${textPrimary}`}>
              @{user?.username || "User"}
            </h2>
            <p className={`text-xs ${textSecondary} mt-1`}>
              Telegram ID: {user?.telegramId || "—"}
            </p>
          </div>

          {tier > 0 && (
            <div className={`${tierConfig.bg} px-4 py-2 rounded-full ${tierConfig.color} text-xs font-black border ${tierConfig.border} flex items-center gap-2`}>
              <Trophy size={14} />
              VIP {tierConfig.label} Tier
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          {[
            { icon: Zap, label: "Total Earned", value: loading ? "—" : `$${(stats?.totalEarned ?? 0).toFixed(4)}`, color: "text-green-600", bgColor: isDarkMode ? "bg-green-900/30" : "bg-green-50" },
            { icon: Users, label: "Referrals", value: loading ? "—" : String(stats?.referralCount ?? 0), color: "text-blue-600", bgColor: isDarkMode ? "bg-blue-900/30" : "bg-blue-50" },
            { icon: Calendar, label: "Current Streak", value: loading ? "—" : `${stats?.streak ?? 0}d`, color: "text-orange-600", bgColor: isDarkMode ? "bg-orange-900/30" : "bg-orange-50" },
            { icon: Calendar, label: "VIP Tier", value: loading ? "—" : (tier > 0 ? tierConfig.label : "None"), color: "text-purple-600", bgColor: isDarkMode ? "bg-purple-900/30" : "bg-purple-50" },
          ].map((stat, i) => (
            <div key={i} className={`${cardBase} ${stat.bgColor} rounded-2xl p-4 flex flex-col gap-2 ${borderBase} border`}>
              <stat.icon size={18} className={stat.color} />
              <p className={`text-2xl font-black ${textPrimary}`}>{stat.value}</p>
              <p className={`text-xs font-medium ${textSecondary}`}>{stat.label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${cardBase} rounded-[2rem] p-5 flex flex-col gap-4 ${borderBase} border`}
        >
          <h3 className={`font-bold ${textPrimary}`}>Your Referral Code</h3>
          <div className={`flex items-center gap-3 ${isDarkMode ? "bg-[#111]" : "bg-gray-50"} rounded-2xl p-4`}>
            <p className={`flex-1 font-mono font-bold text-sm ${textPrimary} truncate`}>
              {user?.referralCode || "—"}
            </p>
            <button onClick={handleCopyCode} className={`p-2 ${isDarkMode ? "bg-[#1a1a1a] hover:bg-[#252525]" : "bg-white hover:bg-gray-50"} rounded-xl transition-colors ${borderBase} border`}>
              {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} className={textSecondary} />}
            </button>
            <button onClick={handleShareTelegram} className="p-2 bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors text-white">
              <Share2 size={18} />
            </button>
          </div>
          <div className={`text-xs ${textSecondary} break-all`}>
            <span className="font-medium">Referral Link: </span>
            <span className="font-mono">{referralLink || "—"}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${cardBase} rounded-[2rem] p-5 flex flex-col gap-4 ${borderBase} border`}
        >
          <h3 className={`font-bold ${textPrimary}`}>Settings</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon size={20} className={textSecondary} />
              <span className={`text-sm font-medium ${textPrimary}`}>Dark Mode</span>
            </div>
            <button
              onClick={toggleTheme}
              className={`w-12 h-7 rounded-full transition-all relative ${isDarkMode ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <motion.div
                animate={{ x: isDarkMode ? 22 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
              />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`${cardBase} rounded-[2rem] p-5 flex flex-col gap-4 ${borderBase} border`}
        >
          <h3 className={`font-bold ${textPrimary}`}>Account</h3>
          <button
            onClick={handleLogout}
            className="w-full h-12 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/40 active:scale-[0.98] transition-all border border-red-100 dark:border-red-800 flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            Logout
          </button>
        </motion.div>
      </div>
    </div>
  );
}