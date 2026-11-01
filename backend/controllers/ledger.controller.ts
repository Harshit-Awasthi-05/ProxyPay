import { Request, Response } from "express";
import { activeWallet, activeCart, getRemainingBudget, resetSession } from "../models/cart.model.js";
import { ledgerStore, clearLedger } from "../models/ledger.model.js";

export function getState(_req: Request, res: Response) {
  res.json({
    wallet: { ...activeWallet, remainingBudget: getRemainingBudget() },
    cart: activeCart,
    ledger: ledgerStore,
  });
}

export function resetDemo(_req: Request, res: Response) {
  resetSession();
  clearLedger();
  res.json({ ok: true });
}