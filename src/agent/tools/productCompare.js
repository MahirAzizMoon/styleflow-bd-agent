import { tool } from "langchain";
import { z } from "zod";
import { getProductImageUrl, PRODUCTS } from "../../data/store.js";

export function compareProducts(productIds) {
  const ids = productIds.map((id) => id.toLowerCase());
  const products = PRODUCTS.filter((product) => ids.includes(product.id.toLowerCase())).map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.description,
    price: product.price,
    currency: "BDT",
    occasions: product.occasions,
    colors: [...new Set(product.variants.map((variant) => variant.color))],
    sizes: [...new Set(product.variants.map((variant) => variant.size))],
    totalStock: product.variants.reduce((sum, variant) => sum + variant.stock, 0),
    imageUrl: getProductImageUrl(product),
  }));
  return { found: products.length, requested: productIds.length, products };
}

export const productCompareTool = tool(
  async ({ productIds }) => JSON.stringify(compareProducts(productIds)),
  {
    name: "product_compare",
    description: "Compare two to four exact catalogue products by price, description, occasions, colors, sizes, and total stock. Obtain product IDs from catalogue_search first.",
    schema: z.object({ productIds: z.array(z.string().trim().min(1)).min(2).max(4) }),
  }
);
