import { useState, useEffect } from "react";
import {
  CheckCircle2, Circle, Zap, Timer, Plus, Target, Calendar,
  Brain, Trophy, Flame, Star, ArrowRight, AlertTriangle,
  TrendingUp, ChevronRight, Clock, Sparkles, BarChart3
} from "lucide-react";

// ─── Mock Data ───────────────────────────────────────────────────────────────
const TODAY_TASKS = [
  { id: 1, title: "Loyiha hisobot tayyorlash", priority: "high", status: "pending", xp: 50, time: "09:00" },
  { id: 2, title: "React darslarini tugatish", priority: "medium", status: "completed", xp: 30, time: "11:00" },
  { id: 3, title: "Ertalabki yugurish", priority: "medium", status: "completed", xp: 25, time: "07:00" },
  { id: 4, title: "Mijoz bilan uchrashuv", priority: "high", status: "pending", xp: 40, time: "14:00" },
];

const OVERDUE_TASKS = [
  { id: 10, title: "Hisobotni yuborish", daysLate: 1 },
  { id: 11, title: "Trening dasturi", daysLate: 2 },
];

const UPCOMING_TASKS = [
  { id: 20, title: "Ota-ona bilan uchrashuv", date: "Ertaga" },
  { id: 21, title: "Sprint rejalashtirish", date: "Seshanba" },
  { id: 22, title: "Oylik hisob", date: "Juma" },
];

const HABITS = [
  { name: "Suv", icon: "💧", done: true, streak: 12 },
  { name: "Meditatsiya", icon: "🧘", done: true, streak: 7 },
  { name: "Kitob", icon: "📚", done: false, streak: 4 },
  { name: "Sport", icon: "💪", done: true, streak: 21 },
  { name: "Uyqu", icon: "😴", done: false, streak: 3 },
  { name: "Vitamin", icon: "💊", done: true, streak: 9 },
  { name: "Suv 2L", icon: "🫗", done: true, streak: 5 },
];

const ACHIEVEMENTS = [
  { icon: "🔥", label: "21-kun streak", unlocked: true },
  { icon: "⚡", label: "100 vazifa", unlocked: true },
  { icon: "🏆", label: "A daraja", unlocked: true },
  { icon: "🧠", label: "Focus Pro", unlocked: false },
  { icon: "💎", label: "Pishiq Iroda", unlocked: false },
];

// ─── Radial Score ─────────────────────────────────────────────────────────────
function RadialScore({ score, grade }: { score: number; grade: string }) {
  const size = 160;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;

  const gradeColor = grade === "A" ? "#10b981" : grade === "B" ? "#8b5cf6" : grade === "C" ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={gradeColor} strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${gradeColor})` }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 40, fontWeight: 900, color: gradeColor, lineHeight: 1 }}>{grade}</span>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#f0f0f8", marginTop: 2 }}>{score}</span>
        <span style={{ fontSize: 10, color: "#6b7280", marginTop: 1 }}>ball</span>
      </div>
    </div>
  );
}

// ─── Mini Ring ────────────────────────────────────────────────────────────────
function MiniRing({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const size = 52, stroke = 5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={circ * (1 - value / max)} strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color }}>{value}</span>
        </div>
      </div>
      <span style={{ fontSize: 9, color: "#6b7280", fontWeight: 600, textAlign: "center", maxWidth: 50 }}>{label}</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function FocusMode() {
  const [todayTasks, setTodayTasks] = useState(TODAY_TASKS);
  const [now, setNow] = useState(new Date());
  const [popXp, setPopXp] = useState<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const completedCount = todayTasks.filter(t => t.status === "completed").length;
  const habitsDone = HABITS.filter(h => h.done).length;

  const toggleTask = (id: number) => {
    const task = todayTasks.find(t => t.id === id);
    if (task && task.status !== "completed") {
      setPopXp(task.xp);
      setTimeout(() => setPopXp(null), 1600);
    }
    setTodayTasks(prev => prev.map(t =>
      t.id === id ? { ...t, status: t.status === "completed" ? "pending" : "completed" } : t
    ));
  };

  const hours = now.getHours();
  const greeting = hours < 5 ? "Tun faol ishlayapti" : hours < 12 ? "Xayrli tong" : hours < 17 ? "Xayrli kun" : "Xayrli kech";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#06060f",
      fontFamily: "'Inter', sans-serif",
      color: "#f0f0f8",
      display: "grid",
      gridTemplateColumns: "380px 1fr",
      gridTemplateRows: "auto 1fr",
    }}>
      {/* XP Pop */}
      {popXp && (
        <div style={{
          position: "fixed", top: "25%", left: "50%", transform: "translateX(-50%)",
          zIndex: 999, fontSize: 28, fontWeight: 900, color: "#a78bfa",
          pointerEvents: "none", animation: "popUp 1.6s ease forwards",
          textShadow: "0 0 20px rgba(167,139,250,0.8)",
        }}>
          ⚡ +{popXp} XP
        </div>
      )}

      {/* ─── LEFT SIDEBAR ─── */}
      <div style={{
        gridRow: "1 / -1",
        background: "rgba(255,255,255,0.02)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        overflowY: "auto",
      }}>
        {/* Greeting + Time */}
        <div>
          <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{greeting}</div>
          <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: "-3px", lineHeight: 1, background: "linear-gradient(135deg, #f0f0f8, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {now.toLocaleTimeString("uz", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
            {now.toLocaleDateString("uz-Latn", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>

        {/* Score radial */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <RadialScore score={78} grade="B" />
          <div style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>A darajaga <strong style={{ color: "#f59e0b" }}>+12 ball</strong> kerak</div>
        </div>

        {/* Mini rings row */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
          <MiniRing value={completedCount} max={todayTasks.length} color="#8b5cf6" label="Vazifalar" />
          <MiniRing value={habitsDone} max={HABITS.length} color="#10b981" label="Odatlar" />
          <MiniRing value={3} max={5} color="#f59e0b" label="Maqsadlar" />
          <MiniRing value={2} max={4} color="#06b6d4" label="Fokus" />
        </div>

        {/* Streak card */}
        <div style={{
          background: "linear-gradient(135deg, rgba(249,115,22,0.12), rgba(239,68,68,0.06))",
          border: "1px solid rgba(249,115,22,0.25)",
          borderRadius: 14, padding: "16px 18px",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{ fontSize: 36, filter: "drop-shadow(0 0 12px rgba(249,115,22,0.7))" }}>🔥</div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#fb923c", lineHeight: 1 }}>21</div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>kunlik streak</div>
            <div style={{ fontSize: 10, color: "#f97316", marginTop: 2 }}>✨ Shaxsiy rekord!</div>
          </div>
        </div>

        {/* Habits */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#a0a0b8", marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
            <span>🔄 Odatlar</span>
            <span style={{ color: "#10b981" }}>{habitsDone}/{HABITS.length}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {HABITS.map((h, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 10px",
                background: h.done ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${h.done ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 100, fontSize: 12,
              }}>
                <span>{h.icon}</span>
                {h.done && <CheckCircle2 className="w-3 h-3" style={{ color: "#10b981" }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#a0a0b8", marginBottom: 10 }}>🏆 Yutuqlar</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ACHIEVEMENTS.map((a, i) => (
              <div key={i} title={a.label} style={{
                width: 40, height: 40, borderRadius: 10,
                background: a.unlocked ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${a.unlocked ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.06)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, filter: a.unlocked ? "none" : "grayscale(1) opacity(0.3)",
                cursor: "pointer",
              }}>{a.icon}</div>
            ))}
          </div>
        </div>

        {/* XP Bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "#a78bfa", fontWeight: 700 }}>⚡ Daraja 7</span>
            <span style={{ fontSize: 11, color: "#6b7280" }}>1240 / 2000 XP</span>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: "62%",
              background: "linear-gradient(90deg, #7c3aed, #8b5cf6)",
              borderRadius: 3, boxShadow: "0 0 10px rgba(139,92,246,0.5)",
            }} />
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div style={{ padding: "28px 28px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>Abdulloh's Command Center</h1>
            <p style={{ fontSize: 12, color: "#6b7280" }}>Har bir daqiqa qarordir — sarfla yoki yo'qot.</p>
          </div>
          {/* Quick action buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { icon: <Plus className="w-4 h-4" />, label: "Vazifa", color: "#8b5cf6" },
              { icon: <Timer className="w-4 h-4" />, label: "Fokus", color: "#10b981" },
              { icon: <Target className="w-4 h-4" />, label: "Odat", color: "#f59e0b" },
              { icon: <Calendar className="w-4 h-4" />, label: "Taqvim", color: "#06b6d4" },
            ].map((a, i) => (
              <button key={i} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "10px 14px",
                background: `${a.color}10`, border: `1px solid ${a.color}25`,
                borderRadius: 12, cursor: "pointer", color: a.color, fontSize: 10, fontWeight: 700,
              }}>
                {a.icon} {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overdue — RED ALERT */}
        {OVERDUE_TASKS.length > 0 && (
          <div style={{
            background: "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.04))",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 14, padding: "14px 18px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <AlertTriangle className="w-4 h-4" style={{ color: "#ef4444" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>Kechiktirilgan Vazifalar</span>
              <div style={{
                marginLeft: "auto", width: 20, height: 20, borderRadius: "50%",
                background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, color: "white",
              }}>{OVERDUE_TASKS.length}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {OVERDUE_TASKS.map(t => (
                <div key={t.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px",
                  background: "rgba(239,68,68,0.07)", borderRadius: 10,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 8px #ef4444", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, flex: 1, color: "#fca5a5" }}>{t.title}</span>
                  <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>{t.daysLate} kun kechikdi</span>
                  <ChevronRight className="w-3.5 h-3.5" style={{ color: "#ef4444" }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's tasks */}
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>📋 Bugungi Vazifalar</h2>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{completedCount}/{todayTasks.length} bajarildi</div>
            </div>
            <button style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)",
              borderRadius: 10, padding: "8px 14px", color: "#a78bfa", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
              <Plus className="w-3.5 h-3.5" /> Qo'shish
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 3, marginBottom: 16, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${(completedCount / todayTasks.length) * 100}%`,
              background: "linear-gradient(90deg, #7c3aed, #8b5cf6, #a78bfa)",
              transition: "width 0.5s ease",
              boxShadow: "0 0 12px rgba(139,92,246,0.6)",
            }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {todayTasks.map(task => {
              const isDone = task.status === "completed";
              return (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 16px",
                    background: isDone ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isDone ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 12, cursor: "pointer",
                    opacity: isDone ? 0.7 : 1, transition: "all 0.2s",
                  }}
                >
                  {isDone
                    ? <CheckCircle2 className="w-5 h-5" style={{ color: "#10b981", flexShrink: 0 }} />
                    : <Circle className="w-5 h-5" style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 500,
                      color: isDone ? "#6b7280" : "#f0f0f8",
                      textDecoration: isDone ? "line-through" : "none",
                    }}>{task.title}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, display: "flex", gap: 8, alignItems: "center" }}>
                      <Clock className="w-3 h-3" /> {task.time}
                      <span style={{
                        padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600,
                        background: task.priority === "high" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.1)",
                        color: task.priority === "high" ? "#fca5a5" : "#fcd34d",
                      }}>
                        {task.priority === "high" ? "Yuqori" : "O'rta"}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: "#a78bfa",
                    background: "rgba(139,92,246,0.1)", padding: "3px 8px", borderRadius: 6,
                  }}>+{task.xp} XP</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming + AI Coach */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Upcoming */}
          <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
              <Calendar className="w-4 h-4" style={{ color: "#06b6d4" }} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Kelayotgan</span>
            </div>
            {UPCOMING_TASKS.map(t => (
              <div key={t.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", marginBottom: 8,
                background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.15)",
                borderRadius: 10,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#06b6d4", flexShrink: 0 }} />
                <span style={{ fontSize: 12, flex: 1 }}>{t.title}</span>
                <span style={{ fontSize: 10, color: "#06b6d4", fontWeight: 600 }}>{t.date}</span>
              </div>
            ))}
            <button style={{
              width: "100%", padding: "8px", borderRadius: 10,
              background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.2)",
              color: "#67e8f9", fontSize: 11, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            }}>
              Taqvimni ko'rish <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* AI Coach */}
          <div style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.05))",
            border: "1px solid rgba(139,92,246,0.25)", borderRadius: 16, padding: 18,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Brain className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>AI Murabbiy</div>
                <div style={{ fontSize: 10, color: "#a78bfa" }}>Jonli tahlil</div>
              </div>
              <Sparkles className="w-3.5 h-3.5 ml-auto" style={{ color: "#a78bfa" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ padding: "10px 12px", background: "rgba(139,92,246,0.08)", borderRadius: 10, fontSize: 12, color: "#c4c4d4", lineHeight: 1.6 }}>
                💜 <strong style={{ color: "#a78bfa" }}>Zo'r ketmoqda!</strong> Yana 2 vazifani bajarsangiz kunlik rekordga erishasiz.
              </div>
              <div style={{ padding: "10px 12px", background: "rgba(245,158,11,0.07)", borderRadius: 10, fontSize: 12, color: "#c4c4d4", lineHeight: 1.6 }}>
                ⚡ Keyingi qadamingiz: <strong style={{ color: "#fcd34d" }}>"Loyiha hisoboti"</strong> — 25 daqiqa yetarli.
              </div>
            </div>

            <button style={{
              marginTop: 12, width: "100%", padding: "9px",
              background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)",
              borderRadius: 10, color: "#a78bfa", fontSize: 12, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <BarChart3 className="w-3.5 h-3.5" /> Batafsil tahlil <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes popUp {
          0% { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.5); }
          20% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1.2); }
          80% { opacity: 1; transform: translateX(-50%) translateY(-30px) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-60px) scale(0.8); }
        }
      `}</style>
    </div>
  );
}
