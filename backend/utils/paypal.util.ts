import axios from "axios";
import { randomUUID } from "node:crypto";
import { config } from "../config/env.js";

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;
  if (!config.paypalClientId || !config.paypalSecret) {
    throw new Error("PAYPAL_CLIENT_ID / PAYPAL_SECRET are missing in backend/.env");
  }
  const res = await axios.post(
    `${config.paypalBase}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      auth: { username: config.paypalClientId, password: config.paypalSecret },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );
  cachedToken = {
    value: res.data.access_token,
    expiresAt: Date.now() + (Number(res.data.expires_in) - 60) * 1000,
  };
  return cachedToken.value;
}

export async function createOrder(amount: number, description: string) {
  const token = await getAccessToken();
  const res = await axios.post(
    `${config.paypalBase}/v2/checkout/orders`,
    {
      intent: "CAPTURE",
      purchase_units: [
        { description: description.slice(0, 127), amount: { currency_code: "USD", value: amount.toFixed(2) } },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "ProxyPay",
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
            return_url: `${config.frontendUrl}/return`,
            cancel_url: `${config.frontendUrl}/cancel`,
          },
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": randomUUID(), // idempotency key
      },
    }
  );
  const link = (res.data.links ?? []).find(
    (l: any) => l.rel === "payer-action" || l.rel === "approve"
  );
  if (!link?.href) throw new Error("PayPal did not return an approval link.");
  return { orderId: res.data.id as string, approvalUrl: link.href as string };
}

export async function captureOrder(orderId: string) {
  const token = await getAccessToken();
  const res = await axios.post(
    `${config.paypalBase}/v2/checkout/orders/${orderId}/capture`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `capture-${orderId}`, // retries of the same capture are safe
      },
    }
  );
  return res.data;
}

export function isOrderNotApproved(err: any): boolean {
  const details = err?.response?.data?.details;
  return Array.isArray(details) && details.some((d: any) => d.issue === "ORDER_NOT_APPROVED");
}

export function describePayPalError(err: any): string {
  const d = err?.response?.data;
  if (d) {
    const issue = d.details?.[0]?.issue;
    const text = d.details?.[0]?.description ?? d.message ?? "";
    return `PayPal ${err.response.status} ${d.name ?? ""}${issue ? ` (${issue})` : ""}: ${text} [debug_id ${d.debug_id ?? "n/a"}]`.trim();
  }
  return err?.message ?? String(err);
}