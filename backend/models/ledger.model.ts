import { randomUUID } from "node:crypto";

export type LedgerActionType =
  | "USER_GOAL"
  | "CATALOG_SEARCH"
  | "GUARD_APPROVED"
  | "GUARD_BLOCKED"
  | "PAYPAL_ORDER_CREATED"
  | "PAYPAL_ORDER_FAILED"
  | "PAYPAL_PAYMENT_CAPTURED";

export type LedgerStatus = "INFO" | "ALLOWED" | "BLOCKED" | "PENDING_APPROVAL" | "PAID" | "FAILED";

export interface LedgerEntry {
  id: string;
  timestamp: string;
  actor: "USER" | "GEMINI_AGENT" | "BUDGET_GUARD" | "PAYPAL_SANDBOX";
  action: LedgerActionType;
  status: LedgerStatus;
  productName?: string;
  sku?: string;
  quantity?: number;
  amount?: number;
  remainingBudgetAfter: number;
  ruleViolated?: "TOTAL_WALLET_CAP" | "PER_ITEM_LIMIT" | "MAX_QUANTITY" | "OUT_OF_STOCK" | null;
  reason: string;
  paypalOrderId?: string;
  paypalApproveUrl?: string;
}

const MAX_ENTRIES = 500;

// In-memory store. Newest first, so AG Grid shows the latest event on top.
export const ledgerStore: LedgerEntry[] = [];

export function appendLedgerEntry(
  entry: Omit<LedgerEntry, "id" | "timestamp">
): LedgerEntry {
  const record: LedgerEntry = {
    id: `log_${randomUUID().slice(0, 8)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  ledgerStore.unshift(record);
  if (ledgerStore.length > MAX_ENTRIES) ledgerStore.length = MAX_ENTRIES;
  return record;
}

export function clearLedger(): void {
  ledgerStore.length = 0;
}