import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pomodoroSessionsTable = pgTable("pomodoro_sessions", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id"),
  type: text("type").notNull().default("focus"),
  durationMinutes: integer("duration_minutes").notNull().default(25),
  status: text("status").notNull().default("active"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
});

export const insertPomodoroSessionSchema = createInsertSchema(pomodoroSessionsTable).omit({ id: true, startedAt: true });
export type InsertPomodoroSession = z.infer<typeof insertPomodoroSessionSchema>;
export type PomodoroSession = typeof pomodoroSessionsTable.$inferSelect;
