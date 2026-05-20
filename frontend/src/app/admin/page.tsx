'use client';

import { useStore } from "@/store/useStore";
import { ArrowLeft, Users, Clock, DollarSign } from "lucide-react";
import * as Lucide from "lucide-react";
const UserCheckIcon = (Lucide as any).UserCheck ?? (Lucide as any).Check;
import { useState, useEffect } from "react";
import api from "@/api/axios";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";

interface Stats {
  totalUsers: number;
  activeToday: number;
  pendingWithdrawals: number;
  totalPaidOut: number;
}

interface Withdrawal {
  id: string;
  user: {
    username: string;
  };
  amount: number;
  method: string;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  createdAt: string;
}

export default function AdminDashboard() {
  const { user, isDarkMode } = useStore();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (user && user.isAdmin === false) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchStats();
      fetchWithdrawals();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const { data } = await api.get('/admin/withdrawals?limit=5');
      setWithdrawals(Array.isArray(data) ? data.slice(0, 5) : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
      APPROVED: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
      PAID: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
      REJECTED: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
    };
    return `px-2.5 py-1 rounded-full text-xs font-bold border ${classes[status] || ''}`;
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: any) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.4 }
    })
  };

  const bgBase = isDarkMode ? 'bg-[#111827]' : 'bg-[#f0f0f0]';
  const cardBase = isDarkMode ? 'bg-[#1f2937]' : 'bg-white';
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const borderBase = isDarkMode ? 'border-[#374151]' : 'border-gray-100';

  if (user && user.isAdmin === false) return null;

  return (
    <div className={`flex flex-col flex-1 ${bgBase} min-h-full pb-8`}>
      <div className="p-6 flex items-center gap-4">
        <button
          onClick={() => router.push('/')}
          className={`p-2 ${isDarkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-100'} rounded-full transition-colors`}
        >
          <ArrowLeft size={24} className={textPrimary} />
        </button>
        <h1 className={`text-xl font-bold ${textPrimary}`}>Admin Dashboard</h1>
      </div>

      <div className="px-6 flex flex-col gap-8">
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              i: 0,
              icon: Users,
              label: 'Total Users',
              value: statsLoading ? '—' : (stats?.totalUsers ?? 0).toLocaleString(),
              color: 'text-blue-600',
              bg: 'bg-blue-50 dark:bg-blue-900/30'
            },
            {
              i: 1,
              icon: UserCheckIcon,
              label: 'Active Today',
              value: statsLoading ? '—' : (stats?.activeToday ?? 0).toLocaleString(),
              color: 'text-green-600',
              bg: 'bg-green-50 dark:bg-green-900/30'
            },
            {
              i: 2,
              icon: Clock,
              label: 'Pending Withdrawals',
              value: statsLoading ? '—' : (stats?.pendingWithdrawals ?? 0).toLocaleString(),
              color: 'text-yellow-600',
              bg: 'bg-yellow-50 dark:bg-yellow-900/30'
            },
            {
              i: 3,
              icon: DollarSign,
              label: 'Total Paid Out',
              value: statsLoading ? '—' : `$${(stats?.totalPaidOut ?? 0).toFixed(2)}`,
              color: 'text-purple-600',
              bg: 'bg-purple-50 dark:bg-purple-900/30'
            },
          ].map((card) => (
            <motion.div
              key={card.label}
              custom={card.i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className={`${cardBase} ${card.bg} rounded-2xl p-5 flex flex-col gap-3 border ${borderBase}`}
            >
              <card.icon size={24} className={card.color} />
              <p className={`text-2xl font-black ${textPrimary}`}>{card.value}</p>
              <p className={`text-xs font-medium ${textSecondary}`}>{card.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <h2 className={`text-lg font-bold ${textPrimary}`}>Recent Activity</h2>
          <button
            onClick={() => router.push('/admin/withdrawals')}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors"
          >
            View All Withdrawals
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`${cardBase} rounded-2xl border ${borderBase} overflow-hidden`}
        >
          {loading ? (
            <div className="p-6 flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`h-14 ${isDarkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'} rounded-xl animate-pulse`} />
              ))}
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No recent activity</div>
          ) : (
            <div className="flex flex-col">
              {withdrawals.map((w) => (
                <div
                  key={w.id}
                  className={`flex items-center gap-4 p-4 ${isDarkMode ? 'hover:bg-[#2a2a2a]/50' : 'hover:bg-gray-50'} transition-colors border-b ${borderBase} last:border-b-0`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {w.user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${textPrimary} truncate`}>{w.user?.username || 'Unknown User'}</p>
                    <p className={`text-xs ${textSecondary}`}>{w.method}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${textPrimary}`}>${w.amount.toFixed(2)}</p>
                    <span className={getStatusBadge(w.status)}>{w.status}</span>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className={`text-xs ${textSecondary}`}>{formatDate(w.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-4"
        >
          <button
            onClick={() => router.push('/admin/withdrawals')}
            className="flex-1 h-12 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            View All Withdrawals
          </button>
          <button
            onClick={() => router.push('/admin/users')}
            className="flex-1 h-12 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            Manage Users
          </button>
        </motion.div>
      </div>
    </div>
  );
}