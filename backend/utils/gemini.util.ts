import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { config } from "../config/env.js";
import { searchProducts, findProductById } from "../models/product.model.js";
import {
  activeCart, activeWallet, getRemainingBudget,
  createCartItem, setCart, reserveFunds, releaseFunds,
} from "../models/cart.model.js";
import { appendLedgerEntry } from "../models/ledger.model.js";
import { evaluateBudgetGuard } from "../middlewares/budgetGuard.middleware.js";
import { createOrder, describePayPalError } from "../utils/paypal.util.js";

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

const SYSTEM_PROMPT =
  "You are ProxyPay, a shopping agent that works under a strict spending policy enforced by a Budget Guard. " +
  "Always call search_products before buying. Never state a price, stock level or budget figure that did not come from a tool result. " +
  "To buy, call purchase with a product id from the search results. " +
  "If purchase is blocked, explain the exact reason in plain words, then search for a cheaper alternative and try that once. " +
  "You cannot override the Budget Guard and you cannot pay: a successful purchase only creates an order that waits for the human buyer to approve. " +
  "Keep the final answer short: what you chose, the price, and the status."+
  "Never invent a PayPal order id or link; the buyer gets the approval link separately.";

const tools: FunctionDeclaration[] = [
  {
    name: "search_products",
    description: "Search the catalog by keyword (e.g. charger, cable, earbuds) and optional max unit price.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: "Keyword, or empty string for all products" },
        maxPrice: { type: Type.NUMBER, description: "Optional maximum unit price in USD" },
      },
    },
  },
  {
    name: "purchase",
    description: "Attempt to buy a product. The Budget Guard decides if it is allowed.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        productId: { type: Type.STRING, description: "Product id from search results, e.g. prod_102" },
        quantity: { type: Type.NUMBER, description: "Units to buy (default 1)" },
      },
      required: ["productId"],
    },
  },
];

function runSearch(args: Record<string, unknown>) {
  const query = typeof args.query === "string" ? args.query : "";
  const maxPrice = typeof args.maxPrice === "number" && Number.isFinite(args.maxPrice) ? args.maxPrice : undefined;
  const results = searchProducts(query, maxPrice);

  appendLedgerEntry({
    actor: "GEMINI_AGENT", action: "CATALOG_SEARCH", status: "INFO",
    remainingBudgetAfter: getRemainingBudget(),
    reason: `Searched "${query}"${maxPrice !== undefined ? ` under $${maxPrice}` : ""}: ${results.length} result(s).`,
  });

  return {
    products: results.map((p) => ({
      id: p.id, name: p.name, category: p.category,
      price: p.price, stock: p.stock, rating: p.rating,
    })),
  };
}

export async function runPurchase(args: Record<string, unknown>) {
  const product = typeof args.productId === "string" ? findProductById(args.productId) : undefined;
  if (!product) return { success: false, error: "Unknown productId. Search first and use an id from the results." };

  const quantity = typeof args.quantity === "number" ? args.quantity : 1;
  const check = evaluateBudgetGuard(product, quantity);

  if (!check.allowed) {
    appendLedgerEntry({
      actor: "BUDGET_GUARD", action: "GUARD_BLOCKED", status: "BLOCKED",
      productName: product.name, sku: product.sku, quantity, amount: check.totalCost,
      remainingBudgetAfter: getRemainingBudget(), ruleViolated: check.rule, reason: check.reason,
    });
    return { success: false, status: "BLOCKED", rule: check.rule, reason: check.reason, remainingBudget: getRemainingBudget() };
  }

  if (activeCart.status === "AWAITING_BUYER_APPROVAL" || activeCart.status === "AWAITING_GUARD") {
    return { success: false, error: "An order is already in progress. Approve or cancel it first." };
  }

  if (!reserveFunds(check.totalCost)) {
    appendLedgerEntry({
      actor: "BUDGET_GUARD", action: "GUARD_BLOCKED", status: "BLOCKED",
      productName: product.name, sku: product.sku, quantity, amount: check.totalCost,
      remainingBudgetAfter: getRemainingBudget(), ruleViolated: "TOTAL_WALLET_CAP",
      reason: "Funds no longer available.",
    });
    return { success: false, status: "BLOCKED", rule: "TOTAL_WALLET_CAP", reason: "Funds no longer available." };
  }

  // Lock the cart while the PayPal order is being created (reserve and lock happen with no await between).
  activeCart.status = "AWAITING_GUARD";

  appendLedgerEntry({
    actor: "BUDGET_GUARD", action: "GUARD_APPROVED", status: "ALLOWED",
    productName: product.name, sku: product.sku, quantity, amount: check.totalCost,
    remainingBudgetAfter: getRemainingBudget(), ruleViolated: null, reason: check.reason,
  });

  try {
    const order = await createOrder(check.totalCost, `${product.name} (x${quantity})`);
    setCart([createCartItem(product, quantity)], "AWAITING_BUYER_APPROVAL");
    activeCart.paypalOrderId = order.orderId;
    activeCart.paypalApproveUrl = order.approvalUrl;

    appendLedgerEntry({
      actor: "PAYPAL_SANDBOX", action: "PAYPAL_ORDER_CREATED", status: "PENDING_APPROVAL",
      productName: product.name, sku: product.sku, quantity, amount: check.totalCost,
      remainingBudgetAfter: getRemainingBudget(),
      reason: "PayPal sandbox order created. Waiting for the buyer to approve.",
      paypalOrderId: order.orderId, paypalApproveUrl: order.approvalUrl,
    });

    return {
      success: true, status: "AWAITING_BUYER_APPROVAL",
      item: product.name, quantity, total: check.totalCost,
      paypalOrderId: order.orderId,
      remainingBudget: getRemainingBudget(),
    };
  } catch (err) {
    releaseFunds(check.totalCost);
    setCart([], "FAILED");
    delete activeCart.paypalOrderId;
    delete activeCart.paypalApproveUrl;

    const reason = describePayPalError(err);
    appendLedgerEntry({
      actor: "PAYPAL_SANDBOX", action: "PAYPAL_ORDER_FAILED", status: "FAILED",
      productName: product.name, sku: product.sku, quantity, amount: check.totalCost,
      remainingBudgetAfter: getRemainingBudget(), reason,
    });
    return { success: false, status: "PAYPAL_ERROR", error: "Could not create the PayPal order. No money was reserved." };
  }
}

async function runTool(name: string, args: Record<string, unknown>) {
  if (name === "search_products") return runSearch(args);
  if (name === "purchase") return runPurchase(args);
  return { error: `Unknown tool: ${name}` };
}

async function generateWithRetry(
  params: Parameters<typeof ai.models.generateContent>[0],
  attempts = 3
) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      const msg = String(err?.message ?? err);
      const isRateLimit =
        err?.status === 429 || msg.includes("RESOURCE_EXHAUSTED") || msg.includes('"code":429');
      if (!isRateLimit || i === attempts - 1) throw err;
      const m = msg.match(/retry in ([\d.]+)s/i) ?? msg.match(/"retryDelay":"(\d+)s"/);
      const waitMs = Math.min((m ? Number(m[1]) : 20) * 1000 + 1000, 45000);
      console.log(`Rate limited by Gemini, retrying in ${Math.round(waitMs / 1000)}s...`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw new Error("Gemini request failed after retries.");
}

export async function runAgent(prompt: string): Promise<{ reply: string }> {
  const contents: any[] = [{ role: "user", parts: [{ text: prompt }] }];

  for (let step = 0; step < 6; step++) {
    const response = await generateWithRetry({
      model: config.geminiModel,
      contents,
      config: {
        systemInstruction:
          SYSTEM_PROMPT +
          ` Current policy: budget $${activeWallet.totalBudgetCap}, max $${activeWallet.maxPerItemPrice} per item, max ${activeWallet.maxQuantityPerOrder} units per order.`,
        tools: [{ functionDeclarations: tools }],
      },
    });

    const calls = response.functionCalls;
    if (!calls || calls.length === 0) {
      return { reply: response.text ?? "" };
    }

    const modelContent = response.candidates?.[0]?.content;
    if (modelContent) contents.push(modelContent);

    const parts: any[] = [];
    for (const call of calls) {
      const result = await runTool(call.name ?? "", (call.args ?? {}) as Record<string, unknown>);
      parts.push({ functionResponse: { name: call.name, response: result } });
    }
    contents.push({ role: "user", parts });
  }

  return { reply: "I stopped because the task took too many steps." };
}