import { tool } from "langchain";
import { z } from "zod";
import { PRODUCTS } from "../../data/store.js";

export function checkInventory({ productId, color, size }) {
  const product = PRODUCTS.find((item) => item.id.toLowerCase() === productId.toLowerCase());
  if (!product) return { found: false, message: "Product ID was not found in the catalogue." };

  const matches = product.variants.filter((variant) => {
    const colorMatches = !color || variant.color.toLowerCase().includes(color.toLowerCase());
    const sizeMatches = !size || variant.size === size.toUpperCase();
    return colorMatches && sizeMatches;
  });

  return {
    found: true,
    product: { id: product.id, name: product.name, price: product.price, currency: "BDT" },
    variants: matches.map((variant) => ({ ...variant, available: variant.stock > 0 })),
    message: matches.length ? "Inventory checked from the demo stock record." : "The product exists, but that color/size combination is not listed.",
  };
}

export const inventoryCheckTool = tool(
  async (input) => JSON.stringify(checkInventory(input)),
  {
    name: "inventory_check",
    description: "Check trusted stock quantity for an exact catalogue product ID and optional color or size. Never claim availability without this tool.",
    schema: z.object({
      productId: z.string().trim().min(1).describe("Exact ID returned by catalogue_search"),
      color: z.string().trim().optional(),
      size: z.string().trim().optional(),
    }),
  }
);
