'use client';

import { useStore } from "@/store/useStore";
import { ArrowLeft, InboxIcon } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import api from "@/api/axios";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';

interface Withdrawal {
  id: string;
  userId: string;
  username: string;
  amount: number;
  method: string;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  walletAddress: string;
  createdAt: string;
  adminNote?: string;
}

const TABS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Rejected', value: 'REJECTED' },
];

function truncateAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SkeletonCard() {
  return (
    <div className="bg-[#1f2937] rounded-2xl p-5 border border-[#374151] animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-[#374151] rounded-full" />
        <div className="h-4 w-24 bg-[#374151] rounded" />
      </div>
      <div className="h-8 w-32 bg-[#374151] rounded mb-3" />
      <div className="h-3 w-40 bg-[#374151] rounded mb-2" />
      <div className="h-3 w-56 bg-[#374151] rounded" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
      <InboxIcon size={48} className="mb-4 opacity-40" />
      <p className="text-sm font-medium">No withdrawals found</p>
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    APPROVED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    PAID: 'bg-green-500/20 text-green-400 border-green-500/30',
    REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || ''}`}>
      {status}
    </span>
  );
}

interface WithdrawalCardProps {
  withdrawal: Withdrawal;
  onAction: (id: string, status: string) => void;
  loadingId: string | null;
}

function WithdrawalCard({ withdrawal, onAction, loadingId }: WithdrawalCardProps) {
  const methodLabels: Record<string, string> = {
    TRC20: 'TRC20 USDT',
    BINANCE: 'Binance UID',
    TELEGRAM: 'Telegram Stars',
  };

  const getMethodLabel = (m: string) => methodLabels[m] || m;

  const showApprove = withdrawal.status === 'PENDING';
  const showMarkPaid = withdrawal.status === 'APPROVED';
  const isLoading = loadingId === withdrawal.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-[#1f2937] rounded-2xl p-5 border border-[#374151]"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
          {withdrawal.username?.[0]?.toUpperCase() || 'U'}
        </div>
        <span className="text-sm font-medium text-gray-300">
          @{withdrawal.username}
        </span>
        <div className="ml-auto">
          <StatusBadge status={withdrawal.status} />
        </div>
      </div>

      <p className="text-3xl font-black text-white mb-2">
        ${withdrawal.amount.toFixed(2)}
      </p>

      <div className="space-y-1.5 mb-4">
        <p className="text-xs text-gray-400">
          <span className="font-semibold">Method:</span> {getMethodLabel(withdrawal.method)}
        </p>
        <p className="text-xs text-gray-400">
          <span className="font-semibold">Address:</span>{' '}
          <span className="font-mono">{truncateAddress(withdrawal.walletAddress)}</span>
        </p>
        <p className="text-xs text-gray-500">
          {formatDateTime(withdrawal.createdAt)}
        </p>
      </div>

      {withdrawal.adminNote && (
        <div className="mb-4 p-3 bg-[#111827] rounded-xl border border-[#374151]">
          <p className="text-xs text-gray-400">
            <span className="font-semibold text-gray-300">Admin Note:</span>{' '}
            {withdrawal.adminNote}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {showApprove && (
          <>
            <button
              onClick={() => onAction(withdrawal.id, 'APPROVED')}
              disabled={isLoading}
              className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Approve'
              )}
            </button>
            <button
              onClick={() => onAction(withdrawal.id, 'REJECTED')}
              disabled={isLoading}
              className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Reject'
              )}
            </button>
          </>
        )}
        {showMarkPaid && (
          <button
            onClick={() => onAction(withdrawal.id, 'PAID')}
            disabled={isLoading}
            className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Mark Paid'
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function WithdrawalsPage() {
  const { user } = useStore();
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (user && user.isAdmin === false) {
      router.push('/');
    }
  }, [user, router]);

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: page.toString() };
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const { data } = await api.get('/admin/withdrawals', { params });
      setWithdrawals(data.withdrawals || data || []);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchWithdrawals();
    }
  }, [user, fetchWithdrawals]);

  const handleAction = async (id: string, newStatus: string) => {
    const confirmMsg =
      newStatus === 'APPROVED'
        ? 'Approve this withdrawal?'
        : newStatus === 'REJECTED'
        ? 'Reject this withdrawal?'
        : 'Mark this withdrawal as paid?';

    if (!window.confirm(confirmMsg)) return;

    setLoadingAction(id);
    try {
      await api.post(`/admin/withdrawal/${id}/status`, {
        status: newStatus,
        adminNote: '',
      });
      await fetchWithdrawals();
    } catch (e) {
      console.error(e);
      alert('Failed to update withdrawal status');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTabChange = (tab: StatusFilter) => {
    setStatusFilter(tab);
    setPage(1);
  };

  return (
    <div className="flex flex-col flex-1 bg-[#111827] min-h-screen">
      <div className="p-6 flex items-center gap-4">
        <button
          onClick={() => router.push('/admin')}
          className="p-2 hover:bg-[#1f2937] rounded-full transition-colors text-white"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white">Withdrawal Requests</h1>
      </div>

      <div className="px-6 mb-6">
        <div className="flex gap-2 border-b border-[#374151]">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={`px-4 py-2 text-sm font-bold transition-colors relative ${
                statusFilter === tab.value
                  ? 'text-blue-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
              {statusFilter === tab.value && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {[...Array(4)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </motion.div>
          ) : withdrawals.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {withdrawals.map((w) => (
                <WithdrawalCard
                  key={w.id}
                  withdrawal={w}
                  onAction={handleAction}
                  loadingId={loadingAction}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!loading && withdrawals.length > 0 && (
        <div className="px-6 pb-8 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-[#1f2937] hover:bg-[#374151] disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-[#1f2937] hover:bg-[#374151] disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}