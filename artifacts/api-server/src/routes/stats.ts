import { Router, type IRouter } from "express";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { db, tasksTable, habitLogsTable, pomodoroSessionsTable, userProfileTable } from "@workspace/db";
import {
  GetDashboardStatsResponse,
  GetWeeklyStatsResponse,
  GetMonthlyStatsResponse,
  GetHeatmapResponse,
  GetWeeklyStatsQueryParams,
  GetMonthlyStatsQueryParams,
  GetHeatmapQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getGrade(percent: number): string {
  if (percent >= 97) return "A+";
  if (percent >= 90) return "A";
  if (percent >= 80) return "B";
  if (percent >= 70) return "C";
  if (percent >= 60) return "D";
  return "F";
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

router.get("/stats/dashboard", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();

  // Today's tasks
  const todayTasks = await db.select().from(tasksTable).where(eq(tasksTable.scheduledDate, today));
  const total = todayTasks.length;
  const completed = todayTasks.filter(t => t.status === "completed").length;
  const missed = todayTasks.filter(t => t.status === "missed" || t.status === "repeatedly_missed").length;
  const pending = todayTasks.filter(t => t.status === "pending").length;
  const inProgress = todayTasks.filter(t => t.status === "in_progress").length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const grade = getGrade(progressPercent);

  // Streaks — count consecutive days with any completed tasks
  let currentTaskStreak = 0;
  let bestTaskStreak = 0;
  let tempStreak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    const dayTasks = await db.select().from(tasksTable)
      .where(and(eq(tasksTable.scheduledDate, ds), eq(tasksTable.status, "completed")));
    if (dayTasks.length > 0) {
      tempStreak++;
      if (i === 0 || (i > 0 && currentTaskStreak === i - 1 + 1)) currentTaskStreak = tempStreak;
      bestTaskStreak = Math.max(bestTaskStreak, tempStreak);
    } else {
      if (i > 0) tempStreak = 0;
    }
  }

  // Habit streaks
  const habits = await db.select().from(habitLogsTable);
  const habitStreak = habits.length > 0 ? Math.min(habits.length, 7) : 0;

  // Time stats - pomodoro
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const todaySessions = await db.select().from(pomodoroSessionsTable)
    .where(and(
      gte(pomodoroSessionsTable.startedAt, todayStart),
      lte(pomodoroSessionsTable.startedAt, todayEnd),
      eq(pomodoroSessionsTable.status, "completed")
    ));
  const todayPomodoroMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const allSessions = await db.select().from(pomodoroSessionsTable).where(eq(pomodoroSessionsTable.status, "completed"));
  const totalPomodoroMinutes = allSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  // Task time
  const completedTasks = await db.select().from(tasksTable).where(eq(tasksTable.status, "completed"));
  const todayMinutes = todayTasks.filter(t => t.status === "completed").reduce((a, t) => a + (t.durationMinutes ?? 30), 0);
  const totalMinutes = completedTasks.reduce((a, t) => a + (t.durationMinutes ?? 30), 0);

  // Scores
  const disciplineScore = Math.max(0, Math.min(100, progressPercent * 0.7 + currentTaskStreak * 2));
  const productivityScore = Math.min(100, (completed * 10) + (todayPomodoroMinutes / 2));

  // Weekly progress (last 7 days)
  const weekDays = [];
  let weeklyCompleted = 0;
  let weeklyTotal = 0;
  let bestDay: string | null = null;
  let worstDay: string | null = null;
  let bestPercent = -1;
  let worstPercent = 101;

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    const dayTasks = await db.select().from(tasksTable).where(eq(tasksTable.scheduledDate, ds));
    const dayCompleted = dayTasks.filter(t => t.status === "completed").length;
    const dayTotal = dayTasks.length;
    const dayPercent = dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0;
    weekDays.push({ date: ds, completed: dayCompleted, total: dayTotal, percent: dayPercent, grade: getGrade(dayPercent) });
    weeklyCompleted += dayCompleted;
    weeklyTotal += dayTotal;
    if (dayTotal > 0 && dayPercent > bestPercent) { bestPercent = dayPercent; bestDay = ds; }
    if (dayTotal > 0 && dayPercent < worstPercent) { worstPercent = dayPercent; worstDay = ds; }
  }

  const avgCompletion = weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0;

  // Monthly
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const monthTasks = await db.select().from(tasksTable).where(gte(tasksTable.scheduledDate, monthStart));
  const monthCompleted = monthTasks.filter(t => t.status === "completed").length;
  const monthMissed = monthTasks.filter(t => t.status === "missed" || t.status === "repeatedly_missed").length;
  const monthTotal = monthTasks.length;
  const monthPercent = monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0;

  // Gamification profile
  const [profile] = await db.select().from(userProfileTable);
  const xpToNextLevel = profile ? (profile.level * 500) - profile.xp : 500;

  const result = {
    today: { total, completed, missed, pending, inProgress, progressPercent, grade, date: today },
    streaks: { currentTaskStreak, bestTaskStreak, currentHabitStreak: habitStreak, bestHabitStreak: habitStreak },
    time: { todayMinutes, totalMinutes, todayPomodoroMinutes, totalPomodoroMinutes },
    scores: {
      disciplineScore: Math.round(disciplineScore),
      productivityScore: Math.round(productivityScore),
      weeklyScore: avgCompletion,
      monthlyScore: monthPercent,
      yearlyScore: Math.round((avgCompletion + monthPercent) / 2),
    },
    weekly: { days: weekDays, bestDay, worstDay, avgCompletion },
    monthly: { progressPercent: monthPercent, totalCompleted: monthCompleted, totalMissed: monthMissed },
    gamification: profile
      ? {
          level: profile.level,
          xp: profile.xp,
          xpToNextLevel,
          totalXp: profile.totalXp,
          coins: profile.coins,
          badges: [],
          disciplineScore: profile.disciplineScore,
          grade: getGrade(profile.disciplineScore),
          consecutiveDays: profile.consecutiveDays,
          totalAchievements: 10,
          unlockedAchievements: 0,
          dailyQuests: [],
        }
      : {
          level: 1, xp: 0, xpToNextLevel: 500, totalXp: 0, coins: 0, badges: [],
          disciplineScore: 50, grade: "C", consecutiveDays: 0,
          totalAchievements: 10, unlockedAchievements: 0, dailyQuests: [],
        },
  };

  res.json(GetDashboardStatsResponse.parse(result));
});

router.get("/stats/weekly", async (req, res): Promise<void> => {
  const q = GetWeeklyStatsQueryParams.safeParse(req.query);
  const weekBase = q.success && q.data.week ? new Date(q.data.week) : new Date();

  const monday = new Date(weekBase);
  monday.setDate(monday.getDate() - monday.getDay() + 1);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  const weekStart = monday.toISOString().split("T")[0];
  const weekEnd = sunday.toISOString().split("T")[0];

  const days = [];
  let totalCompleted = 0, totalMissed = 0, totalPomodoro = 0;
  let bestDay: string | null = null, worstDay: string | null = null;
  let bestP = -1, worstP = 101;

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
    if (dayTotal > 0 && dayPercent > bestP) { bestP = dayPercent; bestDay = ds; }
    if (dayTotal > 0 && dayPercent < worstP) { worstP = dayPercent; worstDay = ds; }
  }

  const totalTotal = days.reduce((a, d) => a + d.total, 0);
  const avgCompletion = totalTotal > 0 ? Math.round((totalCompleted / totalTotal) * 100) : 0;

  const result = {
    weekStart,
    weekEnd,
    days,
    summary: {
      totalCompleted, totalMissed, avgCompletion, bestDay, worstDay,
      bestCategory: null, worstCategory: null,
      totalPomodoroMinutes: totalPomodoro,
      streak: days.filter(d => d.completed > 0).length,
    },
  };

  res.json(GetWeeklyStatsResponse.parse(result));
});

router.get("/stats/monthly", async (req, res): Promise<void> => {
  const q = GetMonthlyStatsQueryParams.safeParse(req.query);
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

  res.json(GetMonthlyStatsResponse.parse({
    month, year,
    weeks: [{ totalCompleted, totalMissed, avgCompletion, bestDay: null, worstDay: null, bestCategory: null, worstCategory: null, totalPomodoroMinutes: 0, streak: 0 }],
    summary: { totalCompleted, totalMissed, avgCompletion, topCategory: null, bottomCategory: null, discoveredHabits: [], lostHabits: [] },
  }));
});

router.get("/stats/heatmap", async (req, res): Promise<void> => {
  const q = GetHeatmapQueryParams.safeParse(req.query);
  const days = q.success ? (q.data.days ?? 365) : 365;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const tasks = await db.select().from(tasksTable).where(gte(tasksTable.scheduledDate, cutoffStr));

  const map = new Map<string, { completed: number; total: number }>();
  for (const t of tasks) {
    if (!t.scheduledDate) continue;
    const entry = map.get(t.scheduledDate) ?? { completed: 0, total: 0 };
    entry.total++;
    if (t.status === "completed") entry.completed++;
    map.set(t.scheduledDate, entry);
  }

  const result = Array.from(map.entries()).map(([date, { completed, total }]) => {
    const level = total === 0 ? 0 : Math.ceil((completed / total) * 4);
    return { date, count: completed, level };
  }).sort((a, b) => a.date.localeCompare(b.date));

  res.json(GetHeatmapResponse.parse(result));
});

export default router;
