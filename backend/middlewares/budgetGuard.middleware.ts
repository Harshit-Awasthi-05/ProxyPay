import type { Product } from "../models/product.model.js";
import { activeWallet, getRemainingBudget } from "../models/cart.model.js";
import type { LedgerEntry } from "../models/ledger.model.js";

export type GuardRule = NonNullable<LedgerEntry["ruleViolated"]>;

export interface GuardResult {
  allowed: boolean;
  totalCost: number;
  rule: GuardRule | null;
  reason: string;
}

export function evaluateBudgetGuard(product: Product, quantity: number): GuardResult {
  const totalCost = Math.round(product.price * 100 * quantity) / 100;
  const block = (rule: GuardRule, reason: string): GuardResult =>
    ({ allowed: false, totalCost, rule, reason });

  if (!Number.isInteger(quantity) || quantity < 1) {
    return block("MAX_QUANTITY", "Quantity must be a whole number of at least 1.");
  }
  if (quantity > activeWallet.maxQuantityPerOrder) {
    return block("MAX_QUANTITY",
      `Quantity ${quantity} exceeds the limit of ${activeWallet.maxQuantityPerOrder} per order.`);
  }
  if (product.stock < quantity) {
    return block("OUT_OF_STOCK", `Only ${product.stock} of "${product.name}" in stock.`);
  }
  if (product.price > activeWallet.maxPerItemPrice) {
    return block("PER_ITEM_LIMIT",
      `Unit price $${product.price} exceeds the per-item limit of $${activeWallet.maxPerItemPrice}.`);
  }
  const remaining = getRemainingBudget();
  if (totalCost > remaining) {
    return block("TOTAL_WALLET_CAP",
      `Order total $${totalCost} exceeds the remaining budget of $${remaining}.`);
  }
  return { allowed: true, totalCost, rule: null, reason: "Passed all Budget Guard rules." };
}