import { pgTable, serial, text, integer, boolean, timestamp, doublePrecision, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

export const userProfileTable = pgTable("user_profile", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  totalXp: integer("total_xp").notNull().default(0),
  coins: integer("coins").notNull().default(0),
  disciplineScore: doublePrecision("discipline_score").notNull().default(50),
  consecutiveDays: integer("consecutive_days").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const badgesTable = pgTable("badges", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  description: text("description").notNull(),
  rarity: text("rarity").notNull().default("common"),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
});

export const achievementsTable = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  description: text("description").notNull(),
  condition: text("condition").notNull(),
  unlocked: boolean("unlocked").notNull().default(false),
  unlockedAt: timestamp("unlocked_at"),
  xpReward: integer("xp_reward").notNull().default(100),
  rarity: text("rarity").notNull().default("common"),
  progress: doublePrecision("progress").notNull().default(0),
  maxProgress: doublePrecision("max_progress").notNull().default(1),
});

export const questsTable = pgTable("quests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull().default("daily"),
  progress: integer("progress").notNull().default(0),
  target: integer("target").notNull().default(1),
  xpReward: integer("xp_reward").notNull().default(50),
  coinReward: integer("coin_reward").notNull().default(10),
  completed: boolean("completed").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
});

export const aiMessagesTable = pgTable("ai_messages", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => usersTable.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("assistant"),
  content: text("content").notNull(),
  messageType: text("message_type").notNull().default("chat"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAiMessageSchema = createInsertSchema(aiMessagesTable).omit({ id: true, userId: true, createdAt: true });
export type InsertAiMessage = z.infer<typeof insertAiMessageSchema>;
export type AiMessage = typeof aiMessagesTable.$inferSelect;
