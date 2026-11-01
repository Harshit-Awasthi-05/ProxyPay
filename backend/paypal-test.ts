import { createOrder, describePayPalError } from "./utils/paypal.util.js";

createOrder(10, "ProxyPay connectivity test")
  .then((o) => console.log("OK:", o))
  .catch((e) => console.error("FAILED:", describePayPalError(e)));