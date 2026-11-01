import { Request, Response, NextFunction, RequestHandler } from "express";

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found.` });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  res.status(err.status ?? 500).json({ error: err.message ?? "Internal server error" });
}