import { PRODUCT_CATALOG } from "./models/product.model.js";
import { evaluateBudgetGuard } from "./middlewares/budgetGuard.middleware.js";

console.log(evaluateBudgetGuard(PRODUCT_CATALOG[1]!, 1)); // $39.99, allowed
console.log(evaluateBudgetGuard(PRODUCT_CATALOG[0]!, 1)); // $79.99, PER_ITEM_LIMIT
console.log(evaluateBudgetGuard(PRODUCT_CATALOG[1]!, 5)); // MAX_QUANTITY