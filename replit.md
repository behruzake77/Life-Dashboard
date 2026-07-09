# Ultimate Life OS

Shaxsiy nazorat va intizom platformasi — foydalanuvchining shaxsiy murabbiyasi, nazoratchisi va motivatori.

## Run & Operate

- Runs via managed artifact workflows (not root-level `pnpm dev`): `artifacts/life-os: web` (frontend), `artifacts/api-server: API Server` (backend), `artifacts/mockup-sandbox: Component Preview Server` (canvas). Restart with the `WorkflowsRestart` tool using those exact names.
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` (Postgres, pre-provisioned), `SESSION_SECRET`, `REPL_ID` (used by Replit Auth) — all already set.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Framer Motion, Recharts, Wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle ORM schemas (tasks, habits, goals, pomodoro, gamification)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/life-os/src/pages/` — React pages (dashboard, tasks, habits, goals, calendar, stats, reports, pomodoro, gamification, ai, settings)
- `artifacts/life-os/src/index.css` — theme and CSS variables

## Pages

- `/` — Dashboard (Mission Control)
- `/tasks` — Vazifalar boshqaruvi
- `/habits` — Odatlar kuzatuvi
- `/goals` — Maqsadlar tizimi
- `/calendar` — Taqvim
- `/stats` — Statistikalar
- `/reports` — Hisobotlar
- `/pomodoro` — Pomodoro taymer
- `/gamification` — Gamifikatsiya
- `/ai` — AI Murabbiy
- `/settings` — Sozlamalar

## Architecture decisions

- OpenAPI-first: all types generated from `lib/api-spec/openapi.yaml`, never hand-written
- Drizzle `date()` columns expect string format (YYYY-MM-DD), not Date objects — convert before insert/query
- AI responses are rule-based (no external AI API needed) — based on task completion analysis
- Dark mode is the default; glassmorphism UI with electric violet (#7C3AED) accent
- All user-facing text is in Uzbek language

## User preferences

- Language: Uzbek (O'zbek tili)
- Design: Dark mode, glassmorphism, premium/cinematic look
- Discipline: Strict accountability — punishment system for missed tasks

## Gotchas

- Date columns in Drizzle (PgDateString) only accept strings — always convert Date to string before passing to `eq()` or `.values()`
- The `getHabitLogs` endpoint has no `days` query param (removed to avoid TS2308 Orval collision) — defaults to 30 days server-side
- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` before touching frontend or backend

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
