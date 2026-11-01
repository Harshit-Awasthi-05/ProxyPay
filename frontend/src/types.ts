// ── Wallet ──
export interface WalletState {
  totalBudgetCap: number;
  totalSpent: number;
  totalReserved: number;
  maxPerItemPrice: number;
  maxQuantityPerOrder: number;
  remainingBudget: number;
}

// ── Cart ──
export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export type CartStatus =
  | "IDLE"
  | "AWAITING_GUARD"
  | "BLOCKED_BY_GUARD"
  | "AWAITING_BUYER_APPROVAL"
  | "CAPTURED"
  | "FAILED";

export interface Cart {
  id: string;
  items: CartItem[];
  totalAmount: number;
  currency: "USD";
  status: CartStatus;
  paypalOrderId?: string;
  paypalApproveUrl?: string;
  updatedAt: string;
}

// ── Ledger ──
export interface LedgerEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  status: string;
  productName?: string;
  sku?: string;
  quantity?: number;
  amount?: number;
  remainingBudgetAfter: number;
  ruleViolated?: string | null;
  reason: string;
  paypalOrderId?: string;
  paypalApproveUrl?: string;
}

// ── API responses ──
export interface ChatResponse {
  reply: string;
  wallet: WalletState;
  cart: Cart;
  ledger: LedgerEntry[];
}

export interface StateResponse {
  wallet: WalletState;
  cart: Cart;
  ledger: LedgerEntry[];
}

export interface ApproveResponse {
  status: string;
  captureId?: string;
  remainingBudget?: number;
  error?: string;
  detail?: string;
  approvalUrl?: string;
}

// ── Chat UI ──
export interface ChatMessage {
  id: string;
  role: "user" | "agent" | "system";
  text: string;
  timestamp: Date;
}

