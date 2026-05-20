'use client';

import { useStore } from "@/store/useStore";
import { ArrowLeft, AlertCircle, Loader2, CheckCircle2, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import * as Lucide from "lucide-react";
const EmptyIcon: any = (props: any) => null;
const UserCheckIcon: any = (Lucide as any).UserCheck ?? (Lucide as any).Check ?? (Lucide as any).CheckCircle2 ?? EmptyIcon;
import { useState, useEffect } from "react";
import api from "@/api/axios";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Transaction {
  id: string;
  amount: number;
  targetUsername: string;
  createdAt: string;
}

interface HistoryResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  totalPages: number;
}

export default function TransferPage() {
  const { user, isDarkMode, addNotification, updateBalance } = useStore();
  const router = useRouter();

  const [targetUsername, setTargetUsername] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [userFound, setUserFound] = useState<string | null>(null);
  const [checkError, setCheckError] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get<HistoryResponse>('/transfer/history');
      setTransactions(data.transactions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCheckUser = async () => {
    if (!targetUsername.trim()) {
      setCheckError('Please enter a username');
      setUserFound(null);
      return;
    }

    if (targetUsername.toLowerCase() === user?.username?.toLowerCase()) {
      setCheckError('You cannot transfer to yourself');
      setUserFound(null);
      return;
    }

    setChecking(true);
    setCheckError('');
    setUserFound(null);

    try {
      const { data } = await api.get(`/transfer/balance-check/${targetUsername}`);
      setUserFound(data.username || targetUsername);
    } catch (e: any) {
      setCheckError(e.response?.data?.message || 'User not found');
      setUserFound(null);
    } finally {
      setChecking(false);
    }
  };

  const handleTransfer = async () => {
    const amountNum = parseFloat(amount);

    if (!targetUsername.trim()) {
      addNotification({ type: 'error', message: 'Please enter a username' });
      return;
    }

    if (!amount || isNaN(amountNum)) {
      addNotification({ type: 'error', message: 'Please enter a valid amount' });
      return;
    }

    if (amountNum < 0.01) {
      addNotification({ type: 'error', message: 'Minimum transfer amount is $0.01' });
      return;
    }

    if (amountNum > (user?.balance || 0)) {
      addNotification({ type: 'error', message: 'Insufficient balance' });
      return;
    }

    if (targetUsername.toLowerCase() === user?.username?.toLowerCase()) {
      addNotification({ type: 'error', message: 'You cannot transfer to yourself' });
      return;
    }

    setLoading(true);

    try {
      await api.post('/transfer', {
        targetUsername: targetUsername.trim(),
        amount: amountNum
      });

      updateBalance(-amountNum);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        addNotification({ type: 'success', message: 'Transfer successful!' });
      }, 2000);

      setTargetUsername('');
      setAmount('');
      setUserFound(null);
      fetchHistory();
    } catch (e: any) {
      addNotification({ type: 'error', message: e.response?.data?.message || 'Transfer failed' });
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

  const bgBase = isDarkMode ? 'bg-[#111827]' : 'bg-[#f0f0f0]';
  const cardBase = isDarkMode ? 'bg-[#1f2937]' : 'bg-white';
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const borderBase = isDarkMode ? 'border-[#374151]' : 'border-gray-100';
  const inputBg = isDarkMode ? 'bg-[#111827]' : 'bg-gray-50';

  return (
    <div className={`flex flex-col flex-1 ${bgBase} min-h-full pb-8`}>
      <div className="p-6 flex items-center gap-4">
        <button
          onClick={() => router.push('/wallet')}
          className={`p-2 ${isDarkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-100'} rounded-full transition-colors`}
        >
          <ArrowLeft size={24} className={textPrimary} />
        </button>
        <h1 className={`text-xl font-bold ${textPrimary}`}>Send to Friends</h1>
      </div>

      <div className="px-6 flex flex-col gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500 to-pink-600 p-6 rounded-[2rem] text-white shadow-xl"
        >
          <p className="text-purple-100 text-xs font-bold uppercase mb-1">Available Balance</p>
          <h2 className="text-4xl font-black">${(Number(user?.balance || 0)).toFixed(4)}</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${cardBase} rounded-[2rem] p-6 flex flex-col gap-5 ${borderBase} border`}
        >
          <div className="flex flex-col gap-2">
            <label className={`text-sm font-bold ${textSecondary} ml-1`}>Recipient Username</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="@username"
                value={targetUsername}
                onChange={(e) => {
                  setTargetUsername(e.target.value);
                  setUserFound(null);
                  setCheckError('');
                }}
                className={`flex-1 h-14 ${inputBg} rounded-2xl px-5 font-bold text-base ${textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500 border ${borderBase}`}
              />
              <button
                onClick={handleCheckUser}
                disabled={checking || !targetUsername.trim()}
                className="h-14 px-5 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {checking ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <UserCheckIcon size={18} />
                    Check
                  </>
                )}
              </button>
            </div>

            <AnimatePresence>
              {userFound && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl flex items-center gap-2 mt-1"
                >
                  <CheckCircle2 size={16} className="text-green-500" />
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    User found: <span className="font-bold">@{userFound}</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {checkError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl flex items-center gap-2 mt-1"
                >
                  <AlertCircle size={16} className="text-red-500" />
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">{checkError}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-2">
            <label className={`text-sm font-bold ${textSecondary} ml-1`}>Amount (USD)</label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full h-14 ${inputBg} rounded-2xl px-5 font-bold text-base ${textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500 border ${borderBase}`}
            />
            <p className={`text-xs ${textSecondary} ml-1`}>
              Balance: ${(Number(user?.balance || 0)).toFixed(4)}
            </p>
          </div>

          <button
            onClick={handleTransfer}
            disabled={loading || !targetUsername.trim() || !amount || !userFound}
            className="w-full h-14 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-2xl font-black text-base shadow-lg shadow-purple-200 dark:shadow-purple-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              'Send Transfer'
            )}
          </button>
        </motion.div>

        <div className="flex items-center justify-between">
          <h2 className={`text-lg font-bold ${textPrimary}`}>Transfer History</h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${cardBase} rounded-2xl border ${borderBase} overflow-hidden`}
        >
          {historyLoading ? (
            <div className="p-6 flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`h-14 ${isDarkMode ? 'bg-[#2a2a2a]' : 'bg-gray-100'} rounded-xl animate-pulse`} />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No transfer history yet</div>
          ) : (
            <div className="flex flex-col">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className={`flex items-center gap-4 p-4 ${isDarkMode ? 'hover:bg-[#2a2a2a]/50' : 'hover:bg-gray-50'} transition-colors border-b ${borderBase} last:border-b-0`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white">
                    <ArrowUpRight size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${textPrimary} truncate`}>
                      Sent to <span className="font-bold">@{tx.targetUsername}</span>
                    </p>
                    <p className={`text-xs ${textSecondary}`}>{formatDate(tx.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-500">-${tx.amount.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white dark:bg-[#1f2937] rounded-3xl p-8 flex flex-col items-center gap-4 mx-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 20 }}
              >
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={48} className="text-green-500" />
                </div>
              </motion.div>
              <div className="text-center">
                <h3 className={`text-xl font-bold ${textPrimary}`}>Transfer Successful!</h3>
                <p className={`text-sm ${textSecondary} mt-1`}>Your transfer has been processed</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}