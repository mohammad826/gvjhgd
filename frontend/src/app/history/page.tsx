'use client';

import { useStore } from "@/store/useStore";
import { ArrowLeft, Play, Gift, Star, Wallet, Shield, Package } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import api from "@/api/axios";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type TransactionType = 'AD_REWARD' | 'REFERRAL_REWARD' | 'DAILY_BONUS' | 'WITHDRAWAL' | 'ADMIN_ADJUSTMENT';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  createdAt: string;
}

interface TransactionResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  totalPages: number;
}

const TABS = ['All', 'Earnings', 'Withdrawals', 'Bonuses'] as const;
type Tab = typeof TABS[number];

const TYPE_CONFIG: Record<TransactionType, { icon: any; label: string; color: string; bgColor: string }> = {
  AD_REWARD: { icon: Play, label: 'Ad Reward', color: 'text-green-600', bgColor: 'bg-green-100' },
  REFERRAL_REWARD: { icon: Gift, label: 'Referral Commission', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  DAILY_BONUS: { icon: Star, label: 'Daily Bonus', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  WITHDRAWAL: { icon: Wallet, label: 'Withdrawal', color: 'text-red-600', bgColor: 'bg-red-100' },
  ADMIN_ADJUSTMENT: { icon: Shield, label: 'Adjustment', color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

const EARNING_TYPES: TransactionType[] = ['AD_REWARD', 'REFERRAL_REWARD'];
const WITHDRAWAL_TYPES: TransactionType[] = ['WITHDRAWAL'];
const BONUS_TYPES: TransactionType[] = ['DAILY_BONUS'];

export default function HistoryPage() {
  const router = useRouter();
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTransactions(1);
  }, [activeTab]);

  const fetchTransactions = useCallback(async (pageNum: number) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const { data }: { data: TransactionResponse } = await api.get('/user/transactions', {
        params: { page: pageNum, limit: 20 }
      });

      if (pageNum === 1) {
        setTransactions(data.transactions);
      } else {
        setTransactions(prev => [...prev, ...data.transactions]);
      }
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab]);

  const loadMore = useCallback(() => {
    if (page < totalPages && !loadingMore) {
      fetchTransactions(page + 1);
    }
  }, [page, totalPages, loadingMore, fetchTransactions]);

  const getFilteredTransactions = (): Transaction[] => {
    if (activeTab === 'All') return transactions;
    if (activeTab === 'Earnings') return transactions.filter(t => EARNING_TYPES.includes(t.type));
    if (activeTab === 'Withdrawals') return transactions.filter(t => WITHDRAWAL_TYPES.includes(t.type));
    if (activeTab === 'Bonuses') return transactions.filter(t => BONUS_TYPES.includes(t.type));
    return transactions;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredTransactions = getFilteredTransactions();

  return (
    <div className="flex flex-col flex-1 bg-gray-50 min-h-screen">
      <div className="bg-white p-6 flex items-center gap-4 shadow-sm">
        <button onClick={() => router.push('/')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Transaction History</h1>
      </div>

      <div className="bg-white border-b border-gray-100">
        <div className="flex px-4 pt-4 gap-2 overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="h-4" />
      </div>

      <div className="flex-1 p-4 pb-8">
        {loading ? (
          <div className="flex flex-col gap-4">
            {[...Array(5)].map((_, i) => (
              <TransactionSkeleton key={i} />
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              {filteredTransactions.map((tx, index) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  index={index}
                  formatDate={formatDate}
                  formatTime={formatTime}
                />
              ))}

              {page < totalPages && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="mt-4 py-4 bg-white rounded-2xl border border-gray-200 text-blue-600 font-bold text-sm shadow-sm hover:bg-gray-50 active:scale-98 transition-all disabled:opacity-50"
                >
                  {loadingMore ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    'Load More'
                  )}
                </motion.button>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function TransactionCard({
  transaction,
  index,
  formatDate,
  formatTime
}: {
  transaction: Transaction;
  index: number;
  formatDate: (d: string) => string;
  formatTime: (d: string) => string;
}) {
  const config = TYPE_CONFIG[transaction.type] || TYPE_CONFIG.ADMIN_ADJUSTMENT;
  const Icon = config.icon;
  const isPositive = transaction.amount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
    >
      <div className={`w-12 h-12 ${config.bgColor} rounded-2xl flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${config.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-gray-800">{config.label}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatDate(transaction.createdAt)} at {formatTime(transaction.createdAt)}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className={`font-black text-base ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{transaction.amount.toFixed(4)}
        </p>
        <p className="text-[10px] text-gray-400 uppercase font-bold">
          {isPositive ? 'Earned' : 'Debited'}
        </p>
      </div>
    </motion.div>
  );
}

function TransactionSkeleton() {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 animate-pulse">
      <div className="w-12 h-12 bg-gray-200 rounded-2xl shrink-0" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-24" />
      </div>
      <div className="w-16 h-5 bg-gray-200 rounded" />
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-6"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6"
      >
        <Package className="w-10 h-10 text-gray-300" />
      </motion.div>
      <h3 className="font-bold text-lg text-gray-700 mb-2">No transactions yet</h3>
      <p className="text-sm text-gray-400 text-center max-w-xs">
        {tab === 'All' && "Start watching ads to see your transaction history here."}
        {tab === 'Earnings' && "Complete sponsor tasks or watch ads to earn rewards."}
        {tab === 'Withdrawals' && "Your withdrawal history will appear here."}
        {tab === 'Bonuses' && "Claim your daily bonus to start earning!"}
      </p>
    </motion.div>
  );
}