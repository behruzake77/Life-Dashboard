import { Router, type IRouter } from "express";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { db, tasksTable } from "@workspace/db";
import {
  CreateTaskBody,
  UpdateTaskBody,
  GetTaskParams,
  GetTaskResponse,
  UpdateTaskParams,
  UpdateTaskResponse,
  DeleteTaskParams,
  GetTasksResponse,
  GetTasksQueryParams,
  CreateTaskResponse,
  GetTodayTasksResponse,
  GetOverdueTasksResponse,
  FailTaskParams,
  FailTaskBody,
  FailTaskResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/requireAuth";

const router: IRouter = Router();

function parseId(raw: unknown): number | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(String(s), 10);
  return isNaN(n) ? null : n;
}

function toDateStr(v: string | Date | undefined | null): string | undefined | null {
  if (v == null) return v as null | undefined;
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

router.get("/tasks", requireAuth, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) return;
  const userId = req.user!.id;
  const q = GetTasksQueryParams.safeParse(req.query);
  const conditions: ReturnType<typeof eq>[] = [eq(tasksTable.userId, userId)];

  if (q.success) {
    if (q.data.status) conditions.push(eq(tasksTable.status, q.data.status));
    if (q.data.category) conditions.push(eq(tasksTable.category, q.data.category));
    if (q.data.date) conditions.push(eq(tasksTable.scheduledDate, toDateStr(q.data.date) as string));
  }

  const tasks = await db.select().from(tasksTable).where(and(...conditions)).orderBy(desc(tasksTable.createdAt));

  res.json(GetTasksResponse.parse(tasks));
});

router.post("/tasks", requireAuth, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) return;
  const userId = req.user!.id;
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const insertData = {
    ...parsed.data,
    scheduledDate: toDateStr(parsed.data.scheduledDate),
    userId,
  };
  const [task] = await db.insert(tasksTable).values(insertData).returning();
  res.status(201).json(CreateTaskResponse.parse(task));
});

router.get("/tasks/today", requireAuth, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) return;
  const userId = req.user!.id;
  const today = new Date().toISOString().split("T")[0];
  const tasks = await db.select().from(tasksTable)
    .where(and(eq(tasksTable.userId, userId), eq(tasksTable.scheduledDate, today)))
    .orderBy(tasksTable.createdAt);

  const total = tasks.length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const missed = tasks.filter(t => t.status === "missed" || t.status === "repeatedly_missed").length;
  const pending = tasks.filter(t => t.status === "pending").length;
  const inProgress = tasks.filter(t => t.status === "in_progress").length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  res.json(GetTodayTasksResponse.parse({ tasks, total, completed, missed, pending, inProgress, progressPercent }));
});

router.get("/tasks/overdue", requireAuth, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) return;
  const userId = req.user!.id;
  const now = new Date();
  const tasks = await db.select().from(tasksTable)
    .where(and(
      eq(tasksTable.userId, userId),
      lte(tasksTable.deadline, now),
      sql`${tasksTable.status} NOT IN ('completed', 'missed', 'repeatedly_missed')`
    ))
    .orderBy(desc(tasksTable.deadline));

  res.json(GetOverdueTasksResponse.parse(tasks));
});

router.get("/tasks/:id", requireAuth, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) return;
  const userId = req.user!.id;
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const [task] = await db.select().from(tasksTable).where(and(eq(tasksTable.id, id), eq(tasksTable.userId, userId)));
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }

  res.json(GetTaskResponse.parse(task));
});

router.patch("/tasks/:id", requireAuth, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) return;
  const userId = req.user!.id;
  const id = parseId(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.status === "completed" && !parsed.data.completedAt) {
    updateData.completedAt = new Date();
  }

  const [task] = await db.update(tasksTable).set(updateData).where(and(eq(tasksTable.id, id), eq(tasksTable.userId, userId))).returning();
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }

  res.json(UpdateTaskResponse.parse(task));
});

router.delete("/tasks/:id", requireAuth, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) return;
  const userId = req.user!.id;
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [task] = await db.delete(tasksTable).where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.userId, userId))).returning();
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }

  res.sendStatus(204);
});

router.post("/tasks/:id/fail", requireAuth, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) return;
  const userId = req.user!.id;
  const params = FailTaskParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = FailTaskBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [existing] = await db.select().from(tasksTable).where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.userId, userId)));
  if (!existing) { res.status(404).json({ error: "Task not found" }); return; }

  const newFailCount = (existing.failCount ?? 0) + 1;
  const newStatus = newFailCount >= 3 ? "repeatedly_missed" : "missed";

  const [task] = await db.update(tasksTable)
    .set({ status: newStatus, failureReason: parsed.data.reason, failCount: newFailCount, updatedAt: new Date() })
    .where(and(eq(tasksTable.id, params.data.id), eq(tasksTable.userId, userId)))
    .returning();

  res.json(FailTaskResponse.parse(task));
});

export default router;
