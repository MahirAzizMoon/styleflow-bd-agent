import { tool } from "langchain";
import { z } from "zod";
import { PRODUCTS } from "../../data/store.js";

// Some OpenAI-compatible providers serialize omitted optional tool fields as
// empty strings. Treat those as absent filters instead of failing the request.
const optionalText = z.string().trim().optional();

function contains(value, query) {
  return value.toLowerCase().includes(query.toLowerCase());
}

function matchesNaturalQuery(value, query) {
  if (contains(value, query)) return true;
  const ignored = new Set(["show", "find", "give", "want", "need", "with", "under", "over", "taka", "size", "outfit", "dress", "available", "please"]);
  const terms = query.toLowerCase().match(/[a-z0-9-]+/g)?.filter((term) => term.length > 1 && !ignored.has(term)) ?? [];
  return terms.length === 0 || terms.some((term) => contains(value, term));
}

export function searchCatalogue({ query, category, color, size, occasion, maxPrice }) {
  const normalizedSize = size?.toUpperCase();
  // Some tool-calling models emit 0 for an omitted optional number. Treat it
  // as "no budget supplied" instead of rejecting the entire model response.
  const normalizedMaxPrice = maxPrice > 0 ? maxPrice : undefined;
  return PRODUCTS.filter((product) => {
    const searchable = [
      product.id,
      product.name,
      product.category,
      product.description,
      ...product.occasions,
      ...product.variants.flatMap((variant) => [variant.color, variant.size]),
    ].join(" ");
    if (query && !matchesNaturalQuery(searchable, query)) return false;
    if (category && !contains(product.category, category)) return false;
    if (occasion && !product.occasions.some((item) => contains(item, occasion))) return false;
    if (normalizedMaxPrice !== undefined && product.price > normalizedMaxPrice) return false;
    if (color && !product.variants.some((variant) => contains(variant.color, color))) return false;
    if (normalizedSize && !product.variants.some((variant) => variant.size === normalizedSize)) return false;
    return true;
  }).map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.description,
    price: product.price,
    currency: "BDT",
    occasions: product.occasions,
    availableVariants: product.variants.filter((variant) => variant.stock > 0),
  }));
}

export const catalogueSearchTool = tool(
  async (filters) => {
    const matches = searchCatalogue(filters);
    return JSON.stringify({
      found: matches.length,
      products: matches,
      note: matches.length ? "All results come from the StyleFlow BD demo catalogue." : "No catalogue product matched every supplied filter.",
    });
  },
  {
    name: "catalogue_search",
    description: "Search the trusted StyleFlow BD product catalogue by text, category, color, size, occasion, or maximum budget. Use this before recommending products or stating prices.",
    schema: z.object({
      query: optionalText.describe("Product name, ID, or general search words"),
      category: optionalText,
      color: optionalText,
      size: optionalText,
      occasion: optionalText,
      maxPrice: z.number().nonnegative().optional().describe("Maximum product price in BDT, excluding delivery. Use 0 only when the customer did not provide a maximum budget."),
    }),
  }
);
