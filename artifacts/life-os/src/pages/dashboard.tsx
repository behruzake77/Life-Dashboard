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
  Sparkles, TrendingUp, Timer, Sun, Moon, Sunrise, BarChart3,
  ArrowRight, Circle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { playSound } from "@/lib/sound";
import { notifyTaskComplete } from "@/lib/notifications";

// ─── Constants ───────────────────────────────────────────────────────────────

const QUOTES = [
  "Intizom – muvaffaqiyatning yashirin kaliti.",
  "Bugun qilgan kichik harakat, ertangi katta muvaffaqiyat asosi.",
  "Har bir daqiqa qarordir — sarfla yoki yo'qot.",
  "Qiyinchilik – bu muvaffaqiyatga yetaklovchi yo'l.",
  "Sen kutayotgan o'zgarish, sening qo'lingda.",
  "Muvaffaqiyat kechasi emas, har kungi intizom bilan quriladi.",
  "Eng yaxshi vaqt – hozir. Ikkinchi eng yaxshi vaqt – hozir ham.",
];

const GRADE_CONFIG: Record<string, { color: string; glow: string; label: string; emoji: string }> = {
  "A+": { color: "#10b981", glow: "rgba(16,185,129,0.4)", label: "Mukammal", emoji: "🏆" },
  A:   { color: "#10b981", glow: "rgba(16,185,129,0.35)", label: "A'lo", emoji: "⭐" },
  B:   { color: "#8b5cf6", glow: "rgba(139,92,246,0.4)", label: "Yaxshi", emoji: "💪" },
  C:   { color: "#f59e0b", glow: "rgba(245,158,11,0.35)", label: "O'rtacha", emoji: "📈" },
  D:   { color: "#f97316", glow: "rgba(249,115,22,0.35)", label: "Kuchsiz", emoji: "⚡" },
  F:   { color: "#ef4444", glow: "rgba(239,68,68,0.35)", label: "Jiddiy!", emoji: "🔥" },
};

const PRIORITY_DOT: Record<string, string> = {
  urgent: "#ef4444",
  high:   "#f97316",
  medium: "#f59e0b",
  low:    "#6b7280",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function GradeRing({
  grade, score, size = 144, stroke = 11,
}: { grade: string; score: number; size?: number; stroke?: number }) {
  const cfg = GRADE_CONFIG[grade] ?? GRADE_CONFIG["B"];
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score / 100, 1);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={cfg.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
          style={{
            strokeDasharray: circ,
            filter: `drop-shadow(0 0 6px ${cfg.glow})`,
          }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: "spring" }}
          style={{ fontSize: 36, fontWeight: 900, color: cfg.color, lineHeight: 1 }}
        >
          {grade}
        </motion.span>
        <span style={{ fontSize: 16, fontWeight: 700, color: "rgba(240,240,248,0.9)", marginTop: 2 }}>{score}</span>
        <span style={{ fontSize: 10, color: "#6b7280" }}>/ 100</span>
      </div>
    </div>
  );
}

function MiniRing({
  value, max, color, icon, label,
}: { value: number; max: number; color: string; icon: React.ReactNode; label: string }) {
  const size = 52, stroke = 5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          <motion.circle
            cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth={stroke} strokeLinecap="round"
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - pct) }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
            style={{ strokeDasharray: circ }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          color,
        }}>
          {icon}
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color }}>
        {value}<span style={{ fontSize: 9, color: "#6b7280", fontWeight: 400 }}>/{max}</span>
      </span>
      <span style={{ fontSize: 9, color: "#6b7280", textAlign: "center" }}>{label}</span>
    </div>
  );
}

function XpFloater({ xp, onDone }: { xp: number; onDone: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.6 }}
      animate={{ opacity: [0, 1, 1, 0], y: [-10, -50, -80, -110], scale: [0.6, 1.2, 1, 0.8] }}
      transition={{ duration: 1.6, times: [0, 0.15, 0.7, 1] }}
      onAnimationComplete={onDone}
      style={{
        position: "fixed", top: "30%", right: "35%", zIndex: 9999,
        fontSize: 22, fontWeight: 900, color: "#a78bfa",
        textShadow: "0 0 20px rgba(167,139,250,0.8)",
        pointerEvents: "none",
      }}
    >
      ⚡ +{xp} XP
    </motion.div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [now, setNow] = useState(new Date());
  const [xpFloaters, setXpFloaters] = useState<{ id: number; xp: number }[]>([]);
  const [animatingTask, setAnimatingTask] = useState<{ id: number; type: "complete" | "fail" } | null>(null);
  const floaterIdRef = useRef(0);

  const quote = QUOTES[new Date().getDay() % QUOTES.length];

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ─── Data fetching ───────────────────────────────────────────────────────
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey() },
  });
  const { data: todayTasksData, isLoading: tasksLoading } = useGetTodayTasks({
    query: { queryKey: getGetTodayTasksQueryKey() },
  });
  const { data: overdueTasks } = useGetOverdueTasks({
    query: { queryKey: getGetOverdueTasksQueryKey() },
  });
  const { data: todayHabits } = useGetTodayHabits({
    query: { queryKey: getGetTodayHabitsQueryKey() },
  });
  const { data: achievements } = useGetAchievements({
    query: { queryKey: getGetAchievementsQueryKey() },
  });
  const { data: profile } = useGetGamificationProfile({
    query: { queryKey: getGetGamificationProfileQueryKey() },
  });

  // ─── Mutations ───────────────────────────────────────────────────────────
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
        floaterIdRef.current += 1;
        setXpFloaters(prev => [...prev, { id: floaterIdRef.current, xp }]);
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
        toast.error("Muvaffaqiyatsiz. Diqqatni jamla!", {
          style: { backgroundColor: "hsl(var(--destructive))", color: "white" },
        });
        setTimeout(() => setAnimatingTask(null), 400);
        invalidateAll();
      },
    });
  };

  const handleHabitLog = (id: number, name: string) => {
    const dateStr = format(new Date(), "yyyy-MM-dd");
    logHabit.mutate({ id, data: { date: dateStr, completed: true } }, {
      onSuccess: () => {
        playSound("habitDone");
        toast.success(`🔥 "${name}" bajarildi!`);
        queryClient.invalidateQueries({ queryKey: getGetTodayHabitsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
      },
    });
  };

  // ─── Derived values ───────────────────────────────────────────────────────
  const hours = now.getHours();
  const greeting =
    hours < 5  ? "Tungi sessiya 🌙" :
    hours < 12 ? "Xayrli tong ☀️" :
    hours < 17 ? "Xayrli kun ⚡" : "Xayrli kech 🌙";

  const grade = stats?.today?.grade ?? profile?.grade ?? "B";
  const score = stats?.scores?.disciplineScore ?? profile?.disciplineScore ?? 0;
  const gradeConfig = GRADE_CONFIG[grade] ?? GRADE_CONFIG["B"];

  const taskTotal     = stats?.today?.total ?? 0;
  const taskCompleted = stats?.today?.completed ?? 0;
  const taskPct       = stats?.today?.progressPercent ?? 0;

  const habitTotal     = todayHabits?.length ?? 0;
  const habitCompleted = todayHabits?.filter(h => h.completedToday).length ?? 0;

  const streak      = stats?.streaks?.currentTaskStreak ?? 0;
  const bestStreak  = stats?.streaks?.bestTaskStreak ?? 0;
  const pomodoroMin = stats?.time?.todayPomodoroMinutes ?? 0;

  const xp           = profile?.xp ?? stats?.gamification?.xp ?? 0;
  const xpToNext     = profile?.xpToNextLevel ?? stats?.gamification?.xpToNextLevel ?? 1000;
  const level        = profile?.level ?? stats?.gamification?.level ?? 1;
  const xpPct        = Math.min((xp / (xp + xpToNext)) * 100, 100);

  const unlockedAchievements = (achievements ?? []).filter(a => a.unlocked).slice(0, 8);
  const lockedAchievements   = (achievements ?? []).filter(a => !a.unlocked).slice(0, 4);

  const pendingTasks  = todayTasksData?.tasks.filter(t => t.status === "pending" || t.status === "in_progress") ?? [];
  const doneTasks     = todayTasksData?.tasks.filter(t => t.status === "completed") ?? [];
  const failedTasks   = todayTasksData?.tasks.filter(t => t.status === "missed" || t.status === "repeatedly_missed") ?? [];

  const overdueCount = overdueTasks?.length ?? 0;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-5 max-w-[1440px] mx-auto">

      {/* XP Floaters */}
      <AnimatePresence>
        {xpFloaters.map(f => (
          <XpFloater key={f.id} xp={f.xp} onDone={() =>
            setXpFloaters(prev => prev.filter(x => x.id !== f.id))
          } />
        ))}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════
          LEFT SIDEBAR
      ══════════════════════════════════════════════════════════════════════ */}
      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-[300px] flex-shrink-0 flex flex-col gap-4"
      >
        {/* Time + greeting */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(255,255,255,0.03) 100%)",
            border: "1px solid rgba(139,92,246,0.2)",
            backdropFilter: "blur(20px)",
          }}
        >
          <p className="text-[11px] font-bold tracking-widest uppercase text-primary/80 mb-1">{greeting}</p>
          <div className="text-4xl font-black tracking-tight tabular-nums" style={{
            background: "linear-gradient(135deg, #f0f0f8, #a78bfa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            {now.toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {format(now, "EEEE, d-MMMM yyyy", { locale: uz })}
          </p>
          <blockquote className="mt-3 text-[11px] text-muted-foreground/80 italic border-l-2 border-primary/30 pl-2.5 leading-relaxed">
            "{quote}"
          </blockquote>
        </div>

        {/* Grade Ring + score */}
        <div
          className="rounded-2xl p-5 flex flex-col items-center gap-3"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: `1px solid ${gradeConfig.color}30`,
            boxShadow: `0 0 30px ${gradeConfig.glow}`,
          }}
        >
          {statsLoading ? (
            <Skeleton className="h-36 w-36 rounded-full" />
          ) : (
            <GradeRing grade={grade} score={score} />
          )}
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: gradeConfig.color }}>
              {gradeConfig.emoji} {gradeConfig.label}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Intizom bahosi</p>
          </div>

          {/* Progress bar */}
          <div className="w-full">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Bugungi progress</span>
              <span style={{ color: "#10b981", fontWeight: 600 }}>{Math.round(taskPct)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${taskPct}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                style={{ background: "linear-gradient(90deg, #7c3aed, #8b5cf6)", boxShadow: "0 0 8px rgba(139,92,246,0.6)" }}
              />
            </div>
          </div>
        </div>

        {/* Mini Rings row */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider mb-3">⚡ Progress xulasasi</p>
          <div className="grid grid-cols-4 gap-1">
            <MiniRing value={taskCompleted} max={taskTotal || 1} color="#8b5cf6"
              icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="Vazifalar" />
            <MiniRing value={habitCompleted} max={habitTotal || 1} color="#10b981"
              icon={<Target className="w-3.5 h-3.5" />} label="Odatlar" />
            <MiniRing value={Math.floor(pomodoroMin / 25)} max={8} color="#f59e0b"
              icon={<Timer className="w-3.5 h-3.5" />} label="Pomodoro" />
            <MiniRing value={Math.min(streak, 30)} max={30} color="#f97316"
              icon={<Flame className="w-3.5 h-3.5" />} label="Streak" />
          </div>
        </div>

        {/* Streak card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="rounded-2xl p-4 flex items-center gap-3 cursor-default"
          style={{
            background: "linear-gradient(135deg, rgba(249,115,22,0.12), rgba(239,68,68,0.06))",
            border: "1px solid rgba(249,115,22,0.28)",
          }}
        >
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

        {/* Today's habits */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider">🔄 Odatlar</p>
            <span className="text-[11px] font-bold" style={{ color: "#10b981" }}>
              {habitCompleted}/{habitTotal}
            </span>
          </div>
          {!todayHabits || todayHabits.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">Hali odat qo'shilmagan</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {todayHabits.map((hw) => (
                <motion.button
                  key={hw.habit.id}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => !hw.completedToday && handleHabitLog(hw.habit.id, hw.habit.name)}
                  title={`${hw.habit.name} — ${hw.completedToday ? "✓ Bajarildi" : "Bosing"}`}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all"
                  style={{
                    background: hw.completedToday ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${hw.completedToday ? "rgba(16,185,129,0.35)" : "rgba(255,255,255,0.1)"}`,
                    color: hw.completedToday ? "#6ee7b7" : "#9ca3af",
                    cursor: hw.completedToday ? "default" : "pointer",
                  }}
                >
                  <span>{hw.habit.icon}</span>
                  {hw.completedToday && <CheckCircle2 className="w-2.5 h-2.5" />}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Achievements */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider">🏆 Yutuqlar</p>
            <button
              onClick={() => setLocation("/gamification")}
              className="text-[10px] text-primary hover:underline"
            >
              Hammasi →
            </button>
          </div>
          {achievements === undefined ? (
            <div className="grid grid-cols-4 gap-1.5">
              {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-9 w-9 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {unlockedAchievements.map((a) => (
                <motion.div
                  key={a.id}
                  whileHover={{ scale: 1.12 }}
                  title={`${a.name}: ${a.description}`}
                  className="h-9 w-9 flex items-center justify-center rounded-xl text-lg cursor-default"
                  style={{
                    background: "rgba(139,92,246,0.15)",
                    border: "1px solid rgba(139,92,246,0.3)",
                    boxShadow: "0 0 8px rgba(139,92,246,0.15)",
                  }}
                >
                  {a.icon}
                </motion.div>
              ))}
              {lockedAchievements.map((a) => (
                <div
                  key={a.id}
                  title={`Qulflangan: ${a.name}`}
                  className="h-9 w-9 flex items-center justify-center rounded-xl text-lg"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    filter: "grayscale(1) opacity(0.3)",
                  }}
                >
                  {a.icon}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* XP bar */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #8b5cf6)" }}
            >
              {level}
            </div>
            <span className="text-xs font-bold text-primary">Daraja {level}</span>
            <span className="ml-auto text-[10px] text-muted-foreground">{xp.toLocaleString()} / {(xp + xpToNext).toLocaleString()} XP</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
              style={{
                background: "linear-gradient(90deg, #7c3aed, #8b5cf6, #a78bfa)",
                boxShadow: "0 0 10px rgba(139,92,246,0.5)",
              }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{xpToNext.toLocaleString()} XP qoldi — Daraja {level + 1}</p>
        </div>
      </motion.aside>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════════════════════ */}
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex-1 min-w-0 flex flex-col gap-5"
      >
        {/* Top bar */}
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
            ].map((a) => (
              <motion.button
                key={a.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={a.action}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-bold transition-all"
                style={{
                  background: `${a.color}12`,
                  border: `1px solid ${a.color}28`,
                  color: a.color,
                  minWidth: 52,
                }}
              >
                {a.icon}
                {a.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Overdue alert */}
        <AnimatePresence>
          {overdueCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-xl p-4"
              style={{
                background: "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.04))",
                border: "1px solid rgba(239,68,68,0.3)",
              }}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "#ef4444" }} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold" style={{ color: "#ef4444" }}>
                    {overdueCount} ta kechiktirilgan vazifa
                  </span>
                  <span className="text-xs text-red-400/80 ml-2">
                    — darhol bajaring!
                  </span>
                </div>
                <button
                  onClick={() => setLocation("/tasks")}
                  className="flex items-center gap-1 text-xs font-bold flex-shrink-0"
                  style={{ color: "#ef4444" }}
                >
                  Ko'rish <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {overdueTasks && overdueTasks.length <= 3 && (
                <div className="mt-2 flex flex-col gap-1.5">
                  {overdueTasks.map(t => (
                    <div key={t.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(239,68,68,0.07)" }}>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#ef4444" }} />
                      <span className="text-xs text-red-300 flex-1 truncate">{t.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Today's Tasks */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Bugungi Vazifalar
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {taskCompleted}/{taskTotal} bajarildi
              </p>
            </div>
            <button
              onClick={() => setLocation("/tasks")}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Barchasi <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 rounded-full overflow-hidden mb-4" style={{ background: "rgba(255,255,255,0.05)" }}>
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${taskPct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ background: "linear-gradient(90deg, #7c3aed, #8b5cf6)", boxShadow: "0 0 8px rgba(139,92,246,0.5)" }}
            />
          </div>

          {tasksLoading ? (
            <div className="space-y-2">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
            </div>
          ) : (todayTasksData?.tasks.length ?? 0) === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm mb-3">Bugun uchun vazifalar yo'q</p>
              <Button size="sm" onClick={() => setLocation("/tasks")} className="bg-primary/20 border-primary/30 text-primary hover:bg-primary/30">
                <Plus className="w-3.5 h-3.5 mr-1" /> Vazifa qo'shish
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Pending / In-progress tasks first */}
              <AnimatePresence mode="popLayout">
                {pendingTasks.map(task => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={
                      animatingTask?.id === task.id
                        ? {
                          opacity: 0,
                          x: animatingTask.type === "complete" ? 60 : -60,
                          scale: 0.95,
                        }
                        : { opacity: 1, y: 0, x: 0, scale: 1 }
                    }
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-default group transition-colors"
                    style={{
                      background: task.status === "in_progress"
                        ? "rgba(6,182,212,0.07)"
                        : "rgba(255,255,255,0.02)",
                      border: task.status === "in_progress"
                        ? "1px solid rgba(6,182,212,0.2)"
                        : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {/* Priority dot */}
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background: PRIORITY_DOT[task.priority] ?? "#6b7280",
                        boxShadow: `0 0 6px ${PRIORITY_DOT[task.priority] ?? "#6b7280"}`,
                      }}
                    />

                    {/* Task info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {task.scheduledDate && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {format(new Date(task.scheduledDate), "HH:mm")}
                          </span>
                        )}
                        {task.status === "in_progress" && (
                          <span className="text-[10px] font-semibold" style={{ color: "#06b6d4" }}>● Davom etmoqda</span>
                        )}
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{
                            background: `${PRIORITY_DOT[task.priority] ?? "#6b7280"}18`,
                            color: PRIORITY_DOT[task.priority] ?? "#6b7280",
                            fontWeight: 600,
                          }}
                        >
                          {task.priority === "urgent" ? "Juda muhim" :
                           task.priority === "high" ? "Yuqori" :
                           task.priority === "medium" ? "O'rta" : "Past"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => handleComplete(task.id, task.title)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-emerald-500/15"
                        title="Bajarildi"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => handleFail(task.id)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-red-500/15"
                        title="Muvaffaqiyatsiz"
                      >
                        <XCircle className="w-4 h-4 text-red-400" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Completed tasks */}
              {doneTasks.length > 0 && (
                <div className="pt-1 border-t border-white/5 mt-1 space-y-1.5">
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider px-1 py-0.5">✓ Bajarilganlar</p>
                  {doneTasks.map(task => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                      style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.12)" }}
                    >
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#10b981" }} />
                      <span className="text-sm line-through text-muted-foreground truncate flex-1">{task.title}</span>
                      <span className="text-[10px] font-semibold text-emerald-400 flex-shrink-0">✓ Bajarildi</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Failed tasks */}
              {failedTasks.length > 0 && (
                <div className="pt-1 border-t border-white/5 mt-1 space-y-1.5">
                  {failedTasks.map(task => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                      style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)" }}
                    >
                      <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#ef4444" }} />
                      <span className="text-sm line-through text-muted-foreground truncate flex-1">{task.title}</span>
                      <span className="text-[10px] font-semibold text-red-400 flex-shrink-0">Bajarilmadi</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom row: AI Coach + Stats */}
        <div className="grid grid-cols-2 gap-4">

          {/* AI Coach */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="rounded-2xl p-5"
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(6,182,212,0.06) 100%)",
              border: "1px solid rgba(139,92,246,0.22)",
            }}
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}
              >
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold">AI Murabbiy</p>
                <p className="text-[10px] text-primary">Jonli tahlil</p>
              </div>
              <Sparkles className="w-3.5 h-3.5 ml-auto text-primary/60" />
            </div>

            <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
              {stats ? (
                <>
                  {stats.today.grade === "F" || stats.today.grade === "D" ? (
                    <div className="p-2.5 rounded-lg text-red-300" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      🚨 Intizomingiz jiddiy pasaymoqda. Darhol hozirning o'zida bitta vazifani bajaring!
                    </div>
                  ) : stats.today.progressPercent >= 100 ? (
                    <div className="p-2.5 rounded-lg text-emerald-300" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                      🎉 Ajoyib! Bugungi barcha vazifalar bajarildi. Rekordga yaqinlashmoqdasiz!
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
                      💜 Siz bugun <strong className="text-primary">{Math.round(taskPct)}%</strong> mahsuldorsiz.
                      {stats.today.pending > 0 && ` Yana ${stats.today.pending} ta vazifa qoldi.`} A darajaga erishish uchun harakatni oshiring!
                    </div>
                  )}
                  {overdueCount > 0 && (
                    <div className="p-2.5 rounded-lg" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
                      ⚡ <strong className="text-amber-400">{overdueCount} ta kechiktirilgan</strong> vazifa bor — ularni birinchi bajaring.
                    </div>
                  )}
                </>
              ) : (
                <Skeleton className="h-14 w-full rounded-lg" />
              )}
            </div>

            <button
              onClick={() => setLocation("/ai")}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors"
              style={{
                background: "rgba(139,92,246,0.12)",
                border: "1px solid rgba(139,92,246,0.25)",
                color: "#a78bfa",
              }}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Batafsil tahlil
              <ArrowRight className="w-3 h-3" />
            </button>
          </motion.div>

          {/* Stats summary */}
          <div className="flex flex-col gap-3">
            {/* Focus time */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(6,182,212,0.15)" }}>
                <Timer className="w-4 h-4" style={{ color: "#06b6d4" }} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Samarali vaqt</p>
                <p className="text-lg font-black tabular-nums">
                  {Math.floor(pomodoroMin / 60)}s <span className="text-sm font-normal text-muted-foreground">{pomodoroMin % 60}d</span>
                </p>
              </div>
              <button
                onClick={() => setLocation("/pomodoro")}
                className="ml-auto p-1.5 rounded-lg transition-colors hover:bg-cyan-500/15"
              >
                <Play className="w-3.5 h-3.5" style={{ color: "#06b6d4" }} />
              </button>
            </motion.div>

            {/* Weekly score */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(16,185,129,0.15)" }}>
                <TrendingUp className="w-4 h-4" style={{ color: "#10b981" }} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Haftalik baho</p>
                <p className="text-lg font-black">
                  {stats?.scores?.weeklyScore ?? "—"}
                  <span className="text-sm font-normal text-muted-foreground">/100</span>
                </p>
              </div>
              <button
                onClick={() => setLocation("/statistics")}
                className="ml-auto p-1.5 rounded-lg transition-colors hover:bg-emerald-500/15"
              >
                <ChevronRight className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
              </button>
            </motion.div>

            {/* Coins / Gamification */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(245,158,11,0.15)" }}>
                <Trophy className="w-4 h-4" style={{ color: "#f59e0b" }} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Tangalar</p>
                <p className="text-lg font-black">
                  {(profile?.coins ?? stats?.gamification?.coins ?? 0).toLocaleString()}
                  <span className="text-xs ml-1">🪙</span>
                </p>
              </div>
              <button
                onClick={() => setLocation("/gamification")}
                className="ml-auto p-1.5 rounded-lg transition-colors hover:bg-amber-500/15"
              >
                <ChevronRight className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
              </button>
            </motion.div>

            {/* Start focus CTA */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { playSound("click"); setLocation("/pomodoro"); }}
              className="rounded-xl py-3 px-4 flex items-center justify-center gap-2 text-sm font-bold transition-all"
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(16,185,129,0.15))",
                border: "1px solid rgba(139,92,246,0.35)",
                color: "#a78bfa",
                boxShadow: "0 0 20px rgba(139,92,246,0.15)",
              }}
            >
              <Timer className="w-4 h-4" />
              Fokus seansini boshlash
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
