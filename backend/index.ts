import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import chatRoutes from "./routes/chat.routes.js";
import ledgerRoutes from "./routes/ledger.routes.js";
import { asyncHandler, notFound, errorHandler } from "./middlewares/error.middleware.js";
import approveRoutes from "./routes/approve.routes.js"; 
import { runPurchase } from "./utils/gemini.util.js"; 


const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/chat", chatRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/approve", approveRoutes);

if (process.env.ENABLE_DEV_ROUTES === "true") {
  // Exercises the guard and PayPal flow without using Gemini quota.
  app.post("/api/dev/purchase", asyncHandler(async (req, res) => {
    res.json(await runPurchase(req.body ?? {}));
  }));
}

// These two must stay last.
app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`ProxyPay backend running on http://localhost:${config.port}`);
});