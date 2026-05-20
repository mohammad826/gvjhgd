'use client';

import { useStore } from "@/store/useStore";
import { ArrowLeft, Trophy, Medal, TrendingUp, Users } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/api/axios";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  photoUrl: string | null;
  balance: number;
  referrals: number;
  isCurrentUser: boolean;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  currentRank: number | null;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { user } = useStore();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentRank, setCurrentRank] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data }: { data: LeaderboardResponse } = await api.get('/user/leaderboard');
      setLeaderboard(data.leaderboard);
      setCurrentRank(data.currentRank);
    } catch (e: any) {
      console.error(e);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const topThree = leaderboard.filter(e => e.rank <= 3);
  const rest = leaderboard.filter(e => e.rank > 3);
  const currentUserEntry = leaderboard.find(e => e.isCurrentUser);
  const userNotInTop20 = currentRank && currentRank > 20 && !currentUserEntry;

  const podiumColors = [
    { bg: 'bg-yellow-400', text: 'text-yellow-900', shadow: 'shadow-yellow-300', ring: 'ring-yellow-400' },
    { bg: 'bg-gray-300', text: 'text-gray-700', shadow: 'shadow-gray-300', ring: 'ring-gray-300' },
    { bg: 'bg-orange-400', text: 'text-orange-900', shadow: 'shadow-orange-300', ring: 'ring-orange-400' },
  ];

  const podiumOrder = [1, 0, 2];

  return (
    <div className="flex flex-col flex-1 bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <div className="bg-white p-6 flex items-center gap-4 shadow-sm">
        <button onClick={() => router.push('/')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Leaderboard</h1>
      </div>

      <div className="flex-1 p-4 pb-8 flex flex-col gap-6">
        {loading ? (
          <LeaderboardSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={fetchLeaderboard}
              className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {topThree.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end justify-center gap-3 px-4 pt-4"
              >
                {podiumOrder.map((pos, idx) => {
                  const entry = topThree[pos];
                  if (!entry) return null;
                  const style = podiumColors[pos];
                  const heights = ['h-28', 'h-40', 'h-32'];

                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: pos * 0.15, type: 'spring', stiffness: 200 }}
                      className="flex flex-col items-center flex-1"
                    >
                      <div className="mb-2">
                        {pos === 0 && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                          >
                            <Trophy className="w-10 h-10 text-yellow-500 fill-yellow-100" />
                          </motion.div>
                        )}
                        {pos === 1 && <Medal className="w-8 h-8 text-gray-400 fill-gray-100" />}
                        {pos === 2 && <Medal className="w-8 h-8 text-orange-400 fill-orange-100" />}
                      </div>

                      <div className={`w-14 h-14 ${style.bg} rounded-full flex items-center justify-center font-bold text-white text-lg shadow-lg ${style.shadow} ring-4 ring-white`}>
                        {entry.photoUrl ? (
                          <img src={entry.photoUrl} alt={entry.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          entry.username?.[0]?.toUpperCase() || '?'
                        )}
                      </div>

                      <p className="mt-2 text-xs font-bold text-gray-600 truncate max-w-20">{entry.username || 'User'}</p>
                      <p className="text-xs font-black text-gray-800">${entry.balance.toFixed(2)}</p>

                      <div className={`w-full ${heights[pos]} ${style.bg} rounded-t-3xl mt-3 flex items-center justify-center`}>
                        <span className={`font-black text-2xl ${style.text}`}>#{entry.rank}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            <div className="flex flex-col gap-2">
              <h3 className="font-bold text-gray-500 text-xs uppercase tracking-wider ml-2">Rankings</h3>
              <div className="flex flex-col gap-2">
                {rest.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-white p-4 rounded-2xl border flex items-center gap-4 shadow-sm transition-all ${
                      entry.isCurrentUser
                        ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-black text-gray-500 text-sm shrink-0">
                      {entry.rank}
                    </div>

                    <div className={`w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                      {entry.photoUrl ? (
                        <img src={entry.photoUrl} alt={entry.username} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        entry.username?.[0]?.toUpperCase() || '?'
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm truncate ${entry.isCurrentUser ? 'text-blue-700' : 'text-gray-800'}`}>
                        {entry.username || 'User'}
                        {entry.isCurrentUser && (
                          <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">You</span>
                        )}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">{entry.referrals}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-black text-sm text-gray-800">${entry.balance.toFixed(2)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {userNotInTop20 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 bg-gradient-to-r from-blue-600 to-blue-700 p-5 rounded-[2rem] text-white shadow-xl shadow-blue-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <Trophy className="w-7 h-7 text-yellow-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Your Position</p>
                    <p className="text-3xl font-black">#{currentRank}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Balance</p>
                    <p className="text-xl font-black">${user?.balance.toFixed(2)}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-xl p-3">
                  <TrendingUp className="w-5 h-5 text-green-300" />
                  <p className="text-sm font-medium text-blue-100">Keep earning to climb the ranks!</p>
                </div>
              </motion.div>
            )}

            {leaderboard.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <Trophy className="w-16 h-16 text-gray-200 mb-4" />
                <p className="text-gray-400 font-medium">No users on the leaderboard yet</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-center gap-4 px-4 pt-4">
        {[32, 44, 36].map((h, i) => (
          <div key={i} className={`h-${h} bg-gray-200 rounded-t-3xl animate-pulse flex-1`} style={{ height: `${h * 2.5}px` }} />
        ))}
      </div>
      <div className="flex flex-col gap-2 px-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 animate-pulse">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-16" />
            </div>
            <div className="w-16 h-4 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}