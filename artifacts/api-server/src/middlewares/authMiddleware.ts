import type { AuthUser } from '@workspace/api-zod';
import { db, usersTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
import { type NextFunction, type Request, type Response } from 'express';

declare global {
  namespace Express {
    interface User extends AuthUser {}

    interface Request {
      isAuthenticated(): this is AuthedRequest;

      user?: User | undefined;
    }

    export interface AuthedRequest {
      user: User;
    }
  }
}

// This deployment is for a single personal user, so there is no login
// screen or per-request session lookup: every request is treated as the one
// owner account, which is created on first use if it doesn't exist yet.
const OWNER_USERNAME = 'owner';
let ownerUserPromise: Promise<AuthUser> | null = null;

async function getOrCreateOwnerUser(): Promise<AuthUser> {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, OWNER_USERNAME));

  if (existing) {
    return { id: existing.id, username: existing.username };
  }

  const [created] = await db
    .insert(usersTable)
    .values({ username: OWNER_USERNAME, passwordHash: 'unused' })
    .onConflictDoNothing()
    .returning();

  if (created) {
    return { id: created.id, username: created.username };
  }

  // Lost a race with another concurrent first request; re-read.
  const [race] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, OWNER_USERNAME));

  if (!race) {
    throw new Error('Failed to provision owner user');
  }

  return { id: race.id, username: race.username };
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  req.isAuthenticated = function (this: Request) {
    return this.user != null;
  } as Request['isAuthenticated'];

  if (!ownerUserPromise) {
    ownerUserPromise = getOrCreateOwnerUser();
  }

  try {
    req.user = await ownerUserPromise;
  } catch (err) {
    ownerUserPromise = null;
    next(err);
    return;
  }

  next();
}
