import type { NextFunction, Request, Response } from "express";

/**
 * Guards a route so it only runs for authenticated requests, and narrows
 * `req.user` to be defined inside the handler. Mount before route handlers
 * that need to read/write data scoped to the current user.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
