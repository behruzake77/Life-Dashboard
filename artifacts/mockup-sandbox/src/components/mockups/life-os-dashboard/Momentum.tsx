import { useState, useEffect } from "react";
import {
  CheckCircle2, Circle, Flame, Zap, Trophy, Timer, Plus, Target,
  ArrowRight, TrendingUp, Clock, Star, ChevronRight, AlertTriangle,
  Calendar, Brain, Sparkles
} from "lucide-react";

// ─── Mock Data ───────────────────────────────────────────────────────────────
const TASKS = [
  { id: 1, title: "Loyiha hisobot tayyorlash", priority: "high", status: "pending", time: "09:00", xp: 50 },
  { id: 2, title: "React darslarini tugatish", priority: "medium", status: "completed", time: "11:00", xp: 30 },
  { id: 3, title: "Ertalabki yugurish", priority: "medium", status: "completed", time: "07:00", xp: 25 },
  { id: 4, title: "Mijoz bilan uchrashuv", priority: "high", status: "in_progress", time: "14:00", xp: 40 },
  { id: 5, title: "Kitob o'qish", priority: "low", status: "pending", time: "21:00", xp: 20 },
  { id: 6, title: "Haftalik plan tuzish", priority: "medium", status: "pending", time: "Bugun", xp: 35 },
];

const OVERDUE = [
  { title: "Hisobotni yuborish", overdueSince: "Kecha", priority: "high" },
  { title: "Trening dasturini yangilash", overdueSince: "2 kun", priority: "medium" },
];

const UPCOMING = [
  { title: "Ota-ona bilan uchrashuv", time: "Ertaga, 10:00" },
  { title: "Sprint rejalashtirish", time: "Seshanba, 09:00" },
];

const HABITS = [
  { name: "Suv", icon: "💧", done: true, streak: 12 },
  { name: "Meditatsiya", icon: "🧘", done: true, streak: 7 },
  { name: "Kitob", icon: "📚", done: false, streak: 4 },
  { name: "Sport", icon: "💪", done: true, streak: 21 },
  { name: "Uxlash", icon: "😴", done: false, streak: 3 },
  { name: "Vitamin", icon: "💊", done: true, streak: 9 },
];

const LEVEL_XP = { current: 1240, max: 2000, level: 7 };

const priorityColors: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  high: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", text: "#fca5a5", dot: "#ef4444" },
  medium: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", text: "#fcd34d", dot: "#f59e0b" },
  low: { bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.2)", text: "#9ca3af", dot: "#6b7280" },
  in_progress: { bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.25)", text: "#67e8f9", dot: "#06b6d4" },
};

// ─── Streak Fire Component ───────────────────────────────────────────────────
function StreakFire({ count }: { count: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ fontSize: 48, lineHeight: 1, filter: "drop-shadow(0 0 20px rgba(249,115,22,0.8))", animation: "flamePulse 2s ease-in-out infinite" }}>🔥</div>
      <div style={{ fontSize: 32, fontWeight: 900, background: "linear-gradient(135deg, #fb923c, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{count}</div>
      <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Kun Streak</div>
    </div>
  );
}

// ─── XP Bar ─────────────────────────────────────────────────────────────────
function XpBar({ current, max, level }: { current: number; max: number; level: number }) {
  const pct = (current / max) * 100;
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg, #7c3aed, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "white" }}>{level}</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>Daraja {level}</span>
        </div>
        <span style={{ fontSize: 11, color: "#6b7280" }}>{current.toLocaleString()} / {max.toLocaleString()} XP</span>
      </div>
      <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", position: "relative" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: "linear-gradient(90deg, #7c3aed, #8b5cf6, #a78bfa)",
          borderRadius: 4,
          boxShadow: "0 0 12px rgba(139,92,246,0.6)",
          animation: "shimmer 2s linear infinite",
          backgroundSize: "200% 100%",
        }} />
      </div>
      <div style={{ fontSize: 10, color: "#6b7280", marginTop: 4, textAlign: "right" }}>{max - current} XP qoldi</div>
    </div>
  );
}

// ─── Task Card ───────────────────────────────────────────────────────────────
function TaskRow({ task, onToggle }: { task: typeof TASKS[0]; onToggle: () => void }) {
  const isDone = task.status === "completed";
  const isActive = task.status === "in_progress";
  const p = isDone ? priorityColors.medium : isActive ? priorityColors.in_progress : priorityColors[task.priority];
  return (
    <div
      onClick={onToggle}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "13px 16px",
        background: isDone ? "rgba(16,185,129,0.05)" : isActive ? "rgba(6,182,212,0.06)" : p.bg,
        border: `1px solid ${isDone ? "rgba(16,185,129,0.15)" : p.border}`,
        borderRadius: 12, cursor: "pointer",
        transition: "all 0.2s",
        opacity: isDone ? 0.65 : 1,
        position: "relative",
      }}
    >
      {/* Timeline dot */}
      <div style={{
        width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
        background: isDone ? "#10b981" : isActive ? "#06b6d4" : p.dot,
        boxShadow: `0 0 8px ${isDone ? "#10b981" : isActive ? "#06b6d4" : p.dot}`,
      }} />

      {isDone
        ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "#10b981" }} />
        : <Circle className="w-5 h-5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.15)" }} />
      }

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 500,
          color: isDone ? "#6b7280" : "#f0f0f8",
          textDecoration: isDone ? "line-through" : "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{task.title}</div>
        <div style={{ fontSize: 11, color: "#6b7280", display: "flex", gap: 8, marginTop: 2 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock className="w-3 h-3" /> {task.time}</span>
          {isActive && <span style={{ color: "#06b6d4", fontWeight: 600 }}>● Davom etmoqda</span>}
        </div>
      </div>

      <div style={{
        fontSize: 11, fontWeight: 700, color: "#a78bfa",
        background: "rgba(139,92,246,0.12)", padding: "2px 8px", borderRadius: 6,
      }}>+{task.xp} XP</div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export function Momentum() {
  const [tasks, setTasks] = useState(TASKS);
  const [now, setNow] = useState(new Date());
  const [xpAnimations, setXpAnimations] = useState<{ id: number; xp: number }[]>([]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const completed = tasks.filter(t => t.status === "completed").length;
  const progress = (completed / tasks.length) * 100;
  const habitsDone = HABITS.filter(h => h.done).length;

  const toggleTask = (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    if (task.status !== "completed") {
      setXpAnimations(prev => [...prev, { id: Date.now(), xp: task.xp }]);
      setTimeout(() => setXpAnimations(prev => prev.filter(a => a.id !== Date.now())), 1500);
    }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === "completed" ? "pending" : "completed" } : t));
  };

  const hours = now.getHours();
  const greeting = hours < 12 ? "🌅 Xayrli tong" : hours < 17 ? "☀️ Xayrli kun" : "🌙 Xayrli kech";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#070710",
      fontFamily: "'Inter', sans-serif",
      color: "#f0f0f8",
      overflow: "hidden",
    }}>
      {/* XP pop-ups */}
      {xpAnimations.map(a => (
        <div key={a.id} style={{
          position: "fixed", top: "20%", right: "20%", zIndex: 999,
          fontSize: 22, fontWeight: 800, color: "#a78bfa",
          pointerEvents: "none", animation: "floatUp 1.5s ease forwards",
        }}>⚡ +{a.xp} XP</div>
      ))}

      {/* ─── HERO BANNER ─── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(6,182,212,0.08) 50%, rgba(16,185,129,0.08) 100%)",
        borderBottom: "1px solid rgba(139,92,246,0.2)",
        padding: "32px 32px 24px",
        position: "relative",
      }}>
        {/* Glow orbs */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 13, color: "#a78bfa", fontWeight: 600, marginBottom: 8, letterSpacing: "0.05em" }}>{greeting}, Abdulloh</div>
            <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: "-2px", lineHeight: 1, marginBottom: 6 }}>
              {now.toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              {now.toLocaleDateString("uz-Latn", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>

          {/* Score Circle */}
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 90, height: 90, borderRadius: "50%",
              background: "conic-gradient(#8b5cf6 0deg, #8b5cf6 281deg, rgba(255,255,255,0.06) 281deg)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 30px rgba(139,92,246,0.35)",
              position: "relative",
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%", background: "#070710",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: "#a78bfa" }}>78</span>
                <span style={{ fontSize: 9, color: "#6b7280" }}>BALL</span>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700, marginTop: 6 }}>Mahsuldorlik</div>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          {[
            { label: "Bajarildi", value: `${completed}/${tasks.length}`, color: "#10b981", icon: "✅" },
            { label: "Odatlar", value: `${habitsDone}/${HABITS.length}`, color: "#8b5cf6", icon: "🔄" },
            { label: "Streak", value: "21 kun", color: "#f97316", icon: "🔥" },
            { label: "Fokus", value: "2.5 soat", color: "#06b6d4", icon: "⏱" },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, padding: "10px 14px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12, textAlign: "center",
            }}>
              <div style={{ fontSize: 16, marginBottom: 3 }}>{s.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── CONTENT ─── */}
      <div style={{ padding: "20px 32px", display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>

        {/* LEFT: Tasks */}
        <div>
          {/* Overdue */}
          {OVERDUE.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <AlertTriangle className="w-4 h-4" style={{ color: "#ef4444" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>Kechiktirilgan ({OVERDUE.length})</span>
              </div>
              {OVERDUE.map((t, i) => (
                <div key={i} style={{
                  padding: "11px 14px", marginBottom: 8,
                  background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)",
                  borderRadius: 10, display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 8px #ef4444" }} />
                  <span style={{ fontSize: 13, flex: 1, color: "#fca5a5" }}>{t.title}</span>
                  <span style={{ fontSize: 11, color: "#ef4444" }}>{t.overdueSince} kechikdi</span>
                </div>
              ))}
            </div>
          )}

          {/* Today's tasks */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Zap className="w-4 h-4" style={{ color: "#8b5cf6" }} />
                <span style={{ fontSize: 14, fontWeight: 700 }}>Bugungi Vazifalar</span>
              </div>
              <button style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)",
                color: "#a78bfa", fontSize: 12, fontWeight: 600, borderRadius: 8, padding: "6px 12px", cursor: "pointer",
              }}>
                <Plus className="w-3.5 h-3.5" /> Qo'shish
              </button>
            </div>

            {/* Progress */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${progress}%`,
                  background: "linear-gradient(90deg, #7c3aed, #8b5cf6)",
                  borderRadius: 3, transition: "width 0.5s ease",
                  boxShadow: "0 0 10px rgba(139,92,246,0.5)",
                }} />
              </div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 5 }}>{Math.round(progress)}% tugallangan</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tasks.map(task => <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task.id)} />)}
            </div>
          </div>

          {/* Upcoming */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Calendar className="w-4 h-4" style={{ color: "#06b6d4" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#a0a0b8" }}>Kelayotgan</span>
            </div>
            {UPCOMING.map((t, i) => (
              <div key={i} style={{
                padding: "11px 14px", marginBottom: 8,
                background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)",
                borderRadius: 10, display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#06b6d4" }} />
                <span style={{ fontSize: 13, flex: 1 }}>{t.title}</span>
                <span style={{ fontSize: 11, color: "#06b6d4" }}>{t.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Streak, XP, Habits, AI */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Streak + XP card */}
          <div style={{
            background: "linear-gradient(135deg, rgba(249,115,22,0.1) 0%, rgba(139,92,246,0.1) 100%)",
            border: "1px solid rgba(249,115,22,0.25)",
            borderRadius: 16, padding: 20, textAlign: "center",
          }}>
            <StreakFire count={21} />
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "16px 0" }} />
            <XpBar current={LEVEL_XP.current} max={LEVEL_XP.max} level={LEVEL_XP.level} />
          </div>

          {/* Habits */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <span>🔄</span> Odatlar
              <span style={{ marginLeft: "auto", fontSize: 11, color: "#10b981", fontWeight: 600 }}>{HABITS.filter(h => h.done).length}/{HABITS.length}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {HABITS.map((h, i) => (
                <div key={i} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  padding: "10px 6px",
                  background: h.done ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${h.done ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 10,
                }}>
                  <span style={{ fontSize: 20 }}>{h.icon}</span>
                  <span style={{ fontSize: 9, color: h.done ? "#6ee7b7" : "#6b7280", textAlign: "center", fontWeight: 600 }}>{h.name}</span>
                  <span style={{ fontSize: 9, color: "#f97316" }}>🔥{h.streak}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Coach */}
          <div style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.06))",
            border: "1px solid rgba(139,92,246,0.2)", borderRadius: 16, padding: 16,
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
              <Sparkles className="w-4 h-4" style={{ color: "#a78bfa" }} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>AI Tavsiya</span>
            </div>
            <div style={{ fontSize: 12, color: "#c4c4d4", lineHeight: 1.7, marginBottom: 10 }}>
              Kechki 9 ga qadar yana <strong style={{ color: "#a78bfa" }}>3 vazifani</strong> bajarsangiz, haftalik rekorddagi A+ ga erishasiz!
            </div>
            <button style={{
              width: "100%", padding: "8px 0",
              background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)",
              borderRadius: 8, color: "#a78bfa", fontSize: 12, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <Brain className="w-3.5 h-3.5" /> Batafsil tahlil
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { icon: <Timer className="w-4 h-4" />, label: "Fokus", color: "#10b981" },
              { icon: <Plus className="w-4 h-4" />, label: "Vazifa", color: "#8b5cf6" },
              { icon: <Target className="w-4 h-4" />, label: "Odat", color: "#f59e0b" },
              { icon: <Trophy className="w-4 h-4" />, label: "Yutuqlar", color: "#06b6d4" },
            ].map((a, i) => (
              <button key={i} style={{
                padding: "12px 8px",
                background: `${a.color}10`, border: `1px solid ${a.color}25`,
                borderRadius: 12, cursor: "pointer", color: a.color,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                fontSize: 11, fontWeight: 600,
              }}>
                {a.icon} {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          25% { opacity: 1; transform: translateY(-20px) scale(1.1); }
          75% { opacity: 1; transform: translateY(-50px) scale(1); }
          100% { opacity: 0; transform: translateY(-80px) scale(0.8); }
        }
        @keyframes flamePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
