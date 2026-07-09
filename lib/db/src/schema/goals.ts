import { pgTable, serial, text, integer, boolean, timestamp, date, doublePrecision, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

export const goalsTable = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  deadline: date("deadline"),
  progressPercent: doublePrecision("progress_percent").notNull().default(0),
  status: text("status").notNull().default("active"),
  priority: text("priority").notNull().default("medium"),
  totalSteps: integer("total_steps").notNull().default(0),
  completedSteps: integer("completed_steps").notNull().default(0),
  aiAdvice: text("ai_advice"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const goalStepsTable = pgTable("goal_steps", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull().references(() => goalsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").notNull().default(false),
  order: integer("order").notNull().default(0),
  deadline: date("deadline"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGoalSchema = createInsertSchema(goalsTable).omit({ id: true, userId: true, createdAt: true, updatedAt: true, totalSteps: true, completedSteps: true, progressPercent: true });
export const insertGoalStepSchema = createInsertSchema(goalStepsTable).omit({ id: true, createdAt: true });
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type InsertGoalStep = z.infer<typeof insertGoalStepSchema>;
export type Goal = typeof goalsTable.$inferSelect;
export type GoalStep = typeof goalStepsTable.$inferSelect;
