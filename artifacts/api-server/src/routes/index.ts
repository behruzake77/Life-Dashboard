import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import tasksRouter from "./tasks";
import habitsRouter from "./habits";
import goalsRouter from "./goals";
import statsRouter from "./stats";
import pomodoroRouter from "./pomodoro";
import reportsRouter from "./reports";
import gamificationRouter from "./gamification";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(tasksRouter);
router.use(habitsRouter);
router.use(goalsRouter);
router.use(statsRouter);
router.use(pomodoroRouter);
router.use(reportsRouter);
router.use(gamificationRouter);
router.use(aiRouter);

export default router;
