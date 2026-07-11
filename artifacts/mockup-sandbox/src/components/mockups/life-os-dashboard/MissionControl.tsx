import { useState, useEffect } from "react";
import {
  CheckCircle2, Circle, Zap, Target, Flame, Trophy, Brain, Calendar,
  Plus, Timer, Star, TrendingUp, AlertCircle, ChevronRight, Clock,
  BookOpen, Dumbbell, Coffee, Laptop, Moon, Sun
} from "lucide-react";

// ─── Mock Data ─────────────────────────────────────────────────────────────
const TASKS = [
  { id: 1, title: "Loyiha hisobot tayyorlash", priority: "high", status: "pending", category: "work", time: "09:00" },
  { id: 2, title: "React darslarini tugatish", priority: "medium", status: "completed", category: "learn", time: "11:00" },
  { id: 3, title: "Ertalabki yugurish", priority: "medium", status: "completed", category: "health", time: "07:00" },
  { id: 4, title: "Mijoz bilan uchrashuv", priority: "high", status: "pending", category: "work", time: "14:00" },
  { id: 5, title: "Kitob o'qish (30 daqiqa)", priority: "low", status: "pending", category: "learn", time: "21:00" },
];

const HABITS = [
  { name: "Suv ichish", icon: "💧", done: true, streak: 12 },
  { name: "Meditatsiya", icon: "🧘", done: true, streak: 7 },
  { name: "Kitob", icon: "📚", done: false, streak: 4 },
  { name: "Sport", icon: "💪", done: true, streak: 21 },
  { name: "Uxlash", icon: "😴", done: false, streak: 3 },
];

const HEATMAP = Array.from({ length: 7 }, () =>
  Array.from({ length: 7 }, () => Math.floor(Math.random() * 5))
);

const ACHIEVEMENTS = [
  { icon: "🔥", title: "21 Kunlik Streak", color: "#f97316" },
  { icon: "⚡", title: "100 Vazifa", color: "#8b5cf6" },
  { icon: "🏆", title: "A Darajasi", color: "#f59e0b" },
  { icon: "🧠", title: "Focus Master", color: "#06b6d4" },
];

const QUOTES = [
  "Bugun qilgan kichik harakat, ertangi katta muvaffaqiyat asosi.",
  "Intizom – muvaffaqiyatning yashirin kaliti.",
  "Har bir daqiqa hisob beradi. Sarfla yoki yo'qot.",
];

const categoryIcons: Record<string, React.ReactNode> = {
  work: <Laptop className="w-3.5 h-3.5" />,
  learn: <BookOpen className="w-3.5 h-3.5" />,
  health: <Dumbbell className="w-3.5 h-3.5" />,
};

const priorityColor: Record<string, string> = {
  high: "#ef4444", medium: "#f59e0b", low: "#6b7280",
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function ProgressRing({ value, max, size = 80, stroke = 7, color = "#8b5cf6", label, sublabel }: {
  value: number; max: number; size?: number; stroke?: number; color?: string; label: string; sublabel: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f8", lineHeight: 1 }}>{value}</span>
          <span style={{ fontSize: 9, color: "#6b7280", marginTop: 2 }}>/ {max}</span>
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#a0a0b8", textAlign: "center" }}>{label}</span>
      <span style={{ fontSize: 10, color: "#6b7280" }}>{sublabel}</span>
    </div>
  );
}

function HeatCell({ val }: { val: number }) {
  const colors = ["rgba(255,255,255,0.04)", "rgba(139,92,246,0.2)", "rgba(139,92,246,0.4)", "rgba(139,92,246,0.65)", "rgba(139,92,246,0.9)"];
  return <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: colors[val] }} />;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function MissionControl() {
  const [time, setTime] = useState(new Date());
  const [tasks, setTasks] = useState(TASKS);
  const [quote] = useState(QUOTES[0]);
  const [xpPop, setXpPop] = useState<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const completed = tasks.filter(t => t.status === "completed").length;
  const total = tasks.length;
  const habitsDone = HABITS.filter(h => h.done).length;

  const hours = time.getHours();
  const greeting = hours < 12 ? "Xayrli tong" : hours < 17 ? "Xayrli kun" : "Xayrli kech";
  const greetIcon = hours < 12 ? <Sun className="w-5 h-5 text-amber-400" /> : hours < 17 ? <Zap className="w-5 h-5 text-violet-400" /> : <Moon className="w-5 h-5 text-blue-400" />;

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const next = t.status === "completed" ? "pending" : "completed";
      if (next === "completed") {
        setXpPop(20);
        setTimeout(() => setXpPop(null), 1500);
      }
      return { ...t, status: next };
    }));
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #080812 0%, #0d0d1a 50%, #080812 100%)",
      fontFamily: "'Inter', sans-serif",
      color: "#f0f0f8",
      padding: "24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient glows */}
      <div style={{ position: "absolute", top: -200, left: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -200, right: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* XP Pop Animation */}
      {xpPop && (
        <div style={{
          position: "fixed", top: "30%", right: "30%", zIndex: 100,
          fontSize: 24, fontWeight: 800, color: "#a78bfa",
          animation: "xpPop 1.5s ease forwards",
          pointerEvents: "none",
        }}>
          +{xpPop} XP ✨
        </div>
      )}

      {/* ─── HERO ─── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(255,255,255,0.03) 100%)",
        border: "1px solid rgba(139,92,246,0.25)",
        borderRadius: 20,
        padding: "28px 32px",
        marginBottom: 24,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backdropFilter: "blur(20px)",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            {greetIcon}
            <span style={{ fontSize: 13, color: "#a78bfa", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{greeting}</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 4, background: "linear-gradient(135deg, #f0f0f8 0%, #a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Abdulloh 👋
          </h1>
          <p style={{ fontSize: 13, color: "#6b7280", maxWidth: 380, lineHeight: 1.5 }}>"{quote}"</p>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-2px", background: "linear-gradient(135deg, #f0f0f8, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontVariantNumeric: "tabular-nums" }}>
            {time.toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
            {time.toLocaleDateString("uz-Latn", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          {/* Productivity score */}
          <div style={{
            marginTop: 12, display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: 100, padding: "5px 14px",
          }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#10b981" }}>Mahsuldorlik: 78%</span>
          </div>
        </div>
      </div>

      {/* ─── MAIN GRID ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px 240px", gap: 20, marginBottom: 20 }}>

        {/* COL 1 — Today's Tasks */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>📋 Bugungi Vazifalar</h2>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{completed}/{total} bajarildi</div>
            </div>
            <button style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)",
              borderRadius: 8, padding: "6px 12px", color: "#a78bfa", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
              <Plus className="w-3.5 h-3.5" /> Qo'shish
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginBottom: 16, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(completed / total) * 100}%`, background: "linear-gradient(90deg, #7c3aed, #8b5cf6)", borderRadius: 2, transition: "width 0.5s ease" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tasks.map(task => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px",
                  background: task.status === "completed" ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${task.status === "completed" ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 12, cursor: "pointer",
                  transition: "all 0.2s ease",
                  opacity: task.status === "completed" ? 0.7 : 1,
                }}
              >
                {task.status === "completed"
                  ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "#10b981" }} />
                  : <Circle className="w-5 h-5 flex-shrink-0" style={{ color: "rgba(255,255,255,0.2)" }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 500,
                    textDecoration: task.status === "completed" ? "line-through" : "none",
                    color: task.status === "completed" ? "#6b7280" : "#f0f0f8",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>{task.title}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock className="w-3 h-3" /> {task.time}
                    <span style={{ color: categoryIcons[task.category] ? "#6b7280" : "#6b7280" }}>·</span>
                    {categoryIcons[task.category]}
                  </div>
                </div>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                  background: priorityColor[task.priority],
                  boxShadow: `0 0 6px ${priorityColor[task.priority]}`,
                }} />
              </div>
            ))}
          </div>

          {/* Overdue alert */}
          <div style={{
            marginTop: 14, padding: "10px 14px",
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 10, display: "flex", alignItems: "center", gap: 8,
          }}>
            <AlertCircle className="w-4 h-4" style={{ color: "#ef4444", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#fca5a5" }}>2 ta kechiktirilgan vazifa mavjud</span>
            <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: "#ef4444" }} />
          </div>
        </div>

        {/* COL 2 — Progress Rings + Habits */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Rings */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: "#a0a0b8" }}>⚡ Bugungi Progress</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, justifyItems: "center" }}>
              <ProgressRing value={completed} max={total} color="#8b5cf6" label="Vazifalar" sublabel="bajarildi" />
              <ProgressRing value={habitsDone} max={HABITS.length} color="#10b981" label="Odatlar" sublabel="yashil" />
              <ProgressRing value={1240} max={2000} color="#f59e0b" label="XP Ball" sublabel="bugun" />
              <ProgressRing value={3} max={5} color="#06b6d4" label="Maqsadlar" sublabel="davom etmoqda" />
            </div>
          </div>

          {/* Habits strip */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 18 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: "#a0a0b8" }}>🔄 Odatlar</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {HABITS.map((h, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                    background: h.done ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${h.done ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.08)"}`,
                    fontSize: 16,
                  }}>{h.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: h.done ? "#f0f0f8" : "#6b7280" }}>{h.name}</div>
                    <div style={{ fontSize: 10, color: "#f97316" }}>🔥 {h.streak} kun</div>
                  </div>
                  {h.done && <CheckCircle2 className="w-4 h-4" style={{ color: "#10b981" }} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COL 3 — AI Coach + Quick Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* AI Coach */}
          <div style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(6,182,212,0.06) 100%)",
            border: "1px solid rgba(139,92,246,0.25)",
            borderRadius: 16, padding: 18, flex: 1,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>AI Murabbiy</div>
                <div style={{ fontSize: 10, color: "#a78bfa" }}>Yangilandi • Hozirgina</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#c4c4d4", lineHeight: 1.7, marginBottom: 12 }}>
              Siz bugun <strong style={{ color: "#a78bfa" }}>78%</strong> mahsuldorsiz. Yana 2 vazifani bajarsangiz <strong style={{ color: "#f59e0b" }}>A darajaga</strong> chiqasiz!
            </div>
            <div style={{ padding: "10px 12px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, fontSize: 11, color: "#6ee7b7" }}>
              💡 Keyingi: "Loyiha hisoboti" — 20 daqiqa vaqtingiz bor
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 18 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#a0a0b8" }}>⚡ Tez Harakatlar</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: <Plus className="w-4 h-4" />, label: "Vazifa qo'shish", color: "#8b5cf6" },
                { icon: <Timer className="w-4 h-4" />, label: "Fokus boshlash", color: "#10b981" },
                { icon: <Target className="w-4 h-4" />, label: "Odat qo'shish", color: "#f59e0b" },
                { icon: <Calendar className="w-4 h-4" />, label: "Taqvimni ko'rish", color: "#06b6d4" },
              ].map((a, i) => (
                <button key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: `${a.color}10`, border: `1px solid ${a.color}30`,
                  borderRadius: 10, padding: "10px 12px", cursor: "pointer",
                  color: a.color, fontSize: 12, fontWeight: 600, textAlign: "left", width: "100%",
                }}>
                  {a.icon} {a.label}
                  <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM ROW ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 20 }}>

        {/* Heatmap */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700 }}>📊 Haftalik Faollik</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <TrendingUp className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
              <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>+12% o'sish</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {HEATMAP.map((week, wi) => (
              <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {week.map((val, di) => <HeatCell key={di} val={val} />)}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "#6b7280" }}>Kam</span>
            {[0, 1, 2, 3, 4].map(v => <HeatCell key={v} val={v} />)}
            <span style={{ fontSize: 10, color: "#6b7280" }}>Ko'p</span>
          </div>
        </div>

        {/* Achievements */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>🏆 Yutuqlar</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ACHIEVEMENTS.map((a, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px",
                background: `${a.color}10`, border: `1px solid ${a.color}25`,
                borderRadius: 10,
              }}>
                <span style={{ fontSize: 20 }}>{a.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#d0d0e8" }}>{a.title}</span>
                <Star className="w-3 h-3 ml-auto" style={{ color: a.color }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes xpPop {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          20% { opacity: 1; transform: translateY(-20px) scale(1.2); }
          80% { opacity: 1; transform: translateY(-40px) scale(1); }
          100% { opacity: 0; transform: translateY(-60px) scale(0.8); }
        }
      `}</style>
    </div>
  );
}
