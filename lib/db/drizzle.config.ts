import { defineConfig } from "drizzle-kit";
import path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // Some deployments share a single Postgres instance with unrelated apps.
  // Restrict push/introspection to only the tables this app owns so it never
  // touches (and never proposes dropping) tables it doesn't manage.
  tablesFilter: [
    "life_os_users",
    "sessions",
    "tasks",
    "habits",
    "habit_logs",
    "goals",
    "goal_steps",
    "pomodoro_sessions",
    "user_profile",
    "badges",
    "achievements",
    "quests",
    "ai_messages",
  ],
});
