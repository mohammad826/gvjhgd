'use client';

import { useStore } from "@/store/useStore";
import { ArrowLeft, Search, ChevronLeft, ChevronRight } from "lucide-react";
import * as Lucide from "lucide-react";
const EmptyIcon: any = (props: any) => null;
const BanIcon: any = (Lucide as any).Ban ?? (Lucide as any).Slash ?? (Lucide as any).X ?? EmptyIcon;
const Loader2Icon: any = (Lucide as any).Loader2 ?? (Lucide as any).Loader ?? EmptyIcon;
const CheckIcon: any = (Lucide as any).CheckCircle ?? (Lucide as any).Check ?? (Lucide as any).CheckCircle2 ?? EmptyIcon;
import { useState, useEffect, useMemo } from "react";
import api from "@/api/axios";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface User {
  id: string;
  username: string;
  telegramId: string;
  balance: number;
  referralCount: number;
  isBanned: boolean;
  createdAt: string;
  _count: {
    referrals: number;
  };
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

export default function UsersManagement() {
  const { user, isDarkMode, addNotification } = useStore();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.isAdmin === false) {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchUsers();
    }
  }, [page, user]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<UsersResponse>(`/admin/users?page=${page}`);
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error(e);
      addNotification({ type: 'error', message: 'Failed to fetch users' });
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string) => {
    const reason = window.prompt('Enter ban reason:');
    if (reason === null) return;
    
    setActionLoading(userId);
    try {
      await api.post(`/admin/user/${userId}/ban`, { reason });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: true } : u));
      addNotification({ type: 'success', message: 'User has been banned' });
    } catch (e: any) {
      addNotification({ type: 'error', message: e.response?.data?.message || 'Failed to ban user' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      await api.post(`/admin/user/${userId}/unban`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: false } : u));
      addNotification({ type: 'success', message: 'User has been unbanned' });
    } catch (e: any) {
      addNotification({ type: 'error', message: e.response?.data?.message || 'Failed to unban user' });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(u => u.username?.toLowerCase().includes(query));
  }, [users, searchQuery]);

  const bgBase = isDarkMode ? 'bg-[#111827]' : 'bg-[#f0f0f0]';
  const cardBase = isDarkMode ? 'bg-[#1f2937]' : 'bg-white';
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const borderBase = isDarkMode ? 'border-[#374151]' : 'border-gray-100';
  const inputBg = isDarkMode ? 'bg-[#111827]' : 'bg-gray-50';

  if (user && user.isAdmin === false) return null;

  return (
    <div className={`flex flex-col flex-1 ${bgBase} min-h-full pb-8`}>
      <div className="p-6 flex items-center gap-4">
        <button
          onClick={() => router.push('/admin')}
          className={`p-2 ${isDarkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-100'} rounded-full transition-colors`}
        >
          <ArrowLeft size={24} className={textPrimary} />
        </button>
        <h1 className={`text-xl font-bold ${textPrimary}`}>User Management</h1>
      </div>

      <div className="px-6 flex flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${cardBase} rounded-2xl p-4 flex items-center gap-3 ${borderBase} border`}
        >
          <Search size={20} className={textSecondary} />
          <input
            type="text"
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`flex-1 bg-transparent ${textPrimary} focus:outline-none text-sm font-medium placeholder:text-gray-400`}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${cardBase} rounded-2xl border ${borderBase} overflow-hidden`}
        >
          {loading ? (
            <div className="p-6 flex flex-col gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className={`h-16 ${isDarkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'} rounded-xl animate-pulse`} />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              {searchQuery ? 'No users found matching your search' : 'No users found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${borderBase}`}>
                    <th className={`text-left text-xs font-bold ${textSecondary} p-4`}>User</th>
                    <th className={`text-left text-xs font-bold ${textSecondary} p-4`}>Telegram ID</th>
                    <th className={`text-left text-xs font-bold ${textSecondary} p-4`}>Balance</th>
                    <th className={`text-left text-xs font-bold ${textSecondary} p-4`}>Referrals</th>
                    <th className={`text-left text-xs font-bold ${textSecondary} p-4`}>Status</th>
                    <th className={`text-left text-xs font-bold ${textSecondary} p-4`}>Joined</th>
                    <th className={`text-left text-xs font-bold ${textSecondary} p-4`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className={`border-b ${borderBase} last:border-b-0 ${isDarkMode ? 'hover:bg-[#2a2a2a]/50' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {u.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <span className={`text-sm font-medium ${textPrimary}`}>@{u.username}</span>
                        </div>
                      </td>
                      <td className={`p-4 text-sm ${textSecondary} font-mono`}>{u.telegramId}</td>
                      <td className={`p-4 text-sm font-bold ${textPrimary}`}>${u.balance.toFixed(2)}</td>
                      <td className={`p-4 text-sm ${textSecondary}`}>
                        <div className="flex items-center gap-1">
                          <span>{u._count?.referrals || 0}</span>
                          <span className="text-xs opacity-60">referrals</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          u.isBanned
                            ? 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700'
                            : 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
                        }`}>
                          {u.isBanned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td className={`p-4 text-sm ${textSecondary}`}>{formatDate(u.createdAt)}</td>
                      <td className="p-4">
                        {actionLoading === u.id ? (
                          <Loader2Icon size={18} className="animate-spin text-blue-500" />
                        ) : (
                          <button
                            onClick={() => u.isBanned ? handleUnbanUser(u.id) : handleBanUser(u.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                              u.isBanned
                                ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                                : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
                            }`}
                          >
                            {u.isBanned ? (
                              <>
                                <CheckIcon size={14} />
                                Unban
                              </>
                            ) : (
                              <>
                                <BanIcon size={14} />
                                Ban
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {!searchQuery && (
          <div className="flex items-center justify-between">
            <p className={`text-sm ${textSecondary}`}>
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-[#1f2937] hover:bg-[#2a2a2a]' : 'bg-white hover:bg-gray-100'} border ${borderBase} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                <ChevronLeft size={20} className={textPrimary} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-[#1f2937] hover:bg-[#2a2a2a]' : 'bg-white hover:bg-gray-100'} border ${borderBase} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                <ChevronRight size={20} className={textPrimary} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}