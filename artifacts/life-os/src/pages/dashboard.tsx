import { useState, useEffect, useRef } from "react";
import {
  useGetDashboardStats,
  getGetDashboardStatsQueryKey,
  useGetTodayTasks,
  getGetTodayTasksQueryKey,
  useGetOverdueTasks,
  getGetOverdueTasksQueryKey,
  useGetTodayHabits,
  getGetTodayHabitsQueryKey,
  useGetAchievements,
  getGetAchievementsQueryKey,
  useGetGamificationProfile,
  getGetGamificationProfileQueryKey,
  useFailTask,
  useUpdateTask,
  useLogHabit,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import {
  CheckCircle2, XCircle, Flame, Clock, Brain, Play, Plus, Target,
  Calendar, AlertTriangle, ChevronRight, Zap, Trophy, Star,
  Sparkles, TrendingUp, Timer, BarChart3, ArrowRight, CircleDot,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { playSound } from "@/lib/sound";
import { notifyTaskComplete } from "@/lib/notifications";

// ─── Constants ────────────────────────────────────────────────────────────────

const QUOTES = [
  "Intizom – muvaffaqiyatning yashirin kaliti.",
  "Bugun qilgan kichik harakat, ertangi muvaffaqiyat asosi.",
  "Har bir daqiqa qarordir — sarfla yoki yo'qot.",
  "Qiyinchilik – bu muvaffaqiyatga yetaklovchi yo'l.",
  "Sen kutayotgan o'zgarish, sening qo'lingda.",
  "Muvaffaqiyat kechasi emas, har kungi intizom bilan quriladi.",
  "Eng yaxshi vaqt – hozir.",
];

const GRADE_CFG: Record<string, { color: string; glow: string; label: string; emoji: string }> = {
  "A+": { color: "#10b981", glow: "rgba(16,185,129,0.4)", label: "Mukammal", emoji: "🏆" },
  "A":  { color: "#10b981", glow: "rgba(16,185,129,0.35)", label: "A'lo", emoji: "⭐" },
  "B":  { color: "#8b5cf6", glow: "rgba(139,92,246,0.4)", label: "Yaxshi", emoji: "💪" },
  "C":  { color: "#f59e0b", glow: "rgba(245,158,11,0.35)", label: "O'rtacha", emoji: "📈" },
  "D":  { color: "#f97316", glow: "rgba(249,115,22,0.35)", label: "Kuchsiz", emoji: "⚡" },
  "F":  { color: "#ef4444", glow: "rgba(239,68,68,0.35)", label: "Jiddiy!", emoji: "🔥" },
};

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#6b7280",
};

const PRIORITY_LABEL: Record<string, string> = {
  urgent: "Juda muhim", high: "Yuqori", medium: "O'rta", low: "Past",
};

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function GradeRing({ grade, score, size, stroke }: { grade: string; score: number; size: number; stroke: number }) {
  const cfg = GRADE_CFG[grade] ?? GRADE_CFG["B"];
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score / 100, 1);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={cfg.color}
          strokeWidth={stroke} strokeLinecap="round"
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
          style={{ strokeDasharray: circ, filter: `drop-shadow(0 0 6px ${cfg.glow})` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, type: "spring" }}
          style={{ fontSize: size * 0.25, fontWeight: 900, color: cfg.color, lineHeight: 1 }}>
          {grade}
        </motion.span>
        <span style={{ fontSize: size * 0.13, fontWeight: 700, color: "rgba(240,240,248,0.9)", marginTop: 2 }}>{score}</span>
      </div>
    </div>
  );
}

function MiniRing({ value, max, color, icon, label }: { value: number; max: number; color: string; icon: React.ReactNode; label: string }) {
  const size = 48, stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
            initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ * (1 - pct) }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
            style={{ strokeDasharray: circ }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color }}>
          {icon}
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color }}>{value}<span style={{ fontSize: 9, color: "#6b7280" }}>/{max}</span></span>
      <span style={{ fontSize: 9, color: "#6b7280", textAlign: "center", whiteSpace: "nowrap" }}>{label}</span>
    </div>
  );
}

function XpFloater({ xp, onDone }: { xp: number; onDone: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 0, scale: 0.6 }} animate={{ opacity: [0,1,1,0], y: [-10,-50,-80,-110], scale: [0.6,1.2,1,0.8] }}
      transition={{ duration: 1.6, times: [0,0.15,0.7,1] }} onAnimationComplete={onDone}
      style={{ position: "fixed", top: "30%", right: "35%", zIndex: 9999, fontSize: 22, fontWeight: 900, color: "#a78bfa",
        textShadow: "0 0 20px rgba(167,139,250,0.8)", pointerEvents: "none" }}>
      ⚡ +{xp} XP
    </motion.div>
  );
}

function glass(extra = "") {
  return `rounded-2xl ${extra}`;
}

const GLASS_STYLE = {
  background: "rgba(255,255,255,0.025)",
  border: "1px solid rgba(255,255,255,0.07)",
} as const;

// ─── Main component ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [now, setNow] = useState(new Date());
  const [xpFloaters, setXpFloaters] = useState<{ id: number; xp: number }[]>([]);
  const [animatingTask, setAnimatingTask] = useState<{ id: number; type: "complete" | "fail" } | null>(null);
  const floaterRef = useRef(0);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const { data: todayTasksData, isLoading: tasksLoading } = useGetTodayTasks({ query: { queryKey: getGetTodayTasksQueryKey() } });
  const { data: overdueTasks } = useGetOverdueTasks({ query: { queryKey: getGetOverdueTasksQueryKey() } });
  const { data: todayHabits } = useGetTodayHabits({ query: { queryKey: getGetTodayHabitsQueryKey() } });
  const { data: achievements } = useGetAchievements({ query: { queryKey: getGetAchievementsQueryKey() } });
  const { data: profile } = useGetGamificationProfile({ query: { queryKey: getGetGamificationProfileQueryKey() } });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const updateTask = useUpdateTask();
  const failTask = useFailTask();
  const logHabit = useLogHabit();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getGetTodayTasksQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetOverdueTasksQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetGamificationProfileQueryKey() });
  };

  const handleComplete = (id: number, title: string) => {
    setAnimatingTask({ id, type: "complete" });
    updateTask.mutate({ id, data: { status: "completed" } }, {
      onSuccess: () => {
        playSound("success");
        notifyTaskComplete(title);
        const xp = 25 + Math.floor(Math.random() * 25);
        floaterRef.current += 1;
        setXpFloaters(prev => [...prev, { id: floaterRef.current, xp }]);
        toast.success(`✅ Bajarildi! +${xp} XP`, { duration: 2500 });
        setTimeout(() => setAnimatingTask(null), 400);
        invalidateAll();
      },
    });
  };

  const handleFail = (id: number) => {
    setAnimatingTask({ id, type: "fail" });
    failTask.mutate({ id, data: { reason: "Bajarilmadi" } }, {
      onSuccess: () => {
        playSound("error");
        toast.error("Muvaffaqiyatsiz. Diqqatni jamla!");
        setTimeout(() => setAnimatingTask(null), 400);
        invalidateAll();
      },
    });
  };

  const handleHabitLog = (id: number, name: string) => {
    logHabit.mutate({ id, data: { date: format(new Date(), "yyyy-MM-dd"), completed: true } }, {
      onSuccess: () => {
        playSound("habitDone");
        toast.success(`🔥 "${name}" bajarildi!`);
        queryClient.invalidateQueries({ queryKey: getGetTodayHabitsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
      },
    });
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const hours       = now.getHours();
  const greeting    = hours < 5 ? "Tungi sessiya 🌙" : hours < 12 ? "Xayrli tong ☀️" : hours < 17 ? "Xayrli kun ⚡" : "Xayrli kech 🌙";
  const quote       = QUOTES[now.getDay() % QUOTES.length];
  const grade       = stats?.today?.grade ?? profile?.grade ?? "B";
  const score       = stats?.scores?.disciplineScore ?? profile?.disciplineScore ?? 0;
  const gcfg        = GRADE_CFG[grade] ?? GRADE_CFG["B"];
  const taskTotal   = stats?.today?.total ?? 0;
  const taskDone    = stats?.today?.completed ?? 0;
  const taskPct     = stats?.today?.progressPercent ?? 0;
  const habitTotal  = todayHabits?.length ?? 0;
  const habitDone   = todayHabits?.filter(h => h.completedToday).length ?? 0;
  const streak      = stats?.streaks?.currentTaskStreak ?? 0;
  const bestStreak  = stats?.streaks?.bestTaskStreak ?? 0;
  const pomMin      = stats?.time?.todayPomodoroMinutes ?? 0;
  const xp          = profile?.xp ?? stats?.gamification?.xp ?? 0;
  const xpToNext    = profile?.xpToNextLevel ?? stats?.gamification?.xpToNextLevel ?? 1000;
  const level       = profile?.level ?? stats?.gamification?.level ?? 1;
  const xpPct       = Math.min((xp / (xp + xpToNext)) * 100, 100);
  const overdueCount = overdueTasks?.length ?? 0;
  const coins       = profile?.coins ?? stats?.gamification?.coins ?? 0;
  const weeklyScore = stats?.scores?.weeklyScore ?? 0;

  const unlockedAch = (achievements ?? []).filter(a => a.unlocked).slice(0, 8);
  const lockedAch   = (achievements ?? []).filter(a => !a.unlocked).slice(0, 4);
  const pendingTasks = todayTasksData?.tasks.filter(t => t.status === "pending" || t.status === "in_progress") ?? [];
  const doneTasks    = todayTasksData?.tasks.filter(t => t.status === "completed") ?? [];
  const failedTasks  = todayTasksData?.tasks.filter(t => t.status === "missed" || t.status === "repeatedly_missed") ?? [];

  // ── Reusable blocks ───────────────────────────────────────────────────────

  // Quick action buttons (horizontal scroll on mobile)
  const QuickActions = (
    <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide" style={{ scrollSnapType: "x mandatory" }}>
      {[
        { icon: <Plus className="w-3.5 h-3.5" />, label: "Vazifa", action: () => setLocation("/tasks"), color: "#8b5cf6" },
        { icon: <Timer className="w-3.5 h-3.5" />, label: "Fokus", action: () => setLocation("/pomodoro"), color: "#10b981" },
        { icon: <Target className="w-3.5 h-3.5" />, label: "Odat", action: () => setLocation("/habits"), color: "#f59e0b" },
        { icon: <Calendar className="w-3.5 h-3.5" />, label: "Taqvim", action: () => setLocation("/calendar"), color: "#06b6d4" },
        { icon: <BarChart3 className="w-3.5 h-3.5" />, label: "Statistika", action: () => setLocation("/statistics"), color: "#f43f5e" },
      ].map((a) => (
        <motion.button key={a.label} whileTap={{ scale: 0.92 }} onClick={a.action}
          className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-[11px] font-bold flex-shrink-0 active:opacity-80 touch-manipulation"
          style={{ background: `${a.color}12`, border: `1px solid ${a.color}28`, color: a.color, minWidth: 60, scrollSnapAlign: "start" }}>
          {a.icon}
          {a.label}
        </motion.button>
      ))}
    </div>
  );

  // Today's tasks section
  const TasksSection = (
    <div className={glass("p-4 sm:p-5")} style={GLASS_STYLE}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-bold flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-primary" />
            Bugungi Vazifalar
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">{taskDone}/{taskTotal} bajarildi</p>
        </div>
        <button onClick={() => setLocation("/tasks")} className="text-xs text-primary flex items-center gap-1 touch-manipulation py-1 px-2 -mr-2">
          Barchasi <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* progress bar */}
      <div className="h-1 rounded-full overflow-hidden mb-3" style={{ background: "rgba(255,255,255,0.05)" }}>
        <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${taskPct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ background: "linear-gradient(90deg,#7c3aed,#8b5cf6)", boxShadow: "0 0 8px rgba(139,92,246,0.5)" }} />
      </div>

      {tasksLoading ? (
        <div className="space-y-2">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
      ) : (todayTasksData?.tasks.length ?? 0) === 0 ? (
        <div className="text-center py-6">
          <p className="text-muted-foreground text-sm mb-3">Bugun uchun vazifalar yo'q</p>
          <Button size="sm" onClick={() => setLocation("/tasks")} className="bg-primary/20 border-primary/30 text-primary hover:bg-primary/30 touch-manipulation">
            <Plus className="w-3.5 h-3.5 mr-1" /> Vazifa qo'shish
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {pendingTasks.map(task => (
              <motion.div key={task.id} layout
                initial={{ opacity: 0, y: 8 }}
                animate={animatingTask?.id === task.id
                  ? { opacity: 0, x: animatingTask.type === "complete" ? 60 : -60, scale: 0.95 }
                  : { opacity: 1, y: 0, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                className="flex items-center gap-3 px-3 sm:px-4 py-3 rounded-xl group touch-manipulation"
                style={{
                  background: task.status === "in_progress" ? "rgba(6,182,212,0.07)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${task.status === "in_progress" ? "rgba(6,182,212,0.2)" : "rgba(255,255,255,0.06)"}`,
                }}>
                {/* priority dot */}
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: PRIORITY_COLOR[task.priority] ?? "#6b7280", boxShadow: `0 0 6px ${PRIORITY_COLOR[task.priority]}` }} />
                {/* info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {task.scheduledDate && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />{format(new Date(task.scheduledDate), "HH:mm")}
                      </span>
                    )}
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ background: `${PRIORITY_COLOR[task.priority] ?? "#6b7280"}18`, color: PRIORITY_COLOR[task.priority] ?? "#6b7280" }}>
                      {PRIORITY_LABEL[task.priority] ?? "Past"}
                    </span>
                  </div>
                </div>
                {/* actions — always visible on mobile (no hover needed) */}
                <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <motion.button whileTap={{ scale: 0.82 }} onClick={() => handleComplete(task.id, task.title)}
                    className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl touch-manipulation"
                    style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.82 }} onClick={() => handleFail(task.id)}
                    className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl touch-manipulation"
                    style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <XCircle className="w-4 h-4 text-red-400" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {doneTasks.length > 0 && (
            <div className="pt-2 border-t border-white/5 space-y-1.5">
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider px-1">✓ Bajarilganlar</p>
              {doneTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-xl"
                  style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.12)" }}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                  <span className="text-sm line-through text-muted-foreground truncate flex-1">{task.title}</span>
                  <span className="text-[10px] font-semibold text-emerald-400 flex-shrink-0">✓</span>
                </div>
              ))}
            </div>
          )}

          {failedTasks.length > 0 && (
            <div className="pt-1 space-y-1.5">
              {failedTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 px-3 sm:px-4 py-2.5 rounded-xl"
                  style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}>
                  <XCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                  <span className="text-sm line-through text-muted-foreground truncate flex-1">{task.title}</span>
                  <span className="text-[10px] font-semibold text-red-400 flex-shrink-0">✗</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Habits pills
  const HabitsBlock = (
    <div className={glass("p-4")} style={GLASS_STYLE}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider">🔄 Odatlar</p>
        <span className="text-[11px] font-bold text-emerald-400">{habitDone}/{habitTotal}</span>
      </div>
      {!todayHabits || todayHabits.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">Hali odat qo'shilmagan</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {todayHabits.map(hw => (
            <motion.button key={hw.habit.id} whileTap={{ scale: 0.88 }}
              onClick={() => !hw.completedToday && handleHabitLog(hw.habit.id, hw.habit.name)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-semibold touch-manipulation min-h-[36px]"
              style={{
                background: hw.completedToday ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${hw.completedToday ? "rgba(16,185,129,0.35)" : "rgba(255,255,255,0.1)"}`,
                color: hw.completedToday ? "#6ee7b7" : "#9ca3af",
                cursor: hw.completedToday ? "default" : "pointer",
              }}>
              <span>{hw.habit.icon}</span>
              <span className="max-w-[80px] truncate">{hw.habit.name}</span>
              {hw.completedToday && <CheckCircle2 className="w-2.5 h-2.5 flex-shrink-0" />}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );

  // AI Coach block
  const AiCoach = (
    <div className={glass("p-4 sm:p-5")}
      style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(6,182,212,0.06) 100%)", border: "1px solid rgba(139,92,246,0.22)" }}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}>
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold">AI Murabbiy</p>
          <p className="text-[10px] text-primary">Jonli tahlil</p>
        </div>
        <Sparkles className="w-3.5 h-3.5 ml-auto text-primary/60 flex-shrink-0" />
      </div>
      <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
        {stats ? (
          <>
            {(grade === "F" || grade === "D") ? (
              <div className="p-2.5 rounded-lg text-red-300" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                🚨 Intizomingiz jiddiy pasaymoqda. Hoziroq bitta vazifani bajaring!
              </div>
            ) : taskPct >= 100 ? (
              <div className="p-2.5 rounded-lg text-emerald-300" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                🎉 Ajoyib! Barcha vazifalar bajarildi. Rekordga yaqinlashmoqdasiz!
              </div>
            ) : (
              <div className="p-2.5 rounded-lg" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
                💜 Bugun <strong className="text-primary">{Math.round(taskPct)}%</strong> mahsuldorsiz.
                {(stats.today.pending ?? 0) > 0 && ` Yana ${stats.today.pending} ta vazifa qoldi.`}
              </div>
            )}
            {overdueCount > 0 && (
              <div className="p-2.5 rounded-lg" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
                ⚡ <strong className="text-amber-400">{overdueCount} ta kechiktirilgan</strong> — ularni birinchi bajaring.
              </div>
            )}
          </>
        ) : <Skeleton className="h-12 w-full rounded-lg" />}
      </div>
      <button onClick={() => setLocation("/ai")}
        className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold touch-manipulation"
        style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", color: "#a78bfa" }}>
        <BarChart3 className="w-3.5 h-3.5" /> Batafsil tahlil <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );

  // XP bar
  const XpBar = (
    <div className={glass("p-4")} style={GLASS_STYLE}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#7c3aed,#8b5cf6)" }}>
          {level}
        </div>
        <span className="text-xs font-bold text-primary">Daraja {level}</span>
        <span className="ml-auto text-[10px] text-muted-foreground">{xp.toLocaleString()} / {(xp+xpToNext).toLocaleString()} XP</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${xpPct}%` }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
          style={{ background: "linear-gradient(90deg,#7c3aed,#8b5cf6,#a78bfa)", boxShadow: "0 0 10px rgba(139,92,246,0.5)" }} />
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">{xpToNext.toLocaleString()} XP qoldi — Daraja {level+1}</p>
    </div>
  );

  // Achievements
  const AchievementsBlock = (
    <div className={glass("p-4")} style={GLASS_STYLE}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider">🏆 Yutuqlar</p>
        <button onClick={() => setLocation("/gamification")} className="text-[10px] text-primary touch-manipulation py-1 px-2 -mr-2">
          Hammasi →
        </button>
      </div>
      {achievements === undefined ? (
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">{Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-9 w-9 rounded-xl" />)}</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {unlockedAch.map(a => (
            <motion.div key={a.id} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.92 }} title={`${a.name}: ${a.description}`}
              className="h-9 w-9 flex items-center justify-center rounded-xl text-lg cursor-default"
              style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", boxShadow: "0 0 8px rgba(139,92,246,0.15)" }}>
              {a.icon}
            </motion.div>
          ))}
          {lockedAch.map(a => (
            <div key={a.id} title={`Qulflangan: ${a.name}`}
              className="h-9 w-9 flex items-center justify-center rounded-xl text-lg"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", filter: "grayscale(1) opacity(0.3)" }}>
              {a.icon}
            </div>
          ))}
          {unlockedAch.length === 0 && lockedAch.length === 0 && (
            <p className="text-xs text-muted-foreground">Hali yutuq ochilmagan</p>
          )}
        </div>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <AnimatePresence>
        {xpFloaters.map(f => <XpFloater key={f.id} xp={f.xp} onDone={() => setXpFloaters(prev => prev.filter(x => x.id !== f.id))} />)}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════
          MOBILE + TABLET  (hidden on lg+)
      ════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-3 lg:hidden">

        {/* Hero: grade ring + live stats */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
          className={glass("p-4")}
          style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.13) 0%, rgba(255,255,255,0.025) 100%)", border: `1px solid ${gcfg.color}28`, boxShadow: `0 0 30px ${gcfg.glow}` }}>
          <div className="flex items-center gap-4">
            {/* Ring */}
            {statsLoading
              ? <Skeleton className="h-[88px] w-[88px] rounded-full flex-shrink-0" />
              : <GradeRing grade={grade} score={score} size={88} stroke={8} />}

            {/* Stats right */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold tracking-widest uppercase text-primary/80 mb-0.5">{greeting}</p>
              <div className="text-3xl font-black tabular-nums leading-none"
                style={{ background: "linear-gradient(135deg,#f0f0f8,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {now.toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {format(now, "d-MMMM yyyy", { locale: uz })}
              </p>
              {/* mini stats row */}
              <div className="flex gap-3 mt-2">
                <div className="flex items-center gap-1 text-[11px]">
                  <Flame className="w-3 h-3 text-orange-400" />
                  <span className="font-bold text-orange-400">{streak}</span>
                  <span className="text-muted-foreground">kun</span>
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  <Zap className="w-3 h-3 text-primary" />
                  <span className="font-bold text-primary">Lv.{level}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  <span className="font-bold text-amber-400">{coins}🪙</span>
                </div>
              </div>
            </div>

            {/* Grade label */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <span className="text-xl">{gcfg.emoji}</span>
              <span className="text-[10px] font-bold text-center leading-tight" style={{ color: gcfg.color }}>{gcfg.label}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Bugungi progress</span>
              <span className="font-bold text-primary">{Math.round(taskPct)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${taskPct}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                style={{ background: "linear-gradient(90deg,#7c3aed,#8b5cf6)", boxShadow: "0 0 8px rgba(139,92,246,0.6)" }} />
            </div>
          </div>

          {/* Motivational quote */}
          <p className="mt-3 text-[11px] text-muted-foreground/70 italic border-l-2 border-primary/30 pl-2 leading-relaxed">
            "{quote}"
          </p>
        </motion.div>

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          {QuickActions}
        </motion.div>

        {/* Overdue alert */}
        <AnimatePresence>
          {overdueCount > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="rounded-xl p-3"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span className="text-sm font-bold text-red-400 flex-1">{overdueCount} ta kechiktirilgan vazifa</span>
                <button onClick={() => setLocation("/tasks")} className="text-xs text-red-400 font-bold touch-manipulation py-1 px-2 -mr-1 flex items-center gap-0.5">
                  Ko'r <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mini rings row */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}
          className={glass("p-3")} style={GLASS_STYLE}>
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-2">⚡ Progress xulasasi</p>
          <div className="grid grid-cols-4 gap-1">
            <MiniRing value={taskDone} max={taskTotal || 1} color="#8b5cf6" icon={<CheckCircle2 className="w-3 h-3" />} label="Vazifalar" />
            <MiniRing value={habitDone} max={habitTotal || 1} color="#10b981" icon={<Target className="w-3 h-3" />} label="Odatlar" />
            <MiniRing value={Math.floor(pomMin/25)} max={8} color="#f59e0b" icon={<Timer className="w-3 h-3" />} label="Pomodoro" />
            <MiniRing value={Math.min(streak,30)} max={30} color="#f97316" icon={<Flame className="w-3 h-3" />} label="Streak" />
          </div>
        </motion.div>

        {/* Tasks */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          {TasksSection}
        </motion.div>

        {/* Habits */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}>
          {HabitsBlock}
        </motion.div>

        {/* AI Coach */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {AiCoach}
        </motion.div>

        {/* XP bar + Achievements in 1-col on sm, 2-col on md */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}>
            {XpBar}
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.24 }}>
            {AchievementsBlock}
          </motion.div>
        </div>

        {/* Stats cards row */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.26 }}
          className="grid grid-cols-3 gap-2">
          {[
            { icon: <Timer className="w-4 h-4" />, label: "Samarali vaqt", value: `${Math.floor(pomMin/60)}s ${pomMin%60}d`, color: "#06b6d4", action: () => setLocation("/pomodoro") },
            { icon: <TrendingUp className="w-4 h-4" />, label: "Haftalik baho", value: `${weeklyScore}/100`, color: "#10b981", action: () => setLocation("/statistics") },
            { icon: <Trophy className="w-4 h-4" />, label: "Tangalar", value: `${coins.toLocaleString()}🪙`, color: "#f59e0b", action: () => setLocation("/gamification") },
          ].map(s => (
            <button key={s.label} onClick={s.action} className={glass("p-3 text-left touch-manipulation active:opacity-80")} style={GLASS_STYLE}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</div>
              <p className="text-sm font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
            </button>
          ))}
        </motion.div>

        {/* Focus CTA */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => { playSound("click"); setLocation("/pomodoro"); }}
          className="w-full rounded-2xl py-4 flex items-center justify-center gap-2 text-sm font-bold touch-manipulation"
          style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.25),rgba(16,185,129,0.15))", border: "1px solid rgba(139,92,246,0.35)", color: "#a78bfa", boxShadow: "0 0 20px rgba(139,92,246,0.15)" }}>
          <Timer className="w-4 h-4" /> Fokus seansini boshlash <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>

      {/* ════════════════════════════════════════════════
          DESKTOP  (hidden below lg)
      ════════════════════════════════════════════════ */}
      <div className="hidden lg:flex gap-5 max-w-[1440px] mx-auto">

        {/* Sidebar */}
        <motion.aside initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          className="w-[300px] xl:w-[320px] flex-shrink-0 flex flex-col gap-4">

          {/* Time + quote */}
          <div className={glass("p-5")}
            style={{ background: "linear-gradient(135deg,rgba(139,92,246,0.15) 0%,rgba(255,255,255,0.03) 100%)", border: "1px solid rgba(139,92,246,0.2)" }}>
            <p className="text-[11px] font-bold tracking-widest uppercase text-primary/80 mb-1">{greeting}</p>
            <div className="text-4xl font-black tracking-tight tabular-nums"
              style={{ background: "linear-gradient(135deg,#f0f0f8,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {now.toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{format(now, "EEEE, d-MMMM yyyy", { locale: uz })}</p>
            <blockquote className="mt-3 text-[11px] text-muted-foreground/80 italic border-l-2 border-primary/30 pl-2.5 leading-relaxed">
              "{quote}"
            </blockquote>
          </div>

          {/* Grade ring */}
          <div className={glass("p-5 flex flex-col items-center gap-3")}
            style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${gcfg.color}30`, boxShadow: `0 0 30px ${gcfg.glow}` }}>
            {statsLoading
              ? <Skeleton className="h-36 w-36 rounded-full" />
              : <GradeRing grade={grade} score={score} size={144} stroke={11} />}
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color: gcfg.color }}>{gcfg.emoji} {gcfg.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Intizom bahosi</p>
            </div>
            <div className="w-full">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Bugungi progress</span>
                <span className="font-bold text-emerald-400">{Math.round(taskPct)}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${taskPct}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                  style={{ background: "linear-gradient(90deg,#7c3aed,#8b5cf6)", boxShadow: "0 0 8px rgba(139,92,246,0.6)" }} />
              </div>
            </div>
          </div>

          {/* Mini rings */}
          <div className={glass("p-4")} style={GLASS_STYLE}>
            <p className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider mb-3">⚡ Progress xulasasi</p>
            <div className="grid grid-cols-4 gap-1">
              <MiniRing value={taskDone} max={taskTotal || 1} color="#8b5cf6" icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="Vazifalar" />
              <MiniRing value={habitDone} max={habitTotal || 1} color="#10b981" icon={<Target className="w-3.5 h-3.5" />} label="Odatlar" />
              <MiniRing value={Math.floor(pomMin/25)} max={8} color="#f59e0b" icon={<Timer className="w-3.5 h-3.5" />} label="Pomodoro" />
              <MiniRing value={Math.min(streak,30)} max={30} color="#f97316" icon={<Flame className="w-3.5 h-3.5" />} label="Streak" />
            </div>
          </div>

          {/* Streak */}
          <motion.div whileHover={{ scale: 1.02 }} className={glass("p-4 flex items-center gap-3")}
            style={{ background: "linear-gradient(135deg,rgba(249,115,22,0.12),rgba(239,68,68,0.06))", border: "1px solid rgba(249,115,22,0.28)" }}>
            <div className="text-4xl" style={{ filter: "drop-shadow(0 0 14px rgba(249,115,22,0.8))" }}>🔥</div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-black text-orange-400">{streak} <span className="text-sm font-normal text-muted-foreground">kun</span></div>
              <div className="text-[10px] text-muted-foreground">Eng yaxshi: {bestStreak} kun</div>
            </div>
            {streak >= bestStreak && streak > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(249,115,22,0.2)", color: "#fb923c" }}>
                Rekord! 🏆
              </span>
            )}
          </motion.div>

          {/* Habits */}
          {HabitsBlock}

          {/* Achievements */}
          {AchievementsBlock}

          {/* XP bar */}
          {XpBar}
        </motion.aside>

        {/* Main */}
        <motion.main initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          className="flex-1 min-w-0 flex flex-col gap-5">

          {/* Header + quick actions */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight">Command Center</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Har bir daqiqa qarordir — sarfla yoki yo'qot.</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {[
                { icon: <Plus className="w-3.5 h-3.5" />, label: "Vazifa", action: () => setLocation("/tasks"), color: "#8b5cf6" },
                { icon: <Timer className="w-3.5 h-3.5" />, label: "Fokus", action: () => setLocation("/pomodoro"), color: "#10b981" },
                { icon: <Target className="w-3.5 h-3.5" />, label: "Odat", action: () => setLocation("/habits"), color: "#f59e0b" },
                { icon: <Calendar className="w-3.5 h-3.5" />, label: "Taqvim", action: () => setLocation("/calendar"), color: "#06b6d4" },
              ].map(a => (
                <motion.button key={a.label} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={a.action}
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-bold touch-manipulation"
                  style={{ background: `${a.color}12`, border: `1px solid ${a.color}28`, color: a.color, minWidth: 52 }}>
                  {a.icon}{a.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Overdue alert */}
          <AnimatePresence>
            {overdueCount > 0 && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-xl p-4"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-red-400">{overdueCount} ta kechiktirilgan vazifa</span>
                    <span className="text-xs text-red-400/80 ml-2">— darhol bajaring!</span>
                  </div>
                  <button onClick={() => setLocation("/tasks")} className="flex items-center gap-1 text-xs font-bold text-red-400 flex-shrink-0">
                    Ko'rish <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                {overdueTasks && overdueTasks.length <= 3 && (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {overdueTasks.map(t => (
                      <div key={t.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(239,68,68,0.07)" }}>
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                        <span className="text-xs text-red-300 flex-1 truncate">{t.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tasks */}
          {TasksSection}

          {/* Bottom: AI coach + stats */}
          <div className="grid grid-cols-2 gap-4">
            {AiCoach}
            <div className="flex flex-col gap-3">
              {[
                { icon: <Timer className="w-4 h-4" />, label: "Samarali vaqt", value: `${Math.floor(pomMin/60)}s ${pomMin%60}d`, color: "#06b6d4", action: () => setLocation("/pomodoro") },
                { icon: <TrendingUp className="w-4 h-4" />, label: "Haftalik baho", value: `${weeklyScore}/100`, color: "#10b981", action: () => setLocation("/statistics") },
                { icon: <Trophy className="w-4 h-4" />, label: "Tangalar", value: `${coins.toLocaleString()} 🪙`, color: "#f59e0b", action: () => setLocation("/gamification") },
              ].map(s => (
                <motion.button key={s.label} whileHover={{ scale: 1.02 }} onClick={s.action}
                  className="rounded-xl px-4 py-3 flex items-center gap-3 text-left touch-manipulation" style={GLASS_STYLE}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    <p className="text-lg font-black">{s.value}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: s.color }} />
                </motion.button>
              ))}
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => { playSound("click"); setLocation("/pomodoro"); }}
                className="rounded-xl py-3 px-4 flex items-center justify-center gap-2 text-sm font-bold touch-manipulation"
                style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.25),rgba(16,185,129,0.15))", border: "1px solid rgba(139,92,246,0.35)", color: "#a78bfa", boxShadow: "0 0 20px rgba(139,92,246,0.15)" }}>
                <Timer className="w-4 h-4" /> Fokus seansini boshlash <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.main>
      </div>
    </>
  );
}
