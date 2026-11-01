import { Request, Response, NextFunction } from "express";

export function validatePrompt(req: Request, res: Response, next: NextFunction) {
  const prompt = req.body?.prompt;
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 500) {
    res.status(400).json({ error: "'prompt' must be a non-empty string up to 500 characters." });
    return;
  }
  next();
}