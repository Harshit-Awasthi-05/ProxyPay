import { useState, useEffect, useRef, useCallback } from "react";
import type { WalletState, Cart, LedgerEntry, ChatMessage } from "../types";
import { sendChat, getState, approveOrder, resetDemo, isQuotaError } from "../api";
import BudgetBar from "../components/BudgetBar";
import ChatBox from "../components/ChatBox";
import PendingOrder from "../components/PendingOrder";
import LedgerGrid from "../components/LedgerGrid";

let msgCounter = 0;
function msgId() {
  return `msg_${++msgCounter}`;
}

const DEFAULT_WALLET: WalletState = {
  totalBudgetCap: 100,
  totalSpent: 0,
  totalReserved: 0,
  maxPerItemPrice: 45,
  maxQuantityPerOrder: 2,
  remainingBudget: 100,
};

const DEFAULT_CART: Cart = {
  id: "",
  items: [],
  totalAmount: 0,
  currency: "USD",
  status: "IDLE",
  updatedAt: new Date().toISOString(),
};

export default function HomePage() {
  const [wallet, setWallet] = useState<WalletState>(DEFAULT_WALLET);
  const [cart, setCart] = useState<Cart>(DEFAULT_CART);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Sync state from any API response
  const syncState = useCallback(
    (w: WalletState, c: Cart, l: LedgerEntry[]) => {
      setWallet(w);
      setCart(c);
      setLedger(l);
    },
    []
  );

  // Initial load + polling
  useEffect(() => {
    getState()
      .then((s) => syncState(s.wallet, s.cart, s.ledger))
      .catch(() => {});

    pollRef.current = setInterval(async () => {
      try {
        const s = await getState();
        syncState(s.wallet, s.cart, s.ledger);
      } catch {
        // silent
      }
    }, 2000);

    return () => clearInterval(pollRef.current);
  }, [syncState]);

  // Send a chat message
  async function handleSend(prompt: string) {
    setMessages((prev) => [
      ...prev,
      { id: msgId(), role: "user", text: prompt, timestamp: new Date() },
    ]);
    setChatLoading(true);

    try {
      const res = await sendChat(prompt);
      syncState(res.wallet, res.cart, res.ledger);
      setMessages((prev) => [
        ...prev,
        { id: msgId(), role: "agent", text: res.reply, timestamp: new Date() },
      ]);
    } catch (err: any) {
      const text = isQuotaError(err)
        ? "⚠️ The AI service has reached its quota limit. Please wait a moment and try again."
        : `❌ ${err.message ?? "Something went wrong."}`;
      setMessages((prev) => [
        ...prev,
        { id: msgId(), role: "system", text, timestamp: new Date() },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  // Cancel pending order
  async function handleCancel() {
    if (!cart.paypalOrderId) return;
    setCancelling(true);
    try {
      await approveOrder(cart.paypalOrderId, "cancel");
      const s = await getState();
      syncState(s.wallet, s.cart, s.ledger);
      setMessages((prev) => [
        ...prev,
        {
          id: msgId(),
          role: "system",
          text: "Order cancelled. Reserved funds have been released.",
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: msgId(),
          role: "system",
          text: `❌ Cancel failed: ${err.message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setCancelling(false);
    }
  }

  // Reset demo
  async function handleReset() {
    try {
      await resetDemo();
      const s = await getState();
      syncState(s.wallet, s.cart, s.ledger);
      setMessages([]);
      msgCounter = 0;
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    }
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-brand">
          <span className="header-icon">🛡️</span>
          <h1>ProxyPay</h1>
          <span className="header-tagline">AI Shopping Agent with Budget Guard</span>
        </div>
        <button className="btn btn-reset" onClick={handleReset}>
          Reset Demo
        </button>
      </header>

      <div className="budget-section">
        <BudgetBar wallet={wallet} />
      </div>

      <main className="main-content">
        <div className="left-panel">
          <PendingOrder
            cart={cart}
            onCancel={handleCancel}
            cancelling={cancelling}
          />
          <ChatBox
            messages={messages}
            onSend={handleSend}
            loading={chatLoading}
          />
        </div>
        <div className="right-panel">
          <div className="panel-header">
            <h2>Activity Ledger</h2>
            <span className="entry-count">{ledger.length} entries</span>
          </div>
          <LedgerGrid entries={ledger} />
        </div>
      </main>
    </div>
  );
}
