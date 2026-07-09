import { Router, type IRouter } from "express";
import { eq, and, gte, lte } from "drizzle-orm";
import { db, tasksTable, pomodoroSessionsTable } from "@workspace/db";
import {
  GetDailyReportResponse,
  GetWeeklyReportResponse,
  GetMonthlyReportResponse,
  GetDailyReportQueryParams,
  GetWeeklyReportQueryParams,
  GetMonthlyReportQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toDateStr(v: string | Date | undefined | null): string {
  if (v == null) return new Date().toISOString().split("T")[0];
  if (v instanceof Date) return v.toISOString().split("T")[0];
  return v;
}

function getGrade(percent: number): string {
  if (percent >= 97) return "A+";
  if (percent >= 90) return "A";
  if (percent >= 80) return "B";
  if (percent >= 70) return "C";
  if (percent >= 60) return "D";
  return "F";
}

function generateAiSummary(completed: number, total: number, percent: number): string {
  if (total === 0) return "Bugun hech qanday vazifa rejalashtirmadingiz.";
  if (percent >= 90) return `Ajoyib! Bugun ${completed} ta vazifani bajarib, ${percent}% natija ko'rsatdingiz. Intizomingiz namunali!`;
  if (percent >= 70) return `Yaxshi ish! Bugun ${percent}% vazifani bajardingiz. Ertaga yanada yaxshiroq natija ko'rsating!`;
  if (percent >= 50) return `Bugun rejangning ${percent}% bajarildi. ${total - completed} ta vazifa qoldi. Ertaga ertaroq boshlang!`;
  if (percent >= 30) return `Bugun sust ishlading. Faqat ${percent}% bajarildi. Intizomingizni oshiring!`;
  return `Bugun rejangdan ortda qoldingiz (${percent}%). Vaqtni bekorga sarflamang — ertaga yangi boshlanish!`;
}

router.get("/reports/daily", async (req, res): Promise<void> => {
  const q = GetDailyReportQueryParams.safeParse(req.query);
  const date = q.success && q.data.date ? toDateStr(q.data.date) : new Date().toISOString().split("T")[0];

  const tasks = await db.select().from(tasksTable).where(eq(tasksTable.scheduledDate, date));
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const missed = tasks.filter(t => t.status === "missed" || t.status === "repeatedly_missed").length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const grade = getGrade(progressPercent);

  const topCompletions = tasks.filter(t => t.status === "completed").slice(0, 3).map(t => t.title);
  const topMisses = tasks.filter(t => t.status === "missed" || t.status === "repeatedly_missed").slice(0, 3).map(t => t.title);

  const dateObj = new Date(date);
  const sessions = await db.select().from(pomodoroSessionsTable)
    .where(and(
      gte(pomodoroSessionsTable.startedAt, dateObj),
      lte(pomodoroSessionsTable.startedAt, new Date(dateObj.getTime() + 86400000)),
      eq(pomodoroSessionsTable.status, "completed")
    ));
  const pomodoroMinutes = sessions.reduce((a, s) => a + s.durationMinutes, 0);

  const disciplineScore = Math.max(0, Math.min(100, progressPercent * 0.8 + (sessions.length * 5)));

  res.json(GetDailyReportResponse.parse({
    date,
    completed,
    missed,
    total,
    progressPercent,
    grade,
    topCompletions,
    topMisses,
    bestProductiveHour: completed > 0 ? "09:00-11:00" : null,
    lostTimeMinutes: Math.max(0, (total - completed) * 30),
    pomodoroMinutes,
    aiSummary: generateAiSummary(completed, total, progressPercent),
    aiTomorrow: progressPercent < 50
      ? "Ertaga kamida 70% vazifani bajarishni maqsad qiling. Eng muhim vazifalar bilan boshlang."
      : "Ertaga bugungi sur'atni saqlab qoling. Intizomingiz kuchayib bormoqda!",
    disciplineScore,
  }));
});

router.get("/reports/weekly", async (req, res): Promise<void> => {
  const q = GetWeeklyReportQueryParams.safeParse(req.query);
  const weekBase = q.success && q.data.week ? new Date(q.data.week) : new Date();

  const monday = new Date(weekBase);
  monday.setDate(monday.getDate() - monday.getDay() + 1);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const weekStart = monday.toISOString().split("T")[0];
  const weekEnd = sunday.toISOString().split("T")[0];

  const days = [];
  let totalCompleted = 0, totalMissed = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const ds = d.toISOString().split("T")[0];
    const dayTasks = await db.select().from(tasksTable).where(eq(tasksTable.scheduledDate, ds));
    const dayCompleted = dayTasks.filter(t => t.status === "completed").length;
    const dayMissed = dayTasks.filter(t => t.status === "missed" || t.status === "repeatedly_missed").length;
    const dayTotal = dayTasks.length;
    const dayPercent = dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0;
    days.push({ date: ds, completed: dayCompleted, total: dayTotal, percent: dayPercent, grade: getGrade(dayPercent) });
    totalCompleted += dayCompleted;
    totalMissed += dayMissed;
  }

  const totalTotal = days.reduce((a, d) => a + d.total, 0);
  const avgCompletion = totalTotal > 0 ? Math.round((totalCompleted / totalTotal) * 100) : 0;

  res.json(GetWeeklyReportResponse.parse({
    weekStart,
    weekEnd,
    stats: {
      weekStart,
      weekEnd,
      days,
      summary: {
        totalCompleted, totalMissed, avgCompletion,
        bestDay: null, worstDay: null, bestCategory: null, worstCategory: null,
        totalPomodoroMinutes: 0, streak: 0,
      },
    },
    aiAnalysis: avgCompletion >= 70
      ? `Bu hafta ${avgCompletion}% samaradorlik ko'rsatdingiz. Ajoyib natija!`
      : `Bu hafta ${avgCompletion}% samaradorlik. Keyingi haftada yanada ko'proq harakat qiling.`,
    recommendations: [
      "Har kuni doimiy vaqtda ishlashni boshlang",
      "Eng muhim 3 ta vazifani avval bajaring",
      "Pomodoro texnikasidan foydalaning",
    ],
  }));
});

router.get("/reports/monthly", async (req, res): Promise<void> => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = new Date(year, month, 0).toISOString().split("T")[0];

  const monthTasks = await db.select().from(tasksTable)
    .where(and(gte(tasksTable.scheduledDate, monthStart), lte(tasksTable.scheduledDate, monthEnd)));

  const totalCompleted = monthTasks.filter(t => t.status === "completed").length;
  const totalMissed = monthTasks.filter(t => t.status === "missed" || t.status === "repeatedly_missed").length;
  const totalTotal = monthTasks.length;
  const avgCompletion = totalTotal > 0 ? Math.round((totalCompleted / totalTotal) * 100) : 0;

  res.json(GetMonthlyReportResponse.parse({
    month,
    year,
    stats: {
      month, year,
      weeks: [{ totalCompleted, totalMissed, avgCompletion, bestDay: null, worstDay: null, bestCategory: null, worstCategory: null, totalPomodoroMinutes: 0, streak: 0 }],
      summary: { totalCompleted, totalMissed, avgCompletion, topCategory: null, bottomCategory: null, discoveredHabits: [], lostHabits: [] },
    },
    aiAnalysis: `${month}-oy natijasi: ${avgCompletion}% samaradorlik. ${totalCompleted} ta vazifa bajarildi, ${totalMissed} ta o'tkazib yuborildi.`,
    recommendations: [
      "Keyingi oy uchun aniq maqsadlar belgilang",
      "Odatlar izchilligiga e'tibor bering",
      "Kuchli tomonlaringizni yanada rivojlantiring",
    ],
  }));
});

export default router;
