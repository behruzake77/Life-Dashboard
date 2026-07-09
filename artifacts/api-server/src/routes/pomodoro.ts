import { Router, type IRouter } from "express";
import { eq, gte, desc } from "drizzle-orm";
import { db, pomodoroSessionsTable } from "@workspace/db";
import {
  GetPomodoroSessionsQueryParams,
  GetPomodoroSessionsResponse,
  CreatePomodoroSessionBody,
  CreatePomodoroSessionResponse,
  UpdatePomodoroSessionParams,
  UpdatePomodoroSessionBody,
  UpdatePomodoroSessionResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/pomodoro/sessions", async (req, res): Promise<void> => {
  const q = GetPomodoroSessionsQueryParams.safeParse(req.query);
  let sessions;

  if (q.success && q.data.date) {
    const start = new Date(q.data.date);
    const end = new Date(q.data.date);
    end.setDate(end.getDate() + 1);
    sessions = await db.select().from(pomodoroSessionsTable)
      .where(gte(pomodoroSessionsTable.startedAt, start))
      .orderBy(desc(pomodoroSessionsTable.startedAt));
  } else {
    sessions = await db.select().from(pomodoroSessionsTable)
      .orderBy(desc(pomodoroSessionsTable.startedAt))
      .limit(50);
  }

  res.json(GetPomodoroSessionsResponse.parse(sessions));
});

router.post("/pomodoro/sessions", async (req, res): Promise<void> => {
  const parsed = CreatePomodoroSessionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [session] = await db.insert(pomodoroSessionsTable).values({ ...parsed.data, status: "active" }).returning();
  res.status(201).json(CreatePomodoroSessionResponse.parse(session));
});

router.patch("/pomodoro/sessions/:id", async (req, res): Promise<void> => {
  const params = UpdatePomodoroSessionParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdatePomodoroSessionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "completed" && !parsed.data.completedAt) {
    updateData.completedAt = new Date();
  }

  const [session] = await db.update(pomodoroSessionsTable)
    .set(updateData)
    .where(eq(pomodoroSessionsTable.id, params.data.id))
    .returning();
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }

  res.json(UpdatePomodoroSessionResponse.parse(session));
});

export default router;
