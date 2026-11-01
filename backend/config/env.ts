import "dotenv/config";


function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} in backend/.env`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  geminiApiKey: required("GEMINI_API_KEY"),
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",

  // Needed once you add the real PayPal calls
  paypalClientId: process.env.PAYPAL_CLIENT_ID ?? "",
  paypalSecret: process.env.PAYPAL_CLIENT_SECRET ?? process.env.PAYPAL_SECRET ?? "",
  paypalBase: (process.env.PAYPAL_BASE_URL ?? "https://api-m.sandbox.paypal.com").replace(/\/+$/, ""),
   frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
};