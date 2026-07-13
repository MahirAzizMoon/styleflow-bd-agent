import { tool } from "langchain";
import { z } from "zod";
import { getProductImageUrl, PRODUCTS } from "../../data/store.js";

// Some OpenAI-compatible providers serialize omitted optional tool fields as
// empty strings. Treat those as absent filters instead of failing the request.
const optionalText = z.string().trim().optional();
const CATEGORY_ALIASES = new Map([
  ["kurta", "panjabi"],
  ["punjabi", "panjabi"],
  ["three piece", "three-piece"],
  ["3 piece", "three-piece"],
]);
const CATEGORIES = new Set(PRODUCTS.map((product) => product.category));

function normalizeCategory(category) {
  if (!category) return undefined;
  const value = category.toLowerCase().trim();
  const mapped = CATEGORY_ALIASES.get(value) || value;
  return CATEGORIES.has(mapped) ? mapped : undefined;
}

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
  const normalizedCategory = normalizeCategory(category);
  const normalizedQuery = query?.toLowerCase().trim();
  const exactRequestedProduct = normalizedQuery
    ? PRODUCTS.find((product) =>
        normalizedQuery.includes(product.id.toLowerCase()) ||
        normalizedQuery.includes(product.name.toLowerCase())
      )
    : undefined;
  const cataloguePool = exactRequestedProduct ? [exactRequestedProduct] : PRODUCTS;
  // Some tool-calling models emit 0 for an omitted optional number. Treat it
  // as "no budget supplied" instead of rejecting the entire model response.
  const normalizedMaxPrice = maxPrice > 0 ? maxPrice : undefined;
  return cataloguePool.filter((product) => {
    const searchable = [
      product.id,
      product.name,
      product.category,
      product.description,
      ...product.occasions,
      ...product.variants.flatMap((variant) => [variant.color, variant.size]),
    ].join(" ");
    if (query && !matchesNaturalQuery(searchable, query)) return false;
    if (normalizedCategory && !contains(product.category, normalizedCategory)) return false;
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
    imageUrl: getProductImageUrl(product),
    occasions: product.occasions,
    availableVariants: product.variants.filter((variant) => variant.stock > 0),
  }));
}

export const catalogueSearchTool = tool(
  async (filters) => {
    const matches = searchCatalogue(filters);
    const displayedProducts = matches.slice(0, 8);
    return JSON.stringify({
      found: matches.length,
      returned: displayedProducts.length,
      products: displayedProducts,
      note: matches.length ? "All results come from the StyleFlow BD demo catalogue." : "No catalogue product matched every supplied filter.",
    });
  },
  {
    name: "catalogue_search",
    description: "Search the trusted StyleFlow BD product catalogue by text, category, color, size, occasion, or maximum budget. The website automatically renders returned products as visual cards. Use this for every request to show product cards, pictures, images, or a visual catalogue, and before recommending products or stating prices.",
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
