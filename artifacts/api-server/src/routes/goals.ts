import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, goalsTable, goalStepsTable } from "@workspace/db";
import {
  GetGoalsResponse,
  CreateGoalBody,
  CreateGoalResponse,
  GetGoalParams,
  GetGoalResponse,
  UpdateGoalParams,
  UpdateGoalBody,
  UpdateGoalResponse,
  DeleteGoalParams,
  CreateGoalStepParams,
  CreateGoalStepBody,
  CreateGoalStepResponse,
  UpdateGoalStepParams,
  UpdateGoalStepBody,
  UpdateGoalStepResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/requireAuth";

const router: IRouter = Router();

function toDateStr(v: string | Date | undefined | null): string | undefined | null {
  if (v == null) return v as null | undefined;
  if (v instanceof Date) return v.toISOString().split("T")[0];
  return v;
}

async function recalcGoalProgress(goalId: number) {
  const steps = await db.select().from(goalStepsTable).where(eq(goalStepsTable.goalId, goalId));
  const total = steps.length;
  const completed = steps.filter(s => s.completed).length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  await db.update(goalsTable)
    .set({ totalSteps: total, completedSteps: completed, progressPercent, updatedAt: new Date() })
    .where(eq(goalsTable.id, goalId));
}

router.get("/goals", requireAuth, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) return;
  const goals = await db.select().from(goalsTable)
    .where(eq(goalsTable.userId, req.user!.id))
    .orderBy(desc(goalsTable.createdAt));
  res.json(GetGoalsResponse.parse(goals));
});

router.post("/goals", requireAuth, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) return;
  const parsed = CreateGoalBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const aiAdvice = `${parsed.data.title} maqsadiga erishish uchun har kuni kichik qadamlar bilan harakatlaning. Izchillik — muvaffaqiyat kaliti!`;
  const [goal] = await db.insert(goalsTable).values({ ...parsed.data, deadline: toDateStr(parsed.data.deadline), aiAdvice, userId: req.user!.id }).returning();
  res.status(201).json(CreateGoalResponse.parse(goal));
});

router.get("/goals/:id", requireAuth, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) return;
  const params = GetGoalParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [goal] = await db.select().from(goalsTable).where(and(eq(goalsTable.id, params.data.id), eq(goalsTable.userId, req.user!.id)));
  if (!goal) { res.status(404).json({ error: "Goal not found" }); return; }

  const steps = await db.select().from(goalStepsTable).where(eq(goalStepsTable.goalId, params.data.id)).orderBy(goalStepsTable.order);
  res.json(GetGoalResponse.parse({ goal, steps }));
});

router.patch("/goals/:id", requireAuth, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) return;
  const params = UpdateGoalParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateGoalBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [goal] = await db.update(goalsTable)
    .set({ ...parsed.data, deadline: toDateStr(parsed.data.deadline), updatedAt: new Date() })
    .where(and(eq(goalsTable.id, params.data.id), eq(goalsTable.userId, req.user!.id)))
    .returning();
  if (!goal) { res.status(404).json({ error: "Goal not found" }); return; }

  res.json(UpdateGoalResponse.parse(goal));
});

router.delete("/goals/:id", requireAuth, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) return;
  const params = DeleteGoalParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await db.delete(goalsTable).where(and(eq(goalsTable.id, params.data.id), eq(goalsTable.userId, req.user!.id)));
  res.sendStatus(204);
});

router.post("/goals/:id/steps", requireAuth, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) return;
  const params = CreateGoalStepParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = CreateGoalStepBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  // Verify the parent goal belongs to the current user
  const [goal] = await db.select().from(goalsTable).where(and(eq(goalsTable.id, params.data.id), eq(goalsTable.userId, req.user!.id)));
  if (!goal) { res.status(404).json({ error: "Goal not found" }); return; }

  const [step] = await db.insert(goalStepsTable)
    .values({ ...parsed.data, deadline: toDateStr(parsed.data.deadline), goalId: params.data.id })
    .returning();

  await recalcGoalProgress(params.data.id);
  res.status(201).json(CreateGoalStepResponse.parse(step));
});

router.patch("/goals/:id/steps/:stepId", requireAuth, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) return;
  const params = UpdateGoalStepParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateGoalStepBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  // Verify the parent goal belongs to the current user
  const [goal] = await db.select().from(goalsTable).where(and(eq(goalsTable.id, params.data.id), eq(goalsTable.userId, req.user!.id)));
  if (!goal) { res.status(404).json({ error: "Goal not found" }); return; }

  const [step] = await db.update(goalStepsTable)
    .set({ ...parsed.data, deadline: toDateStr(parsed.data.deadline) })
    .where(eq(goalStepsTable.id, params.data.stepId))
    .returning();
  if (!step) { res.status(404).json({ error: "Step not found" }); return; }

  await recalcGoalProgress(params.data.id);
  res.json(UpdateGoalStepResponse.parse(step));
});

export default router;
