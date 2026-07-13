import { tool } from "langchain";
import { z } from "zod";
import { searchCatalogue } from "./catalogue.js";

export function recommendOutfits(input) {
  const products = searchCatalogue(input).slice(0, 3);
  return {
    found: products.length,
    recommendations: products,
    explanation: products.length
      ? "Ranked catalogue matches using the supplied occasion, budget, size, color, and category preferences."
      : "No product matched every preference. Relax one filter or ask a clarifying question.",
  };
}

export const outfitRecommendationTool = tool(
  async (input) => JSON.stringify(recommendOutfits(input)),
  {
    name: "outfit_recommendation",
    description: "Return up to three personalized catalogue recommendations using the customer's occasion, budget, size, color, and preferred category.",
    schema: z.object({
      occasion: z.string().trim().optional(),
      maxPrice: z.number().nonnegative().optional(),
      size: z.string().trim().optional(),
      color: z.string().trim().optional(),
      category: z.string().trim().optional(),
    }),
  }
);
