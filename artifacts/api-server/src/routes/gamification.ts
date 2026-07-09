import { Router, type IRouter } from "express";
import { db, userProfileTable, badgesTable, achievementsTable, questsTable } from "@workspace/db";
import {
  GetGamificationProfileResponse,
  GetAchievementsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function getGrade(score: number): string {
  if (score >= 97) return "A+";
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

router.get("/gamification/profile", async (_req, res): Promise<void> => {
  let [profile] = await db.select().from(userProfileTable);

  if (!profile) {
    [profile] = await db.insert(userProfileTable).values({}).returning();
  }

  const badges = await db.select().from(badgesTable).limit(10);
  const quests = await db.select().from(questsTable).limit(5);
  const allAchievements = await db.select().from(achievementsTable);
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

router.get("/gamification/achievements", async (_req, res): Promise<void> => {
  const achievements = await db.select().from(achievementsTable);
  res.json(GetAchievementsResponse.parse(achievements.map(a => ({
    ...a,
    unlockedAt: a.unlockedAt ? a.unlockedAt.toISOString() : null,
  }))));
});

export default router;
