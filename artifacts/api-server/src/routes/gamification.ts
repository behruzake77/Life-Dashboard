import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, userProfileTable, badgesTable, achievementsTable, questsTable } from "@workspace/db";
import {
  GetGamificationProfileResponse,
  GetAchievementsResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/requireAuth";

const router: IRouter = Router();

function getGrade(score: number): string {
  if (score >= 97) return "A+";
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

const DEFAULT_ACHIEVEMENTS = [
  { name: "Birinchi Qadam", icon: "🚀", description: "Birinchi vazifangizni bajardingiz!", condition: "1 ta vazifani bajaring", xpReward: 50, rarity: "common", maxProgress: 1 },
  { name: "Besh Yulduz", icon: "⭐", description: "5 ta vazifani ketma-ket bajardingiz", condition: "5 ta vazifani bajaring", xpReward: 100, rarity: "common", maxProgress: 5 },
  { name: "Hafta Qahramoni", icon: "🏆", description: "Bir haftada barcha vazifalarni bajardingiz", condition: "7 kun ketma-ket bajaring", xpReward: 300, rarity: "rare", maxProgress: 7 },
  { name: "Odat Ustasi", icon: "🔥", description: "30 kunlik ketma-ketlik yaratdingiz", condition: "30 kunlik streak", xpReward: 500, rarity: "epic", maxProgress: 30 },
  { name: "Pomodoro Pro", icon: "⏱️", description: "10 ta fokus sessiyasini yakunladingiz", condition: "10 ta pomodoro", xpReward: 150, rarity: "common", maxProgress: 10 },
  { name: "Maqsad Ortiqchi", icon: "🎯", description: "Birinchi maqsadingizga erishdingiz", condition: "1 ta maqsadni bajaring", xpReward: 200, rarity: "rare", maxProgress: 1 },
  { name: "Intizom Belgisi", icon: "💎", description: "100 ball intizom skoriga erishdingiz", condition: "100 ball intizom", xpReward: 1000, rarity: "legendary", maxProgress: 100 },
  { name: "Tong Yulduzi", icon: "🌅", description: "5 kun ketma-ket ertalab vazifa bajardingiz", condition: "Ertalab 5 kun bajaring", xpReward: 250, rarity: "rare", maxProgress: 5 },
  { name: "Odat Boshliqchi", icon: "💪", description: "5 ta faol odat yaratdingiz", condition: "5 ta odat qo'shing", xpReward: 200, rarity: "common", maxProgress: 5 },
  { name: "AI Do'sti", icon: "🤖", description: "AI murabbiy bilan 10 ta suhbat o'tkаzdingiz", condition: "10 ta AI xabar yuboring", xpReward: 150, rarity: "common", maxProgress: 10 },
];

const DEFAULT_QUESTS = [
  { title: "Bugungi Jangchi", description: "Bugun kamida 3 ta vazifa bajaring", type: "daily", target: 3, xpReward: 100, coinReward: 20 },
  { title: "Odat Davom Ettiruvchi", description: "Bugun kamida 1 ta odatni bajaring", type: "daily", target: 1, xpReward: 50, coinReward: 10 },
  { title: "Fokus Vaqti", description: "Bugun kamida 1 ta Pomodoro sessiyasini bajaring", type: "daily", target: 1, xpReward: 75, coinReward: 15 },
];

async function seedAchievements(userId: string) {
  const existing = await db.select().from(achievementsTable).where(eq(achievementsTable.userId, userId));
  if (existing.length > 0) return;

  await db.insert(achievementsTable).values(
    DEFAULT_ACHIEVEMENTS.map(a => ({ ...a, userId, unlocked: false, progress: 0 }))
  );
}

async function seedDailyQuests(userId: string) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const existing = await db.select().from(questsTable)
    .where(and(eq(questsTable.userId, userId)));

  // Filter for today's quests
  const todayQuests = existing.filter(q => {
    const exp = new Date(q.expiresAt);
    return exp >= startOfDay && exp <= endOfDay;
  });

  if (todayQuests.length > 0) return;

  await db.insert(questsTable).values(
    DEFAULT_QUESTS.map(q => ({
      ...q,
      userId,
      progress: 0,
      completed: false,
      expiresAt: endOfDay,
    }))
  );
}

router.get("/gamification/profile", requireAuth, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) return;
  const userId = req.user.id;

  let [profile] = await db.select().from(userProfileTable).where(eq(userProfileTable.userId, userId));

  if (!profile) {
    [profile] = await db.insert(userProfileTable).values({ userId }).returning();
  }

  // Seed achievements and quests on first visit
  await seedAchievements(userId);
  await seedDailyQuests(userId);

  const badges = await db.select().from(badgesTable).where(eq(badgesTable.userId, userId)).limit(10);
  const quests = await db.select().from(questsTable).where(eq(questsTable.userId, userId)).limit(10);
  const allAchievements = await db.select().from(achievementsTable).where(eq(achievementsTable.userId, userId));
  const unlockedAchievements = allAchievements.filter(a => a.unlocked).length;

  const xpToNextLevel = (profile.level * 500) - profile.xp;

  res.json(GetGamificationProfileResponse.parse({
    level: profile.level,
    xp: profile.xp,
    xpToNextLevel: Math.max(0, xpToNextLevel),
    totalXp: profile.totalXp,
    coins: profile.coins,
    badges: badges.map(b => ({ ...b, earnedAt: b.earnedAt.toISOString() })),
    disciplineScore: profile.disciplineScore,
    grade: getGrade(profile.disciplineScore),
    consecutiveDays: profile.consecutiveDays,
    totalAchievements: allAchievements.length,
    unlockedAchievements,
    dailyQuests: quests.map(q => ({ ...q, expiresAt: q.expiresAt.toISOString() })),
  }));
});

router.get("/gamification/achievements", requireAuth, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) return;
  const userId = req.user.id;
  await seedAchievements(userId);
  const achievements = await db.select().from(achievementsTable).where(eq(achievementsTable.userId, userId));
  res.json(GetAchievementsResponse.parse(achievements.map(a => ({
    ...a,
    unlockedAt: a.unlockedAt ? a.unlockedAt.toISOString() : null,
  }))));
});

export default router;
