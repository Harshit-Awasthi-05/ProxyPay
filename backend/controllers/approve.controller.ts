import { Request, Response } from "express";
import { activeCart, commitFunds, releaseFunds, getRemainingBudget } from "../models/cart.model.js";
import { appendLedgerEntry } from "../models/ledger.model.js";
import { captureOrder, describePayPalError, isOrderNotApproved } from "../utils/paypal.util.js";

export async function approve(req: Request, res: Response) {
  const orderId = req.body?.orderId;
  const action = req.body?.action ?? "capture";

  if (typeof orderId !== "string" || !["capture", "cancel"].includes(action)) {
    res.status(400).json({ error: "Body must be { orderId: string, action?: 'capture' | 'cancel' }." });
    return;
  }
  if (activeCart.paypalOrderId !== orderId || activeCart.status !== "AWAITING_BUYER_APPROVAL") {
    res.status(409).json({ error: "No pending order with that id." });
    return;
  }

  const amount = activeCart.totalAmount;
  const item = activeCart.items[0];
  const base = {
    productName: item?.name, sku: item?.sku, quantity: item?.quantity, amount, paypalOrderId: orderId,
  };

  if (action === "cancel") {
    releaseFunds(amount);
    activeCart.status = "FAILED";
    activeCart.updatedAt = new Date().toISOString();
    appendLedgerEntry({
      actor: "USER", action: "PAYPAL_ORDER_FAILED", status: "FAILED", ...base,
      remainingBudgetAfter: getRemainingBudget(), reason: "Order cancelled. Reserved funds released.",
    });
    res.json({ status: "CANCELLED", remainingBudget: getRemainingBudget() });
    return;
  }

  try {
    const data = await captureOrder(orderId);
    if (data.status === "COMPLETED") {
      const captureId = data.purchase_units?.[0]?.payments?.captures?.[0]?.id;
      commitFunds(amount);
      activeCart.status = "CAPTURED";
      activeCart.updatedAt = new Date().toISOString();
      appendLedgerEntry({
        actor: "PAYPAL_SANDBOX", action: "PAYPAL_PAYMENT_CAPTURED", status: "PAID", ...base,
        remainingBudgetAfter: getRemainingBudget(),
        reason: `Payment captured${captureId ? ` (capture ${captureId})` : ""}.`,
      });
      res.json({ status: "PAID", captureId, remainingBudget: getRemainingBudget() });
      return;
    }
    // e.g. PENDING review: keep the funds reserved
    res.status(202).json({ status: data.status, message: "Payment is not completed yet." });
  } catch (err) {
    if (isOrderNotApproved(err)) {
      res.status(409).json({
        error: "The buyer has not approved this order in PayPal yet.",
        approvalUrl: activeCart.paypalApproveUrl,
      });
      return;
    }
    releaseFunds(amount);
    activeCart.status = "FAILED";
    activeCart.updatedAt = new Date().toISOString();
    const reason = describePayPalError(err);
    appendLedgerEntry({
      actor: "PAYPAL_SANDBOX", action: "PAYPAL_ORDER_FAILED", status: "FAILED", ...base,
      remainingBudgetAfter: getRemainingBudget(), reason,
    });
    res.status(502).json({ error: "Capture failed. Reserved funds released.", detail: reason });
  }
}