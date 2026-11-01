export interface Product {
  id: string;
  sku: string;
  name: string;
  category: "chargers" | "cables" | "audio" | "accessories";
  price: number;
  currency: "USD";
  stock: number;
  rating: number;
  description: string;
}

// Fictional brands and sandbox demo data. Prices are chosen so the Budget Guard
// blocks the premium items and the agent has cheaper alternatives to switch to.
export const PRODUCT_CATALOG: Product[] = [
  {
    id: "prod_101", sku: "VLT-140W-GAN", name: "VoltHub Prime 140W USB-C GaN Charger",
    category: "chargers", price: 79.99, currency: "USD", stock: 12, rating: 4.9,
    description: "Ultra-fast 140W 3-port GaN charger for laptops and phones.",
  },
  {
    id: "prod_102", sku: "VLT-65W-NANO", name: "VoltHub Nano 65W USB-C Charger",
    category: "chargers", price: 39.99, currency: "USD", stock: 25, rating: 4.8,
    description: "Compact 3-port fast charger for laptops, tablets and phones.",
  },
  {
    id: "prod_103", sku: "PKT-30W-MINI", name: "PocketVolt Mini 30W USB-C Charger",
    category: "chargers", price: 16.99, currency: "USD", stock: 40, rating: 4.7,
    description: "Pocket-sized 30W GaN fast charger.",
  },
  {
    id: "prod_201", sku: "LNK-TB-PRO", name: "LinkWorks Pro Thunderbolt Cable (1.8m)",
    category: "cables", price: 129.0, currency: "USD", stock: 8, rating: 4.8,
    description: "Braided Thunderbolt USB-C cable supporting 100W power delivery.",
  },
  {
    id: "prod_202", sku: "LNK-USBC-240W", name: "LinkWorks 240W Braided USB-C Cable (6ft)",
    category: "cables", price: 18.99, currency: "USD", stock: 50, rating: 4.8,
    description: "Heavy-duty 240W fast-charging USB-C cable.",
  },
  {
    id: "prod_301", sku: "SNC-FLAG-ANC", name: "SonicLab Flagship ANC Wireless Earbuds",
    category: "audio", price: 249.99, currency: "USD", stock: 5, rating: 4.7,
    description: "Flagship noise-canceling wireless earbuds.",
  },
  {
    id: "prod_302", sku: "SNC-LITE-ANC", name: "SonicLab Lite ANC Wireless Earbuds",
    category: "audio", price: 44.99, currency: "USD", stock: 19, rating: 4.6,
    description: "Adaptive noise-canceling earbuds with 60-hour playtime.",
  },
];

export function findProductById(id: string): Product | undefined {
  return PRODUCT_CATALOG.find((p) => p.id === id);
}

export function searchProducts(query: string, maxPrice?: number): Product[] {
  const q = query.toLowerCase().trim();
  return PRODUCT_CATALOG.filter((p) => {
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q);
    const matchesPrice = maxPrice === undefined || p.price <= maxPrice;
    return matchesQuery && matchesPrice;
  });
}