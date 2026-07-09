import { Router, type IRouter } from "express";
import { eq, and, gte, desc } from "drizzle-orm";
import { db, habitsTable, habitLogsTable } from "@workspace/db";
import {
  GetHabitsResponse,
  CreateHabitBody,
  CreateHabitResponse,
  UpdateHabitParams,
  UpdateHabitBody,
  UpdateHabitResponse,
  DeleteHabitParams,
  LogHabitParams,
  LogHabitBody,
  LogHabitResponse,
  GetHabitLogsParams,
  GetHabitLogsResponse,
  GetTodayHabitsResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/requireAuth";

const router: IRouter = Router();

function toDateStr(v: string | Date | undefined | null): string | undefined | null {
  if (v == null) return v as null | undefined;
  if (v instanceof Date) return v.toISOString().split("T")[0];
  return v;
}

function parseId(raw: unknown): number | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(String(s), 10);
  return isNaN(n) ? null : n;
}

router.get("/habits", requireAuth, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) return;
  const habits = await db.select().from(habitsTable).where(and(eq(habitsTable.isActive, true), eq(habitsTable.userId, req.user!.id))).orderBy(habitsTable.createdAt);
  res.json(GetHabitsResponse.parse(habits));
});

router.post("/habits", requireAuth, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) return;
  const parsed = CreateHabitBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [habit] = await db.insert(habitsTable).values({ ...parsed.data, userId: req.user!.id }).returning();
  res.status(201).json(CreateHabitResponse.parse(habit));
});

router.patch("/habits/:id", requireAuth, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) return;
  const params = UpdateHabitParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateHabitBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [habit] = await db.update(habitsTable).set(parsed.data).where(and(eq(habitsTable.id, params.data.id), eq(habitsTable.userId, req.user!.id))).returning();
  if (!habit) { res.status(404).json({ error: "Habit not found" }); return; }
  res.json(UpdateHabitResponse.parse(habit));
});

router.delete("/habits/:id", requireAuth, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) return;
  const params = DeleteHabitParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await db.update(habitsTable).set({ isActive: false }).where(and(eq(habitsTable.id, params.data.id), eq(habitsTable.userId, req.user!.id)));
  res.sendStatus(204);
});

router.post("/habits/:id/log", requireAuth, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) return;
  const params = LogHabitParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = LogHabitBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [habit] = await db.select().from(habitsTable).where(and(eq(habitsTable.id, params.data.id), eq(habitsTable.userId, req.user!.id)));
  if (!habit) { res.status(404).json({ error: "Habit not found" }); return; }

  // Upsert log for this date
  const logDate = toDateStr(parsed.data.date) as string;
  const existing = await db.select().from(habitLogsTable)
    .where(and(eq(habitLogsTable.habitId, params.data.id), eq(habitLogsTable.date, logDate)));

  let log;
  if (existing.length > 0) {
    [log] = await db.update(habitLogsTable)
      .set({ completed: parsed.data.completed, note: parsed.data.note ?? null })
      .where(eq(habitLogsTable.id, existing[0].id))
      .returning();
  } else {
    [log] = await db.insert(habitLogsTable)
      .values({ habitId: params.data.id, date: logDate, completed: parsed.data.completed, note: parsed.data.note ?? null })
      .returning();
  }

  // Recalculate streak
  if (parsed.data.completed) {
    const newTotal = (habit.totalCompletions ?? 0) + 1;
    const newStreak = (habit.currentStreak ?? 0) + 1;
    const newBest = Math.max(newStreak, habit.bestStreak ?? 0);
    await db.update(habitsTable)
      .set({ currentStreak: newStreak, bestStreak: newBest, totalCompletions: newTotal })
      .where(and(eq(habitsTable.id, params.data.id), eq(habitsTable.userId, req.user!.id)));
  } else {
    await db.update(habitsTable).set({ currentStreak: 0 }).where(and(eq(habitsTable.id, params.data.id), eq(habitsTable.userId, req.user!.id)));
  }

  res.status(201).json(LogHabitResponse.parse(log));
});

router.get("/habits/:id/logs", requireAuth, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) return;
  const params = GetHabitLogsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  // Verify the habit belongs to the current user
  const [habit] = await db.select().from(habitsTable).where(and(eq(habitsTable.id, params.data.id), eq(habitsTable.userId, req.user!.id)));
  if (!habit) { res.status(404).json({ error: "Habit not found" }); return; }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString().split("T")[0];

  const logs = await db.select().from(habitLogsTable)
    .where(and(eq(habitLogsTable.habitId, params.data.id), gte(habitLogsTable.date, cutoff)))
    .orderBy(desc(habitLogsTable.date));

  res.json(GetHabitLogsResponse.parse(logs));
});

router.get("/habits/today", requireAuth, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) return;
  const today = new Date().toISOString().split("T")[0];
  const habits = await db.select().from(habitsTable).where(and(eq(habitsTable.isActive, true), eq(habitsTable.userId, req.user!.id)));
  const habitIds = habits.map(h => h.id);
  const todayLogs = habitIds.length > 0
    ? await db.select().from(habitLogsTable).where(eq(habitLogsTable.date, today))
    : [];

  const result = habits.map(habit => {
    const log = todayLogs.find(l => l.habitId === habit.id && l.completed);
    return { habit, completedToday: !!log, todayLogId: log?.id ?? null };
  });

  res.json(GetTodayHabitsResponse.parse(result));
});

export default router;
