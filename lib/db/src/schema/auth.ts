import { sql } from 'drizzle-orm';
import { index, jsonb, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

// (IMPORTANT) This table is used to store server-side sessions, don't drop it.
export const sessionsTable = pgTable(
  'sessions',
  {
    sid: varchar('sid').primaryKey(),
    sess: jsonb('sess').notNull(),
    expire: timestamp('expire').notNull(),
  },
  (table) => [index('IDX_session_expire').on(table.expire)],
);

export const usersTable = pgTable('users', {
  id: varchar('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: varchar('username').unique().notNull(),
  passwordHash: varchar('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type UpsertUser = typeof usersTable.$inferInsert;
export type User = typeof usersTable.$inferSelect;
