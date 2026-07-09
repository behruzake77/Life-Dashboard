import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";

// When esbuild bundles this file, import.meta.url points at dist/index.mjs, so
// this resolves to artifacts/api-server/dist at build time.
const currentDir = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// By default the frontend is served from this same origin (see the static
// file serving below), so no cross-origin requests need to be allowed. Set
// ALLOWED_ORIGINS (comma-separated) to explicitly allow other origins, e.g.
// when running the frontend dev server separately during local development.
const allowedOrigins = (process.env["ALLOWED_ORIGINS"] ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    credentials: true,
    origin:
      allowedOrigins.length > 0
        ? allowedOrigins
        : process.env["NODE_ENV"] !== "production",
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);

// Optionally serve the built frontend from this same server/origin. This lets
// a single Render (or similar) web service host both the API and the web app,
// avoiding cross-origin cookie issues with the auth session cookie.
const clientDistPath = path.resolve(
  currentDir,
  "../../life-os/dist/public",
);

if (existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

export default app;
