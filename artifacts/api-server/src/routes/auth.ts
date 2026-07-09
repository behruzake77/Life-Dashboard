import bcrypt from 'bcryptjs';
import {
  GetCurrentAuthUserResponse,
  LoginUserBody,
  LogoutUserResponse,
  RegisterUserBody,
} from '@workspace/api-zod';
import { db, usersTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
import { Router, type IRouter, type Request, type Response } from 'express';

import {
  clearSession,
  createSession,
  getSessionId,
  setSessionCookie,
  type SessionData,
} from '../lib/auth';

const router: IRouter = Router();

const BCRYPT_ROUNDS = 12;
// Precomputed dummy hash used to keep login response timing constant when the
// username does not exist, so the endpoint doesn't leak which usernames are registered.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

router.get('/auth/user', (req: Request, res: Response) => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

router.post('/auth/register', async (req: Request, res: Response) => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Login yoki parol noto'g'ri formatda" });
    return;
  }

  const { username, password } = parsed.data;

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (existing) {
    res.status(400).json({ error: 'Bu login band' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const [user] = await db
    .insert(usersTable)
    .values({ username, passwordHash })
    .returning();

  if (!user) {
    res.status(500).json({ error: 'Foydalanuvchi yaratilmadi' });
    return;
  }

  const sessionData: SessionData = {
    user: { id: user.id, username: user.username },
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.json(GetCurrentAuthUserResponse.parse({ user: sessionData.user }));
});

router.post('/auth/login', async (req: Request, res: Response) => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(401).json({ error: "Login yoki parol noto'g'ri" });
    return;
  }

  const { username, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));

  // Always run bcrypt.compare, even for unknown usernames, against a dummy
  // hash so response timing doesn't reveal whether the username exists.
  const passwordMatches = await bcrypt.compare(
    password,
    user?.passwordHash ?? DUMMY_HASH,
  );

  if (!user || !passwordMatches) {
    res.status(401).json({ error: "Login yoki parol noto'g'ri" });
    return;
  }

  const sessionData: SessionData = {
    user: { id: user.id, username: user.username },
  };

  const sid = await createSession(sessionData);
  setSessionCookie(res, sid);
  res.json(GetCurrentAuthUserResponse.parse({ user: sessionData.user }));
});

router.post('/auth/logout', async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.json(LogoutUserResponse.parse({ success: true }));
});

export default router;
