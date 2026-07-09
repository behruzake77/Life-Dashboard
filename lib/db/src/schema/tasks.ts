import { pgTable, serial, text, integer, timestamp, date, boolean, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

export const tasksTable = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull().default("Umumiy"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("pending"),
  startTime: text("start_time"),
  endTime: text("end_time"),
  durationMinutes: integer("duration_minutes"),
  deadline: timestamp("deadline"),
  recurrence: text("recurrence").default("none"),
  reminderMinutes: integer("reminder_minutes"),
  attachmentUrl: text("attachment_url"),
  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  failureReason: text("failure_reason"),
  failCount: integer("fail_count").notNull().default(0),
  completedAt: timestamp("completed_at"),
  scheduledDate: date("scheduled_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasksTable).omit({ id: true, userId: true, createdAt: true, updatedAt: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasksTable.$inferSelect;
