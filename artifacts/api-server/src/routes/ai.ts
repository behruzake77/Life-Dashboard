import { Router, type IRouter } from "express";
import { eq, desc, gte } from "drizzle-orm";
import { db, tasksTable, aiMessagesTable } from "@workspace/db";
import {
  GetAiDailyReportResponse,
  GetAiMessagesResponse,
  SendAiMessageBody,
  GetAiDailyReportQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function toDateStr(v: string | Date | undefined | null): string {
  if (v == null) return new Date().toISOString().split("T")[0];
  if (v instanceof Date) return v.toISOString().split("T")[0];
  return v;
}

function generateAnalysis(completed: number, total: number, percent: number): { analysis: string; messages: string[]; warnings: string[]; compliments: string[]; mood: string } {
  const messages: string[] = [];
  const warnings: string[] = [];
  const compliments: string[] = [];
  let mood = "average";

  if (total === 0) {
    messages.push("Bugun hech qanday vazifa rejalashtirilmagan.");
    mood = "average";
  } else if (percent >= 90) {
    compliments.push(`Ajoyib! ${completed} ta vazifa bajarildi.`);
    compliments.push("Bugungi intizomingiz namunali!");
    messages.push(`Bugun rejangning ${percent}% bajarildi.`);
    mood = "excellent";
  } else if (percent >= 70) {
    compliments.push("Yaxshi natija!");
    messages.push(`Bugun rejangning ${percent}% bajarildi.`);
    messages.push(`${total - completed} ta vazifa qoldi.`);
    mood = "good";
  } else if (percent >= 40) {
    warnings.push("Bugun sust ishlading.");
    messages.push(`Rejangning faqat ${percent}% bajarildi.`);
    messages.push(`${total - completed} ta muhim vazifa qoldi.`);
    warnings.push("Ertaga ertaroq boshlashing kerak.");
    mood = "poor";
  } else {
    warnings.push("Bugun vaqtni bekorga sarflading!");
    warnings.push("Rejangdan ortda qolding.");
    messages.push(`${total - completed} ta vazifa bajarilmadi.`);
    warnings.push("Oxirgi kunlarda intizoming pasaydi — bunga yo'l qo'yma.");
    mood = "critical";
  }

  const analysis = messages.join(" ");
  return { analysis, messages, warnings, compliments, mood };
}

router.get("/ai/daily-report", async (req, res): Promise<void> => {
  const q = GetAiDailyReportQueryParams.safeParse(req.query);
  const date = q.success && q.data.date ? toDateStr(q.data.date) : new Date().toISOString().split("T")[0];

  const tasks = await db.select().from(tasksTable).where(eq(tasksTable.scheduledDate, date));
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const { analysis, messages, warnings, compliments, mood } = generateAnalysis(completed, total, percent);

  const productivityScore = Math.min(100, percent * 0.8 + (completed * 2));

  res.json(GetAiDailyReportResponse.parse({
    date,
    analysis,
    messages,
    recommendation: percent < 70
      ? "Har kuni eng muhim 3 ta vazifani avval bajaring. Telefondan uzoqroq bo'ling."
      : "Ajoyib sur'atni davom ettiring! Maqsadlaringizga yaqinlashmoqdasiz.",
    mood,
    productivityScore,
    warnings,
    compliments,
  }));
});

router.get("/ai/messages", async (_req, res): Promise<void> => {
  const messages = await db.select().from(aiMessagesTable)
    .orderBy(desc(aiMessagesTable.createdAt))
    .limit(50);
  res.json(GetAiMessagesResponse.parse(messages));
});

router.post("/ai/messages", async (req, res): Promise<void> => {
  const parsed = SendAiMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  // Save user message
  await db.insert(aiMessagesTable).values({
    role: "user",
    content: parsed.data.content,
    messageType: "chat",
  });

  // Generate AI response based on user input
  const content = parsed.data.content.toLowerCase();
  let response = "";
  let messageType = "chat";

  if (content.includes("bugun") || content.includes("today")) {
    const today = new Date().toISOString().split("T")[0];
    const tasks = await db.select().from(tasksTable).where(eq(tasksTable.scheduledDate, today));
    const completed = tasks.filter(t => t.status === "completed").length;
    const total = tasks.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    response = generateAnalysis(completed, total, percent).analysis;
    messageType = percent < 50 ? "warning" : "encouragement";
  } else if (content.includes("maslah") || content.includes("advice")) {
    response = "Samaradorlikni oshirish uchun: 1) Pomodoro texnikasidan foydalaning. 2) Har kuni 3 ta asosiy maqsad belgilang. 3) Telefonni 'Do Not Disturb' rejimiga qo'ying.";
    messageType = "advice";
  } else if (content.includes("maqsad") || content.includes("goal")) {
    response = "Maqsadlaringizni kichik qadamlarga bo'ling. Har kunlik vazifalar — katta maqsad sari qadam. Ularni bajarib boring!";
    messageType = "advice";
  } else if (content.includes("yaxshi") || content.includes("rahmat")) {
    response = "Siz juda yaxshi ishlayapsiz! Intizomingizni davom ettiring. Maqsadlaringizga yaqinlashmoqdasiz!";
    messageType = "encouragement";
  } else {
    response = "Men sizning shaxsiy AI murabbiyingizman. Bugungi vazifalar, maqsadlar yoki samaradorlik haqida so'rang — men tahlil qilib, maslahat beraman!";
    messageType = "chat";
  }

  const [aiMessage] = await db.insert(aiMessagesTable).values({
    role: "assistant",
    content: response,
    messageType,
  }).returning();

  res.json(aiMessage);
});

export default router;
