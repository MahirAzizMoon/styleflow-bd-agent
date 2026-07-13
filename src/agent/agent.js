import { ChatOpenAI } from "@langchain/openai";
import {
  createAgent,
  createMiddleware,
  summarizationMiddleware,
  toolRetryMiddleware,
} from "langchain";
import { SYSTEM_PROMPT } from "./prompts.js";
import { getMemoryCheckpointer } from "./memory.js";
import { calculatorTool } from "./tools/calculator.js";
import { catalogueSearchTool } from "./tools/catalogue.js";
import { humanHandoffTool } from "./tools/humanHandoff.js";
import { inventoryCheckTool } from "./tools/inventory.js";
import { storePolicyTool } from "./tools/storePolicy.js";
import { createWebSearchTool } from "./tools/webSearch.js";
import { productCompareTool } from "./tools/productCompare.js";
import { sizeGuideTool } from "./tools/sizeGuide.js";
import { outfitRecommendationTool } from "./tools/recommender.js";
import { wishlistTool } from "./tools/wishlist.js";
import { orderDraftTool } from "./tools/orderDraft.js";
import { PRODUCTS } from "../data/store.js";

let cachedAgent;
let cachedToolNames = [];

const MEMORY_SUMMARY_PROMPT = `Summarize the conversation below for future turns.
Preserve exact user-provided facts such as names, project titles, sizes, budgets,
colors, occasions, preferences, delivery areas, and unresolved requests. Clearly
separate durable user facts from topics that were only discussed. Preserve exact
wording for distinctive names or phrases when practical. Do not invent facts.

Conversation:
{messages}`;

export function getLlmConfiguration() {
  return {
    provider: "openai",
    configured: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  };
}

function buildTools() {
  const tools = [catalogueSearchTool, inventoryCheckTool, productCompareTool, outfitRecommendationTool, sizeGuideTool, wishlistTool, orderDraftTool, storePolicyTool, calculatorTool, humanHandoffTool];

  if (process.env.TAVILY_API_KEY) {
    tools.push(createWebSearchTool());
  }

  return tools;
}

function readPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function messageType(message) {
  return message?.getType?.() || message?._getType?.() || message?.type || message?.role;
}

function messageText(message) {
  if (typeof message?.content === "string") return message.content;
  if (!Array.isArray(message?.content)) return "";
  return message.content
    .map((part) => (typeof part === "string" ? part : part?.text || ""))
    .filter(Boolean)
    .join("\n");
}

function latestTurn(messages = []) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const type = messageType(messages[index]);
    if (type === "human" || type === "user") return messages.slice(index);
  }
  return [];
}

function calledTools(messages) {
  const names = new Set();
  for (const message of messages) {
    const calls = message?.tool_calls ?? message?.additional_kwargs?.tool_calls ?? [];
    for (const call of calls) {
      const name = call?.name ?? call?.function?.name;
      if (name) names.add(name);
    }
  }
  return names;
}

function exactProductIdInRequest(request) {
  const normalized = request.toLowerCase();
  return PRODUCTS.find((product) =>
    normalized.includes(product.id.toLowerCase()) || normalized.includes(product.name.toLowerCase())
  )?.id;
}

function requestsOneProduct(request) {
  return /\b(?:one|single)\s+(?:outfit|product|item|card|image|picture|photo)\b/i.test(request) ||
    /\b(?:just|only)\s+(?:one|this|that)\b/i.test(request);
}

/** Keep visual-card tool arguments aligned with an exact or explicitly singular user request. */
export function constrainCatalogueToolCalls(response, request) {
  const calls = response?.tool_calls;
  if (!Array.isArray(calls) || calls.length === 0) return response;

  const exactProductId = exactProductIdInRequest(request);
  const limitToOne = Boolean(exactProductId) || requestsOneProduct(request);
  if (!limitToOne) return response;

  response.tool_calls = calls.map((call) => {
    if (call?.name !== "catalogue_search") return call;
    return {
      ...call,
      args: {
        ...(call.args || {}),
        ...(exactProductId ? { query: exactProductId, category: "" } : {}),
        limit: 1,
      },
    };
  });
  return response;
}

/** Return a mandatory tool only for an explicit user intent that cannot be answered safely without it. */
export function requiredToolForLatestTurn(messages = [], { tavilyAvailable = false } = {}) {
  const turn = latestTurn(messages);
  if (turn.length === 0) return null;

  const request = messageText(turn[0]);
  const used = calledTools(turn);
  const explicitlyRequestsWebSearch =
    /\b(?:use|call)\s+(?:the\s+)?tavily(?:_search)?\b/i.test(request) ||
    /\b(?:search|browse|look\s*up|find)\b.{0,40}\b(?:web|internet|online)\b/i.test(request) ||
    /\b(?:latest|current|recent|today(?:'s)?)\b.{0,50}\b(?:news|development|information|trend|update)s?\b/i.test(request);

  if (tavilyAvailable && explicitlyRequestsWebSearch && !used.has("tavily_search")) {
    return "tavily_search";
  }

  const requestsComparison = /\b(?:compare|comparison|versus|vs\.?|differences?\s+between)\b/i.test(request);
  if (!requestsComparison || used.has("product_compare")) return null;

  const productIds = new Set(request.match(/SF-[A-Z]+-\d+/gi) || []);
  if (productIds.size >= 2) return "product_compare";
  return used.has("catalogue_search") ? "product_compare" : "catalogue_search";
}

function explicitToolRoutingMiddleware(tavilyAvailable) {
  return createMiddleware({
    name: "ExplicitToolRoutingMiddleware",
    wrapModelCall: async (request, handler) => {
      const turn = latestTurn(request.messages);
      const userRequest = turn.length > 0 ? messageText(turn[0]) : "";
      const requiredTool = requiredToolForLatestTurn(request.messages, { tavilyAvailable });
      const response = await handler(requiredTool ? {
        ...request,
        toolChoice: { type: "function", function: { name: requiredTool } },
      } : request);
      return constrainCatalogueToolCalls(response, userRequest);
    },
  });
}

export function getAgent() {
  if (cachedAgent) return cachedAgent;

  const llm = getLlmConfiguration();
  if (!llm.configured) {
    throw new Error("OPENAI_API_KEY is missing from the environment.");
  }

  const model = new ChatOpenAI({
    model: llm.model,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.2,
    timeout: 30_000,
    maxRetries: 2,
  });

  const tools = buildTools();
  cachedToolNames = tools.map((registeredTool) => registeredTool.name);

  const summaryTriggerTokens = readPositiveInteger(
    process.env.MEMORY_SUMMARY_TRIGGER_TOKENS,
    6000
  );
  const recentMessagesToKeep = readPositiveInteger(
    process.env.MEMORY_RECENT_MESSAGES_TO_KEEP,
    12
  );

  cachedAgent = createAgent({
    name: "styleflow_boutique_sales_agent",
    model,
    tools,
    systemPrompt: SYSTEM_PROMPT,
    // LangChain stores the complete message state under a thread_id.
    // The singleton checkpointer is deliberately created outside this function.
    checkpointer: getMemoryCheckpointer(),
    middleware: [
      explicitToolRoutingMiddleware(tools.some((registeredTool) => registeredTool.name === "tavily_search")),
      toolRetryMiddleware({ maxRetries: 1 }),
      // Prevent very long conversations from growing without limit while
      // retaining the latest turns and a summary of older context.
      summarizationMiddleware({
        model,
        trigger: { tokens: summaryTriggerTokens },
        keep: { messages: recentMessagesToKeep },
        summaryPrompt: MEMORY_SUMMARY_PROMPT,
      }),
    ],
  });

  return cachedAgent;
}

export function getConfiguredToolNames() {
  if (cachedToolNames.length > 0) return cachedToolNames;
  const tools = ["catalogue_search", "inventory_check", "product_compare", "outfit_recommendation", "size_guide", "wishlist", "order_draft", "store_policy", "calculator", "human_handoff"];
  return process.env.TAVILY_API_KEY ? [...tools, "tavily_search"] : tools;
}
