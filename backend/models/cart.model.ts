import type { Product } from "./product.model.js";

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

export interface WalletPolicy {
  totalBudgetCap: number;       // hard ceiling for the session
  totalSpent: number;           // captured payments
  totalReserved: number;        // orders created but not yet approved/captured
  maxPerItemPrice: number;      // max unit price for any single item
  maxQuantityPerOrder: number;  // max units per purchase attempt
}

// ---- money helpers (integer cents avoid float drift) ----
const toCents = (n: number) => Math.round(n * 100);
const fromCents = (c: number) => c / 100;

export const activeWallet: WalletPolicy = {
  totalBudgetCap: 100.0,
  totalSpent: 0.0,
  totalReserved: 0.0,
  maxPerItemPrice: 45.0,
  maxQuantityPerOrder: 2,
};

export const activeCart: Cart = {
  id: "cart_session_01",
  items: [],
  totalAmount: 0.0,
  currency: "USD",
  status: "IDLE",
  updatedAt: new Date().toISOString(),
};

export function getRemainingBudget(): number {
  const w = activeWallet;
  return fromCents(toCents(w.totalBudgetCap) - toCents(w.totalSpent) - toCents(w.totalReserved));
}

// Called when a PayPal order is created. Returns false if it no longer fits.
export function reserveFunds(amount: number): boolean {
  if (toCents(amount) > toCents(getRemainingBudget())) return false;
  activeWallet.totalReserved = fromCents(toCents(activeWallet.totalReserved) + toCents(amount));
  return true;
}

// Called if the order fails, is rejected, or the buyer cancels.
export function releaseFunds(amount: number): void {
  activeWallet.totalReserved = Math.max(
    0,
    fromCents(toCents(activeWallet.totalReserved) - toCents(amount))
  );
}

// Called when PayPal capture succeeds: reserved becomes spent.
export function commitFunds(amount: number): void {
  releaseFunds(amount);
  activeWallet.totalSpent = fromCents(toCents(activeWallet.totalSpent) + toCents(amount));
}

export function createCartItem(product: Product, quantity: number): CartItem {
  return {
    productId: product.id,
    sku: product.sku,
    name: product.name,
    unitPrice: product.price,
    quantity,
    subtotal: fromCents(toCents(product.price) * quantity),
  };
}

export function setCart(items: CartItem[], status: CartStatus): Cart {
  activeCart.items = items;
  activeCart.totalAmount = fromCents(items.reduce((s, i) => s + toCents(i.subtotal), 0));
  activeCart.status = status;
  activeCart.updatedAt = new Date().toISOString();
  return activeCart;
}

export function resetSession(): void {
  activeWallet.totalSpent = 0;
  activeWallet.totalReserved = 0;
  delete activeCart.paypalOrderId;
  delete activeCart.paypalApproveUrl;
  setCart([], "IDLE");
}