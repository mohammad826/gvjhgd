'use client';

import { useStore } from "@/store/useStore";
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  Star,
  Tv,
  Gamepad2,
  ClipboardList,
  Gift,
  XCircle,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import api from "@/api/axios";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  link: string;
  type: "subscribe" | "mini-app" | "survey" | "offer";
  status: "GO" | "VERIFYING" | "CLAIM" | "DONE";
  timer: number;
}

const TASK_TYPES = [
  { key: "all", label: "All", icon: Star },
  { key: "subscribe", label: "Subscribe", icon: Tv },
  { key: "mini-app", label: "Mini App", icon: Gamepad2 },
  { key: "survey", label: "Survey", icon: ClipboardList },
  { key: "offer", label: "Offer", icon: Gift },
];

const TYPE_ICONS: Record<string, any> = {
  subscribe: Tv,
  "mini-app": Gamepad2,
  survey: ClipboardList,
  offer: Gift,
};

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  subscribe: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
  "mini-app": { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-100" },
  survey: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-100" },
  offer: { bg: "bg-green-50", text: "text-green-600", border: "border-green-100" },
};

export default function TasksPage() {
  const { user, isDarkMode, updateBalance } = useStore();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "subscribe" | "mini-app" | "survey" | "offer">("all");
  const timerRefs = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  useEffect(() => {
    fetchTasks();
    return () => {
      timerRefs.current.forEach((interval) => clearInterval(interval));
    };
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get("/tasks");
      setTasks(data.map((t: any) => ({ ...t, status: t.status || "GO", timer: 0 })));
    } catch (e) {
      setTasks([
        {
          id: "1",
          title: "Join Telegram Channel",
          description: "Subscribe to our official Telegram channel for updates and bonus rewards.",
          reward: 0.05,
          link: "https://t.me/wfjcikcnfhcdbcbot",
          type: "subscribe",
          status: "GO",
          timer: 0,
        },
        {
          id: "2",
          title: "Try Ton Boost Mini App",
          description: "Open and explore the Ton Boost partner mini app.",
          reward: 0.08,
          link: "https://t.me/your_bot",
          type: "mini-app",
          status: "GO",
          timer: 0,
        },
        {
          id: "3",
          title: "Complete Short Survey",
          description: "Answer a quick 5-question survey to earn rewards.",
          reward: 0.04,
          link: "https://example.com/survey",
          type: "survey",
          status: "GO",
          timer: 0,
        },
        {
          id: "4",
          title: "Sign Up for Partner Offer",
          description: "Register on our partner platform and verify your account.",
          reward: 0.12,
          link: "https://example.com/offer",
          type: "offer",
          status: "GO",
          timer: 0,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskAction = async (task: Task) => {
    if (task.status === "GO") {
      if (typeof window !== "undefined") {
        if ((window as any).Telegram?.WebApp?.openLink) {
          (window as any).Telegram.WebApp.openLink(task.link);
        } else {
          window.open(task.link, "_blank");
        }
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: "VERIFYING" as const, timer: 8 } : t))
      );

      const interval = setInterval(() => {
        setTasks((prev) => {
          let shouldClear = false;
          const updated = prev.map((t) => {
            if (t.id === task.id) {
              if (t.timer <= 1) {
                shouldClear = true;
                return { ...t, status: "CLAIM" as const, timer: 0 };
              }
              return { ...t, timer: t.timer - 1 };
            }
            return t;
          });
          if (shouldClear) {
            clearInterval(interval);
            timerRefs.current.delete(task.id);
          }
          return updated;
        });
      }, 1000);
      timerRefs.current.set(task.id, interval);
    } else if (task.status === "CLAIM") {
      try {
        await api.post(`/tasks/${task.id}/claim`);
        updateBalance(task.reward);
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: "DONE" as const } : t))
        );
      } catch {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: "DONE" as const } : t))
        );
      }
    }
  };

  const filteredTasks =
    activeTab === "all" ? tasks : tasks.filter((t) => t.type === activeTab);

  const completedCount = tasks.filter((t) => t.status === "DONE").length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const bgBase = isDarkMode ? "bg-[#0f0f0f]" : "bg-[#f0f0f0]";
  const cardBase = isDarkMode ? "bg-[#1a1a1a]" : "bg-white";
  const textPrimary = isDarkMode ? "text-white" : "text-[#171717]";
  const textSecondary = isDarkMode ? "text-gray-400" : "text-gray-500";
  const borderBase = isDarkMode ? "border-[#2a2a2a]" : "border-gray-100";

  return (
    <div className={`flex flex-col flex-1 ${bgBase} min-h-full`}>
      <div className="p-6 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className={`p-2 ${isDarkMode ? "hover:bg-[#252525]" : "hover:bg-gray-100"} rounded-full transition-colors`}
        >
          <ArrowLeft size={24} className={textPrimary} />
        </button>
        <div>
          <h1 className={`text-xl font-bold ${textPrimary}`}>Earn More</h1>
          <p className={`text-xs ${textSecondary}`}>Complete tasks to boost your earnings</p>
        </div>
      </div>

      <div className="px-6 pb-8 flex flex-col gap-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        >
          {TASK_TYPES.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : `${cardBase} ${textSecondary} ${borderBase} border`
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </motion.div>

        {!loading && totalCount > 0 && (
          <div className={`${cardBase} rounded-2xl p-4 ${borderBase} border`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs font-bold ${textSecondary}`}>Progress</p>
              <p className={`text-xs font-black ${textPrimary}`}>
                {completedCount} of {totalCount} tasks completed
              </p>
            </div>
            <div className={`h-2.5 ${isDarkMode ? "bg-[#252525]" : "bg-gray-100"} rounded-full overflow-hidden`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-full"
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`${cardBase} rounded-[2rem] p-5 ${borderBase} border animate-pulse`}
              >
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${isDarkMode ? "bg-[#252525]" : "bg-gray-100"}`} />
                  <div className="flex-1 space-y-2">
                    <div className={`h-4 rounded-xl ${isDarkMode ? "bg-[#252525]" : "bg-gray-100"} w-1/2`} />
                    <div className={`h-3 rounded-xl ${isDarkMode ? "bg-[#252525]" : "bg-gray-100"} w-3/4`} />
                  </div>
                  <div className={`w-24 h-10 rounded-2xl ${isDarkMode ? "bg-[#252525]" : "bg-gray-100"}`} />
                </div>
              </div>
            ))
          ) : filteredTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${cardBase} rounded-[2rem] p-10 flex flex-col items-center gap-4 ${borderBase} border`}
            >
              <XCircle size={48} className={textSecondary} />
              <div className="text-center">
                <p className={`font-bold ${textPrimary}`}>No Tasks Available</p>
                <p className={`text-sm ${textSecondary} mt-1`}>
                  Check back later for new sponsor tasks in this category.
                </p>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task, index) => {
                const Icon = TYPE_ICONS[task.type] || Star;
                const colors = TYPE_COLORS[task.type] || TYPE_COLORS.offer;

                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.06, duration: 0.3 }}
                    className={`${cardBase} rounded-[2rem] p-5 ${borderBase} border`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${colors.bg}`}
                      >
                        <Icon size={22} className={colors.text} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className={`font-bold text-sm ${textPrimary} leading-tight`}>
                              {task.title}
                            </h3>
                            <p className={`text-xs ${textSecondary} mt-1 leading-tight`}>
                              {task.description}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-[10px] font-black border border-green-100`}
                          >
                            +${task.reward.toFixed(4)}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() => handleTaskAction(task)}
                            disabled={task.status === "DONE"}
                            className={`px-5 py-2.5 rounded-2xl font-black text-xs transition-all active:scale-95 flex items-center gap-1.5 ${
                              task.status === "GO" &&
                              "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-100"
                            } ${
                              task.status === "VERIFYING" &&
                              "bg-yellow-50 text-yellow-700 border border-yellow-200 cursor-wait"
                            } ${
                              task.status === "CLAIM" &&
                              "bg-green-500 text-white hover:bg-green-600 animate-bounce shadow-md shadow-green-100"
                            } ${
                              task.status === "DONE" &&
                              "bg-gray-100 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            {task.status === "GO" && (
                              <>
                                GO <ExternalLink size={12} />
                              </>
                            )}
                            {task.status === "VERIFYING" && (
                              <>
                                <RefreshCw size={12} className="animate-spin" />
                                {task.timer}s
                              </>
                            )}
                            {task.status === "CLAIM" && "CLAIM"}
                            {task.status === "DONE" && (
                              <>
                                DONE <CheckCircle size={12} />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {!loading && totalCount > 0 && completedCount === totalCount && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-[2rem] p-5 flex items-center gap-4 text-white shadow-xl shadow-amber-500/20"
          >
            <Gift size={32} className="shrink-0 drop-shadow" />
            <div>
              <p className="font-black text-sm">Bonus for completing all tasks!</p>
              <p className="text-xs opacity-80 mt-0.5">You earned an extra $0.50 bonus</p>
            </div>
            <div className="ml-auto bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1.5">
              <span className="font-black text-sm">+$0.5000</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
