'use client';

import { useStore } from "@/store/useStore";
import { ArrowLeft, Wallet, AlertCircle, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import api from "@/api/axios";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function WalletPage() {
  const { user, isDarkMode } = useStore();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('TRC20 USDT');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleWithdraw = async () => {
    setError('');
    setSuccess('');
    if (!amount || !address) {
      setError('Please fill all fields');
      return;
    }
    if (parseFloat(amount) < 10) {
      setError('Minimum withdrawal is $10');
      return;
    }
    if (parseFloat(amount) > Number(user?.balance || 0)) {
      setError('Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      await api.post('/withdrawal/request', {
        amount: parseFloat(amount),
        method,
        walletAddress: address
      });
      setSuccess('Withdrawal request submitted successfully!');
      setTimeout(() => router.push('/'), 1500);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const bgBase = isDarkMode ? "bg-[#111827]" : "bg-[#f0f0f0]";
  const cardBase = isDarkMode ? "bg-[#1f2937]" : "bg-white";
  const textPrimary = isDarkMode ? "text-white" : "text-gray-900";
  const textSecondary = isDarkMode ? "text-gray-400" : "text-gray-500";
  const borderBase = isDarkMode ? "border-[#374151]" : "border-gray-100";
  const inputBg = isDarkMode ? "bg-[#111827]" : "bg-gray-50";

  return (
    <div className={`flex flex-col flex-1 ${bgBase} min-h-full pb-8`}>
      <div className="p-6 flex items-center gap-4">
        <button onClick={() => router.back()} className={`p-2 ${isDarkMode ? "hover:bg-[#252525]" : "hover:bg-gray-100"} rounded-full transition-colors`}>
          <ArrowLeft size={24} className={textPrimary} />
        </button>
        <h1 className={`text-xl font-bold ${textPrimary}`}>Withdraw Funds</h1>
      </div>

      <div className="px-6 flex flex-col gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-[2rem] text-white shadow-xl">
          <p className="text-blue-100 text-xs font-bold uppercase mb-1">Available for Withdrawal</p>
          <h2 className="text-4xl font-black">${(Number(user?.balance || 0)).toFixed(4)}</h2>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <button
            onClick={() => router.push('/wallet/transfer')}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white p-4 rounded-[1.5rem] flex items-center justify-between shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Send to Friends</p>
                <p className="text-xs text-purple-100">Transfer balance instantly</p>
              </div>
            </div>
            <span className="text-white/80">→</span>
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`${cardBase} rounded-[2rem] p-6 flex flex-col gap-5 ${borderBase} border`}>
          <h3 className={`font-bold ${textPrimary}`}>Request Withdrawal</h3>

          <div className="flex flex-col gap-2">
            <label className={`text-sm font-bold ${textSecondary} ml-1`}>Amount (USD)</label>
            <input
              type="number"
              placeholder="Min $10.00"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(''); }}
              className={`w-full h-14 ${inputBg} rounded-2xl px-5 font-bold text-base ${textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 border ${borderBase}`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={`text-sm font-bold ${textSecondary} ml-1`}>Withdrawal Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className={`w-full h-14 ${inputBg} rounded-2xl px-5 font-bold text-base ${textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 border ${borderBase}`}
            >
              <option>TRC20 USDT</option>
              <option>Binance UID</option>
              <option>Telegram Stars</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className={`text-sm font-bold ${textSecondary} ml-1`}>Wallet Address / ID</label>
            <input
              type="text"
              placeholder="Enter your address"
              value={address}
              onChange={(e) => { setAddress(e.target.value); setError(''); }}
              className={`w-full h-14 ${inputBg} rounded-2xl px-5 font-bold text-base ${textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500 border ${borderBase}`}
            />
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl text-green-600 dark:text-green-400 text-sm font-medium">
              {success}
            </motion.div>
          )}

          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl flex gap-2">
            <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-orange-700 dark:text-orange-400 leading-tight">
              Withdrawals are processed manually within 24-48 hours. A $1.00 fee is deducted.
            </p>
          </div>

          <button
            onClick={handleWithdraw}
            disabled={loading}
            className="w-full h-14 bg-blue-600 text-white rounded-2xl font-black text-base shadow-lg shadow-blue-200 dark:shadow-blue-900/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : 'Submit Request'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}