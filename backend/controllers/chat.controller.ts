import { Request, Response } from "express";
import { runAgent } from "../utils/gemini.util.js";
import { activeWallet, activeCart, getRemainingBudget } from "../models/cart.model.js";
import { ledgerStore, appendLedgerEntry } from "../models/ledger.model.js";

export async function chat(req: Request, res: Response) {
  const prompt: string = req.body.prompt.trim();

  appendLedgerEntry({
    actor: "USER", action: "USER_GOAL", status: "INFO",
    remainingBudgetAfter: getRemainingBudget(), reason: prompt,
  });

  const { reply } = await runAgent(prompt);

  res.json({
    reply,
    wallet: { ...activeWallet, remainingBudget: getRemainingBudget() },
    cart: activeCart,
    ledger: ledgerStore,
  });
}